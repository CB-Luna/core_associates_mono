'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { DashboardMetrics } from '@/lib/api-types';
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

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<DashboardMetrics>('/reportes/dashboard')
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
      </div>
    );
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
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900">Tendencia Mensual</h3>
          <p className="text-xs text-gray-500">Registros y cupones de los últimos 6 meses</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="asociados" name="Asociados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cupones" name="Cupones" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asociados by estado pie chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900">Asociados por Estado</h3>
          <p className="text-xs text-gray-500">Distribución actual</p>
          <div className="mt-4 h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
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
