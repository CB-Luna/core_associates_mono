'use client';

import { useEffect, useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import { usePermisos } from '@/lib/permisos';
import { useToast } from '@/components/ui/Toast';
import { DataTable } from '@/components/ui/DataTable';
import { SearchToolbar } from '@/components/ui/SearchToolbar';
import { StatsCards } from '@/components/ui/StatsCards';
import { Badge } from '@/components/ui/Badge';
import { formatFechaLegible, formatFechaConHora } from '@/lib/utils';
import { X, QrCode, Eye, Ticket, Calendar } from 'lucide-react';
import { QRDisplay } from '@/components/ui/QRDisplay';
import type { Proveedor } from '@/lib/api-types';

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
  const { toast } = useToast();
  const { esProveedor } = usePermisos();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCupon, setSelectedCupon] = useState<any | null>(null);

  // Advanced filters
  const [proveedorFilter, setProveedorFilter] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // Stats
  const [stats, setStats] = useState({ activos: 0, canjeados: 0, vencidos: 0, total: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (estadoFilter) params.set('estado', estadoFilter);
      if (search) params.set('search', search);
      if (!esProveedor && proveedorFilter) params.set('proveedorId', proveedorFilter);
      if (fechaDesde) params.set('desde', fechaDesde);
      if (fechaHasta) params.set('hasta', fechaHasta);

      const endpoint = esProveedor ? '/cupones/mis-cupones-proveedor' : '/cupones/admin/all';
      const res = await apiClient<PaginatedResponse<any>>(`${endpoint}?${params}`);
      setData(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (err: any) {
      console.error(err);
      toast('error', 'Error', err.message || 'No se pudieron cargar los cupones');
    } finally {
      setLoading(false);
    }
  }, [page, estadoFilter, search, proveedorFilter, fechaDesde, fechaHasta, esProveedor]);

  useEffect(() => {
    // Fetch stats
    const statsEndpoint = esProveedor ? '/cupones/estadisticas-proveedor' : '/cupones/estadisticas';
    apiClient<{ activos: number; canjeados: number; vencidos: number; total: number }>(statsEndpoint)
      .then(setStats)
      .catch(() => {});

    // Fetch proveedores for filter (only admin/operador)
    if (!esProveedor) {
      apiClient<PaginatedResponse<Proveedor>>('/proveedores?limit=100')
        .then((res) => setProveedores(res.data))
        .catch(() => {});
    }
  }, [esProveedor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: ColumnDef<any, any>[] = [
    {
      id: 'cupon',
      header: 'Cupón',
      meta: {
        exportValue: (c: any) => `${c.codigo} — ${c.promocion?.titulo || ''}`,
      },
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              c.estado === 'activo' ? 'bg-green-50 text-green-600' :
              c.estado === 'canjeado' ? 'bg-blue-50 text-blue-600' :
              'bg-gray-50 text-gray-400'
            }`}>
              <Ticket className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-mono text-xs font-bold text-gray-700">{c.codigo}</p>
              <p className="truncate text-[11px] text-gray-400">{c.promocion?.titulo || '—'}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'asociado',
      header: 'Asociado',
      meta: {
        exportValue: (c: any) => c.asociado ? `${c.asociado.nombre} ${c.asociado.apellidoPat}` : '',
      },
      cell: ({ row }) => {
        const a = row.original.asociado;
        if (!a) return <span className="text-gray-300">—</span>;
        const initials = `${a.nombre?.[0] || ''}${a.apellidoPat?.[0] || ''}`.toUpperCase();
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
              {initials}
            </div>
            <span className="truncate font-medium text-gray-800">{`${a.nombre} ${a.apellidoPat}`}</span>
          </div>
        );
      },
    },
    ...(!esProveedor ? [{
      id: 'proveedor',
      header: 'Proveedor',
      meta: {
        exportValue: (c: any) => c.proveedor?.razonSocial || '',
      },
      cell: ({ row }: { row: any }) => {
        const name = row.original.proveedor?.razonSocial;
        return name ? <span className="text-gray-600">{name}</span> : <span className="text-gray-300">—</span>;
      },
    } as ColumnDef<any, any>] : []),
    {
      accessorKey: 'fechaVencimiento',
      header: 'Vencimiento',
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="h-3 w-3 text-gray-400" />
          {formatFechaLegible(getValue() as string)}
        </span>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ getValue }) => {
        const estado = getValue() as string;
        return <Badge variant={estadoVariant[estado] || 'default'}>{estado}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedCupon(row.original); }}
          title="Ver detalle"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary-200 text-primary-500 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:border-primary-800 dark:hover:bg-primary-950/30"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cupones</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{esProveedor ? 'Cupones generados con tus promociones' : 'Seguimiento de cupones generados'}</p>
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

        {/* Advanced filters row */}
        <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          {!esProveedor && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Proveedor</label>
            <select
              value={proveedorFilter}
              onChange={(e) => { setProveedorFilter(e.target.value); setPage(1); }}
              className="mt-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="">Todos</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.razonSocial}</option>
              ))}
            </select>
          </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
              className="mt-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
              className="mt-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
          {(proveedorFilter || fechaDesde || fechaHasta) && (
            <button
              onClick={() => { setProveedorFilter(''); setFechaDesde(''); setFechaHasta(''); setPage(1); }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Limpiar filtros
            </button>
          )}
        </div>
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
          columnToggle
          exportable
          exportFilename="cupones"
          striped
          cardRenderer={(c: any) => {
            const asociado = c.asociado;
            return (
              <div className="flex items-start gap-3 px-4 py-3.5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  c.estado === 'activo' ? 'bg-green-50 text-green-600' :
                  c.estado === 'canjeado' ? 'bg-blue-50 text-blue-600' :
                  'bg-gray-50 text-gray-400'
                }`}>
                  <Ticket className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-bold text-gray-700 dark:text-gray-200">{c.codigo}</p>
                      <p className="truncate text-[11px] text-gray-400">{c.promocion?.titulo || '—'}</p>
                    </div>
                    <Badge variant={estadoVariant[c.estado] || 'default'}>{c.estado}</Badge>
                  </div>
                  {asociado && (
                    <p className="mt-1 truncate text-xs text-gray-600">{asociado.nombre} {asociado.apellidoPat}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />Vence: {formatFechaLegible(c.fechaVencimiento)}</span>
                  </div>
                  <div className="mt-2">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedCupon(c); }} className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-primary-200 text-primary-500 hover:bg-primary-50"><Eye className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          }}
        />
      </div>

      {/* Detail Modal */}
      {selectedCupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedCupon(null)}>
          <div className="relative mx-4 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedCupon(null)} className="absolute right-4 top-4 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Detalle del Cupón</h2>
            <div className="mt-4 space-y-3">
              <DetailRow label="Código" value={selectedCupon.codigo} />
              <DetailRow label="Estado" value={<Badge variant={estadoVariant[selectedCupon.estado] || 'default'}>{selectedCupon.estado}</Badge>} />
              <DetailRow label="Asociado" value={selectedCupon.asociado ? `${selectedCupon.asociado.nombre} ${selectedCupon.asociado.apellidoPat}` : '—'} />
              {selectedCupon.asociado?.idUnico && <DetailRow label="ID Asociado" value={selectedCupon.asociado.idUnico} />}
              <DetailRow label="Promoción" value={selectedCupon.promocion?.titulo || '—'} />
              <DetailRow label="Proveedor" value={selectedCupon.proveedor?.razonSocial || '—'} />
              <DetailRow label="Fecha Generación" value={selectedCupon.fechaGeneracion ? formatFechaConHora(selectedCupon.fechaGeneracion) : '—'} />
              <DetailRow label="Fecha Vencimiento" value={selectedCupon.fechaVencimiento ? formatFechaConHora(selectedCupon.fechaVencimiento) : '—'} />
              {selectedCupon.fechaCanje && <DetailRow label="Fecha Canje" value={formatFechaConHora(selectedCupon.fechaCanje)} />}
              {selectedCupon.qrPayload && (
                <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 py-4">
                  <QRDisplay value={selectedCupon.qrPayload} size={160} />
                  <span className="mt-1 max-w-full break-all px-4 text-center font-mono text-xs text-gray-400">{selectedCupon.qrPayload}</span>
                </div>
              )}
              {!selectedCupon.qrPayload && selectedCupon.codigo && (
                <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 py-4">
                  <QRDisplay value={selectedCupon.codigo} size={160} />
                  <span className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    <QrCode className="h-3.5 w-3.5" /> Código del cupón
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm text-gray-900 dark:text-gray-200">{value}</span>
    </div>
  );
}
