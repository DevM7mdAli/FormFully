const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'background.js'), 'utf8');

function createWorker(storedValues) {
  let commandListener;
  let injection;
  const imported = [];
  const context = {
    console,
    fillFields() {},
    importScripts(file) {
      imported.push(file);
    },
    chrome: {
      commands: {
        onCommand: {
          addListener(listener) {
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
        async executeScript(options) {
          injection = options;
        }
      }
    }
  };
  vm.runInNewContext(source, context);
  return {
    imported,
    runCommand: command => commandListener(command),
    getInjection: () => injection
  };
}

test('Keyboard shortcut defaults existing users to Classic mode', async () => {
  const worker = createWorker({ defaultValue: '9' });
  await worker.runCommand('fill-form');

  assert.deepEqual(worker.imported, ['form-filler.js']);
  assert.equal(worker.getInjection().target.tabId, 17);
  assert.equal(worker.getInjection().args[0].mode, 'classic');
  assert.equal(worker.getInjection().args[0].legacyValue, '9');
});

test('Keyboard shortcut uses the saved Smart mode and profile', async () => {
  const profile = { fullName: 'Alex Morgan', email: 'alex@example.com' };
  const worker = createWorker({ fillMode: 'smart', smartProfile: profile });
  await worker.runCommand('fill-form');

  assert.equal(worker.getInjection().args[0].mode, 'smart');
  assert.deepEqual(worker.getInjection().args[0].profile, profile);
});
