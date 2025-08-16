// Popup logic & i18n
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('auto');
  const fillBtn = document.getElementById('fillButton');
  const presetsWrap = document.getElementById('presets');
  const langButtons = document.querySelectorAll('.lang-btn');

  // restore value & language
  input.value = localStorage.getItem('defaultValue') || '';
  const savedLang = localStorage.getItem('ff_lang') || 'en';
  setLanguage(savedLang);

  // persist value
  input.addEventListener('input', () => localStorage.setItem('defaultValue', input.value));

  // presets
  presetsWrap.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-val]');
    if (!btn) return;
    input.value = btn.getAttribute('data-val');
    localStorage.setItem('defaultValue', input.value);
  });

  // language switching
  langButtons.forEach(b => b.addEventListener('click', () => setLanguage(b.dataset.lang)));

  // main action
  fillBtn.addEventListener('click', () => {
    const inputValue = input.value.trim();
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: fillFields,
        args: [inputValue]
      });
    });
  });
});

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
