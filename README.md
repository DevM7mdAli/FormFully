<div align="center">
	<img src="./icon.png" width="108" alt="FormFully icon" />
	<h1>FormFully</h1>
	<p><em>Instant, intelligent, bilingual form filling.</em></p>
	<a href="https://chromewebstore.google.com/detail/formfully/ojlpggfkjhgadcjdmkgdmpilhmnghlmj" target="_blank">Chrome Web Store</a>
	·
	<a href="https://microsoftedge.microsoft.com/addons/detail/formfully/giahhadiaaljamhigkeggghcadfnofce" target="_blank">Edge Add‑ons</a>
	·
	<a href="https://buymeacoffee.com/devm7mdali" target="_blank">Support</a>
</div>

---

## Overview
FormFully is a lightweight browser extension that saves you time while testing or demoing web forms. Define a value once (or leave it blank for smart randomization) and fill every visible input on the page with a single click or shortcut. It understands different input types (dates, time, color, week, month) and auto‑generates sensible context aware values.

## ✨ Features
- One‑click fill for all visible `<input>` elements (excluding hidden fields)
- Leave the value blank to auto‑generate random numbers (1–5) per field
- Field aware formatting:
	- `date`, `month`, `week`, `time`, `datetime-local`
	- `color` gets a random hex
- Bilingual UI: English + Arabic with full RTL support & instant switching
- Persistent value stored via `chrome.storage` (shared across popup & shortcut)
- Global keyboard shortcut: `Alt + Shift + F` (customizable)
- Accessible glassmorphism UI with semantic focus styles
- Smart week number (ISO week) & date/time generation
- Lightweight: pure JS + Tailwind build (no heavy frameworks)
- Buy Me A Coffee support link integrated

## ⌨️ Keyboard Shortcut
Default: `Alt + Shift + F` on all platforms.

Why not `Cmd + Shift + F` on macOS? Chrome reserves that combo for global search in DevTools, so the extension command will not fire. You can customize the shortcut anytime:
1. Open `chrome://extensions/shortcuts`
2. Locate “FormFully – Fill inputs using FormFully”
3. Click the pencil icon and press your preferred combo (avoid reserved ones)

The popup’s shortcut modal also lists platform specific guidance.

## 🌐 Languages
| Language | Status | Direction |
|----------|--------|-----------|
| English  | ✅     | LTR       |
| العربية  | ✅     | RTL       |

Language preference is remembered (localStorage) and updates immediately with correct direction & typography.

## 🧠 How It Chooses Values
| Input Type | Strategy |
|------------|----------|
| text / number (with user value) | Use your provided value |
| text / number (blank) | Random integer 1–100 |
| date | Today (YYYY-MM-DD) |
| month | Current month (YYYY-MM) |
| week | ISO week format (YYYY-Www) |
| time | Current time (HH:MM) |
| datetime / datetime-local | Current ISO slice (YYYY-MM-DDTHH:MM) |
| color | Random hex `#RRGGBB` |

## 🚀 Installation
### From Stores
* Chrome: [Install](https://chromewebstore.google.com/detail/formfully/ojlpggfkjhgadcjdmkgdmpilhmnghlmj)
* Edge: [Install](https://microsoftedge.microsoft.com/addons/detail/formfully/giahhadiaaljamhigkeggghcadfnofce)

### Manual (Dev Mode)
1. Clone the repo or download & unzip
2. Visit `chrome://extensions` (or equivalent)
3. Enable Developer Mode
4. Click “Load unpacked” and select the project folder

## 🧪 Usage
1. Click the FormFully icon to open the popup
2. Enter a default value, or leave blank for random values
3. (Optional) Tap a preset chip (1,5,10,50,100) to quickly set a value
4. Switch language (EN / AR) if desired
5. Press the Fill Form button OR use `Alt + Shift + F`
6. Observe inputs auto‑populate (any element with `id="a_next"` is auto‑clicked if present)

## 📸 Screenshot
<div align="center">
	<img src="./assets/sample-run.png" alt="FormFully popup screenshot" width="340" />
</div>

## 🔐 Permissions & Privacy
| Permission | Why |
|------------|-----|
| `activeTab` | Inject fill script into the current page when requested |
| `scripting` | Execute the fill function safely (MV3 requirement) |
| `storage` | Persist your default fill value & language |

Privacy: No data leaves your browser. There are no network requests, analytics, or trackers inside the extension. Your stored default value stays local.

## 🧩 Tech Stack
* Manifest V3
* Vanilla JavaScript (no frameworks)
* TailwindCSS (utility + a few custom component classes)
* i18n via lightweight in‑repo dictionary (`i18.js`)

## 🤝 Contributing
1. Fork & create a feature branch
2. Make changes (keep UI lightweight & performant)
3. Update README / i18n if adding user‑visible text
4. Open a PR describing rationale & screenshots (EN + AR if visual)

Ideas welcome: configurable presets, per‑domain profiles, side panel, options page for advanced patterns.

## 🗒️ Changelog (Highlights)
| Version | Summary |
|---------|---------|
| 2.0.2 | Shortcut modal (platform specific), simplified command, footer size tweak |
| 2.0.1 | Added keyboard shortcut, background service worker, storage migration |
| 2.0.0 | Major redesign: glass UI, Arabic support (RTL), presets, i18n extraction, donation button |
| 1.x   | Initial minimal popup & basic fill logic |

## ☕ Support
If FormFully saves you time, consider supporting: [Buy me a coffee](https://buymeacoffee.com/devm7mdali)

## 📝 License
MIT — see [LICENSE](./LICENSE).

---
Made by [Mohammed Alajmi](https://devm7mdali.github.io) with care for testers, QA, and builders.
