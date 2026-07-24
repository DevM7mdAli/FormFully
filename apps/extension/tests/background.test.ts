import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'dist/background.js'), 'utf8');
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'manifest.json'), 'utf8')
) as {
  commands?: Record<string, { suggested_key?: { mac?: string } }>;
};

interface CapturedInjection {
  target: { tabId: number };
  args: [FillSettings];
}

function createWorker(storedValues: Record<string, unknown>) {
  let commandListener: ((command: string) => Promise<void>) | undefined;
  let injection: CapturedInjection | undefined;
  const imported: string[] = [];
  const context = {
    console,
    fillFields() {},
    importScripts(file: string) {
      imported.push(file);
    },
    chrome: {
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
        }
      }
    }
  };
  vm.runInNewContext(source, context);
  return {
    imported,
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
  assert.ok(manifest.commands?.['fill-form']);
  assert.equal(
    manifest.commands?.['fill-form-alt']?.suggested_key?.mac,
    'Option+Shift+F'
  );
});

test('Keyboard shortcut defaults existing users to Classic mode', async () => {
  const worker = createWorker({ defaultValue: '9' });
  await worker.runCommand('fill-form');

  assert.deepEqual(worker.imported, ['form-filler.js']);
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
  const worker = createWorker({ fillMode: 'smart', smartProfile: profile, customRules });
  await worker.runCommand('fill-form');

  assert.equal(worker.getInjection().args[0].mode, 'smart');
  assert.deepEqual(worker.getInjection().args[0].profile, profile);
  assert.deepEqual(worker.getInjection().args[0].customRules, customRules);
});
