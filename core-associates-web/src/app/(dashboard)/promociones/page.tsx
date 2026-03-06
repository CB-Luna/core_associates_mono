'use client';

import { useEffect, useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import type { Promocion } from '@/lib/api-types';
import { DataTable } from '@/components/ui/DataTable';
import { SearchToolbar } from '@/components/ui/SearchToolbar';
import { Badge } from '@/components/ui/Badge';
import { PromocionFormDialog } from '@/components/promociones/PromocionFormDialog';
import { Pause, Play, StopCircle } from 'lucide-react';

const estadoOptions = [
  { label: 'Activa', value: 'activa' },
  { label: 'Pausada', value: 'pausada' },
  { label: 'Finalizada', value: 'finalizada' },
];

export default function PromocionesPage() {
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

      const res = await apiClient<PaginatedResponse<Promocion>>(`/promociones/admin/all?${params}`);
      setData(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, estadoFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEstadoChange = async (id: string, estado: string) => {
    try {
      await apiClient(`/promociones/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRowClick = (row: Promocion) => {
    setEditPromocion(row);
    setDialogOpen(true);
  };

  const columns: ColumnDef<Promocion, any>[] = [
    { accessorKey: 'titulo', header: 'Título', cell: ({ getValue }) => (
      <span className="font-medium text-gray-900">{getValue() as string}</span>
    ) },
    {
      id: 'proveedor',
      header: 'Proveedor',
      cell: ({ row }) => row.original.proveedor?.razonSocial || '—',
    },
    {
      id: 'descuento',
      header: 'Descuento',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <span className="font-semibold text-green-700">
            {p.tipoDescuento === 'porcentaje' ? `${p.valorDescuento}%` : `$${p.valorDescuento}`}
          </span>
        );
      },
    },
    {
      id: 'periodo',
      header: 'Periodo',
      cell: ({ row }) => {
        const p = row.original;
        return `${new Date(p.fechaInicio).toLocaleDateString('es-MX')} - ${new Date(p.fechaFin).toLocaleDateString('es-MX')}`;
      },
    },
    {
      id: 'cupones',
      header: 'Cupones',
      cell: ({ row }) => row.original._count?.cupones || 0,
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
              <button
                onClick={() => handleEstadoChange(p.id, 'pausada')}
                title="Pausar"
                className="rounded-lg p-1.5 text-amber-500 transition-colors hover:bg-amber-50"
              >
                <Pause className="h-4 w-4" />
              </button>
            )}
            {p.estado === 'pausada' && (
              <button
                onClick={() => handleEstadoChange(p.id, 'activa')}
                title="Activar"
                className="rounded-lg p-1.5 text-green-500 transition-colors hover:bg-green-50"
              >
                <Play className="h-4 w-4" />
              </button>
            )}
            {p.estado !== 'finalizada' && (
              <button
                onClick={() => handleEstadoChange(p.id, 'finalizada')}
                title="Finalizar"
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100"
              >
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
