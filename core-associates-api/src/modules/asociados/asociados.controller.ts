import { Controller, Get, Put, Post, Body, Param, Query, Res, UseGuards, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, StreamableFile, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { AsociadosService } from './asociados.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateAsociadoDto } from './dto/update-asociado.dto';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { AsociadosQueryDto } from './dto/asociados-query.dto';
import { CreateNotaAsociadoDto } from './dto/create-nota-asociado.dto';

@ApiTags('Asociados')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('asociados')
export class AsociadosController {
  constructor(private readonly asociadosService: AsociadosService) {}

  // ── Endpoints para asociado (app móvil) ──

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del asociado actual' })
  @ApiResponse({ status: 200, description: 'Perfil del asociado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Asociado no encontrado' })
  getMyProfile(@CurrentUser('id') asociadoId: string) {
    return this.asociadosService.getMyProfile(asociadoId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Actualizar perfil del asociado actual' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  updateMyProfile(
    @CurrentUser('id') asociadoId: string,
    @Body() dto: UpdateAsociadoDto,
  ) {
    return this.asociadosService.updateMyProfile(asociadoId, dto);
  }

  @Get('me/vehiculos')
  @ApiOperation({ summary: 'Listar vehículos del asociado actual' })
  @ApiResponse({ status: 200, description: 'Lista de vehículos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  getMyVehiculos(@CurrentUser('id') asociadoId: string) {
    return this.asociadosService.getMyVehiculos(asociadoId);
  }

  @Post('me/vehiculos')
  @ApiOperation({ summary: 'Agregar vehículo' })
  @ApiResponse({ status: 201, description: 'Vehículo agregado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  addVehiculo(
    @CurrentUser('id') asociadoId: string,
    @Body() dto: CreateVehiculoDto,
  ) {
    return this.asociadosService.addVehiculo(asociadoId, dto);
  }

  @Post('me/foto')
  @ApiOperation({ summary: 'Subir foto de perfil del asociado' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Foto subida correctamente' })
  @ApiResponse({ status: 400, description: 'Archivo inválido (máx 5MB, solo JPEG/PNG/WebP)' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @UseInterceptors(FileInterceptor('file'))
  uploadMyFoto(
    @CurrentUser('id') asociadoId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.asociadosService.uploadFoto(asociadoId, file);
  }

  @Get('me/foto')
  @ApiOperation({ summary: 'Obtener foto de perfil del asociado' })
  @ApiResponse({ status: 200, description: 'Imagen binaria de la foto' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'No tiene foto' })
  async getMyFoto(@CurrentUser('id') asociadoId: string, @Res({ passthrough: true }) res: Response) {
    const result = await this.asociadosService.getFotoBuffer(asociadoId);
    if (!result) throw new NotFoundException('El asociado no tiene foto de perfil');
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'private, max-age=900');
    return new StreamableFile(result.buffer);
  }

  // ── Endpoints admin (CRM) ──

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Listar asociados (admin)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de asociados' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  findAll(@Query() query: AsociadosQueryDto) {
    return this.asociadosService.findAll(query);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Detalle de asociado (admin)' })
  @ApiResponse({ status: 200, description: 'Detalle del asociado con vehículos y documentos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  @ApiResponse({ status: 404, description: 'Asociado no encontrado' })
  findOne(@Param('id') id: string) {
    return this.asociadosService.findOne(id);
  }

  @Get(':id/foto')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Obtener foto del asociado (admin)' })
  @ApiResponse({ status: 200, description: 'Imagen binaria de la foto' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  @ApiResponse({ status: 404, description: 'No tiene foto' })
  async getFoto(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const result = await this.asociadosService.getFotoBuffer(id);
    if (!result) throw new NotFoundException('El asociado no tiene foto de perfil');
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'private, max-age=900');
    return new StreamableFile(result.buffer);
  }

  @Put(':id/estado')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Cambiar estado de asociado' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 400, description: 'Estado o motivo inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  @ApiResponse({ status: 404, description: 'Asociado no encontrado' })
  updateEstado(
    @Param('id') id: string,
    @Body() dto: UpdateEstadoDto,
    @CurrentUser('id') usuarioId: string,
  ) {
    return this.asociadosService.updateEstado(id, dto.estado, usuarioId, dto.motivo);
  }

  // ── Notas / Timeline ──

  @Get(':id/notas')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Obtener notas/timeline de un asociado' })
  @ApiResponse({ status: 200, description: 'Lista de notas y cambios de estado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  getNotas(@Param('id') id: string) {
    return this.asociadosService.getNotas(id);
  }

  @Post(':id/notas')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Agregar nota interna a un asociado' })
  @ApiResponse({ status: 201, description: 'Nota creada' })
  @ApiResponse({ status: 400, description: 'Contenido inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  createNota(
    @Param('id') id: string,
    @CurrentUser('id') usuarioId: string,
    @Body() dto: CreateNotaAsociadoDto,
  ) {
    return this.asociadosService.createNota(id, usuarioId, dto);
  }
}
