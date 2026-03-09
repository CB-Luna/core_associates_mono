'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { type ReporteAvanzado } from '@/lib/api-types';
import { StatsCards } from '@/components/ui/StatsCards';
import { Download, FileText } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from 'recharts';
import { Trophy, Store } from 'lucide-react';
import { usePermisos } from '@/lib/permisos';

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
  const { puede } = usePermisos();
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

  const exportPDF = async () => {
    if (!reporte) return;
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 18;

    // ── Encabezado ──
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text('Reporte Ejecutivo Mensual', margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Período: ${desde} — ${hasta}  |  Generado: ${new Date().toLocaleString('es-MX')}`, margin, y);
    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // ── Resumen General ──
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('Resumen General', margin, y);
    y += 6;
    const resumenData = [
      ['Asociados registrados', String(reporte.asociados.registrados)],
      ['Cupones generados', String(reporte.cupones.generados)],
      ['Casos legales', String(Object.values(reporte.casosLegales.porEstado).reduce((a, b) => a + b, 0))],
      ['Documentos procesados', String(Object.values(reporte.documentos.porEstado).reduce((a, b) => a + b, 0))],
    ];
    (doc as any).autoTable({
      startY: y,
      body: resumenData,
      theme: 'plain',
      bodyStyles: { fontSize: 10, textColor: [30, 41, 59] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { halign: 'left' } },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Tendencia Mensual ──
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('Tendencia Mensual', margin, y);
    y += 2;
    (doc as any).autoTable({
      startY: y,
      head: [['Mes', 'Asociados', 'Cupones', 'Casos']],
      body: reporte.trend.map((t) => [t.mes, t.asociados, t.cupones, t.casos]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Tiempo de Resolución de Casos ──
    if (reporte.tiempoResolucionCasos?.some((d) => d.casosResueltos > 0)) {
      if (y > 240) { doc.addPage(); y = 18; }
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text('Tiempo Promedio de Resolución de Casos', margin, y);
      y += 2;
      (doc as any).autoTable({
        startY: y,
        head: [['Mes', 'Días promedio', 'Casos resueltos']],
        body: reporte.tiempoResolucionCasos.map((d) => [d.mes, d.diasPromedio, d.casosResueltos]),
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11], textColor: 255, fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [255, 251, 235] },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ── Tasa de Aprobación ──
    if (reporte.tasaAprobacion?.some((d) => d.registrados > 0)) {
      if (y > 240) { doc.addPage(); y = 18; }
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text('Tasa de Aprobación de Asociados', margin, y);
      y += 2;
      (doc as any).autoTable({
        startY: y,
        head: [['Mes', 'Tasa (%)', 'Aprobados', 'Registrados']],
        body: reporte.tasaAprobacion.map((d) => [d.mes, `${d.tasa}%`, d.aprobados, d.registrados]),
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94], textColor: 255, fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ── Top Proveedores ──
    if (reporte.topProveedores.length > 0) {
      if (y > 220) { doc.addPage(); y = 18; }
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text('Top Proveedores', margin, y);
      y += 2;
      (doc as any).autoTable({
        startY: y,
        head: [['#', 'Proveedor', 'Tipo', 'Emitidos', 'Canjeados', 'Promociones']],
        body: reporte.topProveedores.map((p, i) => [i + 1, p.razonSocial, p.tipo, p.cuponesEmitidos, p.cuponesCanjeados, p.promociones]),
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [245, 243, 255] },
        margin: { left: margin, right: margin },
      });
    }

    // ── Pie de página ──
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Core Associates — Página ${i} de ${totalPages}`, margin, doc.internal.pageSize.getHeight() - 8);
    }

    doc.save(`reporte-ejecutivo-${desde}-${hasta}.pdf`);
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
        {puede('exportar:reportes') && (
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
          </div>
        )}
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

      {/* Tiempo de Resolución + Tasa de Aprobación */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tiempo promedio de resolución de casos */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Tiempo promedio de resolución</h3>
          <p className="mb-4 text-xs text-gray-500">Días promedio para resolver/cerrar casos legales por mes</p>
          {reporte.tiempoResolucionCasos?.some((d) => d.casosResueltos > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={reporte.tiempoResolucionCasos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} unit=" d" />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13 }} iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="diasPromedio" stroke="#f59e0b" strokeWidth={2.5} name="Días promedio" dot={{ r: 4, fill: '#f59e0b' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="casosResueltos" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="Casos resueltos" dot={{ r: 3, fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-gray-400">Sin casos resueltos en el período</p>
          )}
        </div>

        {/* Tasa de aprobación de asociados */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Tasa de aprobación de asociados</h3>
          <p className="mb-4 text-xs text-gray-500">Porcentaje de asociados aprobados vs registrados por mes</p>
          {reporte.tasaAprobacion?.some((d) => d.registrados > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={reporte.tasaAprobacion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13 }} iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="tasa" stroke="#22c55e" strokeWidth={2.5} name="Tasa aprobación (%)" dot={{ r: 4, fill: '#22c55e' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="aprobados" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="Aprobados" dot={{ r: 3, fill: '#3b82f6' }} />
                <Line type="monotone" dataKey="registrados" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="Registrados" dot={{ r: 3, fill: '#94a3b8' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-gray-400">Sin registros en el período</p>
          )}
        </div>
      </div>

      {/* Top Proveedores */}
      {reporte.topProveedores && reporte.topProveedores.length > 0 && (
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Top Proveedores</h3>
              <p className="text-xs text-gray-500">Proveedores con mayor actividad de cupones en el período</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Bar Chart */}
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={reporte.topProveedores.slice(0, 7)}
                layout="vertical"
                barGap={4}
                margin={{ left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="razonSocial"
                  type="category"
                  width={120}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                <Bar dataKey="cuponesEmitidos" name="Emitidos" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} />
                <Bar dataKey="cuponesCanjeados" name="Canjeados" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-medium uppercase text-gray-500">
                    <th className="pb-2 pr-4">#</th>
                    <th className="pb-2 pr-4">Proveedor</th>
                    <th className="pb-2 pr-4">Tipo</th>
                    <th className="pb-2 pr-4 text-right">Emitidos</th>
                    <th className="pb-2 pr-4 text-right">Canjeados</th>
                    <th className="pb-2 text-right">Promos</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.topProveedores.map((p, i) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 pr-4">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-2 pr-4 font-medium text-gray-900">{p.razonSocial}</td>
                      <td className="py-2 pr-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          <Store className="h-3 w-3" />
                          {p.tipo}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right font-semibold text-blue-600">{p.cuponesEmitidos}</td>
                      <td className="py-2 pr-4 text-right font-semibold text-green-600">{p.cuponesCanjeados}</td>
                      <td className="py-2 text-right text-gray-600">{p.promociones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
