'use client';

import { useEffect, useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { apiClient, apiImageUrl, type PaginatedResponse } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import type { Promocion } from '@/lib/api-types';
import { DataTable } from '@/components/ui/DataTable';
import { SearchToolbar } from '@/components/ui/SearchToolbar';
import { Badge } from '@/components/ui/Badge';
import { PromocionFormDialog } from '@/components/promociones/PromocionFormDialog';
import { usePermisos } from '@/lib/permisos';
import { formatFechaLegible } from '@/lib/utils';
import { Pause, Play, StopCircle, Percent, DollarSign, Calendar, Tag, ImageIcon } from 'lucide-react';

const estadoOptions = [
  { label: 'Activa', value: 'activa' },
  { label: 'Pausada', value: 'pausada' },
  { label: 'Finalizada', value: 'finalizada' },
  { label: 'Expirada', value: 'expirada' },
];

function PromocionThumbnail({ promocionId, imagenUrl }: { promocionId: string; imagenUrl: string | null }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!imagenUrl) return;
    apiImageUrl(`/promociones/${promocionId}/imagen`)
      .then(setSrc)
      .catch(() => {});
  }, [promocionId, imagenUrl]);

  if (src) {
    return (
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg">
        <img src={src} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
      {imagenUrl ? <ImageIcon className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
    </div>
  );
}

export default function PromocionesPage() {
  const { toast } = useToast();
  const { esProveedor } = usePermisos();
  const [data, setData] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPromocion, setEditPromocion] = useState<Promocion | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (estadoFilter) params.set('estado', estadoFilter);

      const endpoint = esProveedor ? '/promociones/mis-promociones' : '/promociones/admin/all';
      const res = await apiClient<PaginatedResponse<Promocion>>(`${endpoint}?${params}`);
      setData(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (err: any) {
      console.error(err);
      toast('error', 'Error', err.message || 'No se pudieron cargar las promociones');
    } finally {
      setLoading(false);
    }
  }, [page, search, estadoFilter, esProveedor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEstadoChange = async (id: string, estado: string) => {
    try {
      const endpoint = esProveedor
        ? `/promociones/mis-promociones/${id}/estado`
        : `/promociones/${id}/estado`;
      await apiClient(endpoint, {
        method: 'PUT',
        body: JSON.stringify({ estado }),
      });
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast('error', 'Error', err.message || 'No se pudo cambiar el estado');
    }
  };

  const handleRowClick = (row: Promocion) => {
    setEditPromocion(row);
    setDialogOpen(true);
  };

  const columns: ColumnDef<Promocion, any>[] = [
    {
      id: 'promocion',
      header: 'Promoción',
      meta: {
        exportValue: (p: Promocion) => `${p.titulo} — ${p.proveedor?.razonSocial || ''}`,
      },
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-3">
            <PromocionThumbnail promocionId={p.id} imagenUrl={p.imagenUrl} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">{p.titulo}</p>
              <p className="truncate text-[11px] text-gray-400">{p.proveedor?.razonSocial || '—'}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'descuento',
      header: 'Descuento',
      meta: {
        exportValue: (p: Promocion) =>
          p.tipoDescuento === 'porcentaje' ? `${p.valorDescuento}%` : `$${p.valorDescuento}`,
      },
      cell: ({ row }) => {
        const p = row.original;
        const isPct = p.tipoDescuento === 'porcentaje';
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${isPct ? 'bg-green-50 text-green-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {isPct ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
            {isPct ? `${p.valorDescuento}%` : `$${p.valorDescuento}`}
          </span>
        );
      },
    },
    {
      id: 'periodo',
      header: 'Periodo',
      meta: {
        exportValue: (p: Promocion) =>
          `${formatFechaLegible(p.fechaInicio)} — ${formatFechaLegible(p.fechaFin)}`,
      },
      cell: ({ row }) => {
        const p = row.original;
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="h-3 w-3 text-gray-400" />
            {formatFechaLegible(p.fechaInicio)} — {formatFechaLegible(p.fechaFin)}
          </span>
        );
      },
    },
    {
      id: 'cupones',
      header: 'Cupones',
      meta: {
        exportValue: (p: Promocion) => p._count?.cupones || 0,
      },
      cell: ({ row }) => {
        const count = row.original._count?.cupones || 0;
        return (
          <span className={`inline-flex min-w-[2rem] items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${count > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-400'}`}>
            {count}
          </span>
        );
      },
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ getValue }) => {
        const estado = getValue() as string;
        const variant = estado === 'activa' ? 'success' : estado === 'pausada' ? 'warning' : estado === 'expirada' ? 'danger' : 'default';
        return (
          <Badge variant={variant}>
            {estado}
          </Badge>
        );
      },
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const p = row.original;
        if (p.estado === 'expirada' || p.estado === 'finalizada') return null;
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {p.estado === 'activa' && (
              <button onClick={() => handleEstadoChange(p.id, 'pausada')} title="Pausar" className="rounded-lg p-2 text-amber-500 transition-colors hover:bg-amber-50">
                <Pause className="h-4 w-4" />
              </button>
            )}
            {p.estado === 'pausada' && (
              <button onClick={() => handleEstadoChange(p.id, 'activa')} title="Activar" className="rounded-lg p-2 text-green-500 transition-colors hover:bg-green-50">
                <Play className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => handleEstadoChange(p.id, 'finalizada')} title="Finalizar" className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100">
              <StopCircle className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Promociones</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Gestión de promociones y descuentos</p>

      <div className="mt-6">
        <SearchToolbar
          placeholder="Buscar por título o proveedor..."
          onSearch={(v) => { setSearch(v); setPage(1); }}
          filterOptions={estadoOptions}
          filterValue={estadoFilter}
          onFilterChange={(v) => { setEstadoFilter(v); setPage(1); }}
          actionLabel="Nueva promoción"
          onAction={() => { setEditPromocion(null); setDialogOpen(true); }}
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
          onRowClick={handleRowClick}
          columnToggle
          exportable
          exportFilename="promociones"
          striped
          cardRenderer={(p: Promocion) => {
            const isPct = p.tipoDescuento === 'porcentaje';
            return (
              <div className="flex items-start gap-3 px-4 py-3.5">
                <PromocionThumbnail promocionId={p.id} imagenUrl={p.imagenUrl} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{p.titulo}</p>
                      <p className="truncate text-[11px] text-gray-400">{p.proveedor?.razonSocial || '—'}</p>
                    </div>
                    <Badge variant={p.estado === 'activa' ? 'success' : p.estado === 'pausada' ? 'warning' : p.estado === 'expirada' ? 'danger' : 'default'}>{p.estado}</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${isPct ? 'bg-green-50 text-green-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {isPct ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                      {isPct ? `${p.valorDescuento}%` : `$${p.valorDescuento}`}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />{formatFechaLegible(p.fechaInicio)} — {formatFechaLegible(p.fechaFin)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {p.estado === 'activa' && (
                      <button onClick={() => handleEstadoChange(p.id, 'pausada')} title="Pausar" className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-amber-200 text-amber-500 hover:bg-amber-50"><Pause className="h-3.5 w-3.5" /></button>
                    )}
                    {p.estado === 'pausada' && (
                      <button onClick={() => handleEstadoChange(p.id, 'activa')} title="Activar" className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-green-200 text-green-500 hover:bg-green-50"><Play className="h-3.5 w-3.5" /></button>
                    )}
                    {p.estado !== 'finalizada' && p.estado !== 'expirada' && (
                      <button onClick={() => handleEstadoChange(p.id, 'finalizada')} title="Finalizar" className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50"><StopCircle className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                </div>
              </div>
            );
          }}
        />
      </div>

      <PromocionFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={fetchData}
        promocion={editPromocion}
      />
    </div>
  );
}
