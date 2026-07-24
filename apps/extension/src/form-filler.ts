/**
 * Shared page-side fill engine.
 *
 * This function is deliberately self-contained because chrome.scripting serializes
 * it before running it in the active tab. Keep helper functions nested.
 */
async function fillFields(settings?: FillSettings | string): Promise<FillSummary> {
  const config: FillSettings = typeof settings === 'string'
    ? { mode: 'classic', legacyValue: settings }
    : (settings || {});

  if (config.mode !== 'smart') {
    const inputValue = String(config.legacyValue || '');
    const allInputs = document.getElementsByTagName('input');

    // This is the original FormFully behavior. Keep this path stable.
    for (let i = 0; i < allInputs.length; i++) {
      const inp = allInputs[i];
      if (!inp) continue;
      if (inp.type && inp.type.toLowerCase() === 'hidden') continue;
      if (inp.type && inp.type.toLowerCase() === 'radio') continue;

      if (inp.type === 'date') inp.value = formatDate(new Date());
      else if (['datetime', 'datetime-local'].includes(inp.type)) inp.value = formatDateTime(new Date());
      else if (inp.type === 'month') inp.value = formatMonth(new Date());
      else if (inp.type === 'week') inp.value = formatLegacyWeek(new Date());
      else if (inp.type === 'time') inp.value = formatTime(new Date());
      else if (inp.type === 'color') inp.value = randomColor();
      else if (inputValue.trim() === '') inp.value = String(Math.floor(Math.random() * 5) + 1);
      else inp.value = inputValue;
    }

    // Classic keeps its established value behavior and now also answers radio groups.
    const radioGroups = new Map<string | HTMLElement, HTMLElement[]>();
    Array.from(new Set(document.querySelectorAll<HTMLElement>('input[type="radio"], [role="radio"]')))
      .filter(radio => (!(radio instanceof HTMLInputElement) || !radio.disabled) &&
        radio.getAttribute('aria-disabled') !== 'true' &&
        (isVisible(radio) || isVisible(radio.closest<HTMLElement>('label'))))
      .forEach(radio => {
        const container = radio.closest<HTMLElement>('fieldset, [role="listitem"], .Qr7Oae') ||
          radio.parentElement || radio;
        const key = (radio instanceof HTMLInputElement ? radio.name : '') || container;
        if (!radioGroups.has(key)) radioGroups.set(key, []);
        radioGroups.get(key)?.push(radio);
      });
    let selectedRadios = 0;
    radioGroups.forEach(group => {
      if (group.some(radio =>
        (radio instanceof HTMLInputElement && radio.checked) ||
        radio.getAttribute('aria-checked') === 'true'
      )) return;
      const choice = group[Math.floor(Math.random() * group.length)];
      if (!choice) return;
      try {
        choice.click();
        selectedRadios++;
      } catch (e) { }
    });

    try { document.getElementById('a_next')?.click(); } catch (e) { }
    return { mode: 'classic', filled: allInputs.length, selectedRadios };
  }

  const profile = Object.assign({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    country: '',
    fallback: ''
  }, config.profile || {});
  const overwrite = config.overwrite === true;
  const now = new Date();
  const parts = String(profile.fullName || '').trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || 'Test';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : 'User';
  const values = {
    fullName: String(profile.fullName || '').trim() || 'Test User',
    firstName,
    lastName,
    email: String(profile.email || '').trim() || 'test@example.com',
    phone: String(profile.phone || '').trim() || '5551234567',
    company: String(profile.company || '').trim() || 'Example Company',
    address: String(profile.address || '').trim() || '123 Main Street',
    city: String(profile.city || '').trim() || 'Test City',
    country: String(profile.country || '').trim() || 'Saudi Arabia',
    fallback: String(profile.fallback || '').trim() || 'Test response',
    jobTitle: 'Software Engineer',
    state: 'Test Region',
    postalCode: '12345',
    username: 'testuser',
    website: 'https://example.com'
  };

  const summary: FillSummary = { mode: 'smart', filled: 0, skipped: 0 };

  function formatDate(date: Date): string { return date.toISOString().slice(0, 10); }
  function formatMonth(date: Date): string { return date.toISOString().slice(0, 7); }
  function formatDateTime(date: Date): string { return date.toISOString().slice(0, 16); }
  function formatWeek(date: Date): string {
    const year = date.getFullYear();
    const weekNumber = getISOWeek(date);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  }
  function formatLegacyWeek(date: Date): string {
    return `${date.getFullYear()}-W${getISOWeek(date)}`;
  }
  function getISOWeek(date: Date): number {
    const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tempDate.getUTCDay() || 7;
    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
    return Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
  function formatTime(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  function randomColor(): string {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }
  function normalize(value: unknown): string {
    return String(value || '')
      .toLowerCase()
      .replace(/[_\-./:]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function containsAny(text: string, terms: readonly string[]): boolean {
    return terms.some(term => text.includes(term));
  }
  function isVisible(element: Element | null): boolean {
    if (
      !element ||
      (element instanceof HTMLElement && element.hidden) ||
      element.getAttribute('aria-hidden') === 'true'
    ) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 &&
      element.getClientRects().length > 0;
  }
  function isEmpty(element: HTMLElement): boolean {
    if (element.isContentEditable ||
        (element.getAttribute('role') === 'textbox' && !['INPUT', 'TEXTAREA'].includes(element.tagName))) {
      return !String(element.textContent || '').trim();
    }
    if (element instanceof HTMLSelectElement) {
      return element.selectedIndex < 0 || !String(element.value || '').trim();
    }
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return !String(element.value || '').trim();
    }
    return !String(element.textContent || '').trim();
  }
  function getQuestionContainer(element: HTMLElement): HTMLElement | null {
    const container = element.closest<HTMLElement>(
      '[role="listitem"], .Qr7Oae, fieldset, .form-group, .field, .question, label'
    );
    if (container) return container;
    const parent = element.parentElement;
    return parent && !['FORM', 'BODY', 'HTML'].includes(parent.tagName) ? parent : null;
  }
  function getDescriptor(element: HTMLElement): string {
    const pieces: Array<string | null | undefined> = [
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
        ? element.name
        : undefined,
      element.id,
      element.getAttribute('type'),
      element.getAttribute('autocomplete'),
      element.getAttribute('placeholder'),
      element.getAttribute('aria-label'),
      element.getAttribute('data-testid')
    ];

    if (
      (element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement) &&
      element.labels
    ) {
      Array.from(element.labels).forEach(label => pieces.push(label.textContent));
    }
    const labelledBy = String(element.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
    labelledBy.forEach(id => pieces.push(document.getElementById(id)?.textContent));
    const container = getQuestionContainer(element);
    if (container) pieces.push(String(container.innerText || container.textContent || '').slice(0, 500));
    return normalize(pieces.filter(Boolean).join(' '));
  }
  const customRules = (Array.isArray(config.customRules) ? config.customRules : [])
    .slice(0, 12)
    .map(rule => ({
      field: normalize(String(rule?.field ?? '').slice(0, 120)),
      value: String(rule?.value ?? '').trim().slice(0, 500)
    }))
    .filter(rule => rule.field && rule.value)
    .sort((a, b) => b.field.length - a.field.length);
  function customRuleFor(descriptor: string): CustomRule | null {
    const normalizedDescriptor = normalize(descriptor);
    return customRules.find(rule => normalizedDescriptor.includes(rule.field)) || null;
  }
  function getChoiceDescriptor(element: HTMLElement): string {
    const pieces: Array<string | null | undefined> = [
      element instanceof HTMLInputElement ? element.value : undefined,
      element.getAttribute('aria-label'),
      element.getAttribute('data-value'),
      element.textContent
    ];
    if (element instanceof HTMLInputElement && element.labels) {
      Array.from(element.labels).forEach(label => pieces.push(label.textContent));
    }
    return normalize(pieces.filter(Boolean).join(' '));
  }
  function getChoiceGroupDescriptor(group: HTMLElement[]): string {
    const first = group[0];
    const container = first?.closest<HTMLElement>(
      '[role="listitem"], .Qr7Oae, fieldset, .form-group, .field, .question'
    );
    return normalize([
      first instanceof HTMLInputElement ? first.name : undefined,
      first?.getAttribute('aria-label'),
      container?.innerText || container?.textContent,
      first ? getDescriptor(first) : undefined
    ].filter(Boolean).join(' '));
  }
  function choiceForRule(group: HTMLElement[], rule: CustomRule | null): HTMLElement | null {
    if (!rule) return null;
    const desired = normalize(rule.value);
    return group.find(choice => {
      const candidate = getChoiceDescriptor(choice);
      return candidate === desired || candidate.includes(desired) || desired.includes(candidate);
    }) || null;
  }
  function isSensitive(element: HTMLElement, descriptor: string): boolean {
    const type = normalize(element.getAttribute('type'));
    return type === 'password' || containsAny(descriptor, [
      'password', 'passcode', 'one time code', 'otp', 'cvv', 'cvc',
      'credit card', 'card number', 'security code', 'social security',
      'كلمة المرور', 'رمز التحقق', 'بطاقة ائتمان'
    ]);
  }
  function classify(element: HTMLElement, descriptor: string): string {
    const type = normalize(element.getAttribute('type'));
    const autocomplete = normalize(element.getAttribute('autocomplete'));

    if (type === 'email' || autocomplete === 'email') return 'email';
    if (type === 'tel' || containsAny(autocomplete, ['tel'])) return 'phone';
    if (type === 'url' || autocomplete === 'url') return 'website';
    if (type === 'date') return 'date';
    if (type === 'datetime' || type === 'datetime local') return 'datetime';
    if (type === 'month') return 'month';
    if (type === 'week') return 'week';
    if (type === 'time') return 'time';
    if (type === 'color') return 'color';
    if (type === 'number' || type === 'range') return 'number';
    if (containsAny(autocomplete, ['given name'])) return 'firstName';
    if (containsAny(autocomplete, ['family name'])) return 'lastName';
    if (autocomplete === 'name') return 'fullName';
    if (containsAny(autocomplete, ['organization title'])) return 'jobTitle';
    if (autocomplete === 'organization') return 'company';
    if (containsAny(autocomplete, ['street address', 'address line'])) return 'address';
    if (containsAny(autocomplete, ['address level2'])) return 'city';
    if (containsAny(autocomplete, ['address level1'])) return 'state';
    if (autocomplete === 'postal code') return 'postalCode';
    if (autocomplete === 'country' || autocomplete === 'country name') return 'country';
    if (containsAny(descriptor, ['e mail', 'email', 'email address', 'البريد', 'الإيميل'])) return 'email';
    if (containsAny(descriptor, ['first name', 'given name', 'forename', 'الاسم الأول', 'الاسم الاول'])) return 'firstName';
    if (containsAny(descriptor, ['last name', 'family name', 'surname', 'الاسم الأخير', 'اسم العائلة'])) return 'lastName';
    if (containsAny(descriptor, ['phone', 'mobile', 'telephone', 'whatsapp', 'رقم الجوال', 'الجوال', 'الهاتف'])) return 'phone';
    if (containsAny(descriptor, ['company', 'organization', 'organisation', 'employer', 'الشركة', 'المنظمة'])) return 'company';
    if (containsAny(descriptor, ['job title', 'position', 'occupation', 'المسمى الوظيفي', 'الوظيفة'])) return 'jobTitle';
    if (containsAny(descriptor, ['postal', 'postcode', 'zip code', 'الرمز البريدي'])) return 'postalCode';
    if (containsAny(descriptor, ['country', 'nationality', 'الدولة', 'البلد', 'الجنسية'])) return 'country';
    if (containsAny(descriptor, ['city', 'town', 'المدينة'])) return 'city';
    if (containsAny(descriptor, ['state', 'province', 'region', 'المنطقة', 'المحافظة'])) return 'state';
    if (containsAny(descriptor, ['address', 'street', 'العنوان', 'الشارع'])) return 'address';
    if (containsAny(descriptor, ['website', 'portfolio', 'linkedin', 'url', 'الموقع', 'رابط'])) return 'website';
    if (containsAny(descriptor, ['username', 'user name', 'اسم المستخدم'])) return 'username';
    if (containsAny(descriptor, ['full name', 'your name', 'contact name', 'name', 'الاسم الكامل', 'الاسم'])) return 'fullName';
    return 'fallback';
  }
  function numberValue(element: HTMLElement): string {
    if (!(element instanceof HTMLInputElement)) return '1';
    const min = Number.parseFloat(element.min);
    const max = Number.parseFloat(element.max);
    let value = Number.isFinite(min) ? min : 1;
    if (value === 0 && (!Number.isFinite(max) || max >= 1)) value = 1;
    if (Number.isFinite(max)) value = Math.min(value, max);
    return String(value);
  }
  function valueFor(element: HTMLElement, kind: string): string {
    if (kind === 'date') return formatDate(now);
    if (kind === 'datetime') return formatDateTime(now);
    if (kind === 'month') return formatMonth(now);
    if (kind === 'week') return formatWeek(now);
    if (kind === 'time') return formatTime(now);
    if (kind === 'color') return randomColor();
    if (kind === 'number') return numberValue(element);
    return values[kind as keyof typeof values] || values.fallback;
  }
  function setNativeValue(element: HTMLElement, value: string): void {
    if (element.isContentEditable ||
        (element.getAttribute('role') === 'textbox' && !['INPUT', 'TEXTAREA'].includes(element.tagName))) {
      element.textContent = value;
    } else {
      const prototype = element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : element instanceof HTMLSelectElement
          ? HTMLSelectElement.prototype
          : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      if (setter) setter.call(element, value);
      else if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        element.value = value;
      }
    }
    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }
  function trimToConstraints(element: HTMLElement, value: string): string {
    const maxLength = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
      ? Number(element.maxLength)
      : -1;
    return maxLength > 0 ? String(value).slice(0, maxLength) : String(value);
  }
  function fillSelect(select: HTMLSelectElement, descriptor: string): boolean {
    if (!overwrite && !isEmpty(select)) return false;
    const customRule = customRuleFor(descriptor);
    const preferred = normalize(customRule?.value || valueFor(select, classify(select, descriptor)));
    const options = Array.from(select.options).filter(option => !option.disabled && String(option.value).trim());
    const match = options.find(option => {
      const candidate = normalize(`${option.value} ${option.textContent}`);
      return preferred && (candidate.includes(preferred) || preferred.includes(candidate));
    });
    const option = match || options[0];
    if (!option) return false;
    setNativeValue(select, option.value);
    return true;
  }
  function isConsentChoice(element: HTMLElement): boolean {
    const descriptor = getDescriptor(element);
    return containsAny(descriptor, [
      'terms', 'privacy policy', 'consent', 'subscribe', 'newsletter', 'marketing',
      'الشروط', 'الخصوصية', 'أوافق', 'النشرة'
    ]);
  }

  const fields = Array.from(document.querySelectorAll<HTMLElement>(
    'input, textarea, select, [contenteditable="true"], [role="textbox"]'
  ));

  for (const element of fields) {
    const unavailable =
      (element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement) &&
      (element.disabled || ('readOnly' in element && element.readOnly));
    if (!isVisible(element) || unavailable) {
      summary.skipped = (summary.skipped ?? 0) + 1;
      continue;
    }
    const tag = element.tagName.toLowerCase();
    const type = normalize(element.getAttribute('type'));
    if (['hidden', 'button', 'submit', 'reset', 'file', 'image', 'radio', 'checkbox'].includes(type)) {
      continue;
    }
    if (element instanceof HTMLSelectElement) {
      if (fillSelect(element, getDescriptor(element))) summary.filled++;
      continue;
    }
    if (!overwrite && !isEmpty(element)) continue;
    const descriptor = getDescriptor(element);
    if (isSensitive(element, descriptor) || type === 'search') {
      summary.skipped = (summary.skipped ?? 0) + 1;
      continue;
    }
    const customRule = customRuleFor(descriptor);
    const value = trimToConstraints(
      element,
      customRule?.value || valueFor(element, classify(element, descriptor))
    );
    try {
      setNativeValue(element, value);
      summary.filled++;
    } catch (e) {
      summary.skipped = (summary.skipped ?? 0) + 1;
    }
  }

  // Native choice groups: choose one unanswered option per question/group.
  const nativeChoices = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[type="radio"], input[type="checkbox"]')
  )
    .filter(element => isVisible(element) && !element.disabled);
  const nativeGroups = new Map<string | HTMLElement, HTMLInputElement[]>();
  nativeChoices.forEach(element => {
    const container = getQuestionContainer(element);
    const key = element.name || container || element;
    if (!nativeGroups.has(key)) nativeGroups.set(key, []);
    nativeGroups.get(key)?.push(element);
  });
  nativeGroups.forEach(group => {
    if (group.some(element => element.checked) || group.some(isConsentChoice)) return;
    const customRule = customRuleFor(getChoiceGroupDescriptor(group));
    const choice = choiceForRule(group, customRule) || group[0];
    if (!choice) return;
    try {
      choice.click();
      summary.filled++;
    } catch (e) {
      summary.skipped = (summary.skipped ?? 0) + 1;
    }
  });

  // Google Forms and other accessible custom controls.
  const customChoices = Array.from(
    document.querySelectorAll<HTMLElement>('[role="radio"], [role="checkbox"]')
  )
    .filter(element => !['INPUT', 'BUTTON'].includes(element.tagName) && isVisible(element) &&
      element.getAttribute('aria-disabled') !== 'true');
  const customGroups = new Map<HTMLElement, HTMLElement[]>();
  customChoices.forEach(element => {
    const container = getQuestionContainer(element);
    const key = container || element.parentElement || element;
    if (!customGroups.has(key)) customGroups.set(key, []);
    customGroups.get(key)?.push(element);
  });
  customGroups.forEach(group => {
    if (group.some(element => element.getAttribute('aria-checked') === 'true') ||
        group.some(isConsentChoice)) return;
    const customRule = customRuleFor(getChoiceGroupDescriptor(group));
    const choice = choiceForRule(group, customRule) || group[0];
    if (!choice) return;
    try {
      choice.click();
      summary.filled++;
    } catch (e) {
      summary.skipped = (summary.skipped ?? 0) + 1;
    }
  });

  // Custom dropdowns render their options after click, so handle them last.
  const customSelects = Array.from(
    document.querySelectorAll<HTMLElement>('[role="listbox"], [role="combobox"]')
  )
    .filter(element => !['INPUT', 'SELECT'].includes(element.tagName) && isVisible(element) &&
      element.getAttribute('aria-disabled') !== 'true');
  for (const select of customSelects) {
    const descriptor = getDescriptor(select);
    const customRule = customRuleFor(descriptor);
    if (!customRule && !overwrite && normalize(select.getAttribute('aria-label') || select.textContent) &&
        select.getAttribute('aria-expanded') !== 'false') continue;
    try {
      select.click();
      await new Promise(resolve => setTimeout(resolve, 50));
      const options = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'))
        .filter(option => isVisible(option) && option.getAttribute('aria-disabled') !== 'true');
      const desired = normalize(customRule?.value);
      const option = (desired && options.find(item => {
        const candidate = normalize(item.textContent);
        return candidate === desired || candidate.includes(desired) || desired.includes(candidate);
      })) || options.find(item => normalize(item.textContent) &&
        !containsAny(normalize(item.textContent), ['choose', 'select', 'اختيار']));
      if (option) {
        option.click();
        summary.filled++;
      }
    } catch (e) {
      summary.skipped = (summary.skipped ?? 0) + 1;
    }
  }

  return summary;
}
