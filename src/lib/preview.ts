export interface PreviewData {
  image: string | null;
  favicon: string | null;
  siteName: string | null;
  title: string | null;
}

const KEY = import.meta.env.PUBLIC_EXABASE_API_KEY ?? "";
const ENDPOINT = "https://api.exabase.io/v2/link";
const TTL = 24 * 60 * 60 * 1000;
const STORE_KEY = "preview-cache:v1";

type Store = Record<string, { t: number; d: PreviewData }>;

let memory: Map<string, PreviewData> | null = null;
const inflight = new Map<string, Promise<PreviewData | null>>();

function asUrl(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "url" in value) {
    const url = (value as { url?: unknown }).url;
    if (typeof url === "string" && url) return url;
  }
  return null;
}

function load(): Map<string, PreviewData> {
  if (memory) return memory;
  memory = new Map();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return memory;
    const parsed = JSON.parse(raw) as Store;
    const now = Date.now();
    for (const [url, entry] of Object.entries(parsed)) {
      if (entry && typeof entry.t === "number" && now - entry.t < TTL) {
        memory.set(url, entry.d);
      }
    }
  } catch {}
  return memory;
}

function persist() {
  try {
    if (!memory) return;
    const now = Date.now();
    const out: Store = {};
    for (const [url, d] of memory) out[url] = { t: now, d };
    localStorage.setItem(STORE_KEY, JSON.stringify(out));
  } catch {}
}

/** Resolves link metadata (og:image, favicon) for the hover preview. */
export function getPreview(url: string): Promise<PreviewData | null> {
  if (!KEY) return Promise.resolve(null);

  const cached = load().get(url);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(url);
  if (pending) return pending;

  const request = (async (): Promise<PreviewData | null> => {
    try {
      const res = await fetch(`${ENDPOINT}?url=${encodeURIComponent(url)}`, {
        headers: { "X-Api-Key": KEY },
      });
      if (!res.ok) return null;
      const json = (await res.json()) as Record<string, unknown>;
      const data: PreviewData = {
        image: asUrl(json.image),
        favicon: asUrl(json.favicon),
        siteName: typeof json.siteName === "string" ? json.siteName : null,
        title: typeof json.title === "string" ? json.title : null,
      };
      load().set(url, data);
      persist();
      return data;
    } catch {
      return null;
    } finally {
      inflight.delete(url);
    }
  })();

  inflight.set(url, request);
  return request;
}
