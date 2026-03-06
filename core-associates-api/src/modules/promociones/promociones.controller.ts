import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PromocionesService } from './promociones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreatePromocionDto } from './dto/create-promocion.dto';
import { PromocionesQueryDto } from './dto/promociones-query.dto';

@ApiTags('Promociones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('promociones')
export class PromocionesController {
  constructor(private readonly promocionesService: PromocionesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar promociones activas' })
  @ApiQuery({ name: 'categoria', required: false })
  findActive(@Query('categoria') categoria?: string) {
    return this.promocionesService.findActive(categoria);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Listar todas las promociones (admin)' })
  findAll(@Query() query: PromocionesQueryDto) {
    return this.promocionesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de promoción' })
  findOne(@Param('id') id: string) {
    return this.promocionesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Crear promoción' })
  create(@Body() dto: CreatePromocionDto) {
    return this.promocionesService.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar promoción' })
  update(@Param('id') id: string, @Body() dto: Partial<CreatePromocionDto>) {
    return this.promocionesService.update(id, dto);
  }

  @Put(':id/estado')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Cambiar estado de promoción' })
  updateEstado(@Param('id') id: string, @Body('estado') estado: string) {
    return this.promocionesService.updateEstado(id, estado);
  }
}
