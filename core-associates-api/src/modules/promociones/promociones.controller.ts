import { Controller, Get, Post, Put, Param, Query, Body, Res, UseGuards, UseInterceptors, UploadedFile, ForbiddenException, BadRequestException, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PromocionesService } from './promociones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
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
  @ApiResponse({ status: 200, description: 'Lista de promociones activas' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  findActive(@Query('categoria') categoria?: string) {
    return this.promocionesService.findActive(categoria);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Listar todas las promociones (admin)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de todas las promociones' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  findAll(@Query() query: PromocionesQueryDto) {
    return this.promocionesService.findAll(query);
  }

  // ── Endpoints para proveedores autenticados (antes de :id) ──

  @Get('mis-promociones')
  @UseGuards(RolesGuard)
  @Roles('proveedor')
  @ApiOperation({ summary: 'Listar promociones del proveedor autenticado' })
  @ApiResponse({ status: 200, description: 'Lista paginada de promociones propias' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo proveedor — usuario no vinculado' })
  findMyPromociones(
    @CurrentUser() user: { id: string; proveedorId?: string },
    @Query() query: PromocionesQueryDto,
  ) {
    if (!user.proveedorId) {
      throw new ForbiddenException('Usuario no vinculado a un proveedor');
    }
    return this.promocionesService.findByProveedor(user.proveedorId, query);
  }

  @Post('mis-promociones')
  @UseGuards(RolesGuard)
  @Roles('proveedor')
  @ApiOperation({ summary: 'Crear promoción como proveedor' })
  @ApiResponse({ status: 201, description: 'Promoción creada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo proveedor — usuario no vinculado' })
  createMyPromocion(
    @CurrentUser() user: { id: string; proveedorId?: string },
    @Body() dto: CreatePromocionDto,
  ) {
    if (!user.proveedorId) {
      throw new ForbiddenException('Usuario no vinculado a un proveedor');
    }
    return this.promocionesService.createForProveedor(user.proveedorId, dto);
  }

  @Put('mis-promociones/:id')
  @UseGuards(RolesGuard)
  @Roles('proveedor')
  @ApiOperation({ summary: 'Editar promoción propia del proveedor' })
  @ApiResponse({ status: 200, description: 'Promoción actualizada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No es dueño de la promoción' })
  @ApiResponse({ status: 404, description: 'Promoción no encontrada' })
  updateMyPromocion(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; proveedorId?: string },
    @Body() dto: Partial<CreatePromocionDto>,
  ) {
    if (!user.proveedorId) {
      throw new ForbiddenException('Usuario no vinculado a un proveedor');
    }
    return this.promocionesService.updateForProveedor(id, user.proveedorId, dto);
  }

  @Put('mis-promociones/:id/estado')
  @UseGuards(RolesGuard)
  @Roles('proveedor')
  @ApiOperation({ summary: 'Cambiar estado de promoción propia' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No es dueño de la promoción' })
  @ApiResponse({ status: 404, description: 'Promoción no encontrada' })
  updateMyPromocionEstado(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; proveedorId?: string },
    @Body('estado') estado: string,
  ) {
    if (!user.proveedorId) {
      throw new ForbiddenException('Usuario no vinculado a un proveedor');
    }
    return this.promocionesService.updateEstadoForProveedor(id, user.proveedorId, estado);
  }

  @Post('mis-promociones/:id/imagen')
  @UseGuards(RolesGuard)
  @Roles('proveedor')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir imagen de promoción propia' })
  @ApiResponse({ status: 201, description: 'Imagen subida' })
  @ApiResponse({ status: 400, description: 'Archivo requerido o inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No es dueño de la promoción' })
  uploadMyPromocionImagen(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; proveedorId?: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!user.proveedorId) {
      throw new ForbiddenException('Usuario no vinculado a un proveedor');
    }
    if (!file) throw new BadRequestException('Archivo requerido');
    return this.promocionesService.uploadImagen(id, file, user.proveedorId);
  }

  // ── Endpoints genéricos con :id (después de rutas estáticas) ──

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de promoción' })
  @ApiResponse({ status: 200, description: 'Detalle de la promoción con proveedor' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Promoción no encontrada' })
  findOne(@Param('id') id: string) {
    return this.promocionesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Crear promoción' })
  @ApiResponse({ status: 201, description: 'Promoción creada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin' })
  create(@Body() dto: CreatePromocionDto) {
    if (!dto.proveedorId) {
      throw new BadRequestException('proveedorId es requerido');
    }
    return this.promocionesService.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar promoción' })
  @ApiResponse({ status: 200, description: 'Promoción actualizada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin' })
  @ApiResponse({ status: 404, description: 'Promoción no encontrada' })
  update(@Param('id') id: string, @Body() dto: Partial<CreatePromocionDto>) {
    return this.promocionesService.update(id, dto);
  }

  @Put(':id/estado')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Cambiar estado de promoción' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin' })
  @ApiResponse({ status: 404, description: 'Promoción no encontrada' })
  updateEstado(@Param('id') id: string, @Body('estado') estado: string) {
    return this.promocionesService.updateEstado(id, estado);
  }

  @Post(':id/imagen')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir imagen de promoción (admin)' })
  @ApiResponse({ status: 201, description: 'Imagen subida' })
  @ApiResponse({ status: 400, description: 'Archivo requerido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin' })
  uploadImagen(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Archivo requerido');
    return this.promocionesService.uploadImagen(id, file);
  }

  @Get(':id/imagen')
  @ApiOperation({ summary: 'Obtener imagen de promoción' })
  @ApiResponse({ status: 200, description: 'Imagen binaria de la promoción' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Promoción sin imagen' })
  async getImagen(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { buffer, contentType } = await this.promocionesService.getImagenBuffer(id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=900');
    return new StreamableFile(buffer);
  }
}
