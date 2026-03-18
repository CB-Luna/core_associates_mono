import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../../common/guards/permisos.guard';
import { Permisos } from '../../common/decorators/permisos.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReporteFiltrosDto } from './dto/reporte-filtros.dto';

@ApiTags('Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('dashboard')
  @Permisos('reportes:ver')
  @ApiOperation({ summary: 'Métricas del dashboard' })
  @ApiResponse({ status: 200, description: 'Métricas generales: asociados, cupones, casos, proveedores' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  getDashboard() {
    return this.reportesService.getDashboardMetrics();
  }

  @Get('dashboard-proveedor')
  @Permisos('dashboard:ver')
  @ApiOperation({ summary: 'Métricas del dashboard para proveedor' })
  @ApiResponse({ status: 200, description: 'Métricas del proveedor: promociones, cupones emitidos/canjeados' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo proveedor' })
  getDashboardProveedor(
    @CurrentUser() user: { id: string; proveedorId?: string },
  ) {
    return this.reportesService.getDashboardProveedorMetrics(user.proveedorId!);
  }

  @Get('avanzado')
  @Permisos('reportes:ver')
  @ApiOperation({ summary: 'Reportes avanzados con filtros por fecha' })
  @ApiResponse({ status: 200, description: 'Reportes avanzados: resolución, aprobación, top proveedores' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  getReporteAvanzado(@Query() filtros: ReporteFiltrosDto) {
    return this.reportesService.getReporteAvanzado(filtros.desde, filtros.hasta);
  }

  @Get('system-info')
  @Permisos('configuracion:ver')
  @ApiOperation({ summary: 'Información del sistema' })
  @ApiResponse({ status: 200, description: 'Versión de Node, Prisma, uptime' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin' })
  getSystemInfo() {
    return this.reportesService.getSystemInfo();
  }

  @Get('resumen-diario')
  @Permisos('reportes:ver')
  @ApiOperation({ summary: 'Resúmenes diarios históricos (cron 8AM)' })
  @ApiQuery({ name: 'dias', required: false, type: Number, description: 'Últimos N días (default 30)' })
  @ApiResponse({ status: 200, description: 'Lista de resúmenes diarios' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  getResumenDiario(@Query('dias') dias?: string) {
    return this.reportesService.getResumenesDiarios(dias ? parseInt(dias, 10) : 30);
  }
}
