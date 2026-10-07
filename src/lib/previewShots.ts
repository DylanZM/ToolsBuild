export type Verdict = "ok" | "blank" | "blocked" | "fail";
export type ShotResult = { v: Verdict; src?: string };

const STORE_KEY = "preview-shots:v1";
const TTL_DAYS: Record<Verdict, number> = {
  ok: 30,
  blank: 2,
  blocked: 2,
  fail: 1,
};

const IDB_NAME = "preview-shots-v1";
const IDB_STORE = "shots";
const IDB_TTL = 14 * 86400000;
const IDB_MAX = 240;
const PREFETCH_CAP = 60;

export const shotUrl = (url: string) =>
  `https://image.thum.io/get/width/680/crop/748/wait/2/noanimate/${url}`;

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
 *  - "blank":   failed/near-empty renders — Cloudflare interstitials and
 *               browser error pages are almost all near-white pixels.
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
    let white = 0;
    let lumSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      lumSum += lum;
      if (lum < 89) dark++;
      if (lum > 240) white++;
      if (r > 140 && g < 102 && b < 102) red++;
    }
    if (dark / n < 0.003 || white / n > 0.96) return "blank";
    if (red / n > 0.012 && dark / n < 0.06 && lumSum / n / 255 > 0.9) {
      return "blocked";
    }
    return "ok";
  } catch {
    return "ok";
  }
}

const sessionShots = new Map<string, string>();
const sessionMiss = new Map<string, Verdict>();
const inflight = new Map<string, Promise<ShotResult>>();

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE, { keyPath: "u" });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

async function idbGet(url: string): Promise<Blob | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(url);
      req.onsuccess = () => {
        const row = req.result;
        if (row && Date.now() - row.t < IDB_TTL) resolve(row.b as Blob);
        else resolve(null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbPut(url: string, blob: Blob): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    store.put({ u: url, b: blob, t: Date.now() });
    const countReq = store.count();
    countReq.onsuccess = () => {
      if (countReq.result <= IDB_MAX) return;
      const all = store.getAll();
      all.onsuccess = () => {
        const rows = (all.result as { u: string; t: number }[])
          .sort((a, b) => a.t - b.t);
        rows.slice(0, rows.length - IDB_MAX).forEach((r) => store.delete(r.u));
      };
    };
  } catch {
    /* best-effort */
  }
}

async function fetchShot(
  url: string,
): Promise<{ v: Verdict; blob?: Blob }> {
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
    return { v: "ok", blob };
  } catch {
    return { v: "fail" };
  }
}

/** Resolve a preview shot: memory → IndexedDB → memo → thum.io fetch.
 *  Shared in-flight promise per URL so hover and prefetch never double-fetch.
 *  `retry` (hover) allows one fresh attempt per session for URLs whose last
 *  capture triaged as blank/blocked — thum.io occasionally serves transient
 *  placeholder plates during request bursts. */
export function ensureShot(
  url: string,
  opts?: { retry?: boolean },
): Promise<ShotResult> {
  const mem = sessionShots.get(url);
  if (mem) return Promise.resolve({ v: "ok", src: mem });
  const existing = inflight.get(url);
  if (existing) return existing;
  const retry = opts?.retry === true;

  const p = (async (): Promise<ShotResult> => {
    const miss = sessionMiss.get(url);
    if (miss) return { v: miss };
    const cached = await idbGet(url);
    if (cached) {
      saveMemo(url, "ok");
      const src = URL.createObjectURL(cached);
      sessionShots.set(url, src);
      return { v: "ok", src };
    }
    const verdict = memoOf(url);
    if ((verdict === "blank" || verdict === "blocked") && !retry) {
      return { v: verdict };
    }
    const res = await fetchShot(url);
    saveMemo(url, res.v);
    if (res.v === "ok" && res.blob) {
      const src = URL.createObjectURL(res.blob);
      sessionShots.set(url, src);
      idbPut(url, res.blob);
      return { v: "ok", src };
    }
    sessionMiss.set(url, res.v);
    return { v: res.v };
  })().finally(() => {
    inflight.delete(url);
  });
  inflight.set(url, p);
  return p;
}

const queued = new Set<string>();
const queue: string[] = [];
let prefetchCount = 0;
let active = 0;

function pump() {
  if (active >= 1 || !queue.length) return;
  if (document.visibilityState !== "visible") return;
  const url = queue.shift()!;
  active++;
  ensureShot(url)
    .catch(() => {})
    .finally(() => {
      active--;
      window.setTimeout(() => pump(), 320);
    });
}

function enqueuePrefetch(url: string) {
  if (queued.has(url) || inflight.has(url) || sessionShots.has(url)) return;
  if (prefetchCount >= PREFETCH_CAP) return;
  const m = memoOf(url);
  if (m && m !== "ok") return;
  queued.add(url);
  prefetchCount++;
  queue.push(url);
  pump();
}

/** Warm shots for cards near the viewport so hover shows them instantly.
 *  Desktop (hover-capable) only — touch devices never show previews. */
export function setupPreviewPrefetch() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __previewPrefetch?: boolean };
  if (w.__previewPrefetch) return;
  w.__previewPrefetch = true;
  if (!window.matchMedia("(hover: hover)").matches) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const u = (e.target as HTMLElement).dataset.previewUrl;
        if (u) enqueuePrefetch(u);
        io.unobserve(e.target);
      }
    },
    { rootMargin: "500px 0px" },
  );

  const scan = () => {
    document
      .querySelectorAll<HTMLElement>("[data-preview-url]")
      .forEach((el) => {
        if (el.dataset.pfSeen) return;
        el.dataset.pfSeen = "1";
        io.observe(el);
      });
  };
  scan();
  document.addEventListener("astro:page-load", scan);

  const kick = () => window.setTimeout(() => pump(), 1500);
  if (document.readyState === "complete") kick();
  else window.addEventListener("load", kick, { once: true });
  document.addEventListener("visibilitychange", pump);
}
