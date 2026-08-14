// Popup behavior and persistence.
(function initPopup() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPopup, { once: true });
    return;
  }

  interface PersistedCustomRule extends CustomRule {
    id: string;
  }

  const fillBtn = document.getElementById('fillButton') as HTMLButtonElement | null;
  if (!fillBtn) return;

  const legacyInput = document.getElementById('auto') as HTMLInputElement | null;
  const classicPanel = document.getElementById('classicPanel');
  const smartPanel = document.getElementById('smartPanel');
  const modeTabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode]'));
  const profileInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>('[data-profile-key]')
  );
  const customRulesWrap = document.getElementById('customRules');
  const customRulesEmpty = document.getElementById('customRulesEmpty');
  const customRuleCount = document.getElementById('customRuleCount');
  const customFieldsDetails = document.getElementById('customFieldsDetails') as HTMLDetailsElement | null;
  const addCustomRuleBtn = document.getElementById('addCustomRule') as HTMLButtonElement | null;
  const presetsWrap = document.getElementById('presets');
  const langButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.lang-btn'));
  const fillStatus = document.getElementById('fillStatus');
  const shortcutOpenBtn = document.getElementById('shortcutOpenBtn') as HTMLButtonElement | null;
  const shortcutModal = document.getElementById('shortcutModal');
  const shortcutModalClose = document.getElementById('shortcutModalClose') as HTMLButtonElement | null;
  const MAX_CUSTOM_RULES = 12;
  let customRuleSequence = 0;
  let customRuleState: PersistedCustomRule[] = [];
  let currentMode: FormFullyMode = 'classic';

  if (!legacyInput) {
    console.warn('[FormFully] Missing core elements.');
    return;
  }
  const legacyValueInput = legacyInput;

  function currentTranslations(): TranslationDictionary {
    const lang = localStorage.getItem('ff_lang') || 'en';
    const translations = window.I18N?.[lang] || window.I18N?.en;
    if (!translations) {
      throw new Error('FormFully translations are unavailable.');
    }
    return translations;
  }

  function setStatus(message = '', isError = false): void {
    if (!fillStatus) return;
    fillStatus.textContent = message || '';
    fillStatus.classList.toggle('hidden', !message);
    fillStatus.classList.toggle('bg-red-500/25', Boolean(isError));
  }

  function updateModeUI(mode: unknown, persistMode: boolean): void {
    currentMode = mode === 'smart' ? 'smart' : 'classic';
    const isSmart = currentMode === 'smart';
    classicPanel?.classList.toggle('hidden', isSmart);
    smartPanel?.classList.toggle('hidden', !isSmart);
    smartPanel?.classList.toggle('flex', isSmart);

    modeTabs.forEach(tab => {
      const selected = tab.dataset.mode === currentMode;
      tab.classList.toggle('mode-tab-active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });

    const t = currentTranslations();
    const fillText = document.getElementById('fillBtnText');
    if (fillText) fillText.textContent = isSmart ? (t.fillSmartBtn || 'Smart Fill') : (t.fillBtn || 'Fill Form');
    setStatus('');
    if (persistMode) {
      void browserApi.storage.local.set({ fillMode: currentMode }).catch(() => {});
    }
  }

  function getProfile(): SmartProfile {
    const profile: SmartProfile = {};
    profileInputs.forEach((field) => {
      const key = field.dataset.profileKey as keyof SmartProfile | undefined;
      if (key) profile[key] = field.value.trim();
    });
    return profile;
  }

  function persistLegacyValue(): void {
    void browserApi.storage.local
      .set({ defaultValue: legacyValueInput.value })
      .catch(() => {});
  }

  function persistProfile(): void {
    void browserApi.storage.local.set({ smartProfile: getProfile() }).catch(() => {});
  }

  function cleanCustomRules(rules: unknown): PersistedCustomRule[] {
    return (Array.isArray(rules) ? rules : []).slice(0, MAX_CUSTOM_RULES).map((rule) => {
      const candidate = rule && typeof rule === 'object'
        ? rule as Partial<CustomRule>
        : {};
      return {
        id: `custom-${++customRuleSequence}`,
        field: String(candidate.field || '').slice(0, 120),
        value: String(candidate.value || '').slice(0, 500)
      };
    });
  }

  function getCustomRules(): CustomRule[] {
    return customRuleState
      .map(({ field, value }) => ({ field: field.trim(), value: value.trim() }))
      .filter(rule => rule.field && rule.value);
  }

  function persistCustomRules(): void {
    const rules = customRuleState.map(({ field, value }) => ({ field, value }));
    void browserApi.storage.local.set({ customRules: rules }).catch(() => {});
  }

  function renderCustomRules(focusId?: string): void {
    if (!customRulesWrap) return;
    const t = currentTranslations();
    const fragment = document.createDocumentFragment();

    customRuleState.forEach(rule => {
      const row = document.createElement('div');
      row.className = 'custom-rule-row';
      row.dataset.ruleId = rule.id;

      const fieldLabel = document.createElement('label');
      fieldLabel.className = 'custom-rule-label';
      const fieldText = document.createElement('span');
      fieldText.textContent = t.customFieldLabel || 'Field label';
      const fieldInput = document.createElement('input');
      fieldInput.className = 'input-glass input-compact';
      fieldInput.type = 'text';
      fieldInput.value = rule.field;
      fieldInput.placeholder = t.customFieldPlaceholder || 'Group number';
      fieldInput.dataset.customProperty = 'field';
      fieldInput.maxLength = 120;
      fieldLabel.append(fieldText, fieldInput);

      const valueLabel = document.createElement('label');
      valueLabel.className = 'custom-rule-label';
      const valueText = document.createElement('span');
      valueText.textContent = t.customValueLabel || 'Value';
      const valueInput = document.createElement('input');
      valueInput.className = 'input-glass input-compact';
      valueInput.type = 'text';
      valueInput.value = rule.value;
      valueInput.placeholder = t.customValuePlaceholder || '12';
      valueInput.dataset.customProperty = 'value';
      valueInput.maxLength = 500;
      valueLabel.append(valueText, valueInput);

      const remove = document.createElement('button');
      remove.className = 'custom-remove';
      remove.type = 'button';
      remove.dataset.removeCustomRule = rule.id;
      remove.setAttribute('aria-label', t.removeCustomRule || 'Remove custom field');
      remove.textContent = '×';

      row.append(fieldLabel, valueLabel, remove);
      fragment.append(row);
    });

    customRulesWrap.replaceChildren(fragment);
    customRulesEmpty?.classList.toggle('hidden', customRuleState.length > 0);
    if (customRuleCount) customRuleCount.textContent = String(customRuleState.length);
    if (addCustomRuleBtn) addCustomRuleBtn.disabled = customRuleState.length >= MAX_CUSTOM_RULES;
    if (focusId) {
      customRulesWrap
        .querySelector<HTMLInputElement>(`[data-rule-id="${focusId}"] input`)
        ?.focus();
    }
  }

  void browserApi.storage.local
    .get(['defaultValue', 'fillMode', 'smartProfile', 'customRules'])
    .then((stored) => {
      if (typeof stored.defaultValue === 'string') legacyValueInput.value = stored.defaultValue;
      if (stored.smartProfile && typeof stored.smartProfile === 'object') {
        const smartProfile = stored.smartProfile as SmartProfile;
        profileInputs.forEach(field => {
          const key = field.dataset.profileKey as keyof SmartProfile | undefined;
          const value = key ? smartProfile[key] : undefined;
          if (typeof value === 'string') field.value = value;
        });
      }
      customRuleState = cleanCustomRules(stored.customRules);
      renderCustomRules();
      updateModeUI(stored.fillMode, false);
    })
    .catch(() => updateModeUI('classic', false));

  try {
    const lang = localStorage.getItem('ff_lang') || 'en';
    window.setLanguage(lang);
  } catch (e) { }

  try {
    const isMac = /Mac/i.test(navigator.platform);
    const target = document.getElementById(isMac ? 'shortcutMac' : 'shortcutWin');
    target?.classList.add('font-semibold', 'text-white');
  } catch (e) { }

  legacyValueInput.addEventListener('input', persistLegacyValue, { passive: true });
  profileInputs.forEach(field => field.addEventListener('input', persistProfile, { passive: true }));

  addCustomRuleBtn?.addEventListener('click', () => {
    if (customRuleState.length >= MAX_CUSTOM_RULES) return;
    const rule = { id: `custom-${++customRuleSequence}`, field: '', value: '' };
    customRuleState.push(rule);
    customFieldsDetails?.setAttribute('open', '');
    persistCustomRules();
    renderCustomRules(rule.id);
  });

  customRulesWrap?.addEventListener('input', event => {
    const target = event.target instanceof Element ? event.target : null;
    const input = target?.closest<HTMLInputElement>('input[data-custom-property]');
    const row = input?.closest<HTMLElement>('[data-rule-id]');
    const rule = customRuleState.find(item => item.id === row?.dataset.ruleId);
    if (!input || !rule) return;
    const property = input.dataset.customProperty;
    if (property !== 'field' && property !== 'value') return;
    rule[property] = input.value;
    persistCustomRules();
  });

  customRulesWrap?.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>('button[data-remove-custom-rule]');
    if (!button) return;
    customRuleState = customRuleState.filter(rule => rule.id !== button.dataset.removeCustomRule);
    persistCustomRules();
    renderCustomRules();
  });

  presetsWrap?.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>('button[data-val]');
    if (!button) return;
    legacyValueInput.value = button.getAttribute('data-val') || '';
    persistLegacyValue();
  });

  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => updateModeUI(tab.dataset.mode, true));
    tab.addEventListener('keydown', (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const nextMode = currentMode === 'classic' ? 'smart' : 'classic';
      updateModeUI(nextMode, true);
      modeTabs.find(item => item.dataset.mode === nextMode)?.focus();
    });
  });

  langButtons.forEach(button => button.addEventListener('click', () => {
    window.setLanguage(button.dataset.lang);
    renderCustomRules();
    updateModeUI(currentMode, false);
  }));

  function openShortcutModal(): void {
    if (!shortcutModal) return;
    shortcutModal.classList.remove('hidden');
    shortcutModalClose?.focus();
  }
  function closeShortcutModal(): void {
    if (!shortcutModal) return;
    shortcutModal.classList.add('hidden');
    shortcutOpenBtn?.focus();
  }

  shortcutOpenBtn?.addEventListener('click', openShortcutModal);
  shortcutModalClose?.addEventListener('click', closeShortcutModal);
  shortcutModal?.addEventListener('click', event => {
    if (event.target === shortcutModal) closeShortcutModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !shortcutModal?.classList.contains('hidden')) {
      closeShortcutModal();
    }
  });

  fillBtn.addEventListener('click', async () => {
    const t = currentTranslations();
    const profile = getProfile();
    const emailField = document.getElementById('smartEmail') as HTMLInputElement | null;
    if (currentMode === 'smart' && profile.email && emailField && !emailField.checkValidity()) {
      setStatus(t.invalidEmail || 'Enter a valid email address.', true);
      emailField.focus();
      return;
    }
    fillBtn.disabled = true;
    fillBtn.classList.add('opacity-70');
    setStatus(t.filling || 'Filling…');

    try {
      const tabs = await browserApi.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      if (!activeTab?.id) {
        throw new Error('The browser returned no active tab.');
      }

      const results = await browserApi.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: fillFields,
        args: [{
          mode: currentMode,
          legacyValue: legacyValueInput.value.trim(),
          profile,
          customRules: getCustomRules()
        }]
      });
      const summary = results?.[0]?.result as FillSummary | undefined;
      const count = Number(summary?.filled || 0);
      if (currentMode === 'smart' && count === 0) {
        setStatus(t.noFields || 'No empty supported fields found.');
        return;
      }
      setStatus((t.fillSuccess || '{count} fields filled.').replace('{count}', String(count)));
    } catch {
      setStatus(t.fillError || 'This page cannot be filled.', true);
    } finally {
      fillBtn.disabled = false;
      fillBtn.classList.remove('opacity-70');
    }
  });
})();
