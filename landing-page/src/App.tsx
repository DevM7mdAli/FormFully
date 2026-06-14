import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* constants                                                          */
/* ------------------------------------------------------------------ */
const LINKS = {
  chrome:
    "https://chromewebstore.google.com/detail/formfully/ojlpggfkjhgadcjdmkgdmpilhmnghlmj",
  edge: "https://microsoftedge.microsoft.com/addons/detail/formfully/giahhadiaaljamhigkeggghcadfnofce",
  coffee: "https://buymeacoffee.com/devm7mdali",
  github: "https://github.com/DevM7mdAli",
  author: "https://devm7mdali.github.io",
  twitter: "https://twitter.com/DevM7mdAli",
  linkedin: "https://www.linkedin.com/in/mohammed-alajmi-b5a327206/",
};

/* ------------------------------------------------------------------ */
/* live value generators — exactly what the extension does            */
/* ------------------------------------------------------------------ */
const pad = (n: number) => String(n).padStart(2, "0");

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function nowTime() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function isoWeek() {
  const d = new Date();
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${pad(week)}`;
}
function randomHex() {
  return (
    "#" +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0")
  );
}
const rand1to5 = () => String(Math.floor(Math.random() * 5) + 1);

/* ------------------------------------------------------------------ */
/* scroll-reveal                                                      */
/* ------------------------------------------------------------------ */
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ------------------------------------------------------------------ */
/* icons                                                              */
/* ------------------------------------------------------------------ */
const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 13l4 4L19 7"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FillBolt = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor" />
  </svg>
);

const ChromeMark = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M12 8.6h8.4M12 8.6 7.7 4.2M12 15.4 7.7 19.8M14.9 14.6l4.2 4.6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const EdgeMark = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M21 12.4c0-5-4-8.4-8.8-8.4C7 4 3.3 7.7 3.3 12c0 3 1.7 5.3 4 6.4-1-2-.5-4.6 2.3-5.8 2.4-1 5.6-.4 6.9.4.5-1.2.5-1.9.5-2.6 0 0 3.7.3 3.7 2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const Coffee = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 9h13a3 3 0 0 1 0 6h-1M5 9v6a4 4 0 0 0 4 4h3a4 4 0 0 0 4-4V9M8 3v2M12 3v2M16 3v2"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FeatureIcon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d={d}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ------------------------------------------------------------------ */
/* hero demo — the signature: a form that fills itself                */
/* ------------------------------------------------------------------ */
type FieldType = "text" | "email" | "number" | "date" | "time" | "week" | "color";
type Field = { key: string; label: string; type: FieldType; span?: boolean };

const FIELDS: Field[] = [
  { key: "name", label: "Full name", type: "text" },
  { key: "email", label: "Email", type: "email" },
  { key: "date", label: "Start date", type: "date" },
  { key: "time", label: "Time", type: "time" },
  { key: "week", label: "Week", type: "week" },
  { key: "color", label: "Brand color", type: "color" },
  { key: "msg", label: "Reference", type: "text", span: true },
];

function valueFor(field: Field, input: string): string {
  switch (field.type) {
    case "date":
      return todayISO();
    case "time":
      return nowTime();
    case "week":
      return isoWeek();
    case "color":
      return randomHex();
    default:
      return input || rand1to5();
  }
}

function FillDemo() {
  const [value, setValue] = useState("");
  const [filled, setFilled] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [pressed, setPressed] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  const fill = useCallback(() => {
    clearTimers();
    setRunning(true);
    setFilled({});
    setActive(null);

    const results = FIELDS.map((f) => ({ key: f.key, value: valueFor(f, value.trim()) }));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      const all: Record<string, string> = {};
      results.forEach((r) => (all[r.key] = r.value));
      setFilled(all);
      setRunning(false);
      return;
    }

    let i = 0;
    const step = () => {
      if (i >= results.length) {
        setActive(null);
        setRunning(false);
        return;
      }
      const r = results[i];
      setActive(r.key);
      timers.current.push(
        window.setTimeout(() => {
          setFilled((prev) => ({ ...prev, [r.key]: r.value }));
          i += 1;
          timers.current.push(window.setTimeout(step, 150));
        }, 190)
      );
    };
    step();
  }, [value]);

  // auto-run once shortly after mount
  useEffect(() => {
    const t = window.setTimeout(fill, 850);
    return () => {
      clearTimeout(t);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Alt+Shift+F triggers a fill, just like the real extension
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && (e.key === "F" || e.key === "f")) {
        e.preventDefault();
        setPressed(true);
        window.setTimeout(() => setPressed(false), 220);
        fill();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fill]);

  return (
    <div className="demo reveal">
      <div className="demo-stage">
        <div className={"demo-kbd-float" + (pressed ? " pressed" : "")} aria-hidden="true">
          <span className="kbd">Alt</span>
          <span className="kbd">Shift</span>
          <span className="kbd">F</span>
        </div>

        <div className="demo-form" aria-hidden="true">
          {FIELDS.map((f) => {
            const v = filled[f.key];
            const isFilled = v !== undefined;
            const cls =
              "df-field" +
              (f.span ? " col-span" : "") +
              (isFilled ? " filled" : "") +
              (active === f.key ? " active" : "");
            return (
              <div className={cls} key={f.key}>
                <span className="df-label">{f.label}</span>
                <div className="df-input">
                  {f.type === "color" && (
                    <span
                      className="df-swatch"
                      style={isFilled ? { background: v } : undefined}
                    />
                  )}
                  <span className="val">{v ?? ""}</span>
                  <span className="caret" />
                  <span className="df-check">
                    <Check />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* the extension popup, in miniature */}
        <div className="demo-bar">
          <img className="demo-pop-logo" src="/icon.png" alt="" aria-hidden="true" />
          <input
            className="demo-value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type a value, or leave blank for random"
            aria-label="Value to fill"
          />
          <button className="demo-fill" onClick={fill} disabled={running}>
            <FillBolt />
            {running ? "Filling…" : "Fill"}
          </button>
        </div>

        <div className="demo-presets">
          <span className="ptag">presets</span>
          {["1", "5", "10", "50", "100"].map((p) => (
            <button key={p} className="preset-chip" onClick={() => setValue(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* marquee                                                            */
/* ------------------------------------------------------------------ */
const MQ_ITEMS = [
  "text", "email", "number", "date", "month", "week", "time",
  "datetime-local", "color", "search", "tel", "url",
];
function Marquee() {
  const items = [...MQ_ITEMS, ...MQ_ITEMS];
  return (
    <div className="marquee-track">
      {items.map((t, i) => (
        <span className="mq-item" key={i}>
          <span className="tag">&lt;input type="{t}"&gt;</span>
          <span className="sep">✦</span>
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* value ledger                                                       */
/* ------------------------------------------------------------------ */
function LedgerRow({ type, desc, out }: { type: string; desc: string; out: string }) {
  return (
    <div className="ledger-row">
      <span className="type">{type}</span>
      <span className="desc">{desc}</span>
      <span className="out">{out}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* bilingual demo                                                     */
/* ------------------------------------------------------------------ */
const BILINGUAL = {
  en: {
    dir: "ltr" as const,
    rows: [
      { label: "Full name", value: "5" },
      { label: "Email", value: "5" },
      { label: "Quantity", value: "5" },
    ],
    note: "English · left-to-right",
  },
  ar: {
    dir: "rtl" as const,
    rows: [
      { label: "الاسم الكامل", value: "٥" },
      { label: "البريد الإلكتروني", value: "5" },
      { label: "الكمية", value: "٥" },
    ],
    note: "العربية · من اليمين إلى اليسار",
  },
};

function Bilingual() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const data = BILINGUAL[lang];
  return (
    <section className="section" id="languages">
      <div className="wrap">
        <div className="bilingual-grid">
          <div className="reveal">
            <p className="eyebrow">Bilingual by design</p>
            <h2 style={{ fontSize: "clamp(28px, 3.6vw, 40px)", marginBottom: 18 }}>
              English and العربية, <span className="grad">instantly</span>.
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 18, maxWidth: 420 }}>
              Switch the interface between English and Arabic in a tap. Arabic
              flips the entire layout to full right-to-left with the right
              typography — and your choice is remembered next time.
            </p>
            <div className="lang-toggle" style={{ marginTop: 28 }} role="tablist" aria-label="Language">
              <button
                role="tab"
                aria-selected={lang === "en"}
                className={lang === "en" ? "on" : ""}
                onClick={() => setLang("en")}
              >
                EN
              </button>
              <button
                role="tab"
                aria-selected={lang === "ar"}
                className={lang === "ar" ? "on" : ""}
                onClick={() => setLang("ar")}
              >
                AR
              </button>
            </div>
          </div>

          <div className="lang-card reveal" dir={data.dir}>
            {data.rows.map((r) => (
              <div className="lc-row" key={r.label}>
                <span className="lc-label">{r.label}</span>
                <div className="lc-input">{r.value}</div>
              </div>
            ))}
            <p
              style={{
                marginTop: 18,
                fontFamily: "var(--mono)",
                fontSize: 12,
                color: "#e4ecff",
              }}
            >
              {data.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                */
/* ------------------------------------------------------------------ */
type Faq = { q: string; a: ReactNode };
const FAQS: Faq[] = [
  {
    q: "Is Formfully free?",
    a: (
      <>
        Yes — completely free, on both Chrome and Edge. If it saves you time you
        can <a href={LINKS.coffee} style={{ color: "var(--coffee)" }}>buy the
        author a coffee</a>, but there's no paywall, account, or upsell.
      </>
    ),
  },
  {
    q: "Does any of my data leave the browser?",
    a: (
      <>
        No. There are no network requests, analytics, or trackers. The only
        things stored are your default fill value and language preference, kept
        locally with <code>chrome.storage</code> on your machine.
      </>
    ),
  },
  {
    q: "What exactly gets filled?",
    a: (
      <>
        Every <code>&lt;input&gt;</code> that's visible on the page — hidden
        fields are skipped. Type-aware fields like <code>date</code>,{" "}
        <code>time</code>, <code>week</code> and <code>color</code> get sensible
        generated values; text and number fields use your value, or a random
        number when you leave it blank.
      </>
    ),
  },
  {
    q: "Why not Cmd + Shift + F on macOS?",
    a: (
      <>
        Chrome reserves <code>Cmd + Shift + F</code> for DevTools search, so the
        command won't fire. Formfully uses <code>Alt + Shift + F</code> on every
        platform — and you can rebind it anytime at{" "}
        <code>chrome://extensions/shortcuts</code>.
      </>
    ),
  },
  {
    q: "Can I change the keyboard shortcut?",
    a: (
      <>
        Yes. Open <code>chrome://extensions/shortcuts</code>, find the Formfully
        “Fill inputs” command, click the pencil, and set any combo that isn't
        already reserved by the browser.
      </>
    ),
  },
  {
    q: "Which browsers are supported?",
    a: (
      <>
        It's published on the Chrome Web Store and Microsoft Edge Add-ons. Any
        other Chromium-based browser can run it by loading the unpacked folder
        in developer mode.
      </>
    ),
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="section" id="faq">
      <div className="wrap">
        <div className="section-head reveal">
          <p className="eyebrow">Questions</p>
          <h2>Everything you might ask</h2>
        </div>
        <div className="faq-list reveal">
          {FAQS.map((f, i) => (
            <div className={"faq-item" + (open === i ? " open" : "")} key={f.q}>
              <button
                className="faq-q"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
              >
                {f.q}
                <span className="faq-sign" aria-hidden="true" />
              </button>
              <div className="faq-a">
                <p>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* nav                                                                */
/* ------------------------------------------------------------------ */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className={"nav" + (scrolled ? " scrolled" : "")}>
      <div className="wrap nav-inner">
        <a className="brand" href="#top">
          <img src="/icon.png" alt="" />
          Formfully
        </a>
        <div className="nav-links">
          <a className="navlink" href="#how">How it works</a>
          <a className="navlink" href="#features">Features</a>
          <a className="navlink" href="#values">Values</a>
          <a className="navlink" href="#faq">FAQ</a>
        </div>
        <div className="nav-cta">
          <a className="btn btn-ghost" href={LINKS.github} target="_blank" rel="noopener">
            GitHub
          </a>
          <a className="btn btn-primary" href={LINKS.chrome} target="_blank" rel="noopener">
            <ChromeMark />
            Add to Chrome
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* features                                                           */
/* ------------------------------------------------------------------ */
const FEATURES = [
  {
    icon: "M4 7h16M4 12h10M4 17h7",
    title: "Fills every visible field",
    body: "One action populates every input on the page. Hidden fields stay untouched.",
  },
  {
    icon: "M12 3v18M5 10l7-7 7 7",
    title: "Field-aware values",
    body: "Dates, times, weeks and colors each get a value that actually fits the field type.",
  },
  {
    icon: "M7 8h10M7 12h6M4 4h16v12H4zM9 21l3-3 3 3",
    title: "Blank = smart random",
    body: "Leave the value empty and every field gets its own random number — ideal for quick stress tests.",
  },
  {
    icon: "M4 8h16v12H4zM12 4v4M8 4v4M16 4v4M9 14l2 2 4-4",
    title: "Remembers your value",
    body: "Your default fill value is saved and reused by both the popup and the keyboard shortcut.",
  },
  {
    icon: "M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9 11l12-2",
    title: "Light & framework-free",
    body: "Pure JavaScript on Manifest V3. No heavy bundles, no slowdown on your tabs.",
  },
];

/* ------------------------------------------------------------------ */
/* page                                                               */
/* ------------------------------------------------------------------ */
function App() {
  useReveal();
  return (
    <div id="top">
      <Nav />

      {/* HERO */}
      <header className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="hero-badge reveal">
              <span className="dot" />
              For testers, QA &amp; demo builders
            </span>
            <h1 className="reveal">
              Fill the whole form
              <span className="line2">
                in <span className="grad">one keystroke.</span>
              </span>
            </h1>
            <p className="hero-sub reveal">
              Formfully drops a value into <b>every visible field</b> on the
              page — instantly. Set it once, press the shortcut, and skip the
              tab-tab-type grind.
            </p>
            <div className="hero-cta reveal">
              <a className="btn btn-primary" href={LINKS.chrome} target="_blank" rel="noopener">
                <ChromeMark />
                Add to Chrome
              </a>
              <a className="btn btn-ghost" href={LINKS.edge} target="_blank" rel="noopener">
                <EdgeMark />
                Get it on Edge
              </a>
            </div>
            <p className="hero-shortcut reveal">
              or just press
              <span className="kbd">Alt</span>
              <span className="kbd">Shift</span>
              <span className="kbd">F</span>
              — try it on this page
            </p>
            <div className="hero-trust reveal">
              <div className="stat">
                <span className="n">1 press</span>
                <span className="l">fills the page</span>
              </div>
              <div className="stat">
                <span className="n">0 requests</span>
                <span className="l">nothing leaves your browser</span>
              </div>
              <div className="stat">
                <span className="n">EN / عربي</span>
                <span className="l">full RTL support</span>
              </div>
            </div>
          </div>

          <FillDemo />
        </div>
      </header>

      {/* MARQUEE */}
      <div className="marquee" aria-hidden="true">
        <Marquee />
      </div>

      {/* HOW IT WORKS */}
      <section className="section" id="how">
        <div className="wrap">
          <div className="section-head reveal">
            <p className="eyebrow">Three steps</p>
            <h2>From empty form to filled in seconds</h2>
            <p>No setup, no profiles to configure. Open it, press once, move on.</p>
          </div>
          <div className="steps">
            <div className="step reveal">
              <div className="step-n">1</div>
              <h3>Set a value</h3>
              <p>
                Type a number or text in the popup — or tap a preset. Leave it
                blank to get a random value in every field.
              </p>
            </div>
            <div className="step reveal">
              <div className="step-n">2</div>
              <h3>Press the shortcut</h3>
              <p>Hit the button, or fire it from anywhere on the page.</p>
              <p className="step-kbd">
                <span className="kbd">Alt</span> <span className="kbd">Shift</span>{" "}
                <span className="kbd">F</span>
              </p>
            </div>
            <div className="step reveal">
              <div className="step-n">3</div>
              <h3>Every field fills</h3>
              <p>
                Watch the whole form populate at once — dates, times, colors and
                all — ready to submit or screenshot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="wrap">
          <div className="section-head reveal">
            <p className="eyebrow">Features</p>
            <h2>Small extension, serious time saved</h2>
            <p>Everything a tester needs to stop typing the same value into twenty boxes.</p>
          </div>
          <div className="bento">
            <div className="card hero-card reveal">
              <div>
                <div className="ic">
                  <FillBolt />
                </div>
                <h3>One keystroke, the whole page</h3>
                <p>
                  The core of Formfully: a single global shortcut that fills
                  every visible input at once.
                </p>
              </div>
              <div className="big-kbd">⌥ + ⇧ + F</div>
            </div>
            {FEATURES.map((f) => (
              <div className="card span-2 reveal" key={f.title}>
                <div className="ic">
                  <FeatureIcon d={f.icon} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUE LEDGER */}
      <section className="section" id="values">
        <div className="wrap">
          <div className="section-head reveal">
            <p className="eyebrow">How it chooses values</p>
            <h2>The right value for every input type</h2>
            <p>
              Formfully reads each field's type and generates something that
              actually validates — not just “test” pasted everywhere.
            </p>
          </div>
          <div className="ledger reveal">
            <div className="ledger-row head">
              <span>Input type</span>
              <span className="desc" style={{ fontFamily: "var(--mono)" }}>
                Strategy
              </span>
              <span className="out">Example</span>
            </div>
            <LedgerRow type="text / number" desc="Your value, or a random 1–5 when blank" out="5" />
            <LedgerRow type="date" desc="Today, formatted for the field" out={todayISO()} />
            <LedgerRow type="month" desc="The current month" out={todayISO().slice(0, 7)} />
            <LedgerRow type="week" desc="The current ISO week number" out={isoWeek()} />
            <LedgerRow type="time" desc="The current time" out={nowTime()} />
            <LedgerRow type="datetime-local" desc="Current date and time" out={`${todayISO()}T${nowTime()}`} />
            <LedgerRow type="color" desc="A random hex color" out="#4e65ff" />
          </div>
        </div>
      </section>

      {/* BILINGUAL */}
      <Bilingual />

      {/* PRIVACY */}
      <section className="section" id="privacy">
        <div className="wrap">
          <div className="privacy reveal">
            <div>
              <p className="eyebrow">Private by default</p>
              <h2>
                Nothing ever <span className="grad">leaves your browser</span>.
              </h2>
              <p className="lead">
                No network calls. No analytics. No accounts. Formfully runs
                entirely on your machine and asks for the three permissions it
                actually needs — nothing more.
              </p>
            </div>
            <div className="perm-list">
              <div className="perm">
                <span className="pname">activeTab</span>
                <span className="pwhy">
                  Inject the fill script into the current tab — only when you ask.
                </span>
              </div>
              <div className="perm">
                <span className="pname">scripting</span>
                <span className="pwhy">
                  Run the fill safely on the page (required by Manifest V3).
                </span>
              </div>
              <div className="perm">
                <span className="pname">storage</span>
                <span className="pwhy">
                  Remember your default value and language — stored locally.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* SUPPORT */}
      <section className="section tight" id="support">
        <div className="wrap">
          <div className="support reveal">
            <div className="cup">☕</div>
            <h2>Like it? Keep it caffeinated.</h2>
            <p>
              Formfully is free and always will be. If it's saved you from a few
              hundred keystrokes, a coffee keeps it maintained and improving.
            </p>
            <a className="btn btn-coffee" href={LINKS.coffee} target="_blank" rel="noopener">
              <Coffee />
              Buy me a coffee
            </a>
            <p className="made">
              Built by{" "}
              <a href={LINKS.author} target="_blank" rel="noopener">
                Mohammed Alajmi
              </a>{" "}
              for testers, QA, and builders.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <a className="brand" href="#top">
                <img src="/icon.png" alt="" />
                Formfully
              </a>
              <p className="footer-blurb">
                Instant, intelligent, bilingual form filling for the people who
                fill forms all day.
              </p>
            </div>
            <div className="footer-col">
              <h4>Install</h4>
              <a href={LINKS.chrome} target="_blank" rel="noopener">Chrome Web Store</a>
              <a href={LINKS.edge} target="_blank" rel="noopener">Edge Add-ons</a>
            </div>
            <div className="footer-col">
              <h4>Learn</h4>
              <a href="#how">How it works</a>
              <a href="#features">Features</a>
              <a href="#values">Value types</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="footer-col">
              <h4>Project</h4>
              <a href={LINKS.github} target="_blank" rel="noopener">GitHub</a>
              <a href={LINKS.author} target="_blank" rel="noopener">Author</a>
              <a href={LINKS.coffee} target="_blank" rel="noopener">Support</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Formfully · MIT licensed</span>
            <div className="footer-social">
              <a href={LINKS.twitter} target="_blank" rel="noopener" aria-label="Twitter / X">
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
                </svg>
              </a>
              <a href={LINKS.linkedin} target="_blank" rel="noopener" aria-label="LinkedIn">
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
                </svg>
              </a>
              <a href={LINKS.github} target="_blank" rel="noopener" aria-label="GitHub">
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
