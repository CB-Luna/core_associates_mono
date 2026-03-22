import {
  Controller, Post, Get, Put, Delete, Param, Query, Body,
  UseGuards, UseInterceptors, UploadedFile, ParseFilePipe,
  MaxFileSizeValidator, FileTypeValidator, StreamableFile, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CasosLegalesService } from './casos-legales.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../../common/guards/permisos.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permisos } from '../../common/decorators/permisos.decorator';
import { RequireActivo } from '../../common/decorators/require-activo.decorator';
import { CreateCasoLegalDto } from './dto/create-caso-legal.dto';
import { CreateNotaCasoDto } from './dto/create-nota-caso.dto';
import { UpdateEstadoCasoDto } from './dto/update-estado-caso.dto';
import { UpdatePrioridadCasoDto } from './dto/update-prioridad-caso.dto';
import { AsignarAbogadoDto } from './dto/asignar-abogado.dto';
import { RechazarAsignacionDto } from './dto/rechazar-asignacion.dto';
import { CambiarEstadoAbogadoDto } from './dto/cambiar-estado-abogado.dto';
import { CasosLegalesQueryDto } from './dto/casos-legales-query.dto';

@ApiTags('Casos Legales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('casos-legales')
export class CasosLegalesController {
  constructor(private readonly casosLegalesService: CasosLegalesService) {}

  @Post()
  @RequireActivo()
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

  // ── Endpoints del Abogado (rutas estáticas antes de :id) ──

  @Get('abogado/mis-casos')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:ver-propios')
  @ApiOperation({ summary: 'Listar casos asignados al abogado' })
  @ApiResponse({ status: 200, description: 'Lista paginada de casos del abogado' })
  getMisCasosAbogado(
    @CurrentUser('id') abogadoUsuarioId: string,
    @Query() query: CasosLegalesQueryDto,
  ) {
    return this.casosLegalesService.getMisCasosAbogado(abogadoUsuarioId, query);
  }

  @Get('abogado/mis-casos/:id')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:ver-propios')
  @ApiOperation({ summary: 'Detalle de caso asignado al abogado' })
  @ApiResponse({ status: 200, description: 'Detalle del caso con notas y asociado' })
  @ApiResponse({ status: 404, description: 'Caso no encontrado o no asignado' })
  getMiCasoAbogadoDetail(
    @CurrentUser('id') abogadoUsuarioId: string,
    @Param('id') casoId: string,
  ) {
    return this.casosLegalesService.getMiCasoAbogadoDetail(abogadoUsuarioId, casoId);
  }

  @Get('abogado/disponibles')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:ver-disponibles')
  @ApiOperation({ summary: 'Listar casos sin abogado (disponibles)' })
  @ApiResponse({ status: 200, description: 'Lista de casos disponibles' })
  getCasosDisponibles(@Query() query: CasosLegalesQueryDto) {
    return this.casosLegalesService.getCasosDisponibles(query);
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
    return this.casosLegalesService.assignAbogado(id, dto.abogadoUsuarioId);
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
  @Permisos('casos-legales:ver', 'casos-legales:agregar-notas')
  @ApiOperation({ summary: 'Agregar nota al caso' })
  @ApiResponse({ status: 201, description: 'Nota creada' })
  @ApiResponse({ status: 400, description: 'Contenido inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permiso' })
  addNote(
    @Param('id') casoId: string,
    @CurrentUser('id') autorId: string,
    @Body() dto: CreateNotaCasoDto,
  ) {
    return this.casosLegalesService.addNote(casoId, autorId, dto.contenido, dto.esPrivada);
  }

  // ── Documentos del caso ──

  @Post(':id/documentos')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:ver', 'casos-legales:ver-propios')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir documento al caso' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Documento subido' })
  @ApiResponse({ status: 404, description: 'Caso no encontrado' })
  uploadDocumento(
    @Param('id') casoId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.casosLegalesService.uploadDocumentoCaso(casoId, userId, file);
  }

  @Get(':id/documentos')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:ver', 'casos-legales:ver-propios')
  @ApiOperation({ summary: 'Listar documentos del caso' })
  @ApiResponse({ status: 200, description: 'Lista de documentos' })
  getDocumentos(@Param('id') casoId: string) {
    return this.casosLegalesService.getDocumentosCaso(casoId);
  }

  @Get(':id/documentos/:docId/url')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:ver', 'casos-legales:ver-propios')
  @ApiOperation({ summary: 'Obtener URL firmada de documento' })
  @ApiResponse({ status: 200, description: 'URL presignada' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado' })
  getDocumentoUrl(
    @Param('id') casoId: string,
    @Param('docId') docId: string,
  ) {
    return this.casosLegalesService.getDocumentoCasoPresignedUrl(casoId, docId);
  }

  @Get(':id/documentos/:docId/download')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:ver', 'casos-legales:ver-propios')
  @ApiOperation({ summary: 'Descargar documento del caso (proxy streaming)' })
  @ApiResponse({ status: 200, description: 'Archivo' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado' })
  async downloadDocumento(
    @Param('id') casoId: string,
    @Param('docId') docId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, contentType, nombre } = await this.casosLegalesService.downloadDocumentoCaso(casoId, docId);
    const encoded = encodeURIComponent(nombre);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encoded}`);
    res.setHeader('Content-Length', buffer.length);
    return new StreamableFile(buffer);
  }

  @Delete(':id/documentos/:docId')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:ver', 'casos-legales:ver-propios')
  @ApiOperation({ summary: 'Eliminar documento del caso' })
  @ApiResponse({ status: 200, description: 'Documento eliminado' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado' })
  deleteDocumento(
    @Param('id') casoId: string,
    @Param('docId') docId: string,
  ) {
    return this.casosLegalesService.deleteDocumentoCaso(casoId, docId);
  }

  // ── Acciones del Abogado sobre :id ──

  @Post(':id/aceptar')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:aceptar-rechazar')
  @ApiOperation({ summary: 'Abogado acepta asignación de caso' })
  @ApiResponse({ status: 200, description: 'Caso aceptado' })
  @ApiResponse({ status: 400, description: 'Caso no aceptable' })
  @ApiResponse({ status: 404, description: 'Caso no encontrado' })
  aceptarCaso(
    @Param('id') casoId: string,
    @CurrentUser('id') abogadoUsuarioId: string,
  ) {
    return this.casosLegalesService.aceptarCaso(casoId, abogadoUsuarioId);
  }

  @Post(':id/rechazar')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:aceptar-rechazar')
  @ApiOperation({ summary: 'Abogado rechaza asignación de caso' })
  @ApiResponse({ status: 200, description: 'Caso rechazado, vuelve al pool' })
  @ApiResponse({ status: 400, description: 'Caso no rechazable' })
  @ApiResponse({ status: 404, description: 'Caso no encontrado' })
  rechazarCaso(
    @Param('id') casoId: string,
    @CurrentUser('id') abogadoUsuarioId: string,
    @Body() dto: RechazarAsignacionDto,
  ) {
    return this.casosLegalesService.rechazarCaso(casoId, abogadoUsuarioId, dto.motivo);
  }

  @Post(':id/postularse')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:ver-disponibles')
  @ApiOperation({ summary: 'Abogado se postula para caso disponible' })
  @ApiResponse({ status: 200, description: 'Postulación registrada' })
  @ApiResponse({ status: 400, description: 'Caso no disponible' })
  @ApiResponse({ status: 404, description: 'Caso no encontrado' })
  postularseCaso(
    @Param('id') casoId: string,
    @CurrentUser('id') abogadoUsuarioId: string,
  ) {
    return this.casosLegalesService.postularseCaso(casoId, abogadoUsuarioId);
  }

  @Put(':id/estado-abogado')
  @UseGuards(PermisosGuard)
  @Permisos('casos-legales:cambiar-estado-limitado')
  @ApiOperation({ summary: 'Abogado cambia estado (limitado a en_atencion/escalado)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 400, description: 'Estado inválido o no permitido' })
  @ApiResponse({ status: 404, description: 'Caso no encontrado' })
  cambiarEstadoAbogado(
    @Param('id') casoId: string,
    @CurrentUser('id') abogadoUsuarioId: string,
    @Body() dto: CambiarEstadoAbogadoDto,
  ) {
    return this.casosLegalesService.cambiarEstadoAbogado(casoId, abogadoUsuarioId, dto.estado);
  }
}
