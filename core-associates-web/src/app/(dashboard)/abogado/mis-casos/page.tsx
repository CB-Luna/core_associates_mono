'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import { DataTable } from '@/components/ui/DataTable';
import { SearchToolbar } from '@/components/ui/SearchToolbar';
import { StatsCards } from '@/components/ui/StatsCards';
import { Badge } from '@/components/ui/Badge';
import { formatFechaLegible } from '@/lib/utils';
import { Eye, Car, Gavel, ShieldAlert, AlertTriangle, HelpCircle, CheckCircle, Clock } from 'lucide-react';
import type { CasoLegal, DashboardAbogadoMetrics } from '@/lib/api-types';
import { AsociadoPhoto } from '@/components/shared/AsociadoPhoto';

const tipoIcon: Record<string, typeof AlertTriangle> = {
  accidente: Car, infraccion: Gavel, robo: ShieldAlert, asalto: AlertTriangle, otro: HelpCircle,
};
const tipoColorBg: Record<string, string> = {
  accidente: 'bg-red-50 text-red-500', infraccion: 'bg-amber-50 text-amber-500',
  robo: 'bg-purple-50 text-purple-500', asalto: 'bg-orange-50 text-orange-500', otro: 'bg-gray-50 text-gray-400',
};
const estadoVariant: Record<string, any> = {
  abierto: 'danger', en_atencion: 'warning', escalado: 'secondary', resuelto: 'success',
  cerrado: 'default', cancelado: 'default',
};
const estadoLabel: Record<string, string> = {
  abierto: 'Abierto', en_atencion: 'En atención', escalado: 'Escalado',
  resuelto: 'Resuelto', cerrado: 'Cerrado', cancelado: 'Cancelado',
};
const prioridadVariant: Record<string, any> = {
  urgente: 'danger', alta: 'danger', media: 'warning', baja: 'info',
};

const estadoOptions = [
  { label: 'Abierto', value: 'abierto' },
  { label: 'En atención', value: 'en_atencion' },
  { label: 'Escalado', value: 'escalado' },
  { label: 'Resuelto', value: 'resuelto' },
  { label: 'Cerrado', value: 'cerrado' },
];

export default function MisCasosAbogadoPage() {
  const router = useRouter();
  const [data, setData] = useState<CasoLegal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [stats, setStats] = useState({ asignados: 0, enAtencion: 0, resueltos: 0, disponibles: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (estadoFilter) params.set('estado', estadoFilter);
      const res = await apiClient<PaginatedResponse<CasoLegal>>(`/casos-legales/abogado/mis-casos?${params}`);
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
    apiClient<DashboardAbogadoMetrics>('/casos-legales/abogado/dashboard')
      .then((m) => setStats({
        asignados: m.casos.asignados,
        enAtencion: m.casos.enAtencion,
        resueltos: m.casos.resueltos,
        disponibles: m.casos.disponibles,
      }))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: ColumnDef<CasoLegal, any>[] = [
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
            <div>
              <p className="text-sm font-semibold text-neutral-800">{c.codigo}</p>
              <p className="text-xs text-neutral-500 capitalize">{c.tipoPercance.replace('_', ' ')}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'asociado',
      header: 'Asociado',
      cell: ({ row }) => {
        const as = row.original.asociado;
        if (!as) return <span className="text-neutral-400 text-sm">—</span>;
        return (
          <div className="flex items-center gap-2">
            <AsociadoPhoto asociado={{ id: as.id ?? row.original.asociadoId, nombre: as.nombre, apellidoPat: as.apellidoPat, fotoUrl: as.fotoUrl }} size="sm" />
            <div>
              <p className="text-sm font-medium text-neutral-700">{as.nombre} {as.apellidoPat}</p>
              <p className="text-xs text-neutral-400">{as.idUnico}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'estado',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={estadoVariant[row.original.estado] ?? 'default'}>
          {estadoLabel[row.original.estado] ?? row.original.estado}
        </Badge>
      ),
    },
    {
      id: 'prioridad',
      header: 'Prioridad',
      cell: ({ row }) => (
        <Badge variant={prioridadVariant[row.original.prioridad] ?? 'default'}>
          {row.original.prioridad.charAt(0).toUpperCase() + row.original.prioridad.slice(1)}
        </Badge>
      ),
    },
    {
      id: 'fechaApertura',
      header: 'Apertura',
      cell: ({ row }) => (
        <span className="text-sm text-neutral-600">{formatFechaLegible(row.original.fechaApertura)}</span>
      ),
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => router.push(`/abogado/casos/${row.original.id}`)}
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800 font-medium"
        >
          <Eye className="h-4 w-4" />
          Ver
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Mis Casos</h1>
        <p className="text-sm text-neutral-500 mt-1">Casos legales asignados a ti</p>
      </div>

      <StatsCards
        cards={[
          { title: 'Asignados', value: stats.asignados, icon: Clock, color: 'blue' },
          { title: 'En Atención', value: stats.enAtencion, icon: AlertTriangle, color: 'orange' },
          { title: 'Resueltos', value: stats.resueltos, icon: CheckCircle, color: 'green' },
          { title: 'Disponibles', value: stats.disponibles, icon: HelpCircle, color: 'purple' },
        ]}
      />

      <SearchToolbar
        filterOptions={estadoOptions}
        filterValue={estadoFilter}
        onFilterChange={(v) => { setEstadoFilter(v); setPage(1); }}
        onSearch={() => {}}
      />

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        emptyMessage="No tienes casos asignados"
      />
    </div>
  );
}
