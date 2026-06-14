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

/* shared class recipes — utility-first, composed in JS to stay DRY */
const WRAP = "w-full max-w-[1140px] mx-auto px-7 max-[720px]:px-5";
const SECTION = "relative py-24 max-[720px]:py-[70px]";
const GLASS = "rounded-[20px] bg-glass border border-line backdrop-blur-[14px]";

const BTN =
  "inline-flex items-center justify-center gap-[9px] font-display font-semibold tracking-[-0.01em] rounded-[14px] border border-transparent cursor-pointer whitespace-nowrap transition duration-200 active:translate-y-px";
const BTN_PRIMARY = cx(
  BTN,
  "text-[15px] px-[22px] py-[13px] text-navy bg-[linear-gradient(180deg,#fff,#eef3ff)]",
  "shadow-[0_14px_32px_-14px_rgba(20,30,90,0.55),inset_0_1px_0_rgba(255,255,255,0.8)]",
  "hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-16px_rgba(20,30,90,0.6)]",
);
const BTN_GHOST = cx(
  BTN,
  "text-[15px] px-[22px] py-[13px] text-white bg-glass-2 border-line-strong backdrop-blur-md",
  "hover:bg-glass-3 hover:border-white",
);
const BTN_COFFEE = cx(
  BTN,
  "text-[16px] px-[26px] py-[15px] text-[#0d0c22] bg-[linear-gradient(120deg,#ffdd00,#ffc400)]",
  "shadow-[0_14px_34px_-14px_rgba(255,200,0,0.85),inset_0_1px_0_rgba(255,255,255,0.55)]",
  "hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-16px_rgba(255,200,0,0.95)]",
);

const REVEAL =
  "opacity-0 translate-y-[22px] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform " +
  "motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none";

/* ------------------------------------------------------------------ */
/* primitives                                                         */
/* ------------------------------------------------------------------ */
const Kbd = ({ children }: { children: ReactNode }) => (
  <span
    dir="ltr"
    className="font-mono font-bold text-[0.85em] text-navy bg-white rounded-[7px] px-2 py-[3px] leading-none inline-flex items-center border border-white/90 shadow-[0_2px_6px_-2px_rgba(20,30,90,0.35),inset_0_-2px_0_rgba(28,38,96,0.28)]"
  >
    {children}
  </span>
);

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <p className="inline-flex items-center gap-[9px] font-mono text-[12px] font-medium uppercase tracking-[0.16em] text-ice mb-[18px]">
    <span className="w-[22px] h-px bg-[linear-gradient(90deg,#fff,transparent)] rtl:bg-[linear-gradient(270deg,#fff,transparent)]" />
    {children}
  </p>
);

const Grad = ({ children }: { children: ReactNode }) => (
  <span className="bg-[linear-gradient(90deg,#fff,#cfe0ff)] bg-clip-text text-transparent">
    {children}
  </span>
);

const Code = ({ children }: { children: ReactNode }) => (
  <code
    dir="ltr"
    className="font-mono text-[0.88em] text-white bg-white/18 rounded-[5px] px-1.5 py-0.5 inline-block"
  >
    {children}
  </code>
);

const Brand = () => (
  <a
    className="inline-flex items-center gap-[11px] font-display font-bold text-[19px] text-white tracking-[-0.02em]"
    href="#top"
  >
    <img
      src="/icon.png"
      alt=""
      className="w-8 h-8 rounded-[9px] p-0.5 bg-white/85"
    />
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
/* scroll-reveal — removes the hide classes once in view              */
/* ------------------------------------------------------------------ */
function useReveal() {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const show = (el: HTMLElement) =>
      el.classList.remove("opacity-0", "translate-y-[22px]");
    if (!("IntersectionObserver" in window)) {
      els.forEach(show);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            show(e.target as HTMLElement);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

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

const FIELDS: Field[] = [
  { key: "name", labelKey: "demo.name", type: "text" },
  { key: "email", labelKey: "demo.email", type: "email" },
  { key: "date", labelKey: "demo.date", type: "date" },
  { key: "time", labelKey: "demo.time", type: "time" },
  { key: "week", labelKey: "demo.week", type: "week" },
  { key: "color", labelKey: "demo.color", type: "color" },
  { key: "msg", labelKey: "demo.msg", type: "text", span: true },
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
  const { t } = useTranslation();
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

  const fill = useCallback(() => {
    clearTimers();
    setRunning(true);
    setFilled({});
    setActive(null);

    const results = FIELDS.map((f) => ({
      key: f.key,
      value: valueFor(f, value.trim()),
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
  }, [value]);

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
    <div
      className={cx("relative max-[960px]:max-w-[520px]", REVEAL)}
      data-reveal
    >
      <div className="relative rounded-[26px] p-[26px] bg-glass-2 border border-line-strong backdrop-blur-[22px] shadow-[0_40px_80px_-40px_rgba(20,30,90,0.55),inset_0_1px_0_rgba(255,255,255,0.4)]">
        <div
          className={cx(
            "absolute -top-4 end-[18px] inline-flex items-center gap-1.5 px-3 py-2 rounded-[12px] z-[3]",
            "bg-white/90 border border-white/90 shadow-[0_14px_28px_-14px_rgba(20,30,90,0.6)] transition-[transform,box-shadow] duration-150",
            pressed && "translate-y-0.5",
          )}
          aria-hidden="true"
          dir="ltr"
        >
          <Kbd>Alt</Kbd>
          <Kbd>Shift</Kbd>
          <Kbd>F</Kbd>
        </div>

        <div
          className="grid grid-cols-2 gap-x-3.5 gap-y-[13px]"
          aria-hidden="true"
        >
          {FIELDS.map((f) => {
            const v = filled[f.key];
            const isFilled = v !== undefined;
            const isActive = active === f.key;
            return (
              <div
                key={f.key}
                className={cx(
                  "flex flex-col gap-1.5",
                  f.span && "col-span-full",
                )}
              >
                <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-white/65">
                  {t(f.labelKey)}
                </span>
                <div
                  className={cx(
                    "relative h-10 rounded-[11px] flex items-center px-3 font-mono text-[13.5px] text-white overflow-hidden border transition-[border-color,box-shadow,background] duration-300",
                    isFilled
                      ? "bg-mint/12 border-mint/70 shadow-[0_0_18px_-6px_rgba(94,240,187,0.8)]"
                      : isActive
                        ? "bg-white/24 border-white"
                        : "bg-white/16 border-white/28",
                  )}
                >
                  {f.type === "color" && (
                    <span
                      className="w-[22px] h-[22px] rounded-[6px] me-[9px] shrink-0 border border-white/50 bg-white/25 transition-[background] duration-300"
                      style={isFilled ? { background: v } : undefined}
                    />
                  )}
                  <span
                    className={cx(
                      "transition-[opacity,transform] duration-[280ms]",
                      isFilled
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-1",
                    )}
                  >
                    {v ?? ""}
                  </span>
                  <span
                    className={cx(
                      "w-[1.5px] h-[17px] bg-white ms-px",
                      isActive ? "opacity-100 animate-blink" : "opacity-0",
                    )}
                  />
                  <span
                    className={cx(
                      "absolute end-2.5 w-[17px] h-[17px] rounded-full grid place-items-center bg-mint text-[#06241a]",
                      "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                      isFilled ? "opacity-100 scale-100" : "opacity-0 scale-50",
                    )}
                  >
                    <LuCheck size={11} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* the extension popup, in miniature */}
        <div className="mt-[18px] flex items-center gap-3 p-3.5 rounded-[15px] border border-line-strong bg-white/16">
          <img
            className="w-[34px] h-[34px] rounded-[9px] shrink-0 p-0.5 bg-white/85"
            src="/icon.png"
            alt=""
            aria-hidden="true"
          />
          <input
            className="flex-1 min-w-0 h-[38px] rounded-[10px] text-white font-mono text-[13.5px] px-3 bg-white/16 border border-white/30 placeholder:text-white/60"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("demo.placeholder")}
            aria-label={t("demo.valueLabel")}
          />
          <button
            className="h-[38px] px-[18px] rounded-[10px] border-0 cursor-pointer font-display font-semibold text-[13.5px] text-navy bg-white inline-flex items-center gap-[7px] whitespace-nowrap transition-[transform,box-shadow] duration-150 shadow-[0_8px_20px_-8px_rgba(20,30,90,0.6)] hover:-translate-y-px disabled:opacity-65 disabled:cursor-progress"
            onClick={fill}
            disabled={running}
          >
            <LuZap size={14} />
            {running ? t("demo.filling") : t("demo.fill")}
          </button>
        </div>

        <div className="flex gap-[7px] mt-3 flex-wrap items-center">
          <span className="font-mono text-[11px] text-white/55 me-0.5">
            {t("demo.presetsLabel")}
          </span>
          {["1", "5", "10", "50", "100"].map((p) => (
            <button
              key={p}
              className="font-mono text-[12px] text-white rounded-full px-[13px] py-1 cursor-pointer bg-white/16 border border-white/28 transition-[background,border-color] duration-150 hover:bg-white/32 hover:border-white"
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
/* marquee                                                            */
/* ------------------------------------------------------------------ */
const MQ_ITEMS = [
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
function Marquee() {
  const items = [...MQ_ITEMS, ...MQ_ITEMS];
  return (
    <div
      className="relative overflow-hidden border-y border-line py-[18px] bg-white/[0.07] group [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)] [-webkit-mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
      aria-hidden="true"
      dir="ltr"
    >
      <div className="flex gap-3.5 w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {items.map((t, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-[9px] font-mono text-[13px] text-white/85 whitespace-nowrap"
          >
            <span className="text-ice">&lt;input type="{t}"&gt;</span>
            <span className="text-white/50 text-[16px]">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* value ledger                                                       */
/* ------------------------------------------------------------------ */
const LEDGER_GRID =
  "grid grid-cols-[230px_1fr_160px] gap-[18px] items-center px-6 py-[15px]";
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
        "border-t border-line font-mono text-[14px] hover:bg-white/[0.07] max-[720px]:grid-cols-1 max-[720px]:gap-1",
      )}
    >
      <span className="text-ice" dir="ltr">
        {type}
      </span>
      <span className="text-white/74 font-body text-[14.5px]">{desc}</span>
      <span className="text-white text-end" dir="ltr">
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
  const { t } = useTranslation();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const data = BILINGUAL[lang];
  return (
    <section className={SECTION} id="languages">
      <div className={WRAP}>
        <div className="grid grid-cols-[0.9fr_1.1fr] gap-12 items-center max-[960px]:grid-cols-1 max-[960px]:gap-8">
          <div className={REVEAL} data-reveal>
            <Eyebrow>{t("bilingual.eyebrow")}</Eyebrow>
            <h2 className="text-[clamp(28px,3.6vw,40px)] mb-[18px]">
              {t("bilingual.title")} <Grad>{t("bilingual.titleAccent")}</Grad>.
            </h2>
            <p className="text-white/74 text-[18px] max-w-[420px]">
              {t("bilingual.body")}
            </p>
            <div
              className="inline-flex p-[5px] rounded-full bg-glass-2 border border-line gap-1 mt-7"
              role="tablist"
              aria-label="Language"
            >
              {(["en", "ar"] as const).map((l) => (
                <button
                  key={l}
                  role="tab"
                  aria-selected={lang === l}
                  onClick={() => setLang(l)}
                  className={cx(
                    "font-mono text-[13px] font-medium rounded-full px-5 py-2 cursor-pointer transition-colors border-0",
                    lang === l
                      ? "text-navy bg-white"
                      : "text-white/78 bg-transparent",
                  )}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className={cx(GLASS, "p-7", REVEAL)} dir={data.dir} data-reveal>
            {data.rows.map((r, i) => (
              <div
                key={r.label}
                className={cx(
                  "flex flex-col gap-1.5 py-3",
                  i > 0 && "border-t border-line",
                )}
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/60">
                  {r.label}
                </span>
                <div className="h-[42px] rounded-[11px] flex items-center px-3.5 font-mono text-[14px] text-white bg-white/16 border border-white/28">
                  {r.value}
                </div>
              </div>
            ))}
            <p className="mt-[18px] font-mono text-[12px] text-ice">
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
function FAQ() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<number | null>(0);

  const FAQ_KEYS = ["0", "1", "2", "3", "4", "5"] as const;

  // shared Trans components map
  const transComponents = {
    a: <a href={LINKS.coffee} className="text-[#ffdd00]" />,
    code: <Code>x</Code>,
    inputTag: <Code>x</Code>,
    date: <Code>x</Code>,
    time: <Code>x</Code>,
    week: <Code>x</Code>,
    color: <Code>x</Code>,
    cmdF: <Code>x</Code>,
    altF: <Code>x</Code>,
    shortcuts: <Code>x</Code>,
    strong: <strong />,
  };

  return (
    <section className={SECTION} id="faq">
      <div className={WRAP}>
        <div className={cx("max-w-[640px] mb-[52px]", REVEAL)} data-reveal>
          <Eyebrow>{t("faq.eyebrow")}</Eyebrow>
          <h2 className="text-[clamp(30px,4.4vw,46px)]">{t("faq.title")}</h2>
        </div>
        <div className={cx("border-t border-line", REVEAL)} data-reveal>
          {FAQ_KEYS.map((k, i) => {
            const isOpen = open === i;
            return (
              <div key={k} className="border-b border-line">
                <button
                  className="w-full bg-transparent border-0 text-white font-display font-medium text-[19px] text-start py-6 px-1 cursor-pointer flex items-center justify-between gap-5 transition-colors hover:text-ice"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  {t(`faq.q${k}`)}
                  <span
                    className={cx(
                      "relative shrink-0 w-[26px] h-[26px] text-white transition-transform duration-300",
                      isOpen && "rotate-45",
                    )}
                    aria-hidden="true"
                  >
                    <span className="absolute top-1/2 left-1 right-1 h-0.5 -translate-y-1/2 bg-current rounded-sm" />
                    <span className="absolute left-1/2 top-1 bottom-1 w-0.5 -translate-x-1/2 bg-current rounded-sm" />
                  </span>
                </button>
                <div
                  className={cx(
                    "overflow-hidden transition-[max-height] duration-300",
                    isOpen ? "max-h-[320px]" : "max-h-0",
                  )}
                >
                  <p className="text-white/74 text-[16px] pb-[26px] px-1 max-w-[760px]">
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
  const [scrolled, setScrolled] = useState(false);
  const isAr = i18n.language === "ar";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cx(
        "sticky top-0 z-50 border-b transition-[background,border-color] duration-300",
        scrolled
          ? "bg-[rgba(83,101,230,0.55)] backdrop-blur-xl border-white/[0.18]"
          : "bg-transparent border-transparent",
      )}
    >
      <div className={cx(WRAP, "flex items-center justify-between h-[70px]")}>
        <Brand />
        <div className="flex items-center gap-[30px] max-[960px]:hidden">
          {[
            [t("nav.howItWorks"), "#how"],
            [t("nav.features"), "#features"],
            [t("nav.values"), "#values"],
            [t("nav.faq"), "#faq"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-[14.5px] text-white/78 transition-colors hover:text-white"
            >
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {/* language toggle */}
          <button
            className="font-mono text-[13px] font-semibold text-white/80 hover:text-white border border-line-strong rounded-full px-4 py-[7px] bg-glass-2 hover:bg-glass-3 transition cursor-pointer"
            onClick={() => switchLang(isAr ? "en" : "ar")}
            aria-label="Toggle language"
          >
            {isAr ? "EN" : "عربي"}
          </button>
          <a
            className={cx(BTN_GHOST, "max-[720px]:hidden")}
            href={LINKS.github}
            target="_blank"
            rel="noopener"
          >
            <FaGithub size={18} />
          </a>
          <a
            className={BTN_PRIMARY}
            href={LINKS.chrome}
            target="_blank"
            rel="noopener"
          >
            <FaChrome size={18} />
            {t("nav.addToChrome")}
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
  useReveal();

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
      <header className="relative pt-[72px] pb-[90px]">
        <div
          className={cx(
            WRAP,
            "grid grid-cols-[1.05fr_0.95fr] gap-16 items-center max-[960px]:grid-cols-1 max-[960px]:gap-12",
          )}
        >
          <div className="max-w-[560px]">
            <span
              className="inline-flex items-center gap-2.5 font-mono text-[12.5px] text-white bg-glass-2 border border-line-strong rounded-full ps-2 pe-3.5 py-1.5 mb-[26px] backdrop-blur-md opacity-0 translate-y-[22px] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:opacity-100 motion-reduce:translate-y-0"
              data-reveal
            >
              <span className="w-[7px] h-[7px] rounded-full bg-mint shadow-[0_0_0_4px_rgba(94,240,187,0.25)]" />
              {t("hero.badge")}
            </span>
            <h1
              className={cx(
                "text-[clamp(40px,6.4vw,70px)] font-bold leading-[0.98] [text-shadow:0_4px_30px_rgba(20,30,90,0.25)]",
                REVEAL,
              )}
              data-reveal
            >
              {t("hero.title1")}
              <span className="block">
                {t("hero.title2")} <Grad>{t("hero.titleAccent")}</Grad>
              </span>
            </h1>
            <p
              className={cx(
                "mt-[26px] text-[19px] text-white/85 max-w-[480px]",
                REVEAL,
              )}
              data-reveal
            >
              <Trans
                i18nKey="hero.description"
                components={{
                  strong: <b className="text-white font-semibold" />,
                }}
              />
            </p>
            <div
              className={cx(
                "mt-[34px] flex flex-wrap gap-3.5 items-center",
                REVEAL,
              )}
              data-reveal
            >
              <a
                className={BTN_PRIMARY}
                href={LINKS.chrome}
                target="_blank"
                rel="noopener"
              >
                <FaChrome size={18} />
                {t("hero.addToChrome")}
              </a>
              <a
                className={BTN_GHOST}
                href={LINKS.edge}
                target="_blank"
                rel="noopener"
              >
                <FaEdge size={18} />
                {t("hero.getOnEdge")}
              </a>
            </div>
            <p
              className={cx(
                "mt-[22px] text-[14px] text-white/70 flex items-center gap-2 flex-wrap",
                REVEAL,
              )}
              data-reveal
            >
              {t("hero.shortcutHint")}
              <span dir="ltr" className="inline-flex items-center gap-2">
                <Kbd>Alt</Kbd>
                <Kbd>Shift</Kbd>
                <Kbd>F</Kbd>
              </span>
              {t("hero.shortcutSuffix")}
            </p>
            <div
              className={cx(
                "mt-10 flex gap-7 flex-wrap max-[720px]:gap-5",
                REVEAL,
              )}
              data-reveal
            >
              {(["1", "2", "3"] as const).map((k) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="font-display font-bold text-2xl text-white">
                    {t(`hero.stat${k}n`)}
                  </span>
                  <span className="text-[12.5px] text-white/65">
                    {t(`hero.stat${k}l`)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <FillDemo />
        </div>
      </header>

      {/* MARQUEE */}
      <Marquee />

      {/* HOW IT WORKS */}
      <section className={SECTION} id="how">
        <div className={WRAP}>
          <div className={cx("max-w-[640px] mb-[52px]", REVEAL)} data-reveal>
            <Eyebrow>{t("how.eyebrow")}</Eyebrow>
            <h2 className="text-[clamp(30px,4.4vw,46px)]">{t("how.title")}</h2>
            <p className="mt-[18px] text-white/74 text-[18px]">
              {t("how.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-[22px] max-[720px]:grid-cols-1">
            {(["0", "1", "2"] as const).map((k, i) => (
              <div
                key={k}
                className={cx(GLASS, "relative p-[26px] pt-[30px]", REVEAL)}
                data-reveal
              >
                <div className="font-mono font-bold text-[14px] text-navy w-[34px] h-[34px] rounded-[10px] bg-white grid place-items-center mb-[18px] shadow-[0_6px_16px_-8px_rgba(20,30,90,0.5)]">
                  {i + 1}
                </div>
                <h3 className="text-xl mb-[9px]">{t(`how.step${k}h`)}</h3>
                <p className="text-white/74 text-[15.5px]">
                  {t(`how.step${k}p`)}
                </p>
                {k === "1" && (
                  <p className="mt-3.5 flex gap-1.5" dir="ltr">
                    <Kbd>Alt</Kbd>
                    <Kbd>Shift</Kbd>
                    <Kbd>F</Kbd>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className={SECTION} id="features">
        <div className={WRAP}>
          <div className={cx("max-w-[640px] mb-[52px]", REVEAL)} data-reveal>
            <Eyebrow>{t("features.eyebrow")}</Eyebrow>
            <h2 className="text-[clamp(30px,4.4vw,46px)]">
              {t("features.title")}
            </h2>
            <p className="mt-[18px] text-white/74 text-[18px]">
              {t("features.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-6 gap-[18px] max-[960px]:grid-cols-2 max-[720px]:grid-cols-1">
            {/* hero feature card */}
            <div
              className={cx(
                "rounded-[20px] border border-line backdrop-blur-[14px] relative p-[26px] overflow-hidden flex flex-col justify-between min-h-[230px]",
                "col-span-3 max-[960px]:col-span-2 max-[720px]:col-span-1",
                "bg-[linear-gradient(150deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))]",
                REVEAL,
              )}
              data-reveal
            >
              <div>
                <div className="w-[42px] h-[42px] rounded-[12px] grid place-items-center text-white mb-[18px] border border-line-strong bg-white/18">
                  <LuZap size={21} />
                </div>
                <h3 className="text-[19px] mb-2">{t("features.mainTitle")}</h3>
                <p className="text-white/74 text-[15px]">
                  {t("features.mainBody")}
                </p>
              </div>
              <div
                className="font-mono font-bold text-[clamp(26px,3vw,38px)] text-white tracking-[-0.01em]"
                dir="ltr"
              >
                ⌥ + ⇧ + F
              </div>
            </div>
            {/* feature cards */}
            {FEATURE_ICONS.map((Icon, i) => (
              <div
                key={i}
                className={cx(
                  GLASS,
                  "relative p-[26px] overflow-hidden transition hover:border-line-strong hover:bg-glass-2 hover:-translate-y-[3px]",
                  "col-span-2 max-[720px]:col-span-1",
                  REVEAL,
                )}
                data-reveal
              >
                <div className="w-[42px] h-[42px] rounded-[12px] grid place-items-center text-white mb-[18px] border border-line-strong bg-white/18">
                  <Icon size={21} />
                </div>
                <h3 className="text-[19px] mb-2">
                  {t(`features.item${i}title`)}
                </h3>
                <p className="text-white/74 text-[15px]">
                  {t(`features.item${i}body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUE LEDGER */}
      <section className={SECTION} id="values">
        <div className={WRAP}>
          <div className={cx("max-w-[640px] mb-[52px]", REVEAL)} data-reveal>
            <Eyebrow>{t("values.eyebrow")}</Eyebrow>
            <h2 className="text-[clamp(30px,4.4vw,46px)]">
              {t("values.title")}
            </h2>
            <p className="mt-[18px] text-white/74 text-[18px]">
              {t("values.subtitle")}
            </p>
          </div>
          <div className={cx(GLASS, "overflow-hidden", REVEAL)} data-reveal>
            <div
              className={cx(
                LEDGER_GRID,
                "font-mono text-[11.5px] uppercase tracking-[0.12em] text-white bg-white/12 max-[720px]:hidden",
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
                out={ledgerOuts[i]}
              />
            ))}
          </div>
        </div>
      </section>

      {/* BILINGUAL */}
      <Bilingual />

      {/* PRIVACY */}
      <section className={SECTION} id="privacy">
        <div className={WRAP}>
          <div
            className={cx(
              GLASS,
              "relative p-14 grid grid-cols-2 gap-12 items-center max-[960px]:grid-cols-1 max-[960px]:gap-8 max-[720px]:p-6",
              REVEAL,
            )}
            data-reveal
          >
            <div>
              <Eyebrow>{t("privacy.eyebrow")}</Eyebrow>
              <h2 className="text-[clamp(28px,3.6vw,40px)]">
                {t("privacy.title")} <Grad>{t("privacy.titleAccent")}</Grad>.
              </h2>
              <p className="mt-[18px] text-white/74 text-[17px]">
                {t("privacy.body")}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {(["0", "1", "2"] as const).map((k) => (
                <div
                  key={k}
                  className="grid grid-cols-[130px_1fr] gap-4 items-center p-4 rounded-[12px] border border-line bg-white/[0.1] max-[720px]:grid-cols-1 max-[720px]:gap-1.5"
                >
                  <span
                    className="font-mono text-[13px] rounded-[7px] px-2 py-[3px] justify-self-start text-[#0c3a2a] bg-mint"
                    dir="ltr"
                  >
                    {t(`privacy.perm${k}name`)}
                  </span>
                  <span className="text-[14px] text-white/74">
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
      <section
        className="relative py-[60px] max-[720px]:py-[70px]"
        id="support"
      >
        <div className={WRAP}>
          <div
            className={cx(
              "relative text-center rounded-[26px] py-16 px-10 overflow-hidden backdrop-blur-[16px] border border-[rgba(255,221,0,0.5)] max-[720px]:p-6",
              "bg-glass-2 bg-[radial-gradient(70%_120%_at_50%_0%,rgba(255,221,0,0.22),transparent_60%)]",
              REVEAL,
            )}
            data-reveal
          >
            <div className="text-[44px] leading-none mb-[18px]">☕</div>
            <h2 className="text-[clamp(28px,4vw,42px)]">
              {t("support.title")}
            </h2>
            <p className="mx-auto mt-4 mb-[30px] text-white/82 max-w-[520px] text-[17px]">
              {t("support.body")}
            </p>
            <a
              className={BTN_COFFEE}
              href={LINKS.coffee}
              target="_blank"
              rel="noopener"
            >
              <LuCoffee size={18} />
              {t("support.cta")}
            </a>
            <p className="mt-[26px] text-[14px] text-white/70">
              {t("support.creditPrefix")}{" "}
              <a
                href={LINKS.author}
                target="_blank"
                rel="noopener"
                className="text-white border-b border-dotted border-white/60"
              >
                {t("support.authorName")}
              </a>{" "}
              {t("support.creditSuffix")}
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line pt-[54px] pb-10 bg-[rgba(83,101,230,0.18)]">
        <div className={WRAP}>
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-9 max-[960px]:grid-cols-2 max-[960px]:gap-7 max-[720px]:grid-cols-1">
            <div>
              <div className="mb-3.5">
                <Brand />
              </div>
              <p className="text-white/70 text-[14.5px] max-w-[280px]">
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
                <h4 className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-white/60 mb-4 font-medium">
                  {t(col.hKey)}
                </h4>
                {col.links.map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("#") ? undefined : "_blank"}
                    rel={href.startsWith("#") ? undefined : "noopener"}
                    className="block text-white/85 text-[14.5px] py-[5px] transition-colors hover:text-white"
                  >
                    {label}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-11 pt-6 border-t border-line flex items-center justify-between gap-4 text-white/65 text-[13.5px] font-mono max-[720px]:flex-col max-[720px]:items-start">
            <span>
              © {new Date().getFullYear()} {t("footer.copyright")}
            </span>
            <div className="flex gap-3.5">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-[10px] grid place-items-center text-white border border-line bg-glass transition hover:bg-glass-2 hover:border-white hover:-translate-y-0.5"
                >
                  <s.icon size={17} aria-hidden={true} />
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
