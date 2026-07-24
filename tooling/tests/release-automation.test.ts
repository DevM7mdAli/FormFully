import assert from 'node:assert/strict';
import { test } from 'node:test';

const releaseModule = import('../release/publish-stores.ts');
const packageModule = import('../extension/package.ts');

interface FetchCall {
  url: string | URL | Request;
  options: RequestInit;
}

function jsonResponse(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

test('release version validation rejects mismatched tags and invalid store versions', async () => {
  const { assertReleaseTag, validateVersion } = await packageModule;

  assert.equal(validateVersion('2.2.0'), '2.2.0');
  assert.throws(() => validateVersion('2.02.0'), /Invalid manifest version/);
  assert.throws(() => validateVersion('2.70000.0'), /at most 65535/);
  assert.doesNotThrow(() => assertReleaseTag('2.2.0', 'v2.2.0'));
  assert.throws(() => assertReleaseTag('2.2.0', 'v2.3.0'), /does not match/);
});

test('Chrome release refreshes auth, waits for upload processing, and submits safely', async () => {
  const { publishChrome } = await releaseModule;
  const calls: FetchCall[] = [];
  const responses = [
    jsonResponse({ access_token: 'access-token' }),
    jsonResponse({ uploadState: 'IN_PROGRESS' }),
    jsonResponse({ lastAsyncUploadState: 'SUCCEEDED' }),
    jsonResponse({ state: 'PENDING_REVIEW' })
  ];

  const result = await publishChrome({
    archive: Buffer.from('zip'),
    environment: {
      CHROME_CLIENT_ID: 'client-id',
      CHROME_CLIENT_SECRET: 'client-secret',
      CHROME_REFRESH_TOKEN: 'refresh-token',
      CHROME_PUBLISHER_ID: 'publisher-id',
      CHROME_EXTENSION_ID: 'abcdefghijklmnopabcdefghijklmnop'
    },
    fetchImpl: async (url, options) => {
      calls.push({ url, options: options ?? {} });
      const response = responses.shift();
      assert.ok(response);
      return response;
    },
    sleep: async () => {},
    pollIntervalMs: 0
  });

  assert.equal(result.state, 'PENDING_REVIEW');
  assert.equal(calls.length, 4);
  assert.match(String(calls[1]?.url), /\/upload\/v2\/publishers\/publisher-id\/items\//);
  assert.equal(calls[2]?.options.method, 'GET');
  assert.deepEqual(JSON.parse(String(calls[3]?.options.body)), {
    publishType: 'DEFAULT_PUBLISH',
    blockOnWarnings: true
  });
});

test('Chrome authentication errors fail immediately instead of retrying invalid credentials', async () => {
  const { publishChrome } = await releaseModule;
  let calls = 0;

  await assert.rejects(
    publishChrome({
      archive: Buffer.from('zip'),
      environment: {
        CHROME_CLIENT_ID: 'client-id',
        CHROME_CLIENT_SECRET: 'client-secret',
        CHROME_REFRESH_TOKEN: 'invalid-refresh-token',
        CHROME_PUBLISHER_ID: 'publisher-id',
        CHROME_EXTENSION_ID: 'abcdefghijklmnopabcdefghijklmnop'
      },
      fetchImpl: async () => {
        calls += 1;
        return jsonResponse({ error: 'invalid_grant' }, 400);
      },
      sleep: async () => {}
    }),
    /HTTP 400/
  );

  assert.equal(calls, 1);
});

test('Edge release waits for upload and submission operations independently', async () => {
  const { publishEdge } = await releaseModule;
  const calls: FetchCall[] = [];
  const responses = [
    new Response('', { status: 202, headers: { Location: 'upload-operation' } }),
    jsonResponse({ status: 'InProgress' }),
    jsonResponse({ status: 'Succeeded' }),
    new Response('', { status: 202, headers: { Location: 'publish-operation' } }),
    jsonResponse({ status: 'Succeeded', message: 'Submission created' })
  ];

  const result = await publishEdge({
    archive: Buffer.from('zip'),
    environment: {
      EDGE_CLIENT_ID: 'client-id',
      EDGE_API_KEY: 'api-key',
      EDGE_PRODUCT_ID: 'd34f98f5-f9b7-42b1-bebb-98707202b21d',
      EDGE_CERTIFICATION_NOTES: 'Automated release test'
    },
    fetchImpl: async (url, options) => {
      calls.push({ url, options: options ?? {} });
      const response = responses.shift();
      assert.ok(response);
      return response;
    },
    sleep: async () => {},
    pollIntervalMs: 0
  });

  assert.equal(result.status, 'Succeeded');
  assert.equal(calls.length, 5);
  const uploadHeaders = calls[0]?.options.headers as Record<string, string>;
  assert.equal(uploadHeaders.Authorization, 'ApiKey api-key');
  assert.equal(uploadHeaders['X-ClientID'], 'client-id');
  assert.match(String(calls[2]?.url), /draft\/package\/operations\/upload-operation$/);
  assert.equal(calls[3]?.options.body, 'Automated release test');
  assert.match(String(calls[4]?.url), /submissions\/operations\/publish-operation$/);
});

test('release automation reports all missing credentials without exposing values', async () => {
  const { requireEnvironment } = await releaseModule;

  assert.throws(
    () => requireEnvironment(['FIRST_SECRET', 'SECOND_SECRET'], { FIRST_SECRET: '' }),
    /FIRST_SECRET, SECOND_SECRET/
  );
});
