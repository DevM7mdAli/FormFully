const en = {
  nav: {
    howItWorks: "How it works",
    modes: "Modes",
    features: "Features",
    values: "Values",
    faq: "FAQ",
    addToChrome: "Add to Chrome",
  },

  hero: {
    badge: "Formfully 2.2 · Classic + Smart",
    title1: "Every form.",
    title2: "Your data.",
    titleAccent: "One click.",
    description:
      "Keep the original one-value speed, or switch to <strong>Smart mode</strong> for names, email, Google Forms, saved custom fields, choices, and more.",
    addToChrome: "Add to Chrome",
    getOnEdge: "Get it on Edge",
    shortcutHint: "or just press",
    shortcutSuffix: "— try it on this page",
    stat1n: "2 modes",
    stat1l: "Classic and Smart",
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
    msg: "Group number",
    placeholder: "Type a value, or leave blank for random",
    presetsLabel: "presets",
    fill: "Fill",
    filling: "Filling…",
    valueLabel: "Value to fill",
    tryIt: "Try both modes",
    modeLabel: "Fill mode",
    classic: "Classic",
    smart: "Smart",
    customField: "Group number",
  },

  modes: {
    eyebrow: "Two focused workflows",
    title: "Familiar when you want it. Smarter when you need it.",
    subtitle:
      "Classic stays exactly where existing users expect it. Smart adds context-aware filling without making the simple workflow complicated.",
    classicTag: "The original workflow",
    classicTitle: "Classic",
    classicBody:
      "Set one value and fill the page instantly. Leave it blank for generated values and random unanswered radio choices.",
    classicValue: "Value to fill",
    classicPoint0: "The original behavior remains the default",
    classicPoint1: "Type-aware dates, times, weeks, and colors",
    classicPoint2: "Random selection for unanswered radio groups",
    smartTag: "New in 2.2",
    smartTitle: "Smart",
    smartBody:
      "Use a locally saved profile and let Formfully understand labels, field purpose, and accessible controls across modern forms.",
    customRule: "Saved custom field",
    saved: "Saved locally",
    ruleField: "Group number",
    smartPoint0: "Google Forms and general website forms",
    smartPoint1: "Names, email, phone, company, address, and more",
    smartPoint2: "Custom label → value rules that override guesses",
  },

  how: {
    eyebrow: "Three steps",
    title: "From empty form to filled in seconds",
    subtitle: "Start with the original workflow, or teach Smart mode the details you reuse.",
    step0h: "Choose your mode",
    step0p:
      "Use Classic for one shared value, or Smart for profile-aware filling across complex forms.",
    step1h: "Save what matters",
    step1p:
      "Add your profile once. For unusual questions, save a simple rule such as Group number → 12.",
    step2h: "Fill from anywhere",
    step2p:
      "Click the button or use the shortcut. Your selected mode and saved rules work together automatically.",
  },

  video: {
    eyebrow: "Classic mode in action",
    title: "The original one-keystroke workflow",
    subtitle: "See the fast Classic experience that existing Formfully users already know.",
  },

  features: {
    eyebrow: "Features",
    title: "Built for real forms, not just simple inputs",
    subtitle: "A lightweight extension with enough context to handle the forms people actually use.",
    mainTitle: "One shortcut, whichever mode you chose",
    mainBody:
      "The popup and Alt + Shift + F share the same selected mode, profile, Classic value, and saved rules.",
    item0title: "Works across modern forms",
    item0body:
      "Smart mode handles inputs, textareas, selects, contenteditable fields, and accessible controls.",
    item1title: "Understands field context",
    item1body:
      "Labels, autocomplete, placeholders, ARIA text, and nearby question copy guide each answer.",
    item2title: "Saved custom rules",
    item2body:
      "Map an unusual label or keyword to your own value. The most specific matching rule wins.",
    item3title: "Safe by default",
    item3body:
      "Existing answers stay in place. Passwords, files, payment details, consent, and submit actions are skipped.",
    item4title: "Framework-friendly",
    item4body:
      "Native input and change events keep React and other controlled form libraries in sync.",
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
    body: "Switch the interface between English and Arabic in a tap. Smart mode also recognizes common English and Arabic field labels, while the popup keeps full right-to-left support.",
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
    perm2why: "Remember your mode, profile, default value, and custom rules — stored locally.",
  },

  faq: {
    eyebrow: "Questions",
    title: "Everything you might ask",
    q0: "Is Formfully free?",
    a0: 'Yes — completely free, on both Chrome and Edge. If it saves you time you can <a>buy the author a coffee</a>, but there\'s no paywall, account, or upsell.',
    q1: "Does any of my data leave the browser?",
    a1: "No. There are no network requests, analytics, or trackers. Your selected mode, profile, Classic value, custom rules, and language preference stay locally on your machine.",
    q2: "What is the difference between Classic and Smart?",
    a2: "Classic keeps the original one-value workflow and type-aware generated values. Smart understands field meaning, fills profile details, supports more control types, preserves existing answers, and applies your saved custom rules.",
    q3: "How do custom fields work?",
    a3: "Add a visible field label or distinctive keyword and the value you want. A rule like <strong>Group number → 12</strong> is saved locally and takes priority over Smart mode's built-in guess.",
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
      "Classic speed and Smart context for the people who fill forms all day.",
    colInstall: "Install",
    colLearn: "Learn",
    colProject: "Project",
    chromeStore: "Chrome Web Store",
    edgeAddons: "Edge Add-ons",
    howItWorks: "How it works",
    features: "Features",
    valueTypes: "Classic values",
    faq: "FAQ",
    github: "GitHub",
    author: "Author",
    support: "Support",
    copyright: "Formfully · MIT licensed",
  },
};

export default en;
export type Translation = typeof en;
