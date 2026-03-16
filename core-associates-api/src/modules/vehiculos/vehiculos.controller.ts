import { Controller, Put, Delete, Post, Get, Param, Body, Res, UseGuards, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, StreamableFile, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { VehiculosService } from './vehiculos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';

@ApiTags('Vehículos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar vehículo propio' })
  @ApiResponse({ status: 200, description: 'Vehículo actualizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No es dueño del vehículo' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVehiculoDto,
    @CurrentUser('id') asociadoId: string,
  ) {
    return this.vehiculosService.update(id, asociadoId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar vehículo propio' })
  @ApiResponse({ status: 200, description: 'Vehículo eliminado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No es dueño del vehículo' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') asociadoId: string,
  ) {
    return this.vehiculosService.remove(id, asociadoId);
  }

  @Post(':id/foto')
  @ApiOperation({ summary: 'Subir foto del vehículo' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Foto subida correctamente' })
  @ApiResponse({ status: 400, description: 'Archivo inválido (máx 5MB, solo JPEG/PNG/WebP)' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No es dueño del vehículo' })
  @UseInterceptors(FileInterceptor('file'))
  uploadFoto(
    @Param('id') id: string,
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
    return this.vehiculosService.uploadFoto(id, asociadoId, file);
  }

  @Get(':id/foto')
  @ApiOperation({ summary: 'Obtener foto del vehículo' })
  @ApiResponse({ status: 200, description: 'Imagen binaria de la foto' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Vehículo sin foto' })
  async getFoto(
    @Param('id') id: string,
    @CurrentUser('id') asociadoId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.vehiculosService.getFotoBuffer(id, asociadoId);
    if (!result) throw new NotFoundException('El vehículo no tiene foto');
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'private, max-age=900');
    return new StreamableFile(result.buffer);
  }
}
