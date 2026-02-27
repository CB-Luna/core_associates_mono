'use client';

import { useEffect, useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import { DataTable } from '@/components/ui/DataTable';
import { SearchToolbar } from '@/components/ui/SearchToolbar';
import { StatsCards } from '@/components/ui/StatsCards';
import { Badge } from '@/components/ui/Badge';

const estadoOptions = [
  { label: 'Abierto', value: 'abierto' },
  { label: 'En proceso', value: 'en_proceso' },
  { label: 'Resuelto', value: 'resuelto' },
  { label: 'Cerrado', value: 'cerrado' },
];

const prioridadOptions = [
  { label: 'Alta', value: 'alta' },
  { label: 'Media', value: 'media' },
  { label: 'Baja', value: 'baja' },
];

const estadoVariant: Record<string, any> = {
  abierto: 'danger',
  en_proceso: 'warning',
  resuelto: 'success',
  cerrado: 'default',
};

const prioridadVariant: Record<string, any> = {
  alta: 'danger',
  media: 'warning',
  baja: 'info',
};

export default function CasosLegalesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [prioridadFilter, setPrioridadFilter] = useState('');

  // Stats
  const [stats, setStats] = useState({ abiertos: 0, enProceso: 0, resueltos: 0, total: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (estadoFilter) params.set('estado', estadoFilter);
      if (prioridadFilter) params.set('prioridad', prioridadFilter);

      const res = await apiClient<PaginatedResponse<any>>(`/casos-legales/admin/all?${params}`);
      setData(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, estadoFilter, prioridadFilter]);

  useEffect(() => {
    Promise.all([
      apiClient<PaginatedResponse<any>>('/casos-legales/admin/all?limit=1&estado=abierto'),
      apiClient<PaginatedResponse<any>>('/casos-legales/admin/all?limit=1&estado=en_proceso'),
      apiClient<PaginatedResponse<any>>('/casos-legales/admin/all?limit=1&estado=resuelto'),
      apiClient<PaginatedResponse<any>>('/casos-legales/admin/all?limit=1'),
    ]).then(([abiertos, enProceso, resueltos, all]) => {
      setStats({
        abiertos: abiertos.meta.total,
        enProceso: enProceso.meta.total,
        resueltos: resueltos.meta.total,
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
    { accessorKey: 'tipoPercance', header: 'Tipo' },
    {
      accessorKey: 'prioridad',
      header: 'Prioridad',
      cell: ({ getValue }) => {
        const p = getValue() as string;
        return <Badge variant={prioridadVariant[p] || 'default'}>{p}</Badge>;
      },
    },
    {
      id: 'abogado',
      header: 'Abogado',
      cell: ({ row }) => row.original.abogado?.razonSocial || 'Sin asignar',
    },
    {
      id: 'notas',
      header: 'Notas',
      cell: ({ row }) => row.original._count?.notas || 0,
    },
    {
      accessorKey: 'fechaApertura',
      header: 'Apertura',
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
      <h1 className="text-2xl font-bold text-gray-900">Casos Legales</h1>
      <p className="mt-1 text-sm text-gray-600">Gestión de percances y asistencia legal</p>

      <StatsCards
        className="mt-6"
        cards={[
          { title: 'Total', value: stats.total, color: 'blue' },
          { title: 'Abiertos', value: stats.abiertos, color: 'red' },
          { title: 'En Proceso', value: stats.enProceso, color: 'orange' },
          { title: 'Resueltos', value: stats.resueltos, color: 'green' },
        ]}
      />

      <div className="mt-6 flex gap-3">
        <div className="flex-1">
          <SearchToolbar
            placeholder="Buscar..."
            onSearch={() => {}}
            filterOptions={estadoOptions}
            filterValue={estadoFilter}
            onFilterChange={(v) => { setEstadoFilter(v); setPage(1); }}
          />
        </div>
        <select
          value={prioridadFilter}
          onChange={(e) => { setPrioridadFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Todas las prioridades</option>
          {prioridadOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
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
