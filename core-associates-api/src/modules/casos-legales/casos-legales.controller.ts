import { Controller, Post, Get, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CasosLegalesService } from './casos-legales.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../../common/guards/permisos.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permisos } from '../../common/decorators/permisos.decorator';
import { CreateCasoLegalDto } from './dto/create-caso-legal.dto';
import { CreateNotaCasoDto } from './dto/create-nota-caso.dto';
import { UpdateEstadoCasoDto } from './dto/update-estado-caso.dto';
import { UpdatePrioridadCasoDto } from './dto/update-prioridad-caso.dto';
import { AsignarAbogadoDto } from './dto/asignar-abogado.dto';
import { CasosLegalesQueryDto } from './dto/casos-legales-query.dto';

@ApiTags('Casos Legales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('casos-legales')
export class CasosLegalesController {
  constructor(private readonly casosLegalesService: CasosLegalesService) {}

  @Post()
  @ApiOperation({ summary: 'Reportar percance (SOS)' })
  @ApiResponse({ status: 201, description: 'Caso legal creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  createCaso(
    @CurrentUser('id') asociadoId: string,
    @Body() dto: CreateCasoLegalDto,
  ) {
    return this.casosLegalesService.createCaso(asociadoId, dto);
  }

  @Get('mis-casos')
  @ApiOperation({ summary: 'Listar mis casos legales' })
  @ApiResponse({ status: 200, description: 'Lista de casos del asociado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  getMisCasos(@CurrentUser('id') asociadoId: string) {
    return this.casosLegalesService.getMisCasos(asociadoId);
  }

  @Get('mis-casos/:id')
  @ApiOperation({ summary: 'Detalle de mi caso legal' })
  @ApiResponse({ status: 200, description: 'Detalle del caso con notas' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Caso no encontrado' })
  getMiCasoDetail(
    @CurrentUser('id') asociadoId: string,
    @Param('id') casoId: string,
  ) {
    return this.casosLegalesService.getMiCasoDetail(asociadoId, casoId);
  }

  @Get('admin/all')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:ver')
  @ApiOperation({ summary: 'Listar todos los casos (admin)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de casos legales' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  findAll(@Query() query: CasosLegalesQueryDto) {
    return this.casosLegalesService.findAll(query);
  }

  @Get(':id')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:ver')
  @ApiOperation({ summary: 'Detalle de caso legal' })
  @ApiResponse({ status: 200, description: 'Detalle del caso con notas y asociado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  @ApiResponse({ status: 404, description: 'Caso no encontrado' })
  findOne(@Param('id') id: string) {
    return this.casosLegalesService.findOne(id);
  }

  @Put(':id/estado')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:cambiar-estado')
  @ApiOperation({ summary: 'Cambiar estado de caso' })
  @ApiResponse({ status: 200, description: 'Estado del caso actualizado' })
  @ApiResponse({ status: 400, description: 'Estado inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  @ApiResponse({ status: 404, description: 'Caso no encontrado' })
  updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoCasoDto) {
    return this.casosLegalesService.updateEstado(id, dto.estado);
  }

  @Put(':id/prioridad')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:cambiar-prioridad')
  @ApiOperation({ summary: 'Cambiar prioridad de caso' })
  @ApiResponse({ status: 200, description: 'Prioridad del caso actualizada' })
  @ApiResponse({ status: 400, description: 'Prioridad inválida' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  @ApiResponse({ status: 404, description: 'Caso no encontrado' })
  updatePrioridad(@Param('id') id: string, @Body() dto: UpdatePrioridadCasoDto) {
    return this.casosLegalesService.updatePrioridad(id, dto.prioridad);
  }

  @Put(':id/asignar-abogado')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:asignar')
  @ApiOperation({ summary: 'Asignar abogado al caso' })
  @ApiResponse({ status: 200, description: 'Abogado asignado al caso' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  @ApiResponse({ status: 404, description: 'Caso no encontrado' })
  assignAbogado(@Param('id') id: string, @Body() dto: AsignarAbogadoDto) {
    return this.casosLegalesService.assignAbogado(id, dto.abogadoId);
  }

  @Get(':id/notas')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:ver')
  @ApiOperation({ summary: 'Listar notas del caso' })
  @ApiResponse({ status: 200, description: 'Lista de notas del caso' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  getNotas(@Param('id') casoId: string) {
    return this.casosLegalesService.getNotas(casoId);
  }

  @Post(':id/notas')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:ver')
  @ApiOperation({ summary: 'Agregar nota al caso' })
  @ApiResponse({ status: 201, description: 'Nota creada' })
  @ApiResponse({ status: 400, description: 'Contenido inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  addNote(
    @Param('id') casoId: string,
    @CurrentUser('id') autorId: string,
    @Body() dto: CreateNotaCasoDto,
  ) {
    return this.casosLegalesService.addNote(casoId, autorId, dto.contenido, dto.esPrivada);
  }
}
