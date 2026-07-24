import { open, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME_API = 'https://chromewebstore.googleapis.com';
const EDGE_API = 'https://api.addons.microsoftedge.microsoft.com/v1';
const DEFAULT_POLL_INTERVAL_MS = 10_000;
const DEFAULT_POLL_ATTEMPTS = 60;

type Store = 'chrome' | 'edge';
type Environment = Record<string, string | undefined>;
type FetchImplementation = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;
type Sleep = (milliseconds: number) => Promise<void>;

interface CliArguments {
  artifact: string;
  store: Store;
}

interface ApiRequestOptions {
  expectedStatus: number[];
  fetchImpl: FetchImplementation;
  label: string;
  retries?: number;
  sleep?: Sleep;
}

interface ApiResult<T> {
  data: T;
  headers: Headers;
  status: number;
}

interface PublishOptions {
  archive: Buffer;
  environment?: Environment;
  fetchImpl?: FetchImplementation;
  sleep?: Sleep;
  pollIntervalMs?: number;
  pollAttempts?: number;
}

interface ChromeTokenResponse {
  access_token?: string;
}

interface ChromeUploadResponse {
  uploadState?: string;
}

interface ChromeStatusResponse {
  lastAsyncUploadState?: string;
}

interface ChromePublishResponse {
  state?: string;
}

interface EdgeOperationResponse {
  status?: string;
  message?: string;
  errorCode?: string;
  errors?: unknown;
}

const delay: Sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function binaryBody(archive: Buffer): Uint8Array<ArrayBuffer> {
  const body = new Uint8Array(archive.byteLength);
  body.set(archive);
  return body;
}

function parseArgs(argv: string[]): CliArguments {
  let artifact = '';
  let store: Store | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--') {
      continue;
    } else if (argument === '--artifact' || argument === '--store') {
      const value = argv[index + 1] || '';
      if (argument === '--artifact') artifact = value;
      else if (value === 'chrome' || value === 'edge') store = value;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!artifact) throw new Error('--artifact is required.');
  if (!store) {
    throw new Error('--store must be either "chrome" or "edge".');
  }

  return { artifact, store };
}

export function requireEnvironment<const Names extends readonly string[]>(
  names: Names,
  environment: Environment = process.env
): Record<Names[number], string> {
  const values = {} as Record<Names[number], string>;
  const missing: string[] = [];

  for (const name of names) {
    const value = environment[name]?.trim();
    if (value) values[name as Names[number]] = value;
    else missing.push(name);
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return values;
}

async function verifyArchive(artifactPath: string): Promise<void> {
  const archiveStat = await stat(artifactPath);
  if (!archiveStat.isFile() || archiveStat.size < 4) {
    throw new Error(`Release artifact is not a valid file: ${artifactPath}`);
  }

  const handle = await open(artifactPath, 'r');
  try {
    const signature = Buffer.alloc(4);
    await handle.read(signature, 0, 4, 0);
    if (!signature.equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
      throw new Error(`Release artifact is not a ZIP archive: ${artifactPath}`);
    }
  } finally {
    await handle.close();
  }
}

function responseBodyText(text: string): string {
  return text.length > 2_000 ? `${text.slice(0, 2_000)}…` : text;
}

class ApiResponseError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.retryable = retryable;
  }
}

async function apiRequest<T>(
  url: string,
  options: RequestInit,
  {
    expectedStatus,
    fetchImpl,
    label,
    retries = 0,
    sleep = delay
  }: ApiRequestOptions
): Promise<ApiResult<T>> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        ...options,
        signal: AbortSignal.timeout(60_000)
      });
      const text = await response.text();
      const data: unknown = text ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })() : {};

      if (expectedStatus.includes(response.status)) {
        return { data: data as T, headers: response.headers, status: response.status };
      }

      const retryable = response.status === 429 || response.status >= 500;
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      lastError = new ApiResponseError(
        `${label} failed with HTTP ${response.status}: ${responseBodyText(message)}`,
        retryable
      );
      if (!retryable || attempt === retries) throw lastError;
    } catch (error: unknown) {
      lastError = error;
      if (
        (error instanceof ApiResponseError && !error.retryable) ||
        attempt === retries
      ) throw error;
    }

    await sleep(Math.min(1_000 * (2 ** attempt), 10_000));
  }

  throw lastError instanceof Error ? lastError : new Error('API request failed.');
}

function normalizeChromeUploadState(state: unknown): string {
  return String(state || '').replace(/^UPLOAD_/, '').replace(/^SUCCESS$/, 'SUCCEEDED');
}

interface ChromePollOptions {
  accessToken: string;
  itemName: string;
  fetchImpl: FetchImplementation;
  sleep: Sleep;
  pollIntervalMs: number;
  pollAttempts: number;
}

async function pollChromeUpload({
  accessToken,
  itemName,
  fetchImpl,
  sleep,
  pollIntervalMs,
  pollAttempts
}: ChromePollOptions): Promise<void> {
  const url = `${CHROME_API}/v2/${itemName}:fetchStatus`;

  for (let attempt = 1; attempt <= pollAttempts; attempt += 1) {
    await sleep(pollIntervalMs);
    const { data } = await apiRequest<ChromeStatusResponse>(
      url,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` }
      },
      {
        expectedStatus: [200],
        fetchImpl,
        label: 'Chrome upload status check',
        retries: 3,
        sleep
      }
    );
    const state = normalizeChromeUploadState(data.lastAsyncUploadState);
    console.log(`Chrome upload status: ${state || 'UNKNOWN'}`);

    if (state === 'SUCCEEDED') return;
    if (['FAILED', 'NOT_FOUND'].includes(state)) {
      throw new Error(`Chrome package processing ended with state ${state}.`);
    }
  }

  throw new Error('Timed out waiting for Chrome to process the extension package.');
}

export async function publishChrome({
  archive,
  environment = process.env,
  fetchImpl = globalThis.fetch,
  sleep = delay,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  pollAttempts = DEFAULT_POLL_ATTEMPTS
}: PublishOptions): Promise<ChromePublishResponse> {
  const {
    CHROME_CLIENT_ID,
    CHROME_CLIENT_SECRET,
    CHROME_REFRESH_TOKEN,
    CHROME_PUBLISHER_ID,
    CHROME_EXTENSION_ID
  } = requireEnvironment([
    'CHROME_CLIENT_ID',
    'CHROME_CLIENT_SECRET',
    'CHROME_REFRESH_TOKEN',
    'CHROME_PUBLISHER_ID',
    'CHROME_EXTENSION_ID'
  ], environment);

  const tokenBody = new URLSearchParams({
    client_id: CHROME_CLIENT_ID,
    client_secret: CHROME_CLIENT_SECRET,
    refresh_token: CHROME_REFRESH_TOKEN,
    grant_type: 'refresh_token'
  });
  const { data: token } = await apiRequest<ChromeTokenResponse>(
    'https://oauth2.googleapis.com/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody
    },
    {
      expectedStatus: [200],
      fetchImpl,
      label: 'Chrome OAuth token refresh',
      retries: 3,
      sleep
    }
  );
  if (!token.access_token) throw new Error('Chrome OAuth response did not include an access token.');

  const itemName = `publishers/${encodeURIComponent(CHROME_PUBLISHER_ID)}/items/${encodeURIComponent(CHROME_EXTENSION_ID)}`;
  console.log('Uploading package to Chrome Web Store…');
  const { data: upload } = await apiRequest<ChromeUploadResponse>(
    `${CHROME_API}/upload/v2/${itemName}:upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/zip'
      },
      body: binaryBody(archive)
    },
    {
      expectedStatus: [200],
      fetchImpl,
      label: 'Chrome package upload'
    }
  );

  const uploadState = normalizeChromeUploadState(upload.uploadState);
  console.log(`Chrome upload status: ${uploadState || 'UNKNOWN'}`);
  if (uploadState === 'IN_PROGRESS') {
    await pollChromeUpload({
      accessToken: token.access_token,
      itemName,
      fetchImpl,
      sleep,
      pollIntervalMs,
      pollAttempts
    });
  } else if (uploadState !== 'SUCCEEDED') {
    throw new Error(`Chrome package upload ended with state ${uploadState || 'UNKNOWN'}.`);
  }

  console.log('Submitting Chrome release for review and automatic publication…');
  const { data: published } = await apiRequest<ChromePublishResponse>(
    `${CHROME_API}/v2/${itemName}:publish`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        publishType: 'DEFAULT_PUBLISH',
        blockOnWarnings: true
      })
    },
    {
      expectedStatus: [200],
      fetchImpl,
      label: 'Chrome release submission'
    }
  );

  console.log(`Chrome submission accepted with state: ${published.state || 'UNKNOWN'}`);
  return published;
}

function edgeOperationId(location: string | null): string {
  const trimmed = location?.trim().replace(/\/+$/, '');
  if (!trimmed) throw new Error('Edge API response did not include an operation ID.');
  const operationId = trimmed.split('/').pop();
  if (!operationId) throw new Error('Edge API response included an invalid operation ID.');
  return operationId;
}

function edgeHeaders(
  clientId: string,
  apiKey: string,
  contentType?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `ApiKey ${apiKey}`,
    'X-ClientID': clientId
  };
  if (contentType) headers['Content-Type'] = contentType;
  return headers;
}

interface EdgePollOptions {
  url: string;
  clientId: string;
  apiKey: string;
  fetchImpl: FetchImplementation;
  label: string;
  sleep: Sleep;
  pollIntervalMs: number;
  pollAttempts: number;
}

async function pollEdgeOperation({
  url,
  clientId,
  apiKey,
  fetchImpl,
  label,
  sleep,
  pollIntervalMs,
  pollAttempts
}: EdgePollOptions): Promise<EdgeOperationResponse> {
  for (let attempt = 1; attempt <= pollAttempts; attempt += 1) {
    await sleep(pollIntervalMs);
    const { data } = await apiRequest<EdgeOperationResponse>(
      url,
      {
        method: 'GET',
        headers: edgeHeaders(clientId, apiKey)
      },
      {
        expectedStatus: [200],
        fetchImpl,
        label: `${label} status check`,
        retries: 3,
        sleep
      }
    );

    console.log(`${label} status: ${data.status || 'Unknown'}`);
    if (data.status === 'Succeeded') return data;
    if (data.status === 'Failed') {
      const details = data.errors ? ` ${JSON.stringify(data.errors)}` : '';
      throw new Error(
        `${label} failed: ${data.errorCode || 'UnknownError'} — ${data.message || 'No message.'}${details}`
      );
    }
  }

  throw new Error(`Timed out waiting for ${label.toLowerCase()}.`);
}

export async function publishEdge({
  archive,
  environment = process.env,
  fetchImpl = globalThis.fetch,
  sleep = delay,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  pollAttempts = DEFAULT_POLL_ATTEMPTS
}: PublishOptions): Promise<EdgeOperationResponse> {
  const {
    EDGE_CLIENT_ID,
    EDGE_API_KEY,
    EDGE_PRODUCT_ID
  } = requireEnvironment([
    'EDGE_CLIENT_ID',
    'EDGE_API_KEY',
    'EDGE_PRODUCT_ID'
  ], environment);

  const productPath = `products/${encodeURIComponent(EDGE_PRODUCT_ID)}`;
  console.log('Uploading package to Microsoft Edge Add-ons…');
  const upload = await apiRequest<Record<string, never>>(
    `${EDGE_API}/${productPath}/submissions/draft/package`,
    {
      method: 'POST',
      headers: edgeHeaders(EDGE_CLIENT_ID, EDGE_API_KEY, 'application/zip'),
      body: binaryBody(archive)
    },
    {
      expectedStatus: [202],
      fetchImpl,
      label: 'Edge package upload'
    }
  );
  const uploadOperationId = edgeOperationId(upload.headers.get('location'));

  await pollEdgeOperation({
    url: `${EDGE_API}/${productPath}/submissions/draft/package/operations/${encodeURIComponent(uploadOperationId)}`,
    clientId: EDGE_CLIENT_ID,
    apiKey: EDGE_API_KEY,
    fetchImpl,
    label: 'Edge package upload',
    sleep,
    pollIntervalMs,
    pollAttempts
  });

  const notes = environment.EDGE_CERTIFICATION_NOTES?.trim()
    || `Automated FormFully release ${environment.RELEASE_VERSION || ''}`.trim();
  console.log('Submitting Edge release for certification and publication…');
  const submission = await apiRequest<Record<string, never>>(
    `${EDGE_API}/${productPath}/submissions`,
    {
      method: 'POST',
      headers: edgeHeaders(EDGE_CLIENT_ID, EDGE_API_KEY, 'text/plain; charset=utf-8'),
      body: notes
    },
    {
      expectedStatus: [202],
      fetchImpl,
      label: 'Edge release submission'
    }
  );
  const publishOperationId = edgeOperationId(submission.headers.get('location'));

  return pollEdgeOperation({
    url: `${EDGE_API}/${productPath}/submissions/operations/${encodeURIComponent(publishOperationId)}`,
    clientId: EDGE_CLIENT_ID,
    apiKey: EDGE_API_KEY,
    fetchImpl,
    label: 'Edge release submission',
    sleep,
    pollIntervalMs,
    pollAttempts
  });
}

async function main(): Promise<void> {
  const { artifact, store } = parseArgs(process.argv.slice(2));
  const artifactPath = path.resolve(artifact);
  await verifyArchive(artifactPath);
  const archive = await readFile(artifactPath);

  if (store === 'chrome') await publishChrome({ archive });
  else await publishEdge({ archive });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Store publication failed: ${message}`);
    process.exitCode = 1;
  });
}
