// Shared page-side fill function used by the popup and keyboard shortcut.
importScripts('form-filler.js');

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
    const {
      defaultValue = '',
      fillMode = 'classic',
      smartProfile = {},
      customRules = []
    } = await chrome.storage.local.get([
      'defaultValue',
      'fillMode',
      'smartProfile',
      'customRules'
    ]);
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillFields,
      args: [{
        mode: fillMode === 'smart' ? 'smart' : 'classic',
        legacyValue: defaultValue || '',
        profile: smartProfile,
        customRules
      }]
    });
  } catch (e) {
    console.error('FormFully command failed', e);
  }
}
