'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import { DataTable } from '@/components/ui/DataTable';
import { SearchToolbar } from '@/components/ui/SearchToolbar';
import { StatsCards } from '@/components/ui/StatsCards';
import { Badge } from '@/components/ui/Badge';
import { exportToCSV, exportToPrintPDF } from '@/lib/export-utils';
import { Download, Printer, Eye, ExternalLink, Car, Gavel, ShieldAlert, AlertTriangle, HelpCircle, Calendar } from 'lucide-react';

const tipoIcon: Record<string, typeof AlertTriangle> = {
  accidente: Car, infraccion: Gavel, robo: ShieldAlert, asalto: AlertTriangle, otro: HelpCircle,
};
const tipoColorBg: Record<string, string> = {
  accidente: 'bg-red-50 text-red-500', infraccion: 'bg-amber-50 text-amber-500', robo: 'bg-purple-50 text-purple-500',
  asalto: 'bg-orange-50 text-orange-500', otro: 'bg-gray-50 text-gray-400',
};

const estadoOptions = [
  { label: 'Abierto', value: 'abierto' },
  { label: 'En atención', value: 'en_atencion' },
  { label: 'Escalado', value: 'escalado' },
  { label: 'Resuelto', value: 'resuelto' },
  { label: 'Cerrado', value: 'cerrado' },
  { label: 'Cancelado', value: 'cancelado' },
];

const prioridadOptions = [
  { label: 'Alta', value: 'alta' },
  { label: 'Media', value: 'media' },
  { label: 'Baja', value: 'baja' },
];

const estadoVariant: Record<string, any> = {
  abierto: 'danger',
  en_atencion: 'warning',
  escalado: 'secondary',
  resuelto: 'success',
  cerrado: 'default',
  cancelado: 'default',
};

const prioridadVariant: Record<string, any> = {
  urgente: 'danger',
  alta: 'danger',
  media: 'warning',
  baja: 'info',
};

export default function CasosLegalesPage() {
  const router = useRouter();
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
      apiClient<PaginatedResponse<any>>('/casos-legales/admin/all?limit=1&estado=en_atencion'),
      apiClient<PaginatedResponse<any>>('/casos-legales/admin/all?limit=1&estado=resuelto'),
      apiClient<PaginatedResponse<any>>('/casos-legales/admin/all?limit=1'),
    ]).then(([abiertos, enAtencion, resueltos, all]) => {
      setStats({
        abiertos: abiertos.meta.total,
        enProceso: enAtencion.meta.total,
        resueltos: resueltos.meta.total,
        total: all.meta.total,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: ColumnDef<any, any>[] = [
    {
      id: 'caso',
      header: 'Caso',
      cell: ({ row }) => {
        const c = row.original;
        const TIcon = tipoIcon[c.tipoPercance] || HelpCircle;
        return (
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tipoColorBg[c.tipoPercance] || 'bg-gray-50 text-gray-400'}`}>
              <TIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-mono text-xs font-bold text-gray-700">{c.codigo}</p>
              <p className="truncate text-[11px] capitalize text-gray-400">{c.tipoPercance}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'asociado',
      header: 'Asociado',
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
      cell: ({ row }) => {
        const name = row.original.abogado?.razonSocial;
        return name ? <span className="text-gray-600">{name}</span> : <span className="text-xs text-gray-300">Sin asignar</span>;
      },
    },
    {
      accessorKey: 'fechaApertura',
      header: 'Apertura',
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="h-3 w-3 text-gray-400" />
          {new Date(getValue() as string).toLocaleDateString('es-MX')}
        </span>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ getValue }) => {
        const estado = getValue() as string;
        return <Badge variant={estadoVariant[estado] || 'default'}>{estado?.replace('_', ' ')}</Badge>;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/casos-legales/${row.original.id}`); }}
            title="Ver detalle"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); window.open(`/casos-legales/${row.original.id}`, '_blank'); }}
            title="Abrir en nueva pestaña"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Casos Legales</h1>
          <p className="mt-1 text-sm text-gray-600">Gestión de percances y asistencia legal</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(data.map((c: any) => ({ codigo: c.codigo, asociado: c.asociado ? `${c.asociado.nombre} ${c.asociado.apellidoPat}` : '', tipo: c.tipoPercance, prioridad: c.prioridad, estado: c.estado, apertura: new Date(c.fechaApertura).toLocaleDateString('es-MX') })), [{ key: 'codigo', header: 'Código' }, { key: 'asociado', header: 'Asociado' }, { key: 'tipo', header: 'Tipo' }, { key: 'prioridad', header: 'Prioridad' }, { key: 'estado', header: 'Estado' }, { key: 'apertura', header: 'Apertura' }], 'casos-legales')} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Download className="h-4 w-4" />CSV</button>
          <button onClick={() => exportToPrintPDF(data.map((c: any) => ({ codigo: c.codigo, asociado: c.asociado ? `${c.asociado.nombre} ${c.asociado.apellidoPat}` : '', tipo: c.tipoPercance, prioridad: c.prioridad, estado: c.estado, apertura: new Date(c.fechaApertura).toLocaleDateString('es-MX') })), [{ key: 'codigo', header: 'Código' }, { key: 'asociado', header: 'Asociado' }, { key: 'tipo', header: 'Tipo' }, { key: 'prioridad', header: 'Prioridad' }, { key: 'estado', header: 'Estado' }, { key: 'apertura', header: 'Apertura' }], 'Reporte de Casos Legales')} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Printer className="h-4 w-4" />PDF</button>
        </div>
      </div>

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
          onRowClick={(row: any) => router.push(`/casos-legales/${row.id}`)}
          searchable
          searchPlaceholder="Buscar caso..."
          columnToggle
          exportable
          exportFilename="casos-legales"
          striped
        />
      </div>
    </div>
  );
}
