// Popup logic & i18n (robust, simplified)
(function initPopup() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPopup, { once: true });
    return;
  }

  // Guard: run only inside the popup (has our root container)
  if (!document.getElementById('fillButton')) {
    return; // Not the popup page
  }

  const input = document.getElementById('auto');
  const fillBtn = document.getElementById('fillButton');
  const presetsWrap = document.getElementById('presets');
  const langButtons = Array.from(document.querySelectorAll('.lang-btn'));
  const shortcutOpenBtn = document.getElementById('shortcutOpenBtn');
  const shortcutModal = document.getElementById('shortcutModal');
  const shortcutModalClose = document.getElementById('shortcutModalClose');

  if (!input || !fillBtn) {
    console.warn('[FormFully] Missing core elements.');
    // Try one delayed retry (slow paint edge case)
    return setTimeout(initPopup, 50);
  }

  // Load saved value
  try {
    chrome?.storage?.local.get(['defaultValue'], ({ defaultValue }) => {
      if (typeof defaultValue === 'string') input.value = defaultValue;
    });
  } catch { }

  // Language
  try {
    const lang = localStorage.getItem('ff_lang') || 'en';
    if (typeof setLanguage === 'function') setLanguage(lang);
  } catch { }

  // Highlight current platform shortcut line
  try {
    const isMac = /Mac/i.test(navigator.platform);
    const target = document.getElementById(isMac ? 'shortcutMac' : 'shortcutWin');
    target?.classList.add('font-semibold', 'text-white');
  } catch { }

  function persist() { try { chrome?.storage?.local.set({ defaultValue: input.value }); } catch { } }

  input.addEventListener('input', persist, { passive: true });

  presetsWrap?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-val]');
    if (!btn) return;
    input.value = btn.getAttribute('data-val');
    persist();
  });

  langButtons.forEach(btn => btn.addEventListener('click', () => {
    if (typeof setLanguage === 'function') setLanguage(btn.dataset.lang);
  }));

  // Shortcut modal logic
  function openShortcutModal() {
    if (!shortcutModal) return;
    shortcutModal.classList.remove('hidden');
    // focus close for accessibility
    shortcutModalClose?.focus();
  }
  function closeShortcutModal() {
    if (!shortcutModal) return;
    shortcutModal.classList.add('hidden');
    shortcutOpenBtn?.focus();
  }
  shortcutOpenBtn?.addEventListener('click', openShortcutModal);
  shortcutModalClose?.addEventListener('click', closeShortcutModal);
  // Close on overlay click
  shortcutModal?.addEventListener('click', (e) => {
    if (e.target === shortcutModal) closeShortcutModal();
  });
  // Escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !shortcutModal?.classList.contains('hidden')) {
      closeShortcutModal();
    }
  });

  fillBtn.addEventListener('click', () => {
    const inputValue = (input.value || '').trim();
    if (!chrome?.tabs || !chrome?.scripting) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs && tabs[0];
      if (!activeTab?.id) return;
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: fillFields,
        args: [inputValue]
      });
    });
  });
})();

// CONTENT SCRIPT INJECTION FUNCTION
function fillFields(inputValue) {
  const allInputs = document.getElementsByTagName('input');
  for (let i = 0; i < allInputs.length; i++) {
    const inp = allInputs[i];
    if (inp.type && inp.type.toLowerCase() === 'hidden') continue;

    if (inp.type === 'date') inp.value = formatDate(new Date());
    else if (['datetime', 'datetime-local'].includes(inp.type)) inp.value = formatDateTime(new Date());
    else if (inp.type === 'month') inp.value = formatMonth(new Date());
    else if (inp.type === 'week') inp.value = formatWeek(new Date());
    else if (inp.type === 'time') inp.value = formatTime(new Date());
    else if (inp.type === 'color') inp.value = randomColor();
    else if (inputValue === '') inp.value = Math.floor(Math.random() * 100) + 1; // bigger range
    else inp.value = inputValue;
  }

  try { document.getElementById('a_next')?.click(); } catch (e) { }

  function formatDate(date) { return date.toISOString().split('T')[0]; }
  function formatMonth(date) { return date.toISOString().split('T')[0].slice(0, 7); }
  function formatDateTime(date) { return date.toISOString().slice(0, 16); }
  function formatWeek(date) {
    const year = date.getFullYear();
    const weekNumber = getISOWeek(date);
    return `${year}-W${weekNumber}`;
  }
  function getISOWeek(date) {
    const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tempDate.getUTCDay() || 7;
    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
    return Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
  }
  function formatTime(date) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }
}
