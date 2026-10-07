import React, { useEffect, useRef, useState } from "react";
import { domainOf, faviconUrl } from "../../lib/url";

const W = 340;
const H = 212;
const DELAY = 300;
const MARGIN = 14;

const STORE_KEY = "preview-shots:v1";
type Verdict = "ok" | "blank" | "blocked" | "fail";
const TTL_DAYS: Record<Verdict, number> = {
  ok: 30,
  blank: 7,
  blocked: 7,
  fail: 1,
};

type Item = { url: string; name: string };

const shotUrl = (url: string) =>
  `https://image.thum.io/get/width/680/crop/748/wait/2/noanimate/${url.replace(/\/+$/, "")}`;

let memos: Record<string, { v: Verdict; t: number }> = {};
try {
  memos = JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {};
} catch {
  memos = {};
}

function saveMemo(url: string, v: Verdict) {
  memos[url] = { v, t: Date.now() };
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(memos));
  } catch {
    /* best-effort */
  }
}

function memoOf(url: string): Verdict | null {
  const m = memos[url];
  if (!m) return null;
  return Date.now() - m.t < (TTL_DAYS[m.v] ?? 1) * 86400000 ? m.v : null;
}

/** Pixel triage of the capture:
 *  - "blank":   Cloudflare interstitials — almost no dark pixels
 *  - "blocked": thum.io error plate — light grey page with a red X
 *  - "ok":      real screenshot */
function triage(bitmap: ImageBitmap): Verdict {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "ok";
    ctx.drawImage(bitmap, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const n = canvas.width * canvas.height;
    let dark = 0;
    let red = 0;
    let lumSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      lumSum += lum;
      if (lum < 89) dark++;
      if (r > 140 && g < 102 && b < 102) red++;
    }
    const darkFrac = dark / n;
    if (darkFrac < 0.008) return "blank";
    if (
      red / n > 0.012 &&
      darkFrac < 0.06 &&
      lumSum / n / 255 > 0.9
    ) {
      return "blocked";
    }
    return "ok";
  } catch {
    return "ok";
  }
}

/** Fetch the capture once: status-checked, triaged, returned as an object URL.
 *  referrerPolicy "no-referrer" — thum.io 403s requests that carry a referer. */
async function loadShot(
  url: string,
): Promise<{ v: Verdict; src?: string }> {
  try {
    const res = await fetch(shotUrl(url), {
      mode: "cors",
      referrerPolicy: "no-referrer",
    });
    if (!res.ok) return { v: "fail" };
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const v = triage(bitmap);
    bitmap.close?.();
    if (v !== "ok") return { v };
    return { v: "ok", src: URL.createObjectURL(blob) };
  } catch {
    return { v: "fail" };
  }
}

const sessionShots = new Map<string, string>();

const HoverPreview: React.FC = () => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [imgOk, setImgOk] = useState(false);

  useEffect(() => {
    const url = item?.url;
    setShot(null);
    setImgOk(false);
    if (!url) return;

    const cached = sessionShots.get(url);
    if (cached) {
      setShot(cached);
      return;
    }

    const verdict = memoOf(url);
    if (verdict && verdict !== "ok") return;

    let alive = true;
    loadShot(url).then((res) => {
      if (!alive) return;
      saveMemo(url, res.v);
      if (res.v === "ok" && res.src) {
        sessionShots.set(url, res.src);
        setShot(res.src);
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
      setShot(null);
      setItem(null);
    };

    const reveal = (el: HTMLElement) => {
      const url = el.dataset.previewUrl;
      if (!url) return;
      const name = el.dataset.previewName || domainOf(url);
      shown.current = true;
      place();
      setShot(null);
      setImgOk(false);
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
        setShot(null);
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

  const faviconSrc = item ? faviconUrl(item.url, 128) : "";

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
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
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

              {shot && (
                <img
                  src={shot}
                  alt=""
                  width={340}
                  height={212}
                  decoding="async"
                  className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-300 ${
                    imgOk ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => setImgOk(true)}
                />
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
