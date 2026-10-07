import React, { useMemo, useState } from "react";
import type { Link } from "../../data/links";
import { domainOf, faviconUrl } from "../../lib/url";
import "../arc/foundation.css";
import { SearchField } from "../arc/search-field/search-field";
import { Badge } from "../arc/badge/badge";
import { EmptyState } from "../arc/empty-state/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Pencil, Trash2 } from "lucide-react";

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

interface TableResourcesProps {
  items: Link[];
  categories: { id: string; name: string }[];
  onEdit: (l: Link) => void;
  onDelete: (l: Link) => void;
}

const TableResources: React.FC<TableResourcesProps> = ({
  items,
  categories,
  onEdit,
  onDelete,
}) => {
  const [query, setQuery] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);

  const catName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? id;

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

  return (
    <>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[14px] font-semibold text-ink">Lista</h2>
          <span className="text-[11.5px] text-muted">
            {filtered.length !== items.length
              ? `${filtered.length} de ${items.length}`
              : `${items.length} enlaces`}
          </span>
        </div>
        <div className="w-full min-w-0 max-w-[260px]">
          <SearchField
            label="Buscar"
            placeholder="Nombre, dominio o descripción"
            value={query}
            onValueChange={setQuery}
          />
        </div>
      </div>
      <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
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
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[32%] pl-5">Recurso</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-[150px]">Categoría</TableHead>
              <TableHead className="w-[110px] pr-5 text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="p-0">
                  <EmptyState
                    label="Sin resultados"
                    title="Sin resultados"
                    description={
                      query.trim()
                        ? `Nada coincide con “${query}”.`
                        : "Sin recursos en esta categoría."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="pl-5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Favicon url={l.url} host={domainOf(l.url)} />
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={l.url}
                            className="truncate text-[13px] font-medium text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                          >
                            {l.name}
                          </a>
                        </div>
                        <div className="truncate text-[11.5px] text-muted">
                          {domainOf(l.url)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="block truncate text-[12.5px] text-muted">
                      {l.desc.es}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge tone="neutral" size="sm">
                      {catName(l.category)}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        aria-label={`Editar ${l.name}`}
                        data-tooltip="Editar"
                        onClick={() => onEdit(l)}
                        className="grid size-8 place-items-center rounded-md text-muted transition-colors hdr-hover hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Eliminar ${l.name}`}
                        data-tooltip="Eliminar"
                        onClick={() => onDelete(l)}
                        className="grid size-8 place-items-center rounded-md text-rose-600 transition-colors hdr-hover hover:bg-surface-2 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:text-rose-400 dark:hover:text-rose-300"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default TableResources;
