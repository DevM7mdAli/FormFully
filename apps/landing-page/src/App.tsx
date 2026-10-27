import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  LuCheck,
  LuZap,
  LuList,
  LuWand,
  LuDices,
  LuSave,
  LuFeather,
  LuCoffee,
  LuPlus,
  LuMinus,
} from "react-icons/lu";
import { FaChrome, FaEdge, FaLinkedin, FaGithub } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useTranslation, Trans } from "react-i18next";
import { switchLang } from "./i18n";

/* ------------------------------------------------------------------ */
/* utilities                                                          */
/* ------------------------------------------------------------------ */
const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

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

const SOCIAL_LINKS: Array<{ href: string; label: string; icon: IconType }> = [
  { href: LINKS.twitter, label: "Twitter / X", icon: FaXTwitter },
  { href: LINKS.linkedin, label: "LinkedIn", icon: FaLinkedin },
  { href: LINKS.github, label: "GitHub", icon: FaGithub },
];

/* Vite replaces import.meta.env.BASE_URL with the configured base at build time */
const ICON_URL = `${import.meta.env.BASE_URL}icon.png`;

/* shared class recipes — utility-first, composed in JS to stay DRY */
const WRAP = "w-full max-w-[1140px] mx-auto px-6 max-[720px]:px-4";
const SECTION = "py-20 max-[720px]:py-14";
const CARD = "rounded-xl border border-line bg-white shadow-card";

const BTN =
  "inline-flex items-center justify-center gap-2 rounded-lg border font-medium whitespace-nowrap cursor-pointer transition-colors duration-150";
const BTN_SIZE = {
  sm: "h-9 px-3 text-[14px]",
  md: "h-10 px-4 text-[15px]",
  lg: "h-11 px-5 text-[15px]",
  icon: "h-9 w-9",
};
const BTN_PRIMARY = cx(
  BTN,
  "border-brand bg-brand text-white hover:bg-brand-hover hover:border-brand-hover",
);
const BTN_SECONDARY = cx(
  BTN,
  "border-line-strong bg-white text-ink hover:bg-canvas",
);
const BTN_COFFEE = cx(
  BTN,
  "border-coffee bg-coffee text-coffee-ink font-semibold hover:brightness-95",
);

/* ------------------------------------------------------------------ */
/* primitives                                                         */
/* ------------------------------------------------------------------ */
const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd
    dir="ltr"
    className="inline-flex items-center font-mono text-[12px] font-medium leading-none text-ink bg-white border border-line-strong border-b-2 rounded-[5px] px-1.5 py-1"
  >
    {children}
  </kbd>
);

const Shortcut = () => (
  <span dir="ltr" className="inline-flex items-center gap-1">
    <Kbd>Alt</Kbd>
    <Kbd>Shift</Kbd>
    <Kbd>F</Kbd>
  </span>
);

const Code = ({ children }: { children: ReactNode }) => (
  <code
    dir="ltr"
    className="font-mono text-[0.88em] text-ink bg-canvas border border-line rounded px-1 py-px inline-block"
  >
    {children}
  </code>
);

const SectionHeader = ({
  title,
  subtitle,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
}) => (
  <div className="max-w-[640px] mb-10">
    <h2 className="text-[clamp(26px,3.2vw,36px)]">{title}</h2>
    {subtitle && (
      <p className="mt-3 text-ink-muted text-[17px]">{subtitle}</p>
    )}
  </div>
);

const Brand = () => (
  <a
    className="inline-flex items-center gap-2.5 font-display font-semibold text-[17px] text-ink"
    href="#top"
  >
    <img src={ICON_URL} alt="" className="w-7 h-7" />
    Formfully
  </a>
);

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
  const week = Math.ceil(
    ((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
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
/* hero demo — the signature: a form that fills itself                */
/* ------------------------------------------------------------------ */
type FieldType =
  | "text"
  | "email"
  | "number"
  | "date"
  | "time"
  | "week"
  | "color";
type Field = {
  key: string;
  labelKey: string;
  type: FieldType;
  span?: boolean;
};
type DemoMode = "classic" | "smart";

const FIELDS: Field[] = [
  { key: "name", labelKey: "demo.name", type: "text" },
  { key: "email", labelKey: "demo.email", type: "email" },
  { key: "date", labelKey: "demo.date", type: "date" },
  { key: "time", labelKey: "demo.time", type: "time" },
  { key: "week", labelKey: "demo.week", type: "week" },
  { key: "color", labelKey: "demo.color", type: "color" },
  { key: "msg", labelKey: "demo.msg", type: "text", span: true },
];

function valueFor(field: Field, input: string, mode: DemoMode): string {
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
      if (mode === "smart") {
        if (field.key === "name") return "Alex Morgan";
        if (field.key === "email") return "alex@example.com";
        if (field.key === "msg") return "12";
      }
      return input || rand1to5();
  }
}

/* segmented control shared by the demo and the bilingual preview */
function Segmented<T extends string>({
  items,
  value,
  onChange,
  label,
  render,
  className,
}: {
  items: readonly T[];
  value: T;
  onChange: (item: T) => void;
  label: string;
  render: (item: T) => ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "grid gap-0.5 p-0.5 rounded-lg border border-line bg-canvas",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      role="tablist"
      aria-label={label}
    >
      {items.map((item) => (
        <button
          key={item}
          role="tab"
          aria-selected={value === item}
          className={cx(
            "rounded-md py-1.5 px-3 text-[13px] font-medium cursor-pointer transition-colors",
            value === item
              ? "bg-white text-ink shadow-card"
              : "text-ink-subtle hover:text-ink",
          )}
          onClick={() => onChange(item)}
        >
          {render(item)}
        </button>
      ))}
    </div>
  );
}

function FillDemo() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<DemoMode>("smart");
  const [value, setValue] = useState("");
  const [filled, setFilled] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [pressed, setPressed] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
  };

  const fill = useCallback((targetMode: DemoMode = mode) => {
    clearTimers();
    setRunning(true);
    setFilled({});
    setActive(null);

    const results = FIELDS.map((f) => ({
      key: f.key,
      value: valueFor(f, value.trim(), targetMode),
    }));
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

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
      if (!r) {
        setActive(null);
        setRunning(false);
        return;
      }
      setActive(r.key);
      timers.current.push(
        window.setTimeout(() => {
          setFilled((prev) => ({ ...prev, [r.key]: r.value }));
          i += 1;
          timers.current.push(window.setTimeout(step, 150));
        }, 190),
      );
    };
    step();
  }, [mode, value]);

  useEffect(() => {
    const id = window.setTimeout(fill, 850);
    return () => {
      clearTimeout(id);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className={cx(CARD, "overflow-hidden max-[960px]:max-w-[560px]")}>
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-line">
        <span className="text-[13px] font-medium text-ink-muted">
          {t("demo.tryIt")}
        </span>
        <span
          className={cx(
            "rounded-md transition-shadow duration-150",
            pressed && "ring-2 ring-brand/30",
          )}
          aria-hidden="true"
        >
          <Shortcut />
        </span>
      </div>

      <div
        className="grid grid-cols-2 gap-x-3 gap-y-3.5 p-5"
        aria-hidden="true"
      >
        {FIELDS.map((f) => {
          const v = filled[f.key];
          const isFilled = v !== undefined;
          const isActive = active === f.key;
          return (
            <div
              key={f.key}
              className={cx("flex flex-col gap-1.5", f.span && "col-span-full")}
            >
              <span className="text-[13px] font-medium text-ink-muted">
                {t(f.labelKey)}
              </span>
              <div
                className={cx(
                  "relative h-10 rounded-md flex items-center px-3 font-mono text-[13.5px] text-ink overflow-hidden border transition-colors duration-200",
                  isFilled
                    ? "bg-ok-soft border-ok-line"
                    : isActive
                      ? "bg-white border-brand ring-2 ring-brand/15"
                      : "bg-canvas border-line",
                )}
              >
                {f.type === "color" && (
                  <span
                    className="w-5 h-5 rounded me-2 shrink-0 border border-line-strong bg-white"
                    style={isFilled ? { background: v } : undefined}
                  />
                )}
                <span
                  className={cx(
                    "truncate transition-opacity duration-200",
                    isFilled ? "opacity-100" : "opacity-0",
                  )}
                >
                  {v ?? ""}
                </span>
                <span
                  className={cx(
                    "w-[1.5px] h-4 bg-ink ms-px",
                    isActive ? "opacity-100 animate-blink" : "opacity-0",
                  )}
                />
                <LuCheck
                  size={15}
                  className={cx(
                    "absolute end-3 text-ok transition-opacity duration-200",
                    isFilled ? "opacity-100" : "opacity-0",
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* the extension popup, in miniature */}
      <div className="p-5 border-t border-line bg-canvas">
        <Segmented
          className="mb-3 bg-white"
          items={["classic", "smart"] as const}
          value={mode}
          label={t("demo.modeLabel")}
          render={(item) => t(`demo.${item}`)}
          onChange={(item) => {
            setMode(item);
            setFilled({});
            window.setTimeout(() => fill(item), 80);
          }}
        />

        <div className="flex items-center gap-2.5">
          <img
            className="w-8 h-8 shrink-0"
            src={ICON_URL}
            alt=""
            aria-hidden="true"
          />
          {mode === "classic" ? (
            <input
              className="flex-1 min-w-0 h-10 rounded-md text-ink font-mono text-[13.5px] px-3 bg-white border border-line-strong placeholder:text-ink-subtle focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t("demo.placeholder")}
              aria-label={t("demo.valueLabel")}
            />
          ) : (
            <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_0.6fr] gap-2 items-center">
              <span className="h-10 px-3 rounded-md bg-white border border-line-strong flex items-center text-[13px] text-ink truncate">
                {t("demo.customField")}
              </span>
              <span className="text-ink-subtle rtl:rotate-180" aria-hidden="true">
                →
              </span>
              <span className="h-10 px-3 rounded-md bg-white border border-line-strong flex items-center font-mono text-[13.5px] text-ink">
                12
              </span>
            </div>
          )}
          <button
            className={cx(BTN_PRIMARY, BTN_SIZE.md, "disabled:opacity-60 disabled:cursor-progress")}
            onClick={() => fill()}
            disabled={running}
            title={t("demo.fill")}
          >
            <LuZap size={15} />
            {running ? t("demo.filling") : t("demo.fill")}
          </button>
        </div>

        <div
          className={cx(
            "gap-1.5 mt-3 flex-wrap items-center",
            mode === "classic" ? "flex" : "hidden",
          )}
        >
          <span className="text-[13px] text-ink-subtle me-1">
            {t("demo.presetsLabel")}
          </span>
          {["1", "5", "10", "50", "100"].map((p) => (
            <button
              key={p}
              className="font-mono text-[12.5px] text-ink-muted rounded-md px-2.5 py-1 cursor-pointer bg-white border border-line transition-colors hover:border-line-strong hover:text-ink"
              onClick={() => setValue(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* supported input types                                              */
/* ------------------------------------------------------------------ */
const INPUT_TYPES = [
  "text",
  "email",
  "number",
  "date",
  "month",
  "week",
  "time",
  "datetime-local",
  "color",
  "search",
  "tel",
  "url",
];
function InputTypes() {
  const { t } = useTranslation();
  return (
    <div className="border-y border-line bg-canvas py-5">
      <div
        className={cx(WRAP, "flex flex-wrap items-center gap-x-4 gap-y-2.5")}
      >
        <span className="text-[14px] font-medium text-ink me-2">
          {t("hero.typesLabel")}
        </span>
        <ul className="flex flex-wrap gap-2" dir="ltr">
          {INPUT_TYPES.map((type) => (
            <li key={type}>
              <code className="font-mono text-[12.5px] text-ink-muted bg-white border border-line rounded-md px-2 py-1 inline-block">
                {type}
              </code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* two modes                                                          */
/* ------------------------------------------------------------------ */
const CheckList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2.5">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2.5 text-[15px] text-ink-muted">
        <LuCheck className="mt-1 shrink-0 text-ok" size={15} />
        {item}
      </li>
    ))}
  </ul>
);

function Modes() {
  const { t } = useTranslation();
  const points = (prefix: string) =>
    (["0", "1", "2"] as const).map((k) => t(`modes.${prefix}${k}`));
  return (
    <section className={SECTION} id="modes">
      <div className={WRAP}>
        <SectionHeader title={t("modes.title")} subtitle={t("modes.subtitle")} />
        <div className="grid grid-cols-2 gap-6 max-[820px]:grid-cols-1">
          <article className={cx(CARD, "p-6 flex flex-col")}>
            <div className="flex items-center gap-2.5 mb-1">
              <LuDices size={20} className="text-brand" />
              <h3 className="text-[22px]">{t("modes.classicTitle")}</h3>
            </div>
            <p className="text-[13px] text-ink-subtle mb-4">
              {t("modes.classicTag")}
            </p>
            <p className="text-ink-muted mb-5">{t("modes.classicBody")}</p>
            <div className="p-4 rounded-lg bg-canvas border border-line mb-5">
              <span className="text-[13px] font-medium text-ink-muted">
                {t("modes.classicValue")}
              </span>
              <div className="mt-1.5 h-10 rounded-md bg-white border border-line-strong px-3 flex items-center font-mono text-ink">
                50
              </div>
            </div>
            <CheckList items={points("classicPoint")} />
          </article>

          <article className={cx(CARD, "p-6 flex flex-col border-brand/50")}>
            <div className="flex items-center gap-2.5 mb-1">
              <LuWand size={20} className="text-brand" />
              <h3 className="text-[22px]">{t("modes.smartTitle")}</h3>
              <span className="ms-auto rounded-md bg-brand-soft px-2 py-0.5 text-[12px] font-medium text-brand-ink">
                {t("modes.smartTag")}
              </span>
            </div>
            <p className="text-ink-muted mt-4 mb-5">{t("modes.smartBody")}</p>
            <div className="p-4 rounded-lg bg-canvas border border-line mb-5">
              <div className="flex justify-between gap-3 mb-1.5">
                <span className="text-[13px] font-medium text-ink-muted">
                  {t("modes.customRule")}
                </span>
                <span className="inline-flex items-center gap-1 text-[13px] font-medium text-ok">
                  <LuCheck size={13} />
                  {t("modes.saved")}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto_0.55fr] gap-2 items-center">
                <span className="h-10 rounded-md bg-white border border-line-strong px-3 flex items-center text-[14px] text-ink">
                  {t("modes.ruleField")}
                </span>
                <span className="text-ink-subtle rtl:rotate-180" aria-hidden="true">
                  →
                </span>
                <span className="h-10 rounded-md bg-white border border-line-strong px-3 flex items-center font-mono text-[14px] text-ink">
                  12
                </span>
              </div>
            </div>
            <CheckList items={points("smartPoint")} />
          </article>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* value ledger                                                       */
/* ------------------------------------------------------------------ */
const LEDGER_GRID =
  "grid grid-cols-[220px_1fr_170px] gap-4 items-center px-5 py-3.5";
function LedgerRow({
  type,
  desc,
  out,
}: {
  type: string;
  desc: string;
  out: string;
}) {
  return (
    <div
      className={cx(
        LEDGER_GRID,
        "border-t border-line text-[14.5px] max-[720px]:grid-cols-1 max-[720px]:gap-1",
      )}
    >
      <span className="font-mono text-[13.5px] text-brand-ink" dir="ltr">
        {type}
      </span>
      <span className="text-ink-muted">{desc}</span>
      <span
        className="font-mono text-[13.5px] text-ink text-end max-[720px]:text-start"
        dir="ltr"
      >
        {out}
      </span>
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
      { label: "Full name", value: "Alex Morgan" },
      { label: "Email", value: "alex@example.com" },
      { label: "Group number", value: "12" },
    ],
    note: "English · left-to-right",
  },
  ar: {
    dir: "rtl" as const,
    rows: [
      { label: "الاسم الكامل", value: "أحمد محمد" },
      { label: "البريد الإلكتروني", value: "ahmad@example.com" },
      { label: "رقم المجموعة", value: "12" },
    ],
    note: "العربية · من اليمين إلى اليسار",
  },
};

function Bilingual() {
  const { t } = useTranslation();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const data = BILINGUAL[lang];
  return (
    <section className={SECTION} id="languages">
      <div className={WRAP}>
        <div className="grid grid-cols-[0.9fr_1.1fr] gap-12 items-center max-[960px]:grid-cols-1 max-[960px]:gap-8">
          <div>
            <h2 className="text-[clamp(26px,3.2vw,36px)] mb-3">
              {t("bilingual.title")} {t("bilingual.titleAccent")}.
            </h2>
            <p className="text-ink-muted text-[17px] max-w-[420px]">
              {t("bilingual.body")}
            </p>
            <Segmented
              className="inline-grid mt-6 w-[180px]"
              items={["en", "ar"] as const}
              value={lang}
              label="Language"
              render={(l) => l.toUpperCase()}
              onChange={setLang}
            />
          </div>

          <div className={cx(CARD, "p-6")} dir={data.dir}>
            {data.rows.map((r, i) => (
              <div
                key={r.label}
                className={cx(
                  "flex flex-col gap-1.5 py-3",
                  i > 0 && "border-t border-line",
                )}
              >
                <span className="text-[13px] font-medium text-ink-muted">
                  {r.label}
                </span>
                <div className="h-10 rounded-md flex items-center px-3 font-mono text-[14px] text-ink bg-canvas border border-line">
                  {r.value}
                </div>
              </div>
            ))}
            <p className="mt-3 text-[13px] text-ink-subtle">{data.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                */
/* ------------------------------------------------------------------ */
function FAQ() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<number | null>(0);

  const FAQ_KEYS = ["0", "1", "2", "3", "4", "5"] as const;

  // shared Trans components map
  const transComponents = {
    a: (
      <a
        href={LINKS.coffee}
        className="text-brand-ink underline underline-offset-2"
      />
    ),
    code: <Code>x</Code>,
    inputTag: <Code>x</Code>,
    date: <Code>x</Code>,
    time: <Code>x</Code>,
    week: <Code>x</Code>,
    color: <Code>x</Code>,
    cmdF: <Code>x</Code>,
    altF: <Code>x</Code>,
    shortcuts: <Code>x</Code>,
    strong: <strong className="text-ink font-semibold" />,
  };

  return (
    <section className={SECTION} id="faq">
      <div className={cx(WRAP, "max-w-[860px]")}>
        <SectionHeader title={t("faq.title")} />
        <div className="border-t border-line">
          {FAQ_KEYS.map((k, i) => {
            const isOpen = open === i;
            const panelId = `faq-panel-${k}`;
            return (
              <div key={k} className="border-b border-line">
                <button
                  className="w-full bg-transparent border-0 text-ink font-display font-medium text-[17px] text-start py-5 cursor-pointer flex items-center justify-between gap-5 hover:text-brand-ink transition-colors"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  {t(`faq.q${k}`)}
                  {isOpen ? (
                    <LuMinus size={18} className="shrink-0 text-ink-subtle" />
                  ) : (
                    <LuPlus size={18} className="shrink-0 text-ink-subtle" />
                  )}
                </button>
                <div id={panelId} hidden={!isOpen}>
                  <p className="text-ink-muted text-[16px] pb-5 max-w-[720px]">
                    <Trans i18nKey={`faq.a${k}`} components={transComponents} />
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* nav                                                                */
/* ------------------------------------------------------------------ */
function Nav() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-white">
      <div className={cx(WRAP, "flex items-center justify-between gap-4 h-16")}>
        <Brand />
        <div className="flex items-center gap-7 max-[960px]:hidden">
          {[
            [t("nav.howItWorks"), "#how"],
            [t("nav.modes"), "#modes"],
            [t("nav.features"), "#features"],
            [t("nav.faq"), "#faq"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-[14.5px] text-ink-muted transition-colors hover:text-ink"
            >
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            className={cx(BTN_SECONDARY, BTN_SIZE.sm)}
            onClick={() => switchLang(isAr ? "en" : "ar")}
            aria-label="Toggle language"
          >
            {isAr ? "EN" : "عربي"}
          </button>
          <a
            className={cx(BTN_SECONDARY, BTN_SIZE.icon)}
            href={LINKS.github}
            target="_blank"
            rel="noopener"
            aria-label="GitHub"
          >
            <FaGithub size={17} />
          </a>
          <a
            className={cx(BTN_PRIMARY, BTN_SIZE.sm)}
            href={LINKS.chrome}
            target="_blank"
            rel="noopener"
          >
            <FaChrome size={16} />
            <span className="hidden sm:inline">{t("nav.addToChrome")}</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* features                                                           */
/* ------------------------------------------------------------------ */
const FEATURE_ICONS: IconType[] = [LuList, LuWand, LuDices, LuSave, LuFeather];

/* ------------------------------------------------------------------ */
/* page                                                               */
/* ------------------------------------------------------------------ */
function App() {
  const { t } = useTranslation();

  const ledgerRows = (["0", "1", "2", "3", "4", "5", "6"] as const).map(
    (k) => ({
      type: t(`values.row${k}type`),
      desc: t(`values.row${k}desc`),
    }),
  );
  const ledgerOuts = [
    "5",
    todayISO(),
    todayISO().slice(0, 7),
    isoWeek(),
    nowTime(),
    `${todayISO()}T${nowTime()}`,
    "#4e65ff",
  ];

  return (
    <div id="top">
      <Nav />

      {/* HERO */}
      <header className="pt-16 pb-20 max-[720px]:pt-10 max-[720px]:pb-14">
        <div
          className={cx(
            WRAP,
            "grid grid-cols-[1fr_1fr] gap-14 items-center max-[960px]:grid-cols-1 max-[960px]:gap-10",
          )}
        >
          <div className="max-w-[540px]">
            <h1 className="text-[clamp(36px,5vw,56px)] font-bold leading-[1.05] tracking-[-0.03em]">
              {t("hero.title1")}
              <span className="block">
                {t("hero.title2")} {t("hero.titleAccent")}
              </span>
            </h1>
            <p className="mt-5 text-[18px] text-ink-muted max-w-[480px]">
              <Trans
                i18nKey="hero.description"
                components={{
                  strong: <b className="text-ink font-semibold" />,
                }}
              />
            </p>
            <div className="mt-8 flex flex-wrap gap-3 items-center">
              <a
                className={cx(BTN_PRIMARY, BTN_SIZE.lg)}
                href={LINKS.chrome}
                target="_blank"
                rel="noopener"
              >
                <FaChrome size={18} />
                {t("hero.addToChrome")}
              </a>
              <a
                className={cx(BTN_SECONDARY, BTN_SIZE.lg)}
                href={LINKS.edge}
                target="_blank"
                rel="noopener"
              >
                <FaEdge size={18} />
                {t("hero.getOnEdge")}
              </a>
            </div>
            <p className="mt-5 text-[14px] text-ink-muted flex items-center gap-2 flex-wrap">
              {t("hero.shortcutHint")}
              <Shortcut />
              {t("hero.shortcutSuffix")}
            </p>
            <dl className="mt-10 pt-6 border-t border-line grid grid-cols-3 gap-6 max-[480px]:gap-3">
              {(["1", "2", "3"] as const).map((k) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <dt className="font-display font-semibold text-[18px] text-ink order-1">
                    {t(`hero.stat${k}n`)}
                  </dt>
                  <dd className="m-0 text-[13px] text-ink-subtle order-2">
                    {t(`hero.stat${k}l`)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <FillDemo />
        </div>
      </header>

      {/* INPUT TYPES */}
      <InputTypes />

      {/* MODES */}
      <Modes />

      {/* HOW IT WORKS */}
      <section className={cx(SECTION, "bg-canvas border-y border-line")} id="how">
        <div className={WRAP}>
          <SectionHeader title={t("how.title")} subtitle={t("how.subtitle")} />
          <ol className="grid grid-cols-3 gap-6 max-[720px]:grid-cols-1">
            {(["0", "1", "2"] as const).map((k, i) => (
              <li key={k} className={cx(CARD, "p-6")}>
                <span className="font-mono font-semibold text-[13px] text-brand-ink w-7 h-7 rounded-md bg-brand-soft grid place-items-center mb-4">
                  {i + 1}
                </span>
                <h3 className="text-[18px] mb-1.5">{t(`how.step${k}h`)}</h3>
                <p className="text-ink-muted text-[15px]">
                  {t(`how.step${k}p`)}
                </p>
                {k === "1" && (
                  <p className="mt-3.5">
                    <Shortcut />
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* VIDEO DEMO */}
      <section className={SECTION} id="demo-video">
        <div className={WRAP}>
          <SectionHeader title={t("video.title")} subtitle={t("video.subtitle")} />
          <div className="rounded-xl border border-line overflow-hidden aspect-video max-w-[900px] bg-canvas">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/gWSfH33ZQ7c?controls=1&modestbranding=1"
              title="Formfully demo video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className={cx(SECTION, "pt-0 max-[720px]:pt-0")} id="features">
        <div className={WRAP}>
          <SectionHeader
            title={t("features.title")}
            subtitle={t("features.subtitle")}
          />
          <div className="grid grid-cols-3 gap-4 max-[960px]:grid-cols-2 max-[720px]:grid-cols-1">
            <div className="rounded-xl border border-brand/30 bg-brand-soft p-6 flex flex-col">
              <LuZap size={20} className="text-brand" />
              <h3 className="text-[17px] mt-3 mb-1.5">
                {t("features.mainTitle")}
              </h3>
              <p className="text-ink-muted text-[15px] mb-4">
                {t("features.mainBody")}
              </p>
              <div className="mt-auto">
                <Shortcut />
              </div>
            </div>
            {FEATURE_ICONS.map((Icon, i) => (
              <div key={i} className={cx(CARD, "p-6")}>
                <Icon size={20} className="text-brand" />
                <h3 className="text-[17px] mt-3 mb-1.5">
                  {t(`features.item${i}title`)}
                </h3>
                <p className="text-ink-muted text-[15px]">
                  {t(`features.item${i}body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUE LEDGER */}
      <section className={cx(SECTION, "bg-canvas border-y border-line")} id="values">
        <div className={WRAP}>
          <SectionHeader title={t("values.title")} subtitle={t("values.subtitle")} />
          <div className={cx(CARD, "overflow-hidden")}>
            <div
              className={cx(
                LEDGER_GRID,
                "text-[13px] font-semibold text-ink-muted bg-canvas max-[720px]:hidden",
              )}
            >
              <span>{t("values.colType")}</span>
              <span>{t("values.colStrategy")}</span>
              <span className="text-end">{t("values.colExample")}</span>
            </div>
            {ledgerRows.map((r, i) => (
              <LedgerRow
                key={i}
                type={r.type}
                desc={r.desc}
                out={ledgerOuts[i] ?? ""}
              />
            ))}
          </div>
        </div>
      </section>

      {/* BILINGUAL */}
      <Bilingual />

      {/* PRIVACY */}
      <section className={cx(SECTION, "pt-0 max-[720px]:pt-0")} id="privacy">
        <div className={WRAP}>
          <div className={cx(CARD, "p-10 grid grid-cols-2 gap-12 items-center max-[960px]:grid-cols-1 max-[960px]:gap-8 max-[720px]:p-6")}>
            <div>
              <h2 className="text-[clamp(26px,3.2vw,36px)]">
                {t("privacy.title")} {t("privacy.titleAccent")}.
              </h2>
              <p className="mt-3 text-ink-muted text-[17px]">
                {t("privacy.body")}
              </p>
            </div>
            <div className="rounded-lg border border-line divide-y divide-line">
              {(["0", "1", "2"] as const).map((k) => (
                <div
                  key={k}
                  className="grid grid-cols-[130px_1fr] gap-4 items-center p-4 max-[720px]:grid-cols-1 max-[720px]:gap-1.5"
                >
                  <span className="justify-self-start">
                    <Code>{t(`privacy.perm${k}name`)}</Code>
                  </span>
                  <span className="text-[14.5px] text-ink-muted">
                    {t(`privacy.perm${k}why`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* SUPPORT */}
      <section className="pb-20 max-[720px]:pb-14" id="support">
        <div className={WRAP}>
          <div className={cx(CARD, "px-10 py-12 flex items-center justify-between gap-8 max-[820px]:flex-col max-[820px]:items-start max-[720px]:p-6")}>
            <div className="max-w-[560px]">
              <h2 className="text-[clamp(24px,2.8vw,30px)]">
                {t("support.title")}
              </h2>
              <p className="mt-3 text-ink-muted text-[16px]">
                {t("support.body")}
              </p>
              <p className="mt-4 text-[14px] text-ink-subtle">
                {t("support.creditPrefix")}{" "}
                <a
                  href={LINKS.author}
                  target="_blank"
                  rel="noopener"
                  className="text-ink font-medium underline decoration-line-strong underline-offset-2 hover:decoration-ink"
                >
                  {t("support.authorName")}
                </a>{" "}
                {t("support.creditSuffix")}
              </p>
            </div>
            <a
              className={cx(BTN_COFFEE, BTN_SIZE.lg, "shrink-0")}
              href={LINKS.coffee}
              target="_blank"
              rel="noopener"
            >
              <LuCoffee size={18} />
              {t("support.cta")}
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line bg-canvas pt-12 pb-8">
        <div className={WRAP}>
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-9 max-[960px]:grid-cols-2 max-[960px]:gap-7 max-[720px]:grid-cols-1">
            <div>
              <div className="mb-3">
                <Brand />
              </div>
              <p className="text-ink-muted text-[14.5px] max-w-[280px]">
                {t("footer.tagline")}
              </p>
            </div>
            {[
              {
                hKey: "footer.colInstall",
                links: [
                  [t("footer.chromeStore"), LINKS.chrome],
                  [t("footer.edgeAddons"), LINKS.edge],
                ],
              },
              {
                hKey: "footer.colLearn",
                links: [
                  [t("footer.howItWorks"), "#how"],
                  [t("footer.features"), "#features"],
                  [t("footer.valueTypes"), "#values"],
                  [t("footer.faq"), "#faq"],
                ],
              },
              {
                hKey: "footer.colProject",
                links: [
                  [t("footer.github"), LINKS.github],
                  [t("footer.author"), LINKS.author],
                  [t("footer.support"), LINKS.coffee],
                ],
              },
            ].map((col) => (
              <div key={col.hKey}>
                <h4 className="text-[14px] font-semibold mb-3">
                  {t(col.hKey)}
                </h4>
                {col.links.map((link) => {
                  const label = link[0] ?? "";
                  const href = link[1] ?? "#";
                  return (
                    <a
                      key={label}
                      href={href}
                      target={href.startsWith("#") ? undefined : "_blank"}
                      rel={href.startsWith("#") ? undefined : "noopener"}
                      className="block text-ink-muted text-[14.5px] py-1 transition-colors hover:text-ink"
                    >
                      {label}
                    </a>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-line flex items-center justify-between gap-4 text-ink-subtle text-[13.5px] max-[720px]:flex-col max-[720px]:items-start">
            <span>
              © {new Date().getFullYear()} {t("footer.copyright")}
            </span>
            <div className="flex gap-2">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener"
                  aria-label={s.label}
                  className="w-8 h-8 rounded-md grid place-items-center text-ink-muted border border-line bg-white transition-colors hover:text-ink hover:border-line-strong"
                >
                  <s.icon size={16} aria-hidden={true} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
