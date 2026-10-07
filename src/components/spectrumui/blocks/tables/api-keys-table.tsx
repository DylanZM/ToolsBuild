'use client';

import * as React from 'react';
import { DataTable, type DataTableColumn } from '../../data-table';
import type { Link } from '../../../../data/links';
import { domainOf, faviconUrl } from '../../../../lib/url';
import { Badge } from '../../../arc/badge/badge';
import { Pencil, Star } from 'lucide-react';

type IconProps = React.SVGProps<SVGSVGElement>;

function IconDelete(props: IconProps) {
  return (
    <svg viewBox="0 24" fill="currentColor" aria-hidden="true" {...props}>
      <path
        transform="translate(3, 2)"
        d="M15.939,6.697 C16.138,6.697 16.319,6.784 16.462,6.931 C16.596,7.088 16.663,7.283 16.643,7.489 C16.643,7.557 16.11,14.297 15.806,17.134 C15.615,18.875 14.493,19.932 12.809,19.961 C11.515,19.99 10.25,20 9.004,20 C7.681,20 6.388,19.99 5.132,19.961 C3.505,19.922 2.382,18.846 2.201,17.134 C1.888,14.287 1.364,7.557 1.355,7.489 C1.345,7.283 1.411,7.088 1.545,6.931 C1.678,6.784 1.868,6.697 2.069,6.697 L15.939,6.697 Z M11.065,0 C11.949,0 12.738,0.617 12.967,1.497 L12.967,1.497 L13.13,2.227 C13.263,2.822 13.778,3.243 14.371,3.243 L14.371,3.243 L17.287,3.243 C17.676,3.243 18,3.566 18,3.977 L18,3.977 L18,4.357 C18,4.758 17.676,5.091 17.287,5.091 L17.287,5.091 L0.714,5.091 C0.324,5.091 0,4.758 0,4.357 L0,4.357 L0,3.977 C0,3.566 0.324,3.243 0.714,3.243 L0.714,3.243 L3.63,3.243 C4.222,3.243 4.737,2.822 4.871,2.228 L4.871,2.228 L5.023,1.546 C5.261,0.617 6.041,0 6.935,0 L6.935,0"
      />
    </svg>
  );
}

const Favicon: React.FC<{ url: string; host: string }> = ({ url, host }) => {
  const [broken, setBroken] = React.useState(false);
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

interface ApiKeysTableProps {
  rows: Link[];
  catName: (id: string) => string;
  onEdit: (l: Link) => void;
  onDelete: (ids: string[]) => void;
}

function buildColumns(catName: (id: string) => string): DataTableColumn<Link>[] {
  return [
    {
      id: 'name',
      header: 'Recurso',
      sortable: true,
      value: (row) => row.name,
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Favicon url={row.url} host={domainOf(row.url)} />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                title={row.url}
                className="truncate text-[13px] font-medium text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {row.name}
              </a>
              {row.featured && (
                <Badge
                  tone="warning"
                  size="sm"
                  icon={<Star size={11} fill="currentColor" strokeWidth={0} />}
                >
                  destacado
                </Badge>
              )}
            </div>
            <div className="truncate text-[11.5px] text-muted">
              {domainOf(row.url)}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'desc',
      header: 'Descripción',
      hideBelow: 'md',
      value: (row) => row.desc.es,
      cell: (row) => (
        <span className="block truncate text-[12.5px] text-muted">
          {row.desc.es}
        </span>
      ),
    },
    {
      id: 'category',
      header: 'Categoría',
      sortable: true,
      value: (row) => catName(row.category),
      cell: (row) => (
        <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 ring-1 ring-inset ring-neutral-500/15 dark:bg-neutral-100/10 dark:text-neutral-300 dark:ring-white/15">
          {catName(row.category)}
        </span>
      ),
    },
  ];
}

export function ApiKeysTable({
  rows,
  catName,
  onEdit,
  onDelete,
}: ApiKeysTableProps) {
  const columns = React.useMemo(() => buildColumns(catName), [catName]);

  return (
    <DataTable
      data={rows}
      columns={columns}
      rowId={(row) => row.id}
      rowLabel={(row) => row.name}
      caption="Todos los recursos del directorio."
      variant="panel"
      density="compact"
      title="Recursos"
      searchable
      searchPlaceholder="Buscar recursos…"
      searchText={(row) =>
        `${row.name} ${row.url} ${row.desc.es} ${row.tags.join(' ')} ${catName(row.category)}`
      }
      emptyState={
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Sin resultados
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Prueba con otra búsqueda.
          </p>
        </div>
      }
      onDelete={onDelete}
      rowActions={(row, { remove }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onEdit(row)}
            aria-label={`Editar ${row.name}`}
            className="grid size-8 place-items-center rounded-xl text-neutral-400 transition-colors duration-100 ease-out hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-950 focus-visible:outline-hidden dark:hover:bg-neutral-100/10 dark:hover:text-neutral-100 dark:focus-visible:ring-neutral-300"
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`¿Eliminar "${row.name}" de la lista?`))
                remove();
            }}
            aria-label={`Eliminar ${row.name}`}
            className="grid size-8 place-items-center rounded-xl text-neutral-400 transition-colors duration-100 ease-out hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-1 focus-visible:ring-neutral-950 focus-visible:outline-hidden dark:hover:bg-rose-400/10 dark:hover:text-rose-300 dark:focus-visible:ring-neutral-300"
          >
            <IconDelete className="size-4" />
          </button>
        </div>
      )}
    />
  );
}
