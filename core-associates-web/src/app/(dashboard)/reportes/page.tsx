'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { type ReporteAvanzado } from '@/lib/api-types';
import { StatsCards } from '@/components/ui/StatsCards';
import { Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from 'recharts';

const PIE_COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#8b5cf6', '#6b7280'];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      {label && <p className="mb-1 text-xs font-semibold text-gray-500">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-bold text-gray-900">{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltipCustom({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <div className="flex items-center gap-2 text-sm">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.payload.fill }} />
        <span className="text-gray-600">{d.name}:</span>
        <span className="font-bold text-gray-900">{d.value?.toLocaleString()}</span>
      </div>
    </div>
  );
}

function getDefaultDates() {
  const now = new Date();
  const desde = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10);
  const hasta = now.toISOString().slice(0, 10);
  return { desde, hasta };
}

export default function ReportesPage() {
  const defaults = getDefaultDates();
  const [desde, setDesde] = useState(defaults.desde);
  const [hasta, setHasta] = useState(defaults.hasta);
  const [reporte, setReporte] = useState<ReporteAvanzado | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReporte = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);
      const data = await apiClient<ReporteAvanzado>(`/reportes/avanzado?${params}`);
      setReporte(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    fetchReporte();
  }, [fetchReporte]);

  const exportCSV = () => {
    if (!reporte) return;
    const rows = reporte.trend.map((t) => `${t.mes},${t.asociados},${t.cupones},${t.casos}`);
    const csv = 'Mes,Asociados,Cupones,Casos\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${desde}-${hasta}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!reporte) {
    return <p className="py-10 text-center text-gray-500">No se pudieron cargar los reportes</p>;
  }

  const cuponesPie = Object.entries(reporte.cupones.porEstado)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  const casosPorTipoPie = Object.entries(reporte.casosLegales.porTipo)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  const asociadosPorEstado = Object.entries(reporte.asociados.porEstado)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes Avanzados</h1>
          <p className="mt-1 text-sm text-gray-600">Análisis detallado con filtros por período</p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      {/* Date Filters */}
      <div className="mt-4 flex flex-wrap items-end gap-4 rounded-xl border bg-white p-4 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-gray-500">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={fetchReporte}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Aplicar filtros
        </button>
      </div>

      {/* Stats */}
      <StatsCards
        className="mt-6"
        cards={[
          { title: 'Asociados registrados', value: reporte.asociados.registrados, color: 'blue' },
          { title: 'Cupones generados', value: reporte.cupones.generados, color: 'green' },
          { title: 'Casos abiertos', value: Object.values(reporte.casosLegales.porEstado).reduce((a, b) => a + b, 0), color: 'red' },
          { title: 'Docs procesados', value: Object.values(reporte.documentos.porEstado).reduce((a, b) => a + b, 0), color: 'purple' },
        ]}
      />

      {/* Trend Area Chart */}
      <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-gray-900">Tendencia mensual</h3>
        <p className="mb-4 text-xs text-gray-500">Evolución de registros, cupones y casos en el período</p>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={reporte.trend}>
            <defs>
              <linearGradient id="fillAsoc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillCup" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillCas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13 }} iconType="circle" iconSize={8} />
            <Area type="monotone" dataKey="asociados" stroke="#3b82f6" strokeWidth={2.5} fill="url(#fillAsoc)" name="Asociados" />
            <Area type="monotone" dataKey="cupones" stroke="#22c55e" strokeWidth={2.5} fill="url(#fillCup)" name="Cupones" />
            <Area type="monotone" dataKey="casos" stroke="#ef4444" strokeWidth={2.5} fill="url(#fillCas)" name="Casos" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cupones por Estado */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Cupones por estado</h3>
          <p className="mb-4 text-xs text-gray-500">Distribución actual</p>
          {cuponesPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={cuponesPie}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {cuponesPie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltipCustom />} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">Sin datos</p>
          )}
        </div>

        {/* Casos por Tipo */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Casos por tipo de percance</h3>
          <p className="mb-4 text-xs text-gray-500">Clasificación de incidentes</p>
          {casosPorTipoPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={casosPorTipoPie}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {casosPorTipoPie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltipCustom />} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">Sin datos</p>
          )}
        </div>

        {/* Asociados por Estado */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Asociados por estado</h3>
          <p className="mb-4 text-xs text-gray-500">Distribución de membresías</p>
          {asociadosPorEstado.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={asociadosPorEstado} layout="vertical" barSize={20}>
                <defs>
                  <linearGradient id="gradBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="value" name="Asociados" fill="url(#gradBar)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">Sin datos</p>
          )}
        </div>
      </div>

      {/* Documentos y Casos por Estado */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Documentos por estado</h3>
          <p className="mb-4 text-xs text-gray-500">Revisión de documentación KYC</p>
          <div className="space-y-2">
            {Object.entries(reporte.documentos.porEstado).map(([estado, count]) => {
              const total = Object.values(reporte.documentos.porEstado).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? (count / total) * 100 : 0;
              const barColors: Record<string, string> = { aprobado: 'bg-green-500', pendiente: 'bg-yellow-500', rechazado: 'bg-red-500' };
              return (
                <div key={estado} className="rounded-lg bg-gray-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize text-gray-700">{estado}</span>
                    <span className="text-sm font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className={`h-full rounded-full transition-all ${barColors[estado] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(reporte.documentos.porEstado).length === 0 && (
              <p className="py-4 text-center text-sm text-gray-400">Sin datos en el período</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Casos legales por estado</h3>
          <p className="mb-4 text-xs text-gray-500">Seguimiento de casos activos</p>
          <div className="space-y-2">
            {Object.entries(reporte.casosLegales.porEstado).map(([estado, count]) => {
              const total = Object.values(reporte.casosLegales.porEstado).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? (count / total) * 100 : 0;
              const barColors: Record<string, string> = { abierto: 'bg-blue-500', en_atencion: 'bg-yellow-500', escalado: 'bg-orange-500', resuelto: 'bg-green-500', cerrado: 'bg-gray-400', cancelado: 'bg-red-500' };
              return (
                <div key={estado} className="rounded-lg bg-gray-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize text-gray-700">{estado.replace('_', ' ')}</span>
                    <span className="text-sm font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className={`h-full rounded-full transition-all ${barColors[estado] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(reporte.casosLegales.porEstado).length === 0 && (
              <p className="py-4 text-center text-sm text-gray-400">Sin datos en el período</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
