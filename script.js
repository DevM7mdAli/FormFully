// Popup behavior and persistence.
(function initPopup() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPopup, { once: true });
    return;
  }

  const fillBtn = document.getElementById('fillButton');
  if (!fillBtn) return;

  const legacyInput = document.getElementById('auto');
  const classicPanel = document.getElementById('classicPanel');
  const smartPanel = document.getElementById('smartPanel');
  const modeTabs = Array.from(document.querySelectorAll('[data-mode]'));
  const profileInputs = Array.from(document.querySelectorAll('[data-profile-key]'));
  const customRulesWrap = document.getElementById('customRules');
  const customRulesEmpty = document.getElementById('customRulesEmpty');
  const customRuleCount = document.getElementById('customRuleCount');
  const customFieldsDetails = document.getElementById('customFieldsDetails');
  const addCustomRuleBtn = document.getElementById('addCustomRule');
  const presetsWrap = document.getElementById('presets');
  const langButtons = Array.from(document.querySelectorAll('.lang-btn'));
  const fillStatus = document.getElementById('fillStatus');
  const shortcutOpenBtn = document.getElementById('shortcutOpenBtn');
  const shortcutModal = document.getElementById('shortcutModal');
  const shortcutModalClose = document.getElementById('shortcutModalClose');
  const MAX_CUSTOM_RULES = 12;
  let customRuleSequence = 0;
  let customRuleState = [];
  let currentMode = 'classic';

  if (!legacyInput) {
    console.warn('[FormFully] Missing core elements.');
    return;
  }

  function currentTranslations() {
    const lang = localStorage.getItem('ff_lang') || 'en';
    return window.I18N?.[lang] || window.I18N?.en || {};
  }

  function setStatus(message, isError) {
    if (!fillStatus) return;
    fillStatus.textContent = message || '';
    fillStatus.classList.toggle('hidden', !message);
    fillStatus.classList.toggle('bg-red-500/25', Boolean(isError));
  }

  function updateModeUI(mode, persistMode) {
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
      try { chrome.storage.local.set({ fillMode: currentMode }); } catch (e) { }
    }
  }

  function getProfile() {
    return profileInputs.reduce((profile, field) => {
      profile[field.dataset.profileKey] = field.value.trim();
      return profile;
    }, {});
  }

  function persistLegacyValue() {
    try { chrome.storage.local.set({ defaultValue: legacyInput.value }); } catch (e) { }
  }

  function persistProfile() {
    try { chrome.storage.local.set({ smartProfile: getProfile() }); } catch (e) { }
  }

  function cleanCustomRules(rules) {
    return (Array.isArray(rules) ? rules : []).slice(0, MAX_CUSTOM_RULES).map(rule => ({
      id: `custom-${++customRuleSequence}`,
      field: String(rule?.field || '').slice(0, 120),
      value: String(rule?.value || '').slice(0, 500)
    }));
  }

  function getCustomRules() {
    return customRuleState
      .map(({ field, value }) => ({ field: field.trim(), value: value.trim() }))
      .filter(rule => rule.field && rule.value);
  }

  function persistCustomRules() {
    const rules = customRuleState.map(({ field, value }) => ({ field, value }));
    try { chrome.storage.local.set({ customRules: rules }); } catch (e) { }
  }

  function renderCustomRules(focusId) {
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
      customRulesWrap.querySelector(`[data-rule-id="${focusId}"] input`)?.focus();
    }
  }

  try {
    chrome.storage.local.get(
      ['defaultValue', 'fillMode', 'smartProfile', 'customRules'],
      ({ defaultValue, fillMode, smartProfile, customRules }) => {
        if (typeof defaultValue === 'string') legacyInput.value = defaultValue;
        if (smartProfile && typeof smartProfile === 'object') {
          profileInputs.forEach(field => {
            const value = smartProfile[field.dataset.profileKey];
            if (typeof value === 'string') field.value = value;
          });
        }
        customRuleState = cleanCustomRules(customRules);
        renderCustomRules();
        updateModeUI(fillMode, false);
      }
    );
  } catch (e) {
    updateModeUI('classic', false);
  }

  try {
    const lang = localStorage.getItem('ff_lang') || 'en';
    if (typeof setLanguage === 'function') setLanguage(lang);
  } catch (e) { }

  try {
    const isMac = /Mac/i.test(navigator.platform);
    const target = document.getElementById(isMac ? 'shortcutMac' : 'shortcutWin');
    target?.classList.add('font-semibold', 'text-white');
  } catch (e) { }

  legacyInput.addEventListener('input', persistLegacyValue, { passive: true });
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
    const input = event.target.closest('input[data-custom-property]');
    const row = input?.closest('[data-rule-id]');
    const rule = customRuleState.find(item => item.id === row?.dataset.ruleId);
    if (!input || !rule) return;
    rule[input.dataset.customProperty] = input.value;
    persistCustomRules();
  });

  customRulesWrap?.addEventListener('click', event => {
    const button = event.target.closest('button[data-remove-custom-rule]');
    if (!button) return;
    customRuleState = customRuleState.filter(rule => rule.id !== button.dataset.removeCustomRule);
    persistCustomRules();
    renderCustomRules();
  });

  presetsWrap?.addEventListener('click', event => {
    const button = event.target.closest('button[data-val]');
    if (!button) return;
    legacyInput.value = button.getAttribute('data-val');
    persistLegacyValue();
  });

  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => updateModeUI(tab.dataset.mode, true));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const nextMode = currentMode === 'classic' ? 'smart' : 'classic';
      updateModeUI(nextMode, true);
      modeTabs.find(item => item.dataset.mode === nextMode)?.focus();
    });
  });

  langButtons.forEach(button => button.addEventListener('click', () => {
    if (typeof setLanguage === 'function') setLanguage(button.dataset.lang);
    renderCustomRules();
    updateModeUI(currentMode, false);
  }));

  function openShortcutModal() {
    if (!shortcutModal) return;
    shortcutModal.classList.remove('hidden');
    shortcutModalClose?.focus();
  }
  function closeShortcutModal() {
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

  fillBtn.addEventListener('click', () => {
    const t = currentTranslations();
    const profile = getProfile();
    const emailField = document.getElementById('smartEmail');
    if (currentMode === 'smart' && profile.email && emailField && !emailField.checkValidity()) {
      setStatus(t.invalidEmail || 'Enter a valid email address.', true);
      emailField.focus();
      return;
    }
    if (!chrome?.tabs || !chrome?.scripting) {
      setStatus(t.fillError || 'This page cannot be filled.', true);
      return;
    }

    fillBtn.disabled = true;
    fillBtn.classList.add('opacity-70');
    setStatus(t.filling || 'Filling…');

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const activeTab = tabs && tabs[0];
      if (!activeTab?.id) {
        fillBtn.disabled = false;
        fillBtn.classList.remove('opacity-70');
        setStatus(t.fillError || 'This page cannot be filled.', true);
        return;
      }

      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: fillFields,
        args: [{
          mode: currentMode,
          legacyValue: legacyInput.value.trim(),
          profile,
          customRules: getCustomRules()
        }]
      }, results => {
        fillBtn.disabled = false;
        fillBtn.classList.remove('opacity-70');
        if (chrome.runtime.lastError) {
          setStatus(t.fillError || 'This page cannot be filled.', true);
          return;
        }
        const summary = results?.[0]?.result;
        const count = Number(summary?.filled || 0);
        if (currentMode === 'smart' && count === 0) {
          setStatus(t.noFields || 'No empty supported fields found.');
          return;
        }
        setStatus((t.fillSuccess || '{count} fields filled.').replace('{count}', String(count)));
      });
    });
  });
})();
