const en = {
  nav: {
    howItWorks: "How it works",
    features: "Features",
    values: "Values",
    faq: "FAQ",
    addToChrome: "Add to Chrome",
  },

  hero: {
    badge: "For testers, QA & demo builders",
    title1: "Fill the whole form",
    title2: "in",
    titleAccent: "one keystroke.",
    description:
      "Formfully drops a value into <strong>every visible field</strong> on the page — instantly. Set it once, press the shortcut, and skip the tab-tab-type grind.",
    addToChrome: "Add to Chrome",
    getOnEdge: "Get it on Edge",
    shortcutHint: "or just press",
    shortcutSuffix: "— try it on this page",
    stat1n: "1 press",
    stat1l: "fills the page",
    stat2n: "0 requests",
    stat2l: "nothing leaves your browser",
    stat3n: "EN / عربي",
    stat3l: "full RTL support",
  },

  demo: {
    name: "Full name",
    email: "Email",
    date: "Start date",
    time: "Time",
    week: "Week",
    color: "Brand color",
    msg: "Reference",
    placeholder: "Type a value, or leave blank for random",
    presetsLabel: "presets",
    fill: "Fill",
    filling: "Filling…",
    valueLabel: "Value to fill",
  },

  how: {
    eyebrow: "Three steps",
    title: "From empty form to filled in seconds",
    subtitle: "No setup, no profiles to configure. Open it, press once, move on.",
    step0h: "Set a value",
    step0p:
      "Type a number or text in the popup — or tap a preset. Leave it blank to get a random value in every field.",
    step1h: "Press the shortcut",
    step1p: "Hit the button, or fire it from anywhere on the page.",
    step2h: "Every field fills",
    step2p:
      "Watch the whole form populate at once — dates, times, colors and all — ready to submit or screenshot.",
  },

  video: {
    eyebrow: "See it in action",
    title: "Watch Formfully in real time",
    subtitle: "See how the extension fills an entire form with a single keystroke.",
  },

  features: {
    eyebrow: "Features",
    title: "Small extension, serious time saved",
    subtitle: "Everything a tester needs to stop typing the same value into twenty boxes.",
    mainTitle: "One keystroke, the whole page",
    mainBody:
      "The core of Formfully: a single global shortcut that fills every visible input at once.",
    item0title: "Fills every visible field",
    item0body: "One action populates every input on the page. Hidden fields stay untouched.",
    item1title: "Field-aware values",
    item1body:
      "Dates, times, weeks and colors each get a value that actually fits the field type.",
    item2title: "Blank = smart random",
    item2body:
      "Leave the value empty and every field gets its own random number — ideal for quick stress tests.",
    item3title: "Remembers your value",
    item3body:
      "Your default fill value is saved and reused by both the popup and the keyboard shortcut.",
    item4title: "Light & framework-free",
    item4body: "Pure JavaScript on Manifest V3. No heavy bundles, no slowdown on your tabs.",
  },

  values: {
    eyebrow: "How it chooses values",
    title: "The right value for every input type",
    subtitle:
      'Formfully reads each field\'s type and generates something that actually validates — not just "test" pasted everywhere.',
    colType: "Input type",
    colStrategy: "Strategy",
    colExample: "Example",
    row0type: "text / number",
    row0desc: "Your value, or a random 1–5 when blank",
    row1type: "date",
    row1desc: "Today, formatted for the field",
    row2type: "month",
    row2desc: "The current month",
    row3type: "week",
    row3desc: "The current ISO week number",
    row4type: "time",
    row4desc: "The current time",
    row5type: "datetime-local",
    row5desc: "Current date and time",
    row6type: "color",
    row6desc: "A random hex color",
  },

  bilingual: {
    eyebrow: "Bilingual by design",
    title: "English and العربية,",
    titleAccent: "instantly",
    body: "Switch the interface between English and Arabic in a tap. Arabic flips the entire layout to full right-to-left with the right typography — and your choice is remembered next time.",
  },

  privacy: {
    eyebrow: "Private by default",
    title: "Nothing ever",
    titleAccent: "leaves your browser",
    body: "No network calls. No analytics. No accounts. Formfully runs entirely on your machine and asks for the three permissions it actually needs — nothing more.",
    perm0name: "activeTab",
    perm0why: "Inject the fill script into the current tab — only when you ask.",
    perm1name: "scripting",
    perm1why: "Run the fill safely on the page (required by Manifest V3).",
    perm2name: "storage",
    perm2why: "Remember your default value — stored locally.",
  },

  faq: {
    eyebrow: "Questions",
    title: "Everything you might ask",
    q0: "Is Formfully free?",
    a0: 'Yes — completely free, on both Chrome and Edge. If it saves you time you can <a>buy the author a coffee</a>, but there\'s no paywall, account, or upsell.',
    q1: "Does any of my data leave the browser?",
    a1: "No. There are no network requests, analytics, or trackers. The only things stored are your default fill value and language preference, kept locally with <code>chrome.storage</code> on your machine.",
    q2: "What exactly gets filled?",
    a2: "Every <inputTag>&lt;input&gt;</inputTag> that's visible on the page — hidden fields are skipped. Type-aware fields like <date>date</date>, <time>time</time>, <week>week</week> and <color>color</color> get sensible generated values; text and number fields use your value, or a random number when you leave it blank.",
    q3: "Why not Cmd + Shift + F on macOS?",
    a3: "Chrome reserves <cmdF>Cmd + Shift + F</cmdF> for DevTools search, so the command won't fire. Formfully uses <altF>Alt + Shift + F</altF> on every platform — and you can rebind it anytime at <shortcuts>chrome://extensions/shortcuts</shortcuts>.",
    q4: "Can I change the keyboard shortcut?",
    a4: 'Yes. Open <shortcuts>chrome://extensions/shortcuts</shortcuts>, find the Formfully "Fill inputs" command, click the pencil, and set any combo that isn\'t already reserved by the browser.',
    q5: "Which browsers are supported?",
    a5: "It's published on the Chrome Web Store and Microsoft Edge Add-ons. Any other Chromium-based browser can run it by loading the unpacked folder in developer mode.",
  },

  support: {
    title: "Like it? Keep it caffeinated.",
    body: "Formfully is free and always will be. If it's saved you from a few hundred keystrokes, a coffee keeps it maintained and improving.",
    cta: "Buy me a coffee",
    creditPrefix: "Built by",
    creditSuffix: "for testers, QA, and builders.",
    authorName: "Mohammed Alajmi",
  },

  footer: {
    tagline:
      "Instant, intelligent, bilingual form filling for the people who fill forms all day.",
    colInstall: "Install",
    colLearn: "Learn",
    colProject: "Project",
    chromeStore: "Chrome Web Store",
    edgeAddons: "Edge Add-ons",
    howItWorks: "How it works",
    features: "Features",
    valueTypes: "Value types",
    faq: "FAQ",
    github: "GitHub",
    author: "Author",
    support: "Support",
    copyright: "Formfully · MIT licensed",
  },
};

export default en;
export type Translation = typeof en;
