'use client';

import { useEffect, useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import { DataTable } from '@/components/ui/DataTable';
import { SearchToolbar } from '@/components/ui/SearchToolbar';
import { StatsCards } from '@/components/ui/StatsCards';
import { Badge } from '@/components/ui/Badge';
import { exportToCSV, exportToPrintPDF } from '@/lib/export-utils';
import { Download, Printer, X } from 'lucide-react';

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
  const [search, setSearch] = useState('');
  const [selectedCupon, setSelectedCupon] = useState<any | null>(null);

  // Stats
  const [stats, setStats] = useState({ activos: 0, canjeados: 0, vencidos: 0, total: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (estadoFilter) params.set('estado', estadoFilter);
      if (search) params.set('search', search);

      const res = await apiClient<PaginatedResponse<any>>(`/cupones/admin/all?${params}`);
      setData(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, estadoFilter, search]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cupones</h1>
          <p className="mt-1 text-sm text-gray-600">Seguimiento de cupones generados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(data.map((c: any) => ({ codigo: c.codigo, asociado: c.asociado ? `${c.asociado.nombre} ${c.asociado.apellidoPat}` : '', promocion: c.promocion?.titulo || '', proveedor: c.proveedor?.razonSocial || '', vencimiento: new Date(c.fechaVencimiento).toLocaleDateString('es-MX'), estado: c.estado })), [{ key: 'codigo', header: 'Código' }, { key: 'asociado', header: 'Asociado' }, { key: 'promocion', header: 'Promoción' }, { key: 'proveedor', header: 'Proveedor' }, { key: 'vencimiento', header: 'Vencimiento' }, { key: 'estado', header: 'Estado' }], 'cupones')} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Download className="h-4 w-4" />CSV</button>
          <button onClick={() => exportToPrintPDF(data.map((c: any) => ({ codigo: c.codigo, asociado: c.asociado ? `${c.asociado.nombre} ${c.asociado.apellidoPat}` : '', promocion: c.promocion?.titulo || '', proveedor: c.proveedor?.razonSocial || '', vencimiento: new Date(c.fechaVencimiento).toLocaleDateString('es-MX'), estado: c.estado })), [{ key: 'codigo', header: 'Código' }, { key: 'asociado', header: 'Asociado' }, { key: 'promocion', header: 'Promoción' }, { key: 'proveedor', header: 'Proveedor' }, { key: 'vencimiento', header: 'Vencimiento' }, { key: 'estado', header: 'Estado' }], 'Reporte de Cupones')} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Printer className="h-4 w-4" />PDF</button>
        </div>
      </div>

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
          placeholder="Buscar por código, asociado, promoción..."
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
          onRowClick={(row) => setSelectedCupon(row)}
        />
      </div>

      {/* Detail Modal */}
      {selectedCupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedCupon(null)}>
          <div className="relative mx-4 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedCupon(null)} className="absolute right-4 top-4 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">Detalle del Cupón</h2>
            <div className="mt-4 space-y-3">
              <DetailRow label="Código" value={selectedCupon.codigo} />
              <DetailRow label="Estado" value={<Badge variant={estadoVariant[selectedCupon.estado] || 'default'}>{selectedCupon.estado}</Badge>} />
              <DetailRow label="Asociado" value={selectedCupon.asociado ? `${selectedCupon.asociado.nombre} ${selectedCupon.asociado.apellidoPat}` : '—'} />
              {selectedCupon.asociado?.idUnico && <DetailRow label="ID Asociado" value={selectedCupon.asociado.idUnico} />}
              <DetailRow label="Promoción" value={selectedCupon.promocion?.titulo || '—'} />
              <DetailRow label="Proveedor" value={selectedCupon.proveedor?.razonSocial || '—'} />
              <DetailRow label="Fecha Generación" value={selectedCupon.fechaGeneracion ? new Date(selectedCupon.fechaGeneracion).toLocaleString('es-MX') : '—'} />
              <DetailRow label="Fecha Vencimiento" value={selectedCupon.fechaVencimiento ? new Date(selectedCupon.fechaVencimiento).toLocaleString('es-MX') : '—'} />
              {selectedCupon.fechaCanje && <DetailRow label="Fecha Canje" value={new Date(selectedCupon.fechaCanje).toLocaleString('es-MX')} />}
              {selectedCupon.qrPayload && <DetailRow label="QR Payload" value={<span className="break-all font-mono text-xs">{selectedCupon.qrPayload}</span>} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between border-b border-gray-100 pb-2">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
