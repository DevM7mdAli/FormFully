/**
 * Firefox exposes both a promise-based `browser` namespace and a callback-based
 * `chrome` compatibility alias. Prefer `browser` so awaited API calls return
 * their real values; Chromium falls back to its native promise-capable API.
 */
const resolvedBrowserApi =
  typeof browser !== 'undefined' && browser ? browser : chrome;

if (!resolvedBrowserApi) {
  throw new Error('This browser does not expose the WebExtension APIs.');
}

const browserApi: typeof chrome = resolvedBrowserApi;
