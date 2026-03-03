'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { StatsCards } from '@/components/ui/StatsCards';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const PIE_COLORS = ['#22c55e', '#eab308', '#ef4444', '#6b7280', '#8b5cf6'];

interface DashboardMetrics {
  asociados: { total: number; activos: number; pendientes: number; suspendidos: number; bajas: number; rechazados: number };
  proveedores: { total: number; activos: number };
  cupones: { delMes: number };
  casosLegales: { abiertos: number };
  documentos: { pendientes: number };
  trend: { mes: string; asociados: number; cupones: number }[];
}

export default function ReportesPage() {
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!metrics) {
    return <p className="py-10 text-center text-gray-500">No se pudieron cargar los reportes</p>;
  }

  const asociadosPie = [
    { name: 'Activos', value: metrics.asociados.activos },
    { name: 'Pendientes', value: metrics.asociados.pendientes },
    { name: 'Suspendidos', value: metrics.asociados.suspendidos },
    { name: 'Otros', value: metrics.asociados.total - metrics.asociados.activos - metrics.asociados.pendientes - metrics.asociados.suspendidos },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
      <p className="mt-1 text-sm text-gray-600">Métricas y tendencias del sistema</p>

      <StatsCards
        className="mt-6"
        cards={[
          { title: 'Asociados', value: metrics.asociados.total, color: 'blue' },
          { title: 'Proveedores', value: metrics.proveedores.total, color: 'purple' },
          { title: 'Cupones (mes)', value: metrics.cupones.delMes, color: 'green' },
          { title: 'Casos abiertos', value: metrics.casosLegales.abiertos, color: 'red' },
        ]}
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Trend Chart */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Registros mensuales (últimos 6 meses)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="asociados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asociados Pie */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Asociados por estado</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={asociadosPie}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {asociadosPie.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional stats */}
      <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Resumen adicional</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Docs pendientes</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.documentos.pendientes}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Asociados activos</p>
            <p className="text-2xl font-bold text-green-600">{metrics.asociados.activos}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Asociados pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{metrics.asociados.pendientes}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Casos abiertos</p>
            <p className="text-2xl font-bold text-red-600">{metrics.casosLegales.abiertos}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
