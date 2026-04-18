"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import type { CharsetFlags } from "@/lib/char-pools";
import { generatePassword } from "@/lib/generate-password";
import {
  generatePassphrase,
  passphraseWordCountEntropyBits,
  type PassphraseSeparator,
} from "@/lib/generate-passphrase";
import { entropyLabel, passwordEntropyApprox } from "@/lib/password-entropy";
import { fetchPwnedCount } from "@/lib/pwned-check";

type Mode = "password" | "passphrase";

function strengthTier(
  s: "Weak" | "Fair" | "Strong" | "Excellent",
): 1 | 2 | 3 | 4 {
  if (s === "Weak") return 1;
  if (s === "Fair") return 2;
  if (s === "Strong") return 3;
  return 4;
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function KeyForgeApp() {
  const [mode, setMode] = useState<Mode>("password");
  const [length, setLength] = useState(20);
  const [flags, setFlags] = useState<CharsetFlags>({
    upper: true,
    lower: true,
    digits: true,
    symbols: true,
    excludeAmbiguous: true,
  });
  const [wordCount, setWordCount] = useState(6);
  const [separator, setSeparator] = useState<PassphraseSeparator>("hyphen");
  const [capitalize, setCapitalize] = useState(false);
  const [output, setOutput] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [pwned, setPwned] = useState<number | null | "loading">(null);
  const [pwnedError, setPwnedError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("kf-theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("kf-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  const entropyBits = useMemo(() => {
    if (mode === "passphrase") {
      return passphraseWordCountEntropyBits(wordCount);
    }
    try {
      return passwordEntropyApprox(length, flags);
    } catch {
      return 0;
    }
  }, [mode, length, flags, wordCount]);

  const strength = entropyLabel(entropyBits);
  const tier = strengthTier(strength);
  const entropyFill = Math.min(100, (entropyBits / 96) * 100);

  const lengthPct = ((length - 8) / (64 - 8)) * 100;
  const wordPct = ((wordCount - 3) / (12 - 3)) * 100;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const regenerate = useCallback(() => {
    setPwned(null);
    setPwnedError(null);
    try {
      if (mode === "password") {
        if (!flags.upper && !flags.lower && !flags.digits && !flags.symbols) {
          setOutput("");
          return;
        }
        setOutput(generatePassword(length, flags));
      } else {
        setOutput(generatePassphrase(wordCount, separator, capitalize));
      }
    } catch (e) {
      setOutput("");
      showToast(e instanceof Error ? e.message : "Could not generate.");
    }
  }, [mode, length, flags, wordCount, separator, capitalize, showToast]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      regenerate();
    }, 0);
    return () => window.clearTimeout(id);
  }, [regenerate]);

  const copy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      showToast("Copied to clipboard.");
    } catch {
      showToast("Copy failed — select and copy manually.");
    }
  }, [output, showToast]);

  const checkExposure = async () => {
    if (!output) return;
    setPwned("loading");
    setPwnedError(null);
    try {
      const count = await fetchPwnedCount(output);
      if (count === null) {
        setPwned(null);
        setPwnedError("Exposure check unavailable. Try again later.");
        return;
      }
      setPwned(count);
    } catch {
      setPwned(null);
      setPwnedError("Network error while checking exposure.");
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        regenerate();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && e.shiftKey) {
        e.preventDefault();
        void copy();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [regenerate, copy]);

  const flagsValid =
    flags.upper || flags.lower || flags.digits || flags.symbols;

  const rangeStyle = (pct: number): CSSProperties =>
    ({ "--kf-range-pct": `${pct}%` }) as CSSProperties;

  return (
    <div className="relative min-h-full overflow-hidden bg-[var(--kf-bg)] text-[var(--kf-fg)]">
      <div className="kf-grid" aria-hidden />

      <div
        aria-hidden
        className="pointer-events-none fixed -left-24 top-[18%] h-80 w-80 rounded-full blur-[100px]"
        style={{ background: "var(--kf-orb1)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -right-16 bottom-[-10%] h-[22rem] w-[22rem] rounded-full blur-[110px]"
        style={{ background: "var(--kf-orb2)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-[-20%] h-[28rem] w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.04)_0%,_transparent_55%)]"
      />

      <div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[1] hidden h-full w-px md:block"
        style={{
          background:
            "linear-gradient(to bottom, transparent, var(--kf-vline), transparent)",
        }}
      />

      <header className="relative z-10 border-b border-[var(--kf-border-sm)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-10 pt-10 md:flex-row md:items-end md:justify-between md:px-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-2 w-2 rounded-full bg-[#d4ff4d] shadow-[0_0_12px_var(--kf-glow)] kf-pulse"
                aria-hidden
              />
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.4em] text-[var(--kf-fg-muted)]">
                Local entropy lab
              </p>
            </div>
            <h1 className="font-display mt-4 text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-[var(--kf-fg-bright)]">
              Key
              <span className="kf-brand-text">Forge</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--kf-fg-secondary)]">
              Forge cryptographically strong strings and human-friendly
              passphrases. Everything runs in your browser — nothing is stored
              unless you copy it yourself.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-5 md:items-end">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              className="flex items-center gap-2 rounded-lg border border-[var(--kf-border-md)] bg-[var(--kf-overlay-3)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--kf-fg-muted)] transition hover:border-[var(--kf-border-hover)] hover:text-[var(--kf-fg-kbd)]"
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              {theme === "dark" ? "Light" : "Dark"}
            </button>

            <dl className="grid grid-cols-2 gap-x-10 gap-y-2 font-mono text-[10px] uppercase tracking-widest text-[var(--kf-fg-dim)] md:text-right">
              <div>
                <dt className="text-[var(--kf-fg-muted)]">Regenerate</dt>
                <dd className="mt-0.5 text-[var(--kf-fg-kbd)]">
                  <kbd className="rounded border border-[var(--kf-border-lg)] bg-[var(--kf-overlay-4)] px-1.5 py-0.5 text-[var(--kf-accent-fg)]">
                    ⌃
                  </kbd>{" "}
                  <kbd className="rounded border border-[var(--kf-border-lg)] bg-[var(--kf-overlay-4)] px-1.5 py-0.5">
                    Enter
                  </kbd>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--kf-fg-muted)]">Copy</dt>
                <dd className="mt-0.5 text-[var(--kf-fg-kbd)]">
                  <kbd className="rounded border border-[var(--kf-border-lg)] bg-[var(--kf-overlay-4)] px-1.5 py-0.5">
                    ⇧
                  </kbd>{" "}
                  <kbd className="rounded border border-[var(--kf-border-lg)] bg-[var(--kf-overlay-4)] px-1.5 py-0.5 text-[var(--kf-accent-fg)]">
                    ⌃
                  </kbd>{" "}
                  <kbd className="rounded border border-[var(--kf-border-lg)] bg-[var(--kf-overlay-4)] px-1.5 py-0.5">
                    C
                  </kbd>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-8 px-4 pb-24 md:grid-cols-12 md:gap-10 md:px-10">
        <section
          className="relative md:col-span-7"
          aria-labelledby="output-heading"
        >
          <div className="pointer-events-none absolute -left-1 -top-1 h-8 w-8 border-l border-t border-[#d4ff4d]/50" />
          <div
            className="pointer-events-none absolute -right-1 -bottom-1 h-8 w-8 border-r border-b"
            style={{ borderColor: "var(--kf-border-corner)" }}
          />

          <div
            className="rounded-2xl border border-[var(--kf-border-md)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] ring-1 ring-[var(--kf-ring-sm)] backdrop-blur-xl sm:p-8"
            style={{ background: "var(--kf-surface)" }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2
                  id="output-heading"
                  className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--kf-fg-muted)]"
                >
                  Output specimen
                </h2>
                <output
                  className="mt-4 block font-mono text-lg leading-relaxed tracking-[0.02em] text-[var(--kf-fg-high)] break-all sm:text-xl md:text-2xl"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {output || "—"}
                </output>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[9.5rem]">
                <button
                  type="button"
                  onClick={() => void copy()}
                  className="group relative overflow-hidden rounded-xl bg-[#d4ff4d] px-4 py-3 text-center text-sm font-semibold text-zinc-950 transition hover:bg-[#e6ff7a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4ff4d]"
                >
                  <span className="relative z-10">Copy secret</span>
                  <span
                    className="pointer-events-none absolute inset-0 translate-y-full bg-white/30 transition-transform duration-300 group-hover:translate-y-0"
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  onClick={regenerate}
                  className="rounded-xl border border-[var(--kf-border-lg)] bg-[var(--kf-overlay-3)] px-4 py-3 text-sm font-medium text-[var(--kf-fg-primary)] transition hover:border-[var(--kf-border-xl)] hover:bg-[var(--kf-overlay-6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kf-border-hover)]"
                >
                  Reshuffle entropy
                </button>
              </div>
            </div>

            <div className="mt-8 border-t border-[var(--kf-border-sm)] pt-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--kf-fg-muted)]">
                    Strength
                  </span>
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-bold tracking-wide ${
                      strength === "Weak"
                        ? "bg-rose-500/15 text-rose-400 ring-1 ring-rose-400/25"
                        : strength === "Fair"
                          ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25"
                          : strength === "Strong"
                            ? "bg-[#d4ff4d]/15 text-[var(--kf-accent-fg)] ring-1 ring-[#d4ff4d]/30"
                            : "bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/30"
                    }`}
                  >
                    {strength}
                  </span>
                  <span className="font-mono text-xs text-[var(--kf-fg-muted)]">
                    ≈ {entropyBits.toFixed(0)} bits
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void checkExposure()}
                  disabled={!output || pwned === "loading"}
                  className="font-mono text-[10px] font-medium uppercase tracking-widest text-[var(--kf-fg-muted)] underline-offset-4 transition hover:text-[var(--kf-fg-kbd)] hover:underline disabled:pointer-events-none disabled:opacity-35"
                >
                  {pwned === "loading"
                    ? "Querying HIBP…"
                    : "Check breach corpus"}
                </button>
              </div>

              <div
                className="mt-4 flex h-2 gap-1 rounded-full p-0.5 ring-1 ring-[var(--kf-border-sm)]"
                style={{ background: "var(--kf-bar-track)" }}
                role="presentation"
                aria-hidden
              >
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`relative flex-1 overflow-hidden rounded-full transition-colors duration-500 ${
                      i <= tier
                        ? i === 1
                          ? "bg-rose-400/90"
                          : i === 2
                            ? "bg-amber-300/90"
                            : i === 3
                              ? "bg-[#d4ff4d]"
                              : "bg-violet-400/90"
                        : "bg-[var(--kf-bar-inactive)]"
                    }`}
                  >
                    {i <= tier && (
                      <span className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    )}
                  </div>
                ))}
              </div>

              <div
                className="mt-2 h-1 overflow-hidden rounded-full"
                style={{ background: "var(--kf-bar-inactive)" }}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#d4ff4d]/80 via-[#d4ff4d] to-violet-400/90 transition-[width] duration-500 ease-out"
                  style={{ width: `${entropyFill}%` }}
                />
              </div>

              {pwned !== null && pwned !== "loading" && (
                <p
                  className="mt-4 font-mono text-xs leading-relaxed"
                  style={{
                    color:
                      pwned > 0
                        ? "rgb(253 230 138 / 0.9)"
                        : "var(--kf-success-fg)",
                  }}
                  role="status"
                >
                  {pwned > 0
                    ? `Observed in breach corpora ≈ ${pwned.toLocaleString()}× (expected for random strings sometimes).`
                    : "No range match in Pwned Passwords."}
                </p>
              )}
              {pwnedError && (
                <p className="mt-4 font-mono text-xs text-rose-400" role="alert">
                  {pwnedError}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="md:col-span-5">
          <div
            className="sticky top-8 rounded-2xl border border-[var(--kf-border-md)] p-1 shadow-inner ring-1 ring-[var(--kf-ring-sm)] backdrop-blur-md"
            style={{ background: "var(--kf-panel)" }}
          >
            <div
              className="relative rounded-[calc(1rem-2px)] p-1"
              style={{ background: "var(--kf-panel-inner)" }}
            >
              <div
                className="pointer-events-none absolute bottom-1 top-1 w-[calc(50%-6px)] rounded-xl transition-[left] duration-500 ease-[cubic-bezier(0.34,1.3,0.64,1)]"
                style={{
                  background: `linear-gradient(to bottom right, var(--kf-pill-from), var(--kf-pill-to))`,
                  boxShadow: `inset 0 1px 0 var(--kf-overlay-12)`,
                  left: mode === "password" ? 4 : "calc(50% + 2px)",
                }}
              />
              <div className="relative grid grid-cols-2 gap-0">
                {(
                  [
                    ["password", "Random string"],
                    ["passphrase", "Passphrase"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMode(id)}
                    className={`relative z-10 rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                      mode === id
                        ? "text-[var(--kf-fg-bright)]"
                        : "text-[var(--kf-fg-muted)] hover:text-[var(--kf-fg-kbd)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8 px-5 py-8 sm:px-6">
              {mode === "password" ? (
                <>
                  <div>
                    <div className="flex items-end justify-between gap-4">
                      <label
                        htmlFor="len"
                        className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--kf-fg-muted)]"
                      >
                        Length
                      </label>
                      <span className="font-mono text-sm tabular-nums text-[var(--kf-accent-fg)]">
                        {length}
                      </span>
                    </div>
                    <input
                      id="len"
                      type="range"
                      min={8}
                      max={64}
                      value={length}
                      onChange={(e) => setLength(Number(e.target.value))}
                      className="kf-range mt-4"
                      style={rangeStyle(lengthPct)}
                    />
                  </div>

                  <fieldset>
                    <legend className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--kf-fg-muted)]">
                      Charset matrix
                    </legend>
                    <div className="mt-4 grid gap-2 sm:grid-cols-1">
                      {(
                        [
                          ["upper", "Uppercase"],
                          ["lower", "Lowercase"],
                          ["digits", "Digits"],
                          ["symbols", "Symbols"],
                        ] as const
                      ).map(([key, label]) => (
                        <label
                          key={key}
                          className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--kf-border-sm)] bg-[var(--kf-overlay-2)] px-4 py-3 transition hover:border-[var(--kf-border-hover)] hover:bg-[var(--kf-overlay-4)]"
                        >
                          <span className="text-sm text-[var(--kf-fg-primary)]">
                            {label}
                          </span>
                          <input
                            type="checkbox"
                            checked={flags[key]}
                            onChange={(e) =>
                              setFlags((f) => ({
                                ...f,
                                [key]: e.target.checked,
                              }))
                            }
                            className="size-4 rounded border-[var(--kf-border-xl)] bg-[var(--kf-bar-track)]"
                          />
                        </label>
                      ))}
                    </div>
                    <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--kf-border-lg)] bg-transparent px-4 py-3 transition hover:border-[#d4ff4d]/35 hover:bg-[#d4ff4d]/[0.04]">
                      <span className="text-sm text-[var(--kf-fg-primary)]">
                        Strip ambiguous glyphs
                      </span>
                      <input
                        type="checkbox"
                        checked={flags.excludeAmbiguous}
                        onChange={(e) =>
                          setFlags((f) => ({
                            ...f,
                            excludeAmbiguous: e.target.checked,
                          }))
                        }
                        className="size-4 rounded border-[var(--kf-border-xl)] bg-[var(--kf-bar-track)]"
                      />
                    </label>
                    {!flagsValid && (
                      <p
                        className="mt-3 font-mono text-xs text-amber-300/90"
                        role="alert"
                      >
                        Select ≥ 1 charset row.
                      </p>
                    )}
                  </fieldset>
                </>
              ) : (
                <>
                  <div>
                    <div className="flex items-end justify-between gap-4">
                      <label
                        htmlFor="wc"
                        className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--kf-fg-muted)]"
                      >
                        Word count
                      </label>
                      <span className="font-mono text-sm tabular-nums text-[var(--kf-accent-fg)]">
                        {wordCount}
                      </span>
                    </div>
                    <input
                      id="wc"
                      type="range"
                      min={3}
                      max={12}
                      value={wordCount}
                      onChange={(e) => setWordCount(Number(e.target.value))}
                      className="kf-range mt-4"
                      style={rangeStyle(wordPct)}
                    />
                    <p className="mt-2 font-mono text-[10px] leading-relaxed text-[var(--kf-fg-dim)]">
                      BIP39 English · 2048 words · ~11 bits / token
                    </p>
                  </div>

                  <div>
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--kf-fg-muted)]">
                      Separator
                    </span>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(
                        [
                          ["hyphen", "—"],
                          ["space", "space"],
                          ["dot", "·"],
                        ] as const
                      ).map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setSeparator(id)}
                          className={`min-w-[3.25rem] rounded-lg px-3 py-2 font-mono text-xs font-medium transition ${
                            separator === id
                              ? "bg-[#d4ff4d] text-zinc-950 shadow-[0_0_20px_rgba(212,255,77,0.25)]"
                              : "bg-[var(--kf-overlay-4)] text-[var(--kf-fg-secondary)] ring-1 ring-[var(--kf-border-md)] hover:text-[var(--kf-fg-primary)]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--kf-border-sm)] bg-[var(--kf-overlay-2)] px-4 py-3">
                    <span className="text-sm text-[var(--kf-fg-primary)]">
                      Title-case tokens
                    </span>
                    <input
                      type="checkbox"
                      checked={capitalize}
                      onChange={(e) => setCapitalize(e.target.checked)}
                      className="size-4 rounded border-[var(--kf-border-xl)] bg-[var(--kf-bar-track)]"
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          <p className="mt-6 px-1 font-mono text-[10px] leading-relaxed text-[var(--kf-fg-dim)]">
            RNG via{" "}
            <code className="rounded bg-[var(--kf-overlay-6)] px-1.5 py-0.5 text-[var(--kf-fg-secondary)]">
              crypto.getRandomValues
            </code>
            . Breach checks leak only a SHA-1 prefix (k-anonymity) to HIBP.
          </p>
        </section>
      </main>

      {toast && (
        <div
          className="kf-toast-enter fixed bottom-8 left-1/2 z-50 max-w-[min(90vw,24rem)] -translate-x-1/2 rounded-2xl border border-[var(--kf-border-lg)] px-6 py-3 font-mono text-xs text-[var(--kf-fg)] shadow-[0_16px_48px_rgba(0,0,0,0.25)] ring-1 ring-[#d4ff4d]/20 backdrop-blur-md"
          style={{ background: "var(--kf-toast-bg)" }}
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
