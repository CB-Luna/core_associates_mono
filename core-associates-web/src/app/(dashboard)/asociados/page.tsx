'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import type { Asociado } from '@/lib/api-types';
import { DataTable } from '@/components/ui/DataTable';
import { SearchToolbar } from '@/components/ui/SearchToolbar';
import { StatsCards } from '@/components/ui/StatsCards';
import { Badge, estadoAsociadoVariant } from '@/components/ui/Badge';
import { exportToCSV, exportToPrintPDF } from '@/lib/export-utils';
import { Download, Printer, Eye } from 'lucide-react';

const estadoOptions = [
  { label: 'Activo', value: 'activo' },
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'Suspendido', value: 'suspendido' },
  { label: 'Baja', value: 'baja' },
  { label: 'Rechazado', value: 'rechazado' },
];

export default function AsociadosPage() {
  const router = useRouter();
  const [data, setData] = useState<Asociado[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  // Stats
  const [stats, setStats] = useState({ total: 0, activos: 0, pendientes: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (search) params.set('search', search);
      if (estadoFilter) params.set('estado', estadoFilter);

      const res = await apiClient<PaginatedResponse<Asociado>>(`/asociados?${params}`);
      setData(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, estadoFilter]);

  // Fetch stats once
  useEffect(() => {
    apiClient<any>('/reportes/dashboard')
      .then((m) => {
        setStats({
          total: m.asociados.total,
          activos: m.asociados.activos,
          pendientes: m.asociados.pendientes,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const columns: ColumnDef<Asociado, any>[] = [
    { accessorKey: 'idUnico', header: 'ID' },
    {
      id: 'nombre',
      header: 'Nombre',
      cell: ({ row }) => {
        const a = row.original;
        return `${a.nombre} ${a.apellidoPat} ${a.apellidoMat || ''}`.trim();
      },
    },
    { accessorKey: 'telefono', header: 'Teléfono' },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ getValue }) => {
        const estado = getValue() as string;
        return (
          <Badge variant={estadoAsociadoVariant[estado] || 'default'}>
            {estado}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'fechaRegistro',
      header: 'Registro',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('es-MX'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => router.push(`/asociados/${row.original.id}`)}
          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800"
        >
          <Eye className="h-4 w-4" />
          Ver
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asociados</h1>
          <p className="mt-1 text-sm text-gray-600">Gestión de conductores asociados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(data.map(a => ({ id: a.idUnico, nombre: `${a.nombre} ${a.apellidoPat}`, telefono: a.telefono, estado: a.estado, registro: new Date(a.fechaRegistro).toLocaleDateString('es-MX') })), [{ key: 'id', header: 'ID' }, { key: 'nombre', header: 'Nombre' }, { key: 'telefono', header: 'Teléfono' }, { key: 'estado', header: 'Estado' }, { key: 'registro', header: 'Registro' }], 'asociados')} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Download className="h-4 w-4" />CSV</button>
          <button onClick={() => exportToPrintPDF(data.map(a => ({ id: a.idUnico, nombre: `${a.nombre} ${a.apellidoPat}`, telefono: a.telefono, estado: a.estado, registro: new Date(a.fechaRegistro).toLocaleDateString('es-MX') })), [{ key: 'id', header: 'ID' }, { key: 'nombre', header: 'Nombre' }, { key: 'telefono', header: 'Teléfono' }, { key: 'estado', header: 'Estado' }, { key: 'registro', header: 'Registro' }], 'Reporte de Asociados')} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Printer className="h-4 w-4" />PDF</button>
        </div>
      </div>

      <StatsCards
        className="mt-6"
        cards={[
          { title: 'Total', value: stats.total, color: 'blue' },
          { title: 'Activos', value: stats.activos, color: 'green' },
          { title: 'Pendientes', value: stats.pendientes, color: 'orange' },
        ]}
      />

      <div className="mt-6">
        <SearchToolbar
          placeholder="Buscar por nombre, teléfono o ID..."
          onSearch={handleSearch}
          filterOptions={estadoOptions}
          filterValue={estadoFilter}
          onFilterChange={(v) => {
            setEstadoFilter(v);
            setPage(1);
          }}
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
