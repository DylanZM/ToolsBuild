import { BotAvatar } from "bot-avatars";
import type { BotAvatarState } from "bot-avatars";
import { MorphIcon } from "morphicons/react";
import { ArrowUp, X } from "lucide";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Locale } from "../../i18n/ui";
import { createT } from "../../i18n/ui";
import {
  AI_LEAD_PROVIDER,
  AI_PROVIDERS,
  type AiProvider,
} from "../../lib/ai";

export interface AgentItem {
  id: string;
  url: string;
  name: string;
  desc: string;
}

interface Props {
  items: AgentItem[];
  locale: Locale;
}

type AgentPhase = "idle" | "loading" | "ready" | "empty" | "error";

const CELEBRATION_MS = 1100;

function faviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return "/favicon.svg";
  }
}

const AgentDock: React.FC<Props> = ({ items, locale }) => {
  const t = createT(locale);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<AgentPhase>("idle");
  const [ids, setIds] = useState<string[] | null>(null);
  const [rested, setRested] = useState(true);
  const [celebrating, setCelebrating] = useState(false);
  const [appearanceIndex, setAppearanceIndex] = useState(0);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);
  const previousPhase = useRef<AgentPhase>(phase);

  const results = useMemo(() => {
    if (!ids) return [];
    const byId = new Map(items.map((item) => [item.id, item]));
    return ids
      .map((id) => byId.get(id))
      .filter((item): item is AgentItem => Boolean(item));
  }, [ids, items]);

  const lead = AI_PROVIDERS[appearanceIndex] ?? AI_LEAD_PROVIDER;

  useEffect(() => {
    if (phase === "ready" && previousPhase.current !== "ready") {
      setCelebrating(true);
      const timer = window.setTimeout(() => setCelebrating(false), CELEBRATION_MS);
      previousPhase.current = phase;
      return () => window.clearTimeout(timer);
    }
    previousPhase.current = phase;
  }, [phase]);

  const botState: BotAvatarState = (() => {
    if (phase === "loading") return "working";
    if (celebrating) return "working";
    if (open) return "default";
    return rested ? "sleeping" : "default";
  })();

  const submit = useCallback(
    async (preferred?: AiProvider) => {
      const cleanQuery = query.trim();
      if (cleanQuery.length < 2 || phase === "loading") return;

      setIds(null);
      setPhase("loading");
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 45_000);
      try {
        const response = await fetch("/api/ai-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: cleanQuery,
            locale,
            provider: "gemini",
            ...(preferred ? { provider: preferred } : {}),
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("AI search unavailable");
        const data = (await response.json()) as {
          ids?: string[];
          degraded?: boolean;
        };
        const found = data.degraded ? [] : (data.ids ?? []).slice(0, 10);

        if (!found.length) {
          setIds(null);
          setPhase(data.degraded ? "error" : "empty");
          return;
        }

        setIds(found);
        setPhase("ready");
      } catch {
        setIds(null);
        setPhase("error");
      } finally {
        window.clearTimeout(timer);
        setRested(true);
      }
    },
    [locale, phase, query],
  );

  const openPanel = useCallback(() => {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const closePanel = useCallback((restoreFocus = false) => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!showSwitcher) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && switcherRef.current?.contains(target)) return;
      setShowSwitcher(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowSwitcher(false);
    };
    window.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [showSwitcher]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closePanel(true);
      }
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && dockRef.current?.contains(target)) return;
      closePanel(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer, true);
    };
  }, [closePanel, open]);

  const statusLine = (() => {
    switch (phase) {
      case "loading":
        return t("agent.searching");
      case "ready":
        return t("agent.ranked", { n: results.length });
      case "empty":
        return t("agent.empty");
      case "error":
        return t("agent.error");
      default:
        return t("agent.idle");
    }
  })();

  return (
    <div ref={dockRef} className="fixed bottom-4 right-3 z-40 sm:bottom-5 sm:right-5">
      {open && (
        <div
          role="dialog"
          aria-label={t("agent.title")}
          data-agent-panel
          className="absolute bottom-[4.75rem] right-0 flex max-h-[min(30rem,72vh)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
        >
          <div className="flex items-center gap-2 border-b border-line px-3.5 py-2.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (phase === "loading") return;
                setShowSwitcher((v) => !v);
              }}
              aria-label="Cambiar bot"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <BotAvatar
                aria-label="Bot"
                interactive={false}
                seed={appearanceIndex / AI_PROVIDERS.length}
                shading="plastic"
                size={20}
                state={botState}
                type={lead.type}
              />
            </button>
            <span className="text-[12px] font-medium tracking-tight text-ink">
              {t("agent.title")}
            </span>
            <button
              type="button"
              onClick={() => closePanel(true)}
              aria-label={t("nav.close")}
              className="hdr-hover ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <MorphIcon icon={X} size={14} strokeWidth={2} />
            </button>
          </div>
          {showSwitcher && (
            <div
              ref={switcherRef}
              className="absolute left-3 top-11 z-10 flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xl"
            >
              {AI_PROVIDERS.map((entry, index) => {
                const active = index === appearanceIndex;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setAppearanceIndex(index);
                      setShowSwitcher(false);
                      if (query.trim().length >= 2 && phase !== "loading") {
                        void submit("gemini");
                      }
                    }}
                    className={`hdr-hover flex items-center gap-2 px-3 py-2 text-left transition-colors hover:text-ink ${
                      active ? "text-ink" : "text-muted"
                    }`}
                  >
                    <BotAvatar
                      aria-label="Bot"
                      interactive={false}
                      seed={index / AI_PROVIDERS.length}
                      shading="plastic"
                      size={18}
                      state={active ? "default" : "sleeping"}
                      type={entry.type}
                    />
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (phase === "ready" || phase === "empty") {
                  setPhase("idle");
                  setIds(null);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void submit("gemini");
                }
              }}
              placeholder={t("agent.placeholder")}
              aria-label={t("agent.placeholder")}
              className="h-9 w-full min-w-0 rounded-lg bg-surface-2 px-2.5 text-[13px] text-ink outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => void submit("gemini")}
              disabled={phase === "loading" || query.trim().length < 2}
              aria-label={t("agent.submit")}
              title={t("agent.submit")}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <MorphIcon icon={ArrowUp} size={15} strokeWidth={2} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {phase === "loading" ? (
              <div
                className="space-y-2 px-1 py-1"
                aria-live="polite"
                aria-label={t("agent.searching")}
              >
                {[0, 1, 2].map((skeleton) => (
                  <div key={skeleton} className="flex items-center gap-3 px-2 py-2">
                    <span className="h-6 w-6 shrink-0 animate-pulse rounded-md bg-surface-2" />
                    <span className="min-w-0 flex-1 space-y-2">
                      <span className="block h-2.5 w-2/5 animate-pulse rounded bg-surface-2" />
                      <span className="block h-2 w-4/5 animate-pulse rounded bg-surface-2" />
                    </span>
                  </div>
                ))}
              </div>
            ) : phase === "idle" ? (
              <p className="px-2 py-6 text-center text-[12px] leading-relaxed text-muted">
                {t("agent.hint")}
              </p>
            ) : phase === "empty" ? (
              <p className="px-2 py-6 text-center text-[12px] leading-relaxed text-muted">
                {t("agent.empty")} <span className="text-ink">“{query}”</span>
              </p>
            ) : phase === "error" ? (
              <p
                role="status"
                className="m-1 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-[11.5px] leading-relaxed text-muted"
              >
                {t("agent.error")}
              </p>
            ) : (
              <>
                <p className="px-2 pb-1.5 pt-0.5 text-[9.5px] uppercase tracking-[0.14em] text-muted">
                  {statusLine}
                </p>
                {results.map((item, index) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/item flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-surface-2">
                      <img
                        src={faviconUrl(item.url)}
                        alt=""
                        width="15"
                        height="15"
                        loading="lazy"
                        className="h-[15px] w-[15px] object-contain"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-1.5">
                        <span className="shrink-0 font-mono text-[9px] tabular-nums text-muted">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="truncate text-[12.5px] tracking-tight text-ink">
                          {item.name}
                        </span>
                      </span>
                      <span className="block truncate text-[11px] text-muted">
                        {item.desc}
                      </span>
                    </span>
                  </a>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      <div className="group relative flex items-center justify-end">
        <span
          className={`pointer-events-none absolute right-16 whitespace-nowrap rounded-full border border-line/60 bg-surface/90 px-3 py-1.5 text-[11.5px] tracking-tight text-ink shadow-sm backdrop-blur-sm transition-all duration-200 ${
            open
              ? "translate-x-0 opacity-100"
              : "translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
          }`}
        >
          {t("agent.hintLabel")}
        </span>
        <button
          type="button"
          data-agent-dock
          onClick={() => {
            if (open) {
              closePanel(true);
            } else {
              setOpen(true);
              requestAnimationFrame(() => inputRef.current?.focus());
            }
          }}
          aria-expanded={open}
          className="grid h-14 w-14 place-items-center transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <BotAvatar
            face="mouth"
            interactive={botState !== "sleeping"}
            shading="plastic"
            size={52}
            state={botState}
            type={lead.type}
          />
        </button>
      </div>
    </div>
  );
};

export default AgentDock;
