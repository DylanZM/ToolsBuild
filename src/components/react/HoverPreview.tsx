import React, { useEffect, useRef, useState } from "react";
import { domainOf, faviconUrl } from "../../lib/url";
import { getPreview, type PreviewData } from "../../lib/preview";

const W = 340;
const H = 212;
const DELAY = 350;
const MARGIN = 14;

type Item = { url: string; name: string };
type Phase = "loading" | "image" | "fallback";

const HoverPreview: React.FC = () => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [meta, setMeta] = useState<PreviewData | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [imgSrc, setImgSrc] = useState("");
  const [imgOk, setImgOk] = useState(false);
  const badImages = useRef(new Set<string>());

  useEffect(() => {
    if (!item) return;
    const url = item.url;
    setMeta(null);
    setImgSrc("");
    setImgOk(false);
    setPhase("loading");
    let alive = true;
    getPreview(url).then((data) => {
      if (!alive) return;
      setMeta(data);
      if (data?.image && !badImages.current.has(data.image)) {
        setImgSrc(data.image);
        setPhase("image");
      } else {
        setPhase("fallback");
      }
    });
    return () => {
      alive = false;
    };
  }, [item?.url]);

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

  const shimmer = (
    <div
      className={`absolute inset-0 transition-opacity duration-300 ${
        imgOk ? "opacity-0" : "opacity-100"
      }`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent, var(--line), transparent)",
        backgroundSize: "200% 100%",
        animation: "preview-shimmer 1.4s linear infinite",
      }}
    />
  );

  const faviconSrc =
    (meta?.favicon ?? undefined) ||
    faviconUrl(item?.url ?? "", 128);

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
              {phase === "fallback" ? (
                <div className="flex h-full flex-col items-center justify-center gap-2.5">
                  <img
                    src={faviconSrc}
                    alt=""
                    width={36}
                    height={36}
                    loading="lazy"
                    decoding="async"
                    className="h-9 w-9 rounded-lg object-contain"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.outerHTML =
                        '<span class="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-[13px] font-bold text-ink">' +
                        domainOf(item.url).charAt(0).toUpperCase() +
                        "</span>";
                    }}
                  />
                  <span className="max-w-[85%] truncate text-[11.5px] text-muted">
                    {domainOf(item.url)}
                  </span>
                </div>
              ) : (
                <>
                  {phase === "loading" ? (
                    shimmer
                  ) : (
                    <>
                      {shimmer}
                      <img
                        src={imgSrc}
                        alt=""
                        width={340}
                        height={212}
                        decoding="async"
                        className={`h-full w-full object-cover object-top transition-opacity duration-300 ${
                          imgOk ? "opacity-100" : "opacity-0"
                        }`}
                        onLoad={() => setImgOk(true)}
                        onError={() => {
                          if (imgSrc) badImages.current.add(imgSrc);
                          setPhase("fallback");
                        }}
                      />
                    </>
                  )}
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
