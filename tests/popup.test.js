const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');

test('Popup defaults to Classic, persists mode changes, and supports Arabic RTL', async () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    url: 'https://extension.test/index.html'
  });
  const { window } = dom;
  const writes = [];
  window.chrome = {
    storage: {
      local: {
        get(keys, callback) {
          callback({
            defaultValue: '5',
            customRules: [{ field: 'Group number', value: '12' }]
          });
        },
        set(value) {
          writes.push(value);
        }
      }
    },
    tabs: {},
    scripting: {},
    runtime: {}
  };

  window.eval(fs.readFileSync(path.join(root, 'i18.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(root, 'form-filler.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(root, 'script.js'), 'utf8'));
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  await new Promise(resolve => window.setTimeout(resolve, 0));

  const classic = window.document.getElementById('classicModeTab');
  const smart = window.document.getElementById('smartModeTab');
  assert.equal(classic.getAttribute('aria-selected'), 'true');
  assert.equal(window.document.getElementById('auto').value, '5');
  assert.equal(window.document.querySelectorAll('.custom-rule-row').length, 1);
  assert.equal(
    window.document.querySelector('[data-custom-property="field"]').value,
    'Group number'
  );

  smart.click();
  assert.equal(smart.getAttribute('aria-selected'), 'true');
  assert.equal(window.document.getElementById('smartPanel').classList.contains('hidden'), false);
  assert.ok(writes.some(value => value.fillMode === 'smart'));

  window.document.getElementById('addCustomRule').click();
  assert.equal(window.document.querySelectorAll('.custom-rule-row').length, 2);
  const addedField = window.document.querySelectorAll('[data-custom-property="field"]')[1];
  addedField.value = 'Employee ID';
  addedField.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.ok(writes.some(value =>
    value.customRules?.some(rule => rule.field === 'Employee ID')
  ));

  window.document.getElementById('btnLangAr').click();
  assert.equal(window.document.body.dir, 'rtl');
  assert.equal(window.document.getElementById('smartModeText').textContent, 'ذكي');
  assert.equal(window.document.getElementById('fillBtnText').textContent, 'تعبئة ذكية');
});
