import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildRoot = path.join(root, 'dist');

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
  (window as unknown as { chrome: unknown }).chrome = {
    storage: {
      local: {
        get(_keys: string[], callback: (values: Record<string, unknown>) => void) {
          callback({
            defaultValue: '5',
            customRules: [{ field: 'Group number', value: '12' }]
          });
        },
        set(value: StorageWrite) {
          writes.push(value);
        }
      }
    },
    tabs: {},
    scripting: {},
    runtime: {}
  };

  window.eval(fs.readFileSync(path.join(buildRoot, 'i18n.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(buildRoot, 'form-filler.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(buildRoot, 'popup.js'), 'utf8'));
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
