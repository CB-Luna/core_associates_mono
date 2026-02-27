'use client';

import { useEffect, useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import { DataTable } from '@/components/ui/DataTable';
import { SearchToolbar } from '@/components/ui/SearchToolbar';
import { StatsCards } from '@/components/ui/StatsCards';
import { Badge } from '@/components/ui/Badge';

const estadoOptions = [
  { label: 'Activo', value: 'activo' },
  { label: 'Canjeado', value: 'canjeado' },
  { label: 'Vencido', value: 'vencido' },
  { label: 'Cancelado', value: 'cancelado' },
];

const estadoVariant: Record<string, any> = {
  activo: 'success',
  canjeado: 'info',
  vencido: 'default',
  cancelado: 'danger',
};

export default function CuponesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [estadoFilter, setEstadoFilter] = useState('');

  // Stats
  const [stats, setStats] = useState({ activos: 0, canjeados: 0, vencidos: 0, total: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (estadoFilter) params.set('estado', estadoFilter);

      const res = await apiClient<PaginatedResponse<any>>(`/cupones/admin/all?${params}`);
      setData(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, estadoFilter]);

  useEffect(() => {
    // Fetch stats per estado
    Promise.all([
      apiClient<PaginatedResponse<any>>('/cupones/admin/all?limit=1&estado=activo'),
      apiClient<PaginatedResponse<any>>('/cupones/admin/all?limit=1&estado=canjeado'),
      apiClient<PaginatedResponse<any>>('/cupones/admin/all?limit=1&estado=vencido'),
      apiClient<PaginatedResponse<any>>('/cupones/admin/all?limit=1'),
    ]).then(([activos, canjeados, vencidos, all]) => {
      setStats({
        activos: activos.meta.total,
        canjeados: canjeados.meta.total,
        vencidos: vencidos.meta.total,
        total: all.meta.total,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: ColumnDef<any, any>[] = [
    { accessorKey: 'codigo', header: 'Código' },
    {
      id: 'asociado',
      header: 'Asociado',
      cell: ({ row }) => {
        const a = row.original.asociado;
        return a ? `${a.nombre} ${a.apellidoPat}` : '—';
      },
    },
    {
      id: 'promocion',
      header: 'Promoción',
      cell: ({ row }) => row.original.promocion?.titulo || '—',
    },
    {
      id: 'proveedor',
      header: 'Proveedor',
      cell: ({ row }) => row.original.proveedor?.razonSocial || '—',
    },
    {
      accessorKey: 'fechaVencimiento',
      header: 'Vencimiento',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('es-MX'),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ getValue }) => {
        const estado = getValue() as string;
        return <Badge variant={estadoVariant[estado] || 'default'}>{estado}</Badge>;
      },
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Cupones</h1>
      <p className="mt-1 text-sm text-gray-600">Seguimiento de cupones generados</p>

      <StatsCards
        className="mt-6"
        cards={[
          { title: 'Total', value: stats.total, color: 'blue' },
          { title: 'Activos', value: stats.activos, color: 'green' },
          { title: 'Canjeados', value: stats.canjeados, color: 'purple' },
          { title: 'Vencidos', value: stats.vencidos, color: 'gray' },
        ]}
      />

      <div className="mt-6">
        <SearchToolbar
          placeholder="Buscar..."
          onSearch={() => {}}
          filterOptions={estadoOptions}
          filterValue={estadoFilter}
          onFilterChange={(v) => { setEstadoFilter(v); setPage(1); }}
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
        />
      </div>
    </div>
  );
}
