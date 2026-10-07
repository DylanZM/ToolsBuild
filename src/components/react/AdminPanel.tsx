import React, { useMemo, useRef, useState } from "react";
import type { Link } from "../../data/links";
import { domainOf, faviconUrl } from "../../lib/url";
import "../arc/foundation.css";
import { Button } from "../arc/button/button";
import { Input } from "../arc/input/input";
import { Textarea } from "../arc/textarea/textarea";
import { Select } from "../arc/select/select";
import { TagInput } from "../arc/tag-input/tag-input";
import Toast from "../arc/toast/toast";

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
  tags: string[];
  descEs: string;
  descEn: string;
}

type FieldErrors = Partial<Record<"name" | "url" | "descEs" | "descEn", string>>;

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const Favicon: React.FC<{ url: string; host: string }> = ({ url, host }) => {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-surface-2 text-[10.5px] font-medium text-muted">
        {host.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={faviconUrl(url, 64)}
      alt=""
      width={20}
      height={20}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
      className="h-5 w-5 shrink-0 object-contain"
    />
  );
};

const AdminPanel: React.FC<Props> = ({ links, categories, dev }) => {
  const emptyForm = (): FormState => ({
    name: "",
    url: "",
    category: categories[0]?.id ?? "",
    tags: [],
    descEs: "",
    descEn: "",
  });

  const [items, setItems] = useState<Link[]>(links);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const savedTitle = useRef("");
  const formRef = useRef<HTMLFormElement>(null);

  const catName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? id;

  const saved = (msg: string) => {
    savedTitle.current = msg;
    setToastOpen(true);
  };

  const persist = async (next: Link[]): Promise<boolean> => {
    setBusy(true);
    setFormError(null);
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
        setFormError(data.error || `Error ${res.status} del servidor`);
        return false;
      }
      setItems(next);
      return true;
    } catch {
      setFormError(
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
    setErrors({});
    setFormError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const name = form.name.trim();
    const url = form.url.trim();
    const descEs = form.descEs.trim();
    const descEn = form.descEn.trim();
    const nextErrors: FieldErrors = {};
    if (!name) nextErrors.name = "El nombre es obligatorio.";
    if (!url) nextErrors.url = "La URL es obligatoria.";
    else if (!/^https?:\/\//.test(url))
      nextErrors.url = "Debe empezar por http:// o https://";
    if (!descEs) nextErrors.descEs = "La descripción en español es obligatoria.";
    if (!descEn) nextErrors.descEn = "La descripción en inglés es obligatoria.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    const tags = form.tags.map((t) => t.trim()).filter(Boolean);

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
            }
          : l,
      );
      if (await persist(next)) {
        saved(`✓ "${name}" actualizado`);
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
    };
    if (await persist([...items, entry])) {
      saved(`✓ "${name}" agregado a ${catName(form.category)}`);
      resetForm();
    }
  };

  const remove = async (l: Link) => {
    if (!window.confirm(`¿Eliminar "${l.name}" de la lista?`)) return;
    if (await persist(items.filter((x) => x.id !== l.id)))
      saved(`✓ "${l.name}" eliminado`);
  };

  const startEdit = (l: Link) => {
    setEditingId(l.id);
    setErrors({});
    setFormError(null);
    setForm({
      name: l.name,
      url: l.url,
      category: l.category,
      tags: [...l.tags],
      descEs: l.desc.es,
      descEn: l.desc.en,
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const catCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of items)
      counts.set(l.category, (counts.get(l.category) ?? 0) + 1);
    return counts;
  }, [items]);

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    return items.filter((l) => {
      if (filterCat && l.category !== filterCat) return false;
      if (!s) return true;
      return `${l.name} ${l.url} ${l.tags.join(" ")} ${catName(l.category)} ${l.desc.es}`
        .toLowerCase()
        .includes(s);
    });
  }, [items, query, filterCat]);

  const chipCls = (active: boolean) =>
    `rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
      active
        ? "border-accent/50 bg-[var(--accent-soft)] text-accent"
        : "border-line text-muted hover:border-ink/30 hover:text-ink"
    }`;

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
              <Button type="button" variant="secondary" size="sm" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>

          {formError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-[#d06060]/50 bg-[#d06060]/10 px-4 py-2.5 text-[13px] text-[#e08a8a]"
            >
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                id="f-name"
                label="Nombre"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder="Magic UI"
                error={errors.name}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                id="f-url"
                label="URL"
                type="url"
                value={form.url}
                onChange={(e) => {
                  setForm({ ...form, url: e.target.value });
                  if (errors.url) setErrors({ ...errors, url: undefined });
                }}
                placeholder="https://magicui.design"
                error={errors.url}
              />
            </div>
            <Select
              id="f-cat"
              label="Categoría"
              value={form.category}
              onValueChange={(value) => setForm({ ...form, category: value })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
            <TagInput
              id="f-tags"
              label="Tags"
              placeholder="components, react, free"
              description="Enter o coma para agregar; Backspace elimina."
              value={form.tags}
              onValueChange={(tags) => setForm({ ...form, tags })}
            />
            <Textarea
              id="f-es"
              label="Descripción ES"
              rows={3}
              value={form.descEs}
              onChange={(e) => {
                setForm({ ...form, descEs: e.target.value });
                if (errors.descEs)
                  setErrors({ ...errors, descEs: undefined });
              }}
              placeholder="Componentes animados listos para copiar."
              error={errors.descEs}
            />
            <Textarea
              id="f-en"
              label="Descripción EN"
              rows={3}
              value={form.descEn}
              onChange={(e) => {
                setForm({ ...form, descEn: e.target.value });
                if (errors.descEn)
                  setErrors({ ...errors, descEn: undefined });
              }}
              placeholder="Animated components ready to copy."
              error={errors.descEn}
            />
          </div>

          <div className="mt-5 flex justify-end">
            <Button type="submit" variant="primary" loading={busy}>
              {editingId ? "Guardar cambios" : "+ Agregar"}
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[14px] font-semibold text-ink">Lista</h2>
            <span className="text-[11.5px] text-muted">
              {filtered.length !== items.length
                ? `${filtered.length} de ${items.length}`
                : `${items.length} enlaces`}
            </span>
          </div>
          <input
            className="h-8 w-44 rounded-md border border-line bg-surface-2 px-3 text-[12.5px] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent sm:w-56"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en la lista…"
            aria-label="Buscar en la lista"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-4 py-2.5 sm:px-5">
          <button
            type="button"
            onClick={() => setFilterCat(null)}
            className={chipCls(filterCat === null)}
          >
            Todas <span className="opacity-60">{items.length}</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() =>
                setFilterCat((cur) => (cur === c.id ? null : c.id))
              }
              className={chipCls(filterCat === c.id)}
            >
              {c.name} <span className="opacity-60">{catCounts.get(c.id) ?? 0}</span>
            </button>
          ))}
        </div>
        <ul>
          {filtered.map((l) => (
            <li
              key={l.id}
              className="group flex items-center gap-3 border-b border-line px-4 py-2.5 transition-colors last:border-b-0 hover:bg-surface-2 sm:px-5"
            >
              <Favicon url={l.url} host={domainOf(l.url)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-[13px] font-medium text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {l.name}
                  </a>
                  {l.featured && (
                    <span className="shrink-0 text-[10.5px] text-accent">
                      ★ destacado
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    className="shrink-0 -translate-x-1 text-[11px] text-muted opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                  >
                    ↗
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11.5px] text-muted">
                  <span className="shrink-0">{domainOf(l.url)}</span>
                  <span aria-hidden="true" className="opacity-40">
                    ·
                  </span>
                  <span className="min-w-0 truncate">{l.desc.es}</span>
                  {l.tags.length > 0 && (
                    <span className="ml-auto hidden shrink-0 items-center gap-1 md:flex">
                      {l.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-surface-2 px-1.5 py-px text-[10px] font-medium text-muted transition-colors group-hover:bg-surface"
                        >
                          {t}
                        </span>
                      ))}
                      {l.tags.length > 2 && (
                        <span className="text-[10px] text-muted/70">
                          +{l.tags.length - 2}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
              <span className="hidden shrink-0 rounded-md bg-surface-2 px-2 py-0.5 text-[10.5px] font-medium text-muted transition-colors group-hover:bg-surface sm:block">
                {catName(l.category)}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(l)}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => remove(l)}
                >
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-5 py-8 text-center text-[13px] text-muted">
              {query.trim()
                ? `Sin resultados para “${query}”`
                : "Sin recursos en esta categoría"}
            </li>
          )}
        </ul>
      </div>

      <div className="pointer-events-none fixed bottom-5 right-5 z-50">
        <div className="pointer-events-auto">
          <Toast
            open={toastOpen}
            onOpenChange={setToastOpen}
            title={savedTitle.current}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
