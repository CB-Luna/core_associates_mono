import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReporteFiltrosDto } from './dto/reporte-filtros.dto';

@ApiTags('Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('dashboard')
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Métricas del dashboard' })
  getDashboard() {
    return this.reportesService.getDashboardMetrics();
  }

  @Get('avanzado')
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Reportes avanzados con filtros por fecha' })
  getReporteAvanzado(@Query() filtros: ReporteFiltrosDto) {
    return this.reportesService.getReporteAvanzado(filtros.desde, filtros.hasta);
  }

  @Get('system-info')
  @Roles('admin')
  @ApiOperation({ summary: 'Información del sistema' })
  getSystemInfo() {
    return this.reportesService.getSystemInfo();
  }
}
