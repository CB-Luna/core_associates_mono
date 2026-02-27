import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Build estado counts map
    const estadoCounts: Record<string, number> = {};
    let totalAsociados = 0;
    for (const row of asociadosPorEstado) {
      estadoCounts[row.estado] = row._count.id;
      totalAsociados += row._count.id;
    }

    // Monthly trend (last 6 months)
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

  private async getMonthlyTrend() {
    const months: { mes: string; asociados: number; cupones: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const mesLabel = start.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });

      const [asociados, cupones] = await Promise.all([
        this.prisma.asociado.count({
          where: { fechaRegistro: { gte: start, lt: end } },
        }),
        this.prisma.cupon.count({
          where: { createdAt: { gte: start, lt: end } },
        }),
      ]);

      months.push({ mes: mesLabel, asociados, cupones });
    }

    return months;
  }
}
