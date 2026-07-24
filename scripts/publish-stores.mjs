import { open, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME_API = 'https://chromewebstore.googleapis.com';
const EDGE_API = 'https://api.addons.microsoftedge.microsoft.com/v1';
const DEFAULT_POLL_INTERVAL_MS = 10_000;
const DEFAULT_POLL_ATTEMPTS = 60;

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--artifact' || argument === '--store') {
      args[argument.slice(2)] = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!args.artifact) throw new Error('--artifact is required.');
  if (!['chrome', 'edge'].includes(args.store)) {
    throw new Error('--store must be either "chrome" or "edge".');
  }

  return args;
}

export function requireEnvironment(names, environment = process.env) {
  const values = {};
  const missing = [];

  for (const name of names) {
    const value = environment[name]?.trim();
    if (value) values[name] = value;
    else missing.push(name);
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return values;
}

async function verifyArchive(artifactPath) {
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

function responseBodyText(text) {
  return text.length > 2_000 ? `${text.slice(0, 2_000)}…` : text;
}

class ApiResponseError extends Error {
  constructor(message, retryable) {
    super(message);
    this.retryable = retryable;
  }
}

async function apiRequest(
  url,
  options,
  {
    expectedStatus,
    fetchImpl,
    label,
    retries = 0,
    sleep = delay
  }
) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        ...options,
        signal: AbortSignal.timeout(60_000)
      });
      const text = await response.text();
      const data = text ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })() : {};

      if (expectedStatus.includes(response.status)) {
        return { data, headers: response.headers, status: response.status };
      }

      const retryable = response.status === 429 || response.status >= 500;
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      lastError = new ApiResponseError(
        `${label} failed with HTTP ${response.status}: ${responseBodyText(message)}`,
        retryable
      );
      if (!retryable || attempt === retries) throw lastError;
    } catch (error) {
      lastError = error;
      if (error.retryable === false || attempt === retries) throw error;
    }

    await sleep(Math.min(1_000 * (2 ** attempt), 10_000));
  }

  throw lastError;
}

function normalizeChromeUploadState(state) {
  return String(state || '').replace(/^UPLOAD_/, '').replace(/^SUCCESS$/, 'SUCCEEDED');
}

async function pollChromeUpload({
  accessToken,
  itemName,
  fetchImpl,
  sleep,
  pollIntervalMs,
  pollAttempts
}) {
  const url = `${CHROME_API}/v2/${itemName}:fetchStatus`;

  for (let attempt = 1; attempt <= pollAttempts; attempt += 1) {
    await sleep(pollIntervalMs);
    const { data } = await apiRequest(
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
}) {
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
  const { data: token } = await apiRequest(
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
  const { data: upload } = await apiRequest(
    `${CHROME_API}/upload/v2/${itemName}:upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/zip'
      },
      body: archive
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
  const { data: published } = await apiRequest(
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

function edgeOperationId(location) {
  const trimmed = location?.trim().replace(/\/+$/, '');
  if (!trimmed) throw new Error('Edge API response did not include an operation ID.');
  return trimmed.split('/').pop();
}

function edgeHeaders(clientId, apiKey, contentType) {
  const headers = {
    Authorization: `ApiKey ${apiKey}`,
    'X-ClientID': clientId
  };
  if (contentType) headers['Content-Type'] = contentType;
  return headers;
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
}) {
  for (let attempt = 1; attempt <= pollAttempts; attempt += 1) {
    await sleep(pollIntervalMs);
    const { data } = await apiRequest(
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
}) {
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
  const upload = await apiRequest(
    `${EDGE_API}/${productPath}/submissions/draft/package`,
    {
      method: 'POST',
      headers: edgeHeaders(EDGE_CLIENT_ID, EDGE_API_KEY, 'application/zip'),
      body: archive
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
  const submission = await apiRequest(
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

async function main() {
  const { artifact, store } = parseArgs(process.argv.slice(2));
  const artifactPath = path.resolve(artifact);
  await verifyArchive(artifactPath);
  const archive = await readFile(artifactPath);

  if (store === 'chrome') await publishChrome({ archive });
  else await publishEdge({ archive });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Store publication failed: ${error.message}`);
    process.exitCode = 1;
  });
}
