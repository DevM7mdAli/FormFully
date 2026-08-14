import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chromeBuild = path.join(root, 'dist/chrome');
const browserApiSource = fs.readFileSync(path.join(chromeBuild, 'browser-api.js'), 'utf8');
const backgroundSource = fs.readFileSync(path.join(chromeBuild, 'background.js'), 'utf8');
const serviceWorkerSource = fs.readFileSync(
  path.join(chromeBuild, 'service-worker.js'),
  'utf8'
);
const chromeManifest = JSON.parse(
  fs.readFileSync(path.join(chromeBuild, 'manifest.json'), 'utf8')
) as {
  commands?: Record<string, { suggested_key?: { mac?: string } }>;
  background?: { service_worker?: string };
};
const firefoxManifest = JSON.parse(
  fs.readFileSync(path.join(root, 'dist/firefox/manifest.json'), 'utf8')
) as {
  commands?: Record<string, { suggested_key?: { mac?: string } }>;
  background?: { scripts?: string[] };
  browser_specific_settings?: {
    gecko?: {
      id?: string;
      strict_min_version?: string;
      data_collection_permissions?: { required?: string[] };
    };
  };
};
const safariManifest = JSON.parse(
  fs.readFileSync(path.join(root, 'dist/safari/manifest.json'), 'utf8')
) as {
  background?: { scripts?: string[] };
  browser_specific_settings?: { safari?: { strict_min_version?: string } };
};

interface CapturedInjection {
  target: { tabId: number };
  args: [FillSettings];
}

function createWorker(storedValues: Record<string, unknown>, preferBrowser = false) {
  let commandListener: ((command: string) => Promise<void>) | undefined;
  let injection: CapturedInjection | undefined;
  const extensionApi = {
    commands: {
      onCommand: {
        addListener(listener: (command: string) => Promise<void>) {
          commandListener = listener;
        }
      }
    },
    tabs: {
      async query() {
        return [{ id: 17 }];
      }
    },
    storage: {
      local: {
        async get() {
          return storedValues;
        }
      }
    },
    scripting: {
      async executeScript(options: CapturedInjection) {
        injection = options;
        return [];
      }
    }
  };
  const context: Record<string, unknown> = {
    console,
    fillFields() {},
    chrome: preferBrowser ? {} : extensionApi
  };
  if (preferBrowser) context.browser = extensionApi;
  vm.runInNewContext(`${browserApiSource}\n${backgroundSource}`, context);
  return {
    runCommand: async (command: string) => {
      assert.ok(commandListener);
      await commandListener(command);
    },
    getInjection: () => {
      assert.ok(injection);
      return injection;
    }
  };
}

test('Manifest preserves both released shortcut command IDs', () => {
  assert.ok(chromeManifest.commands?.['fill-form']);
  assert.equal(
    chromeManifest.commands?.['fill-form-alt']?.suggested_key?.mac,
    'Option+Shift+F'
  );
});

test('Each browser receives its supported background manifest', () => {
  assert.equal(chromeManifest.background?.service_worker, 'service-worker.js');
  assert.deepEqual(
    firefoxManifest.background?.scripts,
    ['browser-api.js', 'form-filler.js', 'background.js']
  );
  assert.equal(
    firefoxManifest.browser_specific_settings?.gecko?.id,
    'formfully@devm7mdali.github.io'
  );
  assert.equal(
    firefoxManifest.browser_specific_settings?.gecko?.strict_min_version,
    '142.0'
  );
  assert.equal(
    firefoxManifest.commands?.['fill-form-alt']?.suggested_key?.mac,
    'Alt+Shift+F'
  );
  assert.deepEqual(
    firefoxManifest.browser_specific_settings?.gecko?.data_collection_permissions?.required,
    ['none']
  );
  assert.deepEqual(
    safariManifest.background?.scripts,
    ['browser-api.js', 'form-filler.js', 'background.js']
  );
  assert.equal(
    safariManifest.browser_specific_settings?.safari?.strict_min_version,
    '15.4'
  );
});

test('Chromium service worker loads the shared background scripts in order', () => {
  const imported: string[] = [];
  vm.runInNewContext(serviceWorkerSource, {
    importScripts(...files: string[]) {
      imported.push(...files);
    }
  });
  assert.deepEqual(imported, ['browser-api.js', 'form-filler.js', 'background.js']);
});

test('Keyboard shortcut defaults existing users to Classic mode', async () => {
  const worker = createWorker({ defaultValue: '9' });
  await worker.runCommand('fill-form');

  assert.equal(worker.getInjection().target.tabId, 17);
  assert.equal(worker.getInjection().args[0].mode, 'classic');
  assert.equal(worker.getInjection().args[0].legacyValue, '9');
});

test('Legacy Option+Shift+F command remains supported for existing macOS users', async () => {
  const worker = createWorker({ defaultValue: '17' });
  await worker.runCommand('fill-form-alt');

  assert.equal(worker.getInjection().target.tabId, 17);
  assert.equal(worker.getInjection().args[0].mode, 'classic');
  assert.equal(worker.getInjection().args[0].legacyValue, '17');
});

test('Keyboard shortcut uses the saved Smart mode and profile', async () => {
  const profile = { fullName: 'Alex Morgan', email: 'alex@example.com' };
  const customRules = [{ field: 'Group number', value: '12' }];
  const worker = createWorker(
    { fillMode: 'smart', smartProfile: profile, customRules },
    true
  );
  await worker.runCommand('fill-form');

  assert.equal(worker.getInjection().args[0].mode, 'smart');
  assert.deepEqual(worker.getInjection().args[0].profile, profile);
  assert.deepEqual(worker.getInjection().args[0].customRules, customRules);
});
