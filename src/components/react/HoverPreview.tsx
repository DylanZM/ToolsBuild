import React, { useEffect, useRef, useState } from "react";
import { domainOf, previewUrl } from "../../lib/url";

const W = 340;
const H = 212;
const DELAY = 350;
const MARGIN = 14;

const ok = new Set<string>();
const bad = new Set<string>();

type Item = { url: string; name: string };

const HoverPreview: React.FC = () => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const pt = useRef({ x: -999, y: -999 });
  const timer = useRef<number>(0);
  const target = useRef<HTMLElement | null>(null);
  const shown = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(hover: hover)").matches) return;

    const place = () => {
      const n = nodeRef.current;
      if (!n) return;
      const x = Math.min(
        Math.max(pt.current.x + 26, MARGIN),
        window.innerWidth - W - MARGIN,
      );
      const y = Math.min(
        Math.max(pt.current.y - H / 2, MARGIN),
        window.innerHeight - H - MARGIN,
      );
      n.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const clear = () => window.clearTimeout(timer.current);

    const hide = () => {
      clear();
      target.current = null;
      shown.current = false;
      setItem(null);
    };

    const reveal = (el: HTMLElement) => {
      const url = el.dataset.previewUrl;
      if (!url) return;
      const name = el.dataset.previewName || domainOf(url);
      shown.current = true;
      place();
      setFailed(bad.has(url));
      setReady(ok.has(url));
      setItem({ url, name });
    };

    const onOver = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest?.(
        "[data-preview-url]",
      ) as HTMLElement | null;
      if (!el) return;
      pt.current = { x: e.clientX, y: e.clientY };
      if (el === target.current) return;
      if (shown.current) {
        shown.current = false;
        setItem(null);
      }
      target.current = el;
      clear();
      timer.current = window.setTimeout(() => reveal(el), DELAY);
    };

    const onOut = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest?.(
        "[data-preview-url]",
      );
      if (el !== target.current) return;
      const next = e.relatedTarget as HTMLElement | null;
      if (next && next.closest?.("[data-preview-url]")) return;
      hide();
    };

    const onMove = (e: PointerEvent) => {
      pt.current = { x: e.clientX, y: e.clientY };
      if (shown.current) place();
    };

    const onHide = () => hide();

    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerdown", onHide);
    window.addEventListener("scroll", onHide, { passive: true });
    window.addEventListener("blur", onHide);

    return () => {
      clear();
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerdown", onHide);
      window.removeEventListener("scroll", onHide);
      window.removeEventListener("blur", onHide);
    };
  }, []);

  const src = item ? previewUrl(item.url) : "";

  return (
    <div
      ref={nodeRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-50"
      style={{ willChange: "transform" }}
    >
      <div
        className={`transition-[opacity,transform] duration-200 ease-out-expo ${
          item ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {item && (
          <div className="w-[340px] overflow-hidden rounded-xl border border-line bg-surface shadow-[0_24px_60px_-18px_rgba(0,0,0,0.55)]">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-2">
              {failed ? (
                <div className="flex h-full flex-col items-center justify-center gap-2">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-[13px] font-bold text-ink"
                    aria-hidden="true"
                  >
                    {domainOf(item.url).charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[85%] truncate text-[11.5px] text-muted">
                    {domainOf(item.url)}
                  </span>
                </div>
              ) : (
                <>
                  <div
                    className={`absolute inset-0 transition-opacity duration-300 ${
                      ready ? "opacity-0" : "opacity-100"
                    }`}
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, transparent, var(--line), transparent)",
                      backgroundSize: "200% 100%",
                      animation: "preview-shimmer 1.4s linear infinite",
                    }}
                  />
                  <img
                    src={src}
                    alt=""
                    width={340}
                    height={212}
                    decoding="async"
                    className={`h-full w-full object-cover object-top transition-opacity duration-300 ${
                      ready ? "opacity-100" : "opacity-0"
                    }`}
                    onLoad={() => {
                      ok.add(item.url);
                      setReady(true);
                    }}
                    onError={() => {
                      bad.add(item.url);
                      setFailed(true);
                    }}
                  />
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2.5">
              <span className="truncate text-[12px] font-medium tracking-tight text-ink">
                {item.name}
              </span>
              <span className="shrink-0 text-[10px] tracking-wider text-muted">
                {domainOf(item.url)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HoverPreview;
