import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildRoot = path.join(root, 'dist/chrome');

interface StorageWrite {
  fillMode?: FormFullyMode;
  customRules?: CustomRule[];
  [key: string]: unknown;
}

function requiredElement<T extends Element>(element: T | null | undefined): T {
  assert.ok(element);
  return element;
}

test('Popup defaults to Classic, persists mode changes, and supports Arabic RTL', async () => {
  const html = fs.readFileSync(path.join(buildRoot, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    url: 'https://extension.test/index.html'
  });
  const { window } = dom;
  const writes: StorageWrite[] = [];
  let injectedTabId: number | undefined;
  (window as unknown as { browser: unknown }).browser = {
    storage: {
      local: {
        async get() {
          return {
            defaultValue: '5',
            customRules: [{ field: 'Group number', value: '12' }]
          };
        },
        async set(value: StorageWrite) {
          writes.push(value);
        }
      }
    },
    tabs: {
      async query() {
        return [{ id: 27 }];
      }
    },
    scripting: {
      async executeScript(options: { target: { tabId: number } }) {
        injectedTabId = options.target.tabId;
        return [{ result: { mode: 'classic', filled: 2 } }];
      }
    },
    runtime: {}
  };
  (window as unknown as { chrome: unknown }).chrome = {};

  window.eval(
    [
      'browser-api.js',
      'i18n.js',
      'form-filler.js',
      'popup.js'
    ]
      .map((file) => fs.readFileSync(path.join(buildRoot, file), 'utf8'))
      .join('\n')
  );
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  await new Promise(resolve => window.setTimeout(resolve, 0));

  const classic = requiredElement(window.document.getElementById('classicModeTab'));
  const smart = requiredElement(window.document.getElementById('smartModeTab'));
  assert.equal(classic.getAttribute('aria-selected'), 'true');
  assert.equal(
    requiredElement(window.document.querySelector<HTMLInputElement>('#auto')).value,
    '5'
  );
  assert.equal(window.document.querySelectorAll('.custom-rule-row').length, 1);
  assert.equal(
    requiredElement(
      window.document.querySelector<HTMLInputElement>('[data-custom-property="field"]')
    ).value,
    'Group number'
  );

  requiredElement(window.document.getElementById('fillButton')).click();
  await new Promise(resolve => window.setTimeout(resolve, 0));
  assert.equal(injectedTabId, 27);
  assert.equal(
    requiredElement(window.document.getElementById('fillStatus')).textContent,
    '2 fields filled.'
  );

  smart.click();
  assert.equal(smart.getAttribute('aria-selected'), 'true');
  assert.equal(
    requiredElement(window.document.getElementById('smartPanel')).classList.contains('hidden'),
    false
  );
  assert.ok(writes.some(value => value.fillMode === 'smart'));

  requiredElement(window.document.getElementById('addCustomRule')).click();
  assert.equal(window.document.querySelectorAll('.custom-rule-row').length, 2);
  const addedField = requiredElement(
    window.document.querySelectorAll<HTMLInputElement>('[data-custom-property="field"]')[1]
  );
  addedField.value = 'Employee ID';
  addedField.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.ok(writes.some(value =>
    value.customRules?.some(rule => rule.field === 'Employee ID')
  ));

  requiredElement(window.document.getElementById('btnLangAr')).click();
  assert.equal(window.document.body.dir, 'rtl');
  assert.equal(
    requiredElement(window.document.getElementById('smartModeText')).textContent,
    'ذكي'
  );
  assert.equal(
    requiredElement(window.document.getElementById('fillBtnText')).textContent,
    'تعبئة ذكية'
  );
});
