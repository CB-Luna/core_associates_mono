'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import type { Proveedor } from '@/lib/api-types';
import { DataTable } from '@/components/ui/DataTable';
import { SearchToolbar } from '@/components/ui/SearchToolbar';
import { Badge, estadoProveedorVariant, tipoProveedorVariant } from '@/components/ui/Badge';
import { ProveedorFormDialog } from '@/components/shared/ProveedorFormDialog';
import { exportToCSV, exportToPrintPDF } from '@/lib/export-utils';
import { Download, Printer, Eye } from 'lucide-react';

const tipoOptions = [
  { label: 'Abogado', value: 'abogado' },
  { label: 'Comida', value: 'comida' },
  { label: 'Taller', value: 'taller' },
  { label: 'Lavado', value: 'lavado' },
  { label: 'Capacitación', value: 'capacitacion' },
  { label: 'Otro', value: 'otro' },
];

export default function ProveedoresPage() {
  const router = useRouter();
  const [data, setData] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [showDialog, setShowDialog] = useState(false);

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

  const columns: ColumnDef<Proveedor, any>[] = [
    { accessorKey: 'idUnico', header: 'ID', cell: ({ getValue }) => (
      <span className="font-mono text-xs text-gray-400">{getValue() as string}</span>
    ) },
    { accessorKey: 'razonSocial', header: 'Razón Social', cell: ({ getValue }) => (
      <span className="font-medium text-gray-900">{getValue() as string}</span>
    ) },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ getValue }) => {
        const tipo = getValue() as string;
        return (
          <Badge variant={tipoProveedorVariant[tipo] || 'default'}>
            {tipo}
          </Badge>
        );
      },
    },
    { accessorKey: 'contactoNombre', header: 'Contacto' },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ getValue }) => {
        const estado = getValue() as string;
        return (
          <Badge variant={estadoProveedorVariant[estado] || 'default'}>
            {estado}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => router.push(`/proveedores/${row.original.id}`)}
          title="Ver detalle"
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="mt-1 text-sm text-gray-600">Gestión de proveedores y aliados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(data.map(p => ({ id: p.idUnico, razonSocial: p.razonSocial, tipo: p.tipo, contacto: p.contactoNombre || '', estado: p.estado })), [{ key: 'id', header: 'ID' }, { key: 'razonSocial', header: 'Razón Social' }, { key: 'tipo', header: 'Tipo' }, { key: 'contacto', header: 'Contacto' }, { key: 'estado', header: 'Estado' }], 'proveedores')} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Download className="h-4 w-4" />CSV</button>
          <button onClick={() => exportToPrintPDF(data.map(p => ({ id: p.idUnico, razonSocial: p.razonSocial, tipo: p.tipo, contacto: p.contactoNombre || '', estado: p.estado })), [{ key: 'id', header: 'ID' }, { key: 'razonSocial', header: 'Razón Social' }, { key: 'tipo', header: 'Tipo' }, { key: 'contacto', header: 'Contacto' }, { key: 'estado', header: 'Estado' }], 'Reporte de Proveedores')} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Printer className="h-4 w-4" />PDF</button>
        </div>
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
    </div>
  );
}
