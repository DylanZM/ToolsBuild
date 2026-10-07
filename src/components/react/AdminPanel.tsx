import React, { useMemo, useRef, useState } from "react";
import type { Link } from "../../data/links";
import { domainOf } from "../../lib/url";

interface CatOpt {
  id: string;
  name: string;
}

interface Props {
  links: Link[];
  categories: CatOpt[];
  dev: boolean;
}

interface FormState {
  name: string;
  url: string;
  category: string;
  tags: string;
  descEs: string;
  descEn: string;
  featured: boolean;
}

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseTags = (s: string) =>
  s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

const AdminPanel: React.FC<Props> = ({ links, categories, dev }) => {
  const emptyForm = (): FormState => ({
    name: "",
    url: "",
    category: categories[0]?.id ?? "",
    tags: "",
    descEs: "",
    descEn: "",
    featured: false,
  });

  const [items, setItems] = useState<Link[]>(links);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(
    null,
  );
  const toastTimer = useRef<number | undefined>(undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const catName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? id;

  const showToast = (kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  };

  const persist = async (next: Link[]): Promise<boolean> => {
    setBusy(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        showToast("err", data.error || `Error ${res.status} del servidor`);
        return false;
      }
      setItems(next);
      return true;
    } catch {
      showToast(
        "err",
        "No se pudo escribir el archivo. ¿Sigue corriendo astro dev?",
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const url = form.url.trim();
    const descEs = form.descEs.trim();
    const descEn = form.descEn.trim();
    if (!name || !url || !descEs || !descEn) {
      showToast("err", "Nombre, URL y descripción (ES/EN) son obligatorios.");
      return;
    }
    if (!/^https?:\/\//.test(url)) {
      showToast("err", "La URL debe empezar por http:// o https://");
      return;
    }
    const tags = parseTags(form.tags);
    const featured = form.featured ? true : undefined;

    if (editingId) {
      const next = items.map((l) =>
        l.id === editingId
          ? {
              ...l,
              name,
              url,
              category: form.category,
              tags,
              desc: { es: descEs, en: descEn },
              ...(featured ? { featured: true } : {}),
            }
          : l,
      );
      if (await persist(next)) {
        showToast("ok", `✓ "${name}" actualizado`);
        resetForm();
      }
      return;
    }

    let id = slugify(name) || "recurso";
    const base = id;
    let n = 2;
    while (items.some((l) => l.id === id)) id = `${base}-${n++}`;
    const entry: Link = {
      id,
      url,
      name,
      category: form.category,
      tags,
      desc: { es: descEs, en: descEn },
      ...(featured ? { featured: true } : {}),
    };
    if (await persist([...items, entry])) {
      showToast("ok", `✓ "${name}" agregado a ${catName(form.category)}`);
      resetForm();
    }
  };

  const remove = async (l: Link) => {
    if (!window.confirm(`¿Eliminar "${l.name}" de la lista?`)) return;
    if (await persist(items.filter((x) => x.id !== l.id)))
      showToast("ok", `✓ "${l.name}" eliminado`);
  };

  const startEdit = (l: Link) => {
    setEditingId(l.id);
    setForm({
      name: l.name,
      url: l.url,
      category: l.category,
      tags: l.tags.join(", "),
      descEs: l.desc.es,
      descEn: l.desc.en,
      featured: !!l.featured,
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return items;
    return items.filter((l) =>
      `${l.name} ${l.url} ${l.tags.join(" ")} ${catName(l.category)}`
        .toLowerCase()
        .includes(s),
    );
  }, [items, query]);

  const inputCls =
    "h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-[13px] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent";
  const labelCls = "mb-1.5 block text-[12px] font-medium text-muted";
  const btnPrimary =
    "rounded-md bg-ink px-4 py-2 text-[13px] font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-50";
  const btnGhost =
    "rounded-md border border-line px-3 py-2 text-[13px] text-muted transition-colors hover:border-ink/30 hover:text-ink";

  return (
    <div className="mx-auto max-w-[860px] px-5 py-9 sm:px-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">
            Panel de recursos
          </h1>
          <span className="text-[13px] text-muted">{items.length} enlaces</span>
        </div>
        <a href="/" className={btnGhost}>
          Ver sitio ↗
        </a>
      </div>

      {!dev && (
        <div className="mb-7 rounded-lg border border-line bg-surface px-4 py-3 text-[13px] text-muted">
          Este panel es de solo lectura en producción. Para agregar o editar
          recursos, corre <code className="text-ink">astro dev</code> en local.
        </div>
      )}

      {dev && (
        <form
          ref={formRef}
          onSubmit={submit}
          className="mb-8 rounded-xl border border-line bg-surface p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[14px] font-semibold text-ink">
              {editingId
                ? `Editando: ${form.name || editingId}`
                : "Agregar recurso"}
            </h2>
            {editingId && (
              <button type="button" onClick={resetForm} className={btnGhost}>
                Cancelar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="f-name">
                Nombre
              </label>
              <input
                id="f-name"
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Magic UI"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="f-url">
                URL
              </label>
              <input
                id="f-url"
                className={inputCls}
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://magicui.design"
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="f-cat">
                Categoría
              </label>
              <select
                id="f-cat"
                className={inputCls}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="f-tags">
                Tags (separados por coma)
              </label>
              <input
                id="f-tags"
                className={inputCls}
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="components, react, free"
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="f-es">
                Descripción ES
              </label>
              <input
                id="f-es"
                className={inputCls}
                value={form.descEs}
                onChange={(e) => setForm({ ...form, descEs: e.target.value })}
                placeholder="Componentes animados listos para copiar."
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="f-en">
                Descripción EN
              </label>
              <input
                id="f-en"
                className={inputCls}
                value={form.descEn}
                onChange={(e) => setForm({ ...form, descEn: e.target.value })}
                placeholder="Animated components ready to copy."
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-muted">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  setForm({ ...form, featured: e.target.checked })
                }
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Destacado
            </label>
            <button type="submit" disabled={busy} className={btnPrimary}>
              {busy
                ? "Guardando…"
                : editingId
                  ? "Guardar cambios"
                  : "+ Agregar"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-ink">Lista</h2>
          <input
            className="h-8 w-48 rounded-md border border-line bg-surface-2 px-3 text-[12.5px] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent sm:w-56"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en la lista…"
            aria-label="Buscar en la lista"
          />
        </div>
        <ul>
          {filtered.map((l) => (
            <li
              key={l.id}
              className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-[13px] font-medium text-ink">
                    {l.name}
                  </span>
                  {l.featured && (
                    <span className="shrink-0 text-[10.5px] text-accent">
                      ★ destacado
                    </span>
                  )}
                </div>
                <div className="truncate text-[11.5px] text-muted">
                  {domainOf(l.url)}
                  {l.tags.length > 0 && ` · ${l.tags.join(", ")}`}
                </div>
              </div>
              <span className="hidden shrink-0 rounded-md bg-surface-2 px-2 py-0.5 text-[10.5px] font-medium text-muted sm:block">
                {catName(l.category)}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(l)}
                  className="rounded-md px-2.5 py-1.5 text-[12.5px] text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => remove(l)}
                  className="rounded-md px-2.5 py-1.5 text-[12.5px] text-muted transition-colors hover:text-[#d06060]"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-5 py-8 text-center text-[13px] text-muted">
              Sin resultados para “{query}”
            </li>
          )}
        </ul>
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 rounded-lg border bg-surface px-4 py-2.5 text-[13px] shadow-2xl ${
            toast.kind === "ok"
              ? "border-line text-ink"
              : "border-[#d06060]/50 text-[#e08a8a]"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
