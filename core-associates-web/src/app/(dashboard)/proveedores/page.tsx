'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { apiClient, apiImageUrl, type PaginatedResponse } from '@/lib/api-client';
import type { Proveedor } from '@/lib/api-types';
import { DataTable } from '@/components/ui/DataTable';
import { SearchToolbar } from '@/components/ui/SearchToolbar';
import { Badge, estadoProveedorVariant, tipoProveedorVariant } from '@/components/ui/Badge';
import { ProveedorFormDialog } from '@/components/shared/ProveedorFormDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatFechaLegible } from '@/lib/utils';
import { ProveedorDetailModal } from '@/components/shared/ProveedorDetailModal';
import { usePermisos } from '@/lib/permisos';
import { Eye, Trash2, Store, Utensils, Wrench, Droplets, GraduationCap, Gavel, HelpCircle } from 'lucide-react';

const tipoIcon: Record<string, typeof Store> = {
  abogado: Gavel, comida: Utensils, taller: Wrench, lavado: Droplets, capacitacion: GraduationCap, otro: HelpCircle,
};
const tipoColorBg: Record<string, string> = {
  abogado: 'bg-blue-100 text-blue-600', comida: 'bg-amber-100 text-amber-600', taller: 'bg-purple-100 text-purple-600',
  lavado: 'bg-cyan-100 text-cyan-600', capacitacion: 'bg-green-100 text-green-600', otro: 'bg-gray-100 text-gray-600',
};

const tipoOptions = [
  { label: 'Abogado', value: 'abogado' },
  { label: 'Comida', value: 'comida' },
  { label: 'Taller', value: 'taller' },
  { label: 'Lavado', value: 'lavado' },
  { label: 'Capacitación', value: 'capacitacion' },
  { label: 'Otro', value: 'otro' },
];

function ProveedorThumb({ proveedor }: { proveedor: Proveedor }) {
  const [src, setSrc] = useState<string | null>(null);
  const TIcon = tipoIcon[proveedor.tipo] || Store;

  useEffect(() => {
    if (!proveedor.logotipoUrl) return;
    let revoked = false;
    apiImageUrl(`/proveedores/${proveedor.id}/logotipo`).then((url) => {
      if (!revoked) setSrc(url);
    }).catch(() => {});
    return () => { revoked = true; if (src) URL.revokeObjectURL(src); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proveedor.id, proveedor.logotipoUrl]);

  if (src) {
    return (
      <img src={src} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
    );
  }
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tipoColorBg[proveedor.tipo] || 'bg-gray-100 text-gray-600'}`}>
      <TIcon className="h-4 w-4" />
    </div>
  );
}

export default function ProveedoresPage() {
  const router = useRouter();
  const { puede } = usePermisos();
  const [data, setData] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Proveedor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (tipoFilter) params.set('tipo', tipoFilter);

      const res = await apiClient<PaginatedResponse<Proveedor>>(`/proveedores?${params}`);
      setData(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, tipoFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient(`/proveedores/${deleteTarget.id}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: 'inactivo' }),
      });
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al desactivar');
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<Proveedor, any>[] = [
    {
      id: 'proveedor',
      header: 'Proveedor',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-3">
            <ProveedorThumb proveedor={p} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">{p.razonSocial}</p>
              <p className="truncate font-mono text-[11px] text-gray-400">{p.idUnico}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ getValue }) => {
        const tipo = getValue() as string;
        return <Badge variant={tipoProveedorVariant[tipo] || 'default'}>{tipo}</Badge>;
      },
    },
    {
      accessorKey: 'contactoNombre',
      header: 'Contacto',
      cell: ({ getValue }) => {
        const name = getValue() as string;
        return name ? <span className="text-gray-700">{name}</span> : <span className="text-gray-300">—</span>;
      },
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ getValue }) => {
        const estado = getValue() as string;
        return <Badge variant={estadoProveedorVariant[estado] || 'default'}>{estado}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setDetailId(row.original.id); }}
            title="Ver detalle"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary-200 text-primary-500 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:border-primary-800 dark:hover:bg-primary-950/30"
          >
            <Eye className="h-4 w-4" />
          </button>
          {puede('eliminar:proveedores') && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.original); }}
              title="Eliminar"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Proveedores</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Gestión de proveedores y aliados</p>
      </div>

      <div className="mt-6">
        <SearchToolbar
          placeholder="Buscar por nombre o ID..."
          onSearch={(v) => { setSearch(v); setPage(1); }}
          filterOptions={tipoOptions}
          filterValue={tipoFilter}
          onFilterChange={(v) => { setTipoFilter(v); setPage(1); }}
          actionLabel="Nuevo Proveedor"
          onAction={() => setShowDialog(true)}
        />
      </div>

      <div className="mt-4">
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
          columnToggle
          exportable
          exportFilename="proveedores"
          striped
          cardRenderer={(p: Proveedor) => (
            <div className="flex items-start gap-3 px-4 py-3.5">
              <ProveedorThumb proveedor={p} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{p.razonSocial}</p>
                    <p className="font-mono text-[11px] text-gray-400">{p.idUnico}</p>
                  </div>
                  <Badge variant={estadoProveedorVariant[p.estado] || 'default'}>{p.estado}</Badge>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  <Badge variant={tipoProveedorVariant[p.tipo] || 'default'}>{p.tipo}</Badge>
                  {p.contactoNombre && <span className="text-gray-600">{p.contactoNombre}</span>}
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); setDetailId(p.id); }} className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-primary-200 text-primary-500 hover:bg-primary-50"><Eye className="h-3.5 w-3.5" /></button>
                  {puede('eliminar:proveedores') && (
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }} className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-200 text-red-400 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                  )}
                </div>
              </div>
            </div>
          )}
        />
      </div>

      {showDialog && (
        <ProveedorFormDialog
          onClose={() => setShowDialog(false)}
          onSaved={() => {
            setShowDialog(false);
            fetchData();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Desactivar proveedor"
        message={`¿Estás seguro de desactivar a "${deleteTarget?.razonSocial}"? El proveedor quedará inactivo y podrá reactivarse después.`}
        confirmLabel="Desactivar"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {detailId && (
        <ProveedorDetailModal proveedorId={detailId} onClose={() => setDetailId(null)} onUpdated={fetchData} />
      )}
    </div>
  );
}
