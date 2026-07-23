const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const engineSource = fs.readFileSync(path.join(root, 'form-filler.js'), 'utf8');

function createPage(body) {
  const dom = new JSDOM(`<!doctype html><html><body>${body}</body></html>`, {
    runScripts: 'outside-only',
    url: 'https://example.com/form'
  });
  const { window } = dom;
  Object.defineProperty(window.HTMLElement.prototype, 'getClientRects', {
    configurable: true,
    value() {
      return this.hidden ? [] : [{ width: 100, height: 20 }];
    }
  });
  window.eval(`${engineSource}\nwindow.__fillFields = fillFields;`);
  return dom;
}

test('Classic mode retains the original all-input behavior and next click', async () => {
  const dom = createPage(`
    <input id="text">
    <input id="number" type="number">
    <input id="hidden" type="hidden" value="unchanged">
    <input id="date" type="date">
    <button id="a_next">Next</button>
  `);
  const { document } = dom.window;
  let nextClicks = 0;
  document.getElementById('a_next').addEventListener('click', () => nextClicks++);

  const result = await dom.window.__fillFields({ mode: 'classic', legacyValue: '42' });

  assert.equal(result.mode, 'classic');
  assert.equal(document.getElementById('text').value, '42');
  assert.equal(document.getElementById('number').value, '42');
  assert.equal(document.getElementById('hidden').value, 'unchanged');
  assert.match(document.getElementById('date').value, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(nextClicks, 1);
});

test('Smart mode fills a mixed form without overwriting or touching sensitive fields', async () => {
  const dom = createPage(`
    <form>
      <label>Full name <input id="name" autocomplete="name"></label>
      <label>Email <input id="email" type="email"></label>
      <label>Phone <input id="phone" type="tel"></label>
      <label>Company name <input id="company"></label>
      <label>Message <textarea id="message"></textarea></label>
      <label>Country
        <select id="country">
          <option value="">Choose</option>
          <option value="sa">Saudi Arabia</option>
          <option value="us">United States</option>
        </select>
      </label>
      <label>Already filled <input id="existing" value="Keep me"></label>
      <label>Password <input id="password" type="password"></label>
      <fieldset>
        <legend>Preferred contact</legend>
        <label><input type="radio" name="contact" value="email"> Email</label>
        <label><input type="radio" name="contact" value="phone"> Phone</label>
      </fieldset>
      <label><input id="terms" type="checkbox"> I agree to the terms and privacy policy</label>
    </form>
  `);
  const { document } = dom.window;
  let inputEvents = 0;
  let changeEvents = 0;
  document.getElementById('email').addEventListener('input', () => inputEvents++);
  document.getElementById('email').addEventListener('change', () => changeEvents++);

  const result = await dom.window.__fillFields({
    mode: 'smart',
    profile: {
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      phone: '+966500000000',
      company: 'Acme Labs',
      country: 'Saudi Arabia',
      fallback: 'Hello from FormFully'
    }
  });

  assert.equal(document.getElementById('name').value, 'Alex Morgan');
  assert.equal(document.getElementById('email').value, 'alex@example.com');
  assert.equal(document.getElementById('phone').value, '+966500000000');
  assert.equal(document.getElementById('company').value, 'Acme Labs');
  assert.equal(document.getElementById('message').value, 'Hello from FormFully');
  assert.equal(document.getElementById('country').value, 'sa');
  assert.equal(document.getElementById('existing').value, 'Keep me');
  assert.equal(document.getElementById('password').value, '');
  assert.equal(document.querySelectorAll('input[name="contact"]:checked').length, 1);
  assert.equal(document.getElementById('terms').checked, false);
  assert.equal(inputEvents, 1);
  assert.equal(changeEvents, 1);
  assert.ok(result.filled >= 7);
});

test('Smart mode understands Arabic labels and safe generated defaults', async () => {
  const dom = createPage(`
    <label>الاسم الكامل <input id="arabic-name"></label>
    <label>البريد الإلكتروني <input id="arabic-email"></label>
    <label>رقم الجوال <input id="arabic-phone"></label>
  `);
  const { document } = dom.window;

  await dom.window.__fillFields({ mode: 'smart', profile: {} });

  assert.equal(document.getElementById('arabic-name').value, 'Test User');
  assert.equal(document.getElementById('arabic-email').value, 'test@example.com');
  assert.equal(document.getElementById('arabic-phone').value, '5551234567');
});

test('Smart mode fills Google-Forms-style text and accessible choices', async () => {
  const dom = createPage(`
    <div class="Qr7Oae" role="listitem">
      <div>Email address</div>
      <input id="google-email" type="email" aria-label="Your answer">
    </div>
    <div class="Qr7Oae" role="listitem" id="radio-question">
      <div>Choose one</div>
      <div role="radio" aria-checked="false" tabindex="0">First option</div>
      <div role="radio" aria-checked="false" tabindex="0">Second option</div>
    </div>
    <div class="Qr7Oae" role="listitem" id="checkbox-question">
      <div>Select all that apply</div>
      <div role="checkbox" aria-checked="false" tabindex="0">First option</div>
      <div role="checkbox" aria-checked="false" tabindex="0">Second option</div>
    </div>
  `);
  const { document } = dom.window;
  document.querySelectorAll('[role="radio"], [role="checkbox"]').forEach(control => {
    control.addEventListener('click', () => control.setAttribute('aria-checked', 'true'));
  });

  const result = await dom.window.__fillFields({
    mode: 'smart',
    profile: { email: 'forms@example.com' }
  });

  assert.equal(document.getElementById('google-email').value, 'forms@example.com');
  assert.equal(document.querySelectorAll('#radio-question [aria-checked="true"]').length, 1);
  assert.equal(document.querySelectorAll('#checkbox-question [aria-checked="true"]').length, 1);
  assert.ok(result.filled >= 3);
});
