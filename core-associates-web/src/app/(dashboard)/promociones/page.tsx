'use client';

import { useEffect, useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import type { Promocion } from '@/lib/api-types';
import { DataTable } from '@/components/ui/DataTable';
import { SearchToolbar } from '@/components/ui/SearchToolbar';
import { Badge } from '@/components/ui/Badge';

const estadoOptions = [
  { label: 'Activa', value: 'activa' },
  { label: 'Pausada', value: 'pausada' },
  { label: 'Finalizada', value: 'finalizada' },
];

export default function PromocionesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (estadoFilter) params.set('estado', estadoFilter);

      const res = await apiClient<PaginatedResponse<any>>(`/promociones/admin/all?${params}`);
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

  const columns: ColumnDef<any, any>[] = [
    { accessorKey: 'titulo', header: 'Título' },
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
        return p.tipoDescuento === 'porcentaje'
          ? `${p.valorDescuento}%`
          : `$${p.valorDescuento}`;
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
