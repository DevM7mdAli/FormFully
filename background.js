// Background service worker for keyboard shortcut command.
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'fill-form') {
    await runFill();
  }
});

async function runFill(existingTab) {
  try {
    const tab = existingTab || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
    if (!tab?.id) return;
    const { defaultValue = '' } = await chrome.storage.local.get('defaultValue');
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillFields,
      args: [defaultValue || '']
    });
  } catch (e) {
    console.error('FormFully command failed', e);
  }
}

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
    else if ((inputValue || '').trim() === '') inp.value = Math.floor(Math.random() * 5) + 1;
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
