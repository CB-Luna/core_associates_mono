'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { DashboardMetrics, DashboardProveedorMetrics } from '@/lib/api-types';
import { usePermisos } from '@/lib/permisos';
import { useToast } from '@/components/ui/Toast';
import { StatsCards } from '@/components/ui/StatsCards';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#6b7280', '#dc2626'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-gray-500">{label}</p>
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

function PieTooltip({ active, payload }: any) {
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

export default function DashboardPage() {
  const { toast } = useToast();
  const { esProveedor } = usePermisos();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [proveedorMetrics, setProveedorMetrics] = useState<DashboardProveedorMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = esProveedor ? '/reportes/dashboard-proveedor' : '/reportes/dashboard';
    if (esProveedor) {
      apiClient<DashboardProveedorMetrics>(endpoint)
        .then(setProveedorMetrics)
        .catch((err) => { console.error(err); toast('error', 'Error', 'No se pudieron cargar las métricas'); })
        .finally(() => setLoading(false));
    } else {
      apiClient<DashboardMetrics>(endpoint)
        .then(setMetrics)
        .catch((err) => { console.error(err); toast('error', 'Error', 'No se pudieron cargar las métricas'); })
        .finally(() => setLoading(false));
    }
  }, [esProveedor]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  if (esProveedor) {
    if (!proveedorMetrics) return <p className="text-gray-500">Error cargando métricas</p>;
    return <DashboardProveedor metrics={proveedorMetrics} />;
  }

  if (!metrics) {
    return <p className="text-gray-500">Error cargando métricas</p>;
  }

  const pieData = [
    { name: 'Activos', value: metrics.asociados.activos },
    { name: 'Pendientes', value: metrics.asociados.pendientes },
    { name: 'Suspendidos', value: metrics.asociados.suspendidos },
    { name: 'Bajas', value: metrics.asociados.bajas },
    { name: 'Rechazados', value: metrics.asociados.rechazados },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-600">Resumen general de la plataforma</p>

      <StatsCards
        className="mt-6"
        cards={[
          { title: 'Asociados Activos', value: metrics.asociados.activos, color: 'blue', subtitle: `${metrics.asociados.total} total` },
          { title: 'Proveedores Activos', value: metrics.proveedores.activos, color: 'green', subtitle: `${metrics.proveedores.total} total` },
          { title: 'Cupones del Mes', value: metrics.cupones.delMes, color: 'purple' },
          { title: 'Casos Abiertos', value: metrics.casosLegales.abiertos, color: 'orange' },
        ]}
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly trend bar chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Tendencia Mensual</h3>
          <p className="text-xs text-gray-500">Registros y cupones de los últimos 6 meses</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.trend} barGap={4}>
                <defs>
                  <linearGradient id="gradAsociados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="gradCupones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13 }} iconType="circle" iconSize={8} />
                <Bar dataKey="asociados" name="Asociados" fill="url(#gradAsociados)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="cupones" name="Cupones" fill="url(#gradCupones)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asociados by estado pie chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Asociados por Estado</h3>
          <p className="text-xs text-gray-500">Distribución actual</p>
          <div className="mt-4 h-72">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 13 }} iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Sin datos de asociados
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional info row */}
      <div className="mt-6">
        <StatsCards
          cards={[
            { title: 'Docs Pendientes', value: metrics.documentos.pendientes, color: 'red', subtitle: 'Requieren revisión' },
            { title: 'Asociados Pendientes', value: metrics.asociados.pendientes, color: 'orange', subtitle: 'Esperando aprobación' },
          ]}
        />
      </div>
    </div>
  );
}

// ── Dashboard para Proveedor ──

function DashboardProveedor({ metrics }: { metrics: DashboardProveedorMetrics }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-600">Resumen de tu negocio</p>

      <StatsCards
        className="mt-6"
        cards={[
          { title: 'Promociones Activas', value: metrics.promociones.activas, color: 'green', subtitle: `${metrics.promociones.total} total` },
          { title: 'Cupones Emitidos', value: metrics.cupones.totales, color: 'blue' },
          { title: 'Cupones Canjeados', value: metrics.cupones.canjeados, color: 'purple' },
          { title: 'Cupones del Mes', value: metrics.cupones.delMes, color: 'orange' },
        ]}
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly trend bar chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Tendencia Mensual</h3>
          <p className="text-xs text-gray-500">Cupones emitidos y canjeados de los últimos 6 meses</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.trend} barGap={4}>
                <defs>
                  <linearGradient id="gradEmitidos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="gradCanjeados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13 }} iconType="circle" iconSize={8} />
                <Bar dataKey="emitidos" name="Emitidos" fill="url(#gradEmitidos)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="canjeados" name="Canjeados" fill="url(#gradCanjeados)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Promociones summary */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Estado de Promociones</h3>
          <p className="text-xs text-gray-500">Distribución actual</p>
          <div className="mt-4 h-72">
            {metrics.promociones.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Activas', value: metrics.promociones.activas },
                      { name: 'Pausadas', value: metrics.promociones.pausadas },
                      { name: 'Finalizadas', value: metrics.promociones.finalizadas },
                    ].filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#6b7280" />
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 13 }} iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Sin promociones creadas
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cupones vencidos */}
      <div className="mt-6">
        <StatsCards
          cards={[
            { title: 'Cupones Vencidos', value: metrics.cupones.vencidos, color: 'red', subtitle: 'Expirados sin canjear' },
            { title: 'Promociones Pausadas', value: metrics.promociones.pausadas, color: 'orange', subtitle: 'Reactivar desde Promociones' },
          ]}
        />
      </div>
    </div>
  );
}
