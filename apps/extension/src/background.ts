// Shared page-side fill function used by the popup and keyboard shortcut.
importScripts('form-filler.js');

// Background service worker for keyboard shortcut command.
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'fill-form') {
    await runFill();
  }
});

async function runFill(existingTab?: chrome.tabs.Tab): Promise<void> {
  try {
    const tab = existingTab || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
    if (!tab?.id) return;
    const stored = await chrome.storage.local.get([
      'defaultValue',
      'fillMode',
      'smartProfile',
      'customRules'
    ]);
    const settings: FillSettings = {
      mode: stored.fillMode === 'smart' ? 'smart' : 'classic',
      legacyValue: typeof stored.defaultValue === 'string' ? stored.defaultValue : '',
      profile: stored.smartProfile && typeof stored.smartProfile === 'object'
        ? stored.smartProfile as SmartProfile
        : {},
      customRules: Array.isArray(stored.customRules)
        ? stored.customRules as CustomRule[]
        : []
    };
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillFields,
      args: [settings]
    });
  } catch (e) {
    console.error('FormFully command failed', e);
  }
}
