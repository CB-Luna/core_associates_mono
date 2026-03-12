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
import { Pause, Play, StopCircle, Percent, DollarSign, Calendar, Tag, ImageIcon } from 'lucide-react';

const estadoOptions = [
  { label: 'Activa', value: 'activa' },
  { label: 'Pausada', value: 'pausada' },
  { label: 'Finalizada', value: 'finalizada' },
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
      cell: ({ row }) => {
        const p = row.original;
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="h-3 w-3 text-gray-400" />
            {new Date(p.fechaInicio).toLocaleDateString('es-MX')} — {new Date(p.fechaFin).toLocaleDateString('es-MX')}
          </span>
        );
      },
    },
    {
      id: 'cupones',
      header: 'Cupones',
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
        return (
          <Badge variant={estado === 'activa' ? 'success' : estado === 'pausada' ? 'warning' : 'default'}>
            {estado}
          </Badge>
        );
      },
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => {
        const p = row.original;
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
            {p.estado !== 'finalizada' && (
              <button onClick={() => handleEstadoChange(p.id, 'finalizada')} title="Finalizar" className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100">
                <StopCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Promociones</h1>
      <p className="mt-1 text-sm text-gray-600">Gestión de promociones y descuentos</p>

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
          searchable
          searchPlaceholder="Buscar promocion..."
          columnToggle
          exportable
          exportFilename="promociones"
          striped
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
