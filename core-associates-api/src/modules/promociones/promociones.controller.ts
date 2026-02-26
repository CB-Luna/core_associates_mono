import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PromocionesService } from './promociones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Promociones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('promociones')
export class PromocionesController {
  constructor(private readonly promocionesService: PromocionesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar promociones activas' })
  @ApiQuery({ name: 'categoria', required: false, description: 'Filtrar por tipo de proveedor' })
  findActive(@Query('categoria') categoria?: string) {
    return this.promocionesService.findActive(categoria);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de promoción' })
  findOne(@Param('id') id: string) {
    return this.promocionesService.findOne(id);
  }
}
