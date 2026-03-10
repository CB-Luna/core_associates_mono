import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Dashboard (sin filtros, métricas globales) ──

  async getDashboardMetrics() {
    const [
      asociadosPorEstado,
      totalProveedores,
      proveedoresActivos,
      cuponesDelMes,
      casosAbiertos,
      docsPendientes,
    ] = await Promise.all([
      this.prisma.asociado.groupBy({
        by: ['estado'],
        _count: { id: true },
      }),
      this.prisma.proveedor.count(),
      this.prisma.proveedor.count({ where: { estado: 'activo' } }),
      this.prisma.cupon.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.casoLegal.count({
        where: { estado: { in: ['abierto', 'en_atencion', 'escalado'] } },
      }),
      this.prisma.documento.count({
        where: { estado: 'pendiente' },
      }),
    ]);

    const estadoCounts: Record<string, number> = {};
    let totalAsociados = 0;
    for (const row of asociadosPorEstado) {
      estadoCounts[row.estado] = row._count.id;
      totalAsociados += row._count.id;
    }

    const trend = await this.getMonthlyTrend();

    return {
      asociados: {
        total: totalAsociados,
        activos: estadoCounts['activo'] || 0,
        pendientes: estadoCounts['pendiente'] || 0,
        suspendidos: estadoCounts['suspendido'] || 0,
        bajas: estadoCounts['baja'] || 0,
        rechazados: estadoCounts['rechazado'] || 0,
      },
      proveedores: {
        total: totalProveedores,
        activos: proveedoresActivos,
      },
      cupones: {
        delMes: cuponesDelMes,
      },
      casosLegales: {
        abiertos: casosAbiertos,
      },
      documentos: {
        pendientes: docsPendientes,
      },
      trend,
    };
  }

  // ── Reportes avanzados con filtros de fecha ──

  async getReporteAvanzado(desde?: string, hasta?: string) {
    const dateFilter = this.buildDateFilter(desde, hasta);

    const [
      asociadosRegistrados,
      asociadosPorEstado,
      cuponesPorEstado,
      cuponesGenerados,
      casosPorTipo,
      casosPorEstado,
      docsPorEstado,
      trendMensual,
      topProveedores,
      tiempoResolucion,
      tasaAprobacion,
    ] = await Promise.all([
      this.prisma.asociado.count({ where: { fechaRegistro: dateFilter } }),
      this.prisma.asociado.groupBy({
        by: ['estado'],
        _count: { id: true },
        where: { fechaRegistro: dateFilter },
      }),
      this.prisma.cupon.groupBy({
        by: ['estado'],
        _count: { id: true },
        where: { createdAt: dateFilter },
      }),
      this.prisma.cupon.count({ where: { createdAt: dateFilter } }),
      this.prisma.casoLegal.groupBy({
        by: ['tipoPercance'],
        _count: { id: true },
        where: { fechaApertura: dateFilter },
      }),
      this.prisma.casoLegal.groupBy({
        by: ['estado'],
        _count: { id: true },
        where: { fechaApertura: dateFilter },
      }),
      this.prisma.documento.groupBy({
        by: ['estado'],
        _count: { id: true },
        where: { createdAt: dateFilter },
      }),
      this.getMonthlyTrend(desde, hasta),
      this.prisma.proveedor.findMany({
        where: { estado: 'activo' },
        select: {
          id: true,
          razonSocial: true,
          tipo: true,
          _count: {
            select: {
              cuponesEmitidos: dateFilter ? { where: { createdAt: dateFilter } } : true,
              cuponesCanjeados: dateFilter
                ? { where: { fechaCanje: dateFilter } }
                : true,
              promociones: true,
            },
          },
        },
        orderBy: { cuponesEmitidos: { _count: 'desc' } },
        take: 10,
      }),
      this.getResolutionTimeByMonth(desde, hasta),
      this.getApprovalRateByMonth(desde, hasta),
    ]);

    return {
      periodo: {
        desde: desde || null,
        hasta: hasta || null,
      },
      asociados: {
        registrados: asociadosRegistrados,
        porEstado: this.groupToMap(asociadosPorEstado),
      },
      cupones: {
        generados: cuponesGenerados,
        porEstado: this.groupToMap(cuponesPorEstado),
      },
      casosLegales: {
        porTipo: this.groupToMap(casosPorTipo, 'tipoPercance'),
        porEstado: this.groupToMap(casosPorEstado),
      },
      documentos: {
        porEstado: this.groupToMap(docsPorEstado),
      },
      trend: trendMensual,
      topProveedores: topProveedores.map((p) => ({
        id: p.id,
        razonSocial: p.razonSocial,
        tipo: p.tipo,
        cuponesEmitidos: p._count.cuponesEmitidos,
        cuponesCanjeados: p._count.cuponesCanjeados,
        promociones: p._count.promociones,
      })),
      tiempoResolucionCasos: tiempoResolucion,
      tasaAprobacion,
    };
  }

  // ── Dashboard Proveedor ──

  async getDashboardProveedorMetrics(proveedorId: string) {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      promocionesActivas,
      promocionesPausadas,
      promocionesFinalizadas,
      cuponesTotales,
      cuponesCanjeados,
      cuponesVencidos,
      cuponesDelMes,
    ] = await Promise.all([
      this.prisma.promocion.count({ where: { proveedorId, estado: 'activa' } }),
      this.prisma.promocion.count({ where: { proveedorId, estado: 'pausada' } }),
      this.prisma.promocion.count({ where: { proveedorId, estado: 'finalizada' } }),
      this.prisma.cupon.count({ where: { proveedorId } }),
      this.prisma.cupon.count({ where: { proveedorId, estado: 'canjeado' } }),
      this.prisma.cupon.count({ where: { proveedorId, estado: 'vencido' } }),
      this.prisma.cupon.count({
        where: { proveedorId, createdAt: { gte: inicioMes } },
      }),
    ]);

    const trend = await this.getMonthlyTrendProveedor(proveedorId);

    return {
      promociones: {
        activas: promocionesActivas,
        pausadas: promocionesPausadas,
        finalizadas: promocionesFinalizadas,
        total: promocionesActivas + promocionesPausadas + promocionesFinalizadas,
      },
      cupones: {
        totales: cuponesTotales,
        canjeados: cuponesCanjeados,
        vencidos: cuponesVencidos,
        delMes: cuponesDelMes,
      },
      trend,
    };
  }

  private async getMonthlyTrendProveedor(proveedorId: string) {
    const months: { mes: string; emitidos: number; canjeados: number }[] = [];
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (current <= endDate) {
      const monthStart = new Date(current);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      const mesLabel = current.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });

      const [emitidos, canjeados] = await Promise.all([
        this.prisma.cupon.count({
          where: { proveedorId, createdAt: { gte: monthStart, lt: monthEnd } },
        }),
        this.prisma.cupon.count({
          where: { proveedorId, estado: 'canjeado', fechaCanje: { gte: monthStart, lt: monthEnd } },
        }),
      ]);

      months.push({ mes: mesLabel, emitidos, canjeados });
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }

  // ── System Info ──

  getSystemInfo() {
    return {
      apiVersion: 'v1.0.0',
      nodeEnv: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
    };
  }

  // ── Resúmenes diarios ──

  async getResumenesDiarios(dias = 30) {
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    desde.setHours(0, 0, 0, 0);

    return this.prisma.resumenDiario.findMany({
      where: { fecha: { gte: desde } },
      orderBy: { fecha: 'desc' },
    });
  }

  // ── Helpers ──

  private buildDateFilter(desde?: string, hasta?: string) {
    if (!desde && !hasta) return undefined;
    const filter: { gte?: Date; lte?: Date } = {};
    if (desde) filter.gte = new Date(desde);
    if (hasta) filter.lte = new Date(hasta + 'T23:59:59.999Z');
    return filter;
  }

  private groupToMap(
    rows: { _count: { id: number }; [key: string]: unknown }[],
    key = 'estado',
  ): Record<string, number> {
    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row[key] as string] = row._count.id;
    }
    return map;
  }

  private async getMonthlyTrend(desde?: string, hasta?: string) {
    const months: { mes: string; asociados: number; cupones: number; casos: number }[] = [];
    const now = new Date();

    // Determine range: default last 6 months, or use desde/hasta
    let startDate: Date;
    let endDate: Date;

    if (desde && hasta) {
      startDate = new Date(desde);
      endDate = new Date(hasta);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Iterate month by month
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (current <= endDate) {
      const monthStart = new Date(current);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      const mesLabel = current.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });

      const [asociados, cupones, casos] = await Promise.all([
        this.prisma.asociado.count({
          where: { fechaRegistro: { gte: monthStart, lt: monthEnd } },
        }),
        this.prisma.cupon.count({
          where: { createdAt: { gte: monthStart, lt: monthEnd } },
        }),
        this.prisma.casoLegal.count({
          where: { fechaApertura: { gte: monthStart, lt: monthEnd } },
        }),
      ]);

      months.push({ mes: mesLabel, asociados, cupones, casos });
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }

  /**
   * Tiempo promedio de resolución de casos legales por mes.
   * Solo considera casos con fechaCierre (resuelto/cerrado).
   */
  private async getResolutionTimeByMonth(desde?: string, hasta?: string) {
    const result: { mes: string; diasPromedio: number; casosResueltos: number }[] = [];
    const now = new Date();

    let startDate: Date;
    let endDate: Date;
    if (desde && hasta) {
      startDate = new Date(desde);
      endDate = new Date(hasta);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (current <= endDate) {
      const monthStart = new Date(current);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      const mesLabel = current.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });

      const casos = await this.prisma.casoLegal.findMany({
        where: {
          fechaCierre: { gte: monthStart, lt: monthEnd },
        },
        select: { fechaApertura: true, fechaCierre: true },
      });

      if (casos.length > 0) {
        const totalDias = casos.reduce((sum, c) => {
          const diff = (c.fechaCierre!.getTime() - c.fechaApertura.getTime()) / (1000 * 60 * 60 * 24);
          return sum + diff;
        }, 0);
        result.push({
          mes: mesLabel,
          diasPromedio: Math.round((totalDias / casos.length) * 10) / 10,
          casosResueltos: casos.length,
        });
      } else {
        result.push({ mes: mesLabel, diasPromedio: 0, casosResueltos: 0 });
      }

      current.setMonth(current.getMonth() + 1);
    }

    return result;
  }

  /**
   * Tasa de aprobación de asociados por mes.
   * Compara aprobados (fechaAprobacion en ese mes) vs total registrados (fechaRegistro).
   */
  private async getApprovalRateByMonth(desde?: string, hasta?: string) {
    const result: { mes: string; tasa: number; aprobados: number; registrados: number }[] = [];
    const now = new Date();

    let startDate: Date;
    let endDate: Date;
    if (desde && hasta) {
      startDate = new Date(desde);
      endDate = new Date(hasta);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (current <= endDate) {
      const monthStart = new Date(current);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      const mesLabel = current.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });

      const [aprobados, registrados] = await Promise.all([
        this.prisma.asociado.count({
          where: { fechaAprobacion: { gte: monthStart, lt: monthEnd } },
        }),
        this.prisma.asociado.count({
          where: { fechaRegistro: { gte: monthStart, lt: monthEnd } },
        }),
      ]);

      const tasa = registrados > 0 ? Math.round((aprobados / registrados) * 1000) / 10 : 0;
      result.push({ mes: mesLabel, tasa, aprobados, registrados });

      current.setMonth(current.getMonth() + 1);
    }

    return result;
  }
}
