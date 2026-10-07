import React, { useRef, useState } from "react";
import type { Link } from "../../data/links";
import "../arc/foundation.css";
import { Button } from "../arc/button/button";
import { Input } from "../arc/input/input";
import { Textarea } from "../arc/textarea/textarea";
import { Select } from "../arc/select/select";
import { TagInput } from "../arc/tag-input/tag-input";
import Toast from "../arc/toast/toast";
import { ApiKeysTable } from "../spectrumui/blocks/tables/api-keys-table";

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

  const deleteIds = async (ids: string[]) => {
    const first = items.find((x) => x.id === ids[0]);
    const next = items.filter((x) => !ids.includes(x.id));
    if (await persist(next)) {
      saved(
        ids.length === 1
          ? `✓ "${first?.name}" eliminado`
          : `✓ ${ids.length} recursos eliminados`,
      );
    }
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

  return (
    <div className="mx-auto max-w-[860px] px-5 py-9 sm:px-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">
            Panel de recursos
          </h1>
          <span className="text-[13px] text-muted">{items.length} enlaces</span>
        </div>
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

      <ApiKeysTable
        rows={items}
        catName={catName}
        onEdit={startEdit}
        onDelete={deleteIds}
      />

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
