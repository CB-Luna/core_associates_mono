import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { DocumentosService } from './documentos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../../common/guards/permisos.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permisos } from '../../common/decorators/permisos.decorator';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDocumentEstadoDto } from './dto/update-document-estado.dto';
import { PreValidarDocumentoDto } from './dto/pre-validar-documento.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Documentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Post('pre-validar')
  @ApiOperation({ summary: 'Pre-validar imagen con IA antes de subir' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: '{ valida, motivo?, advertencia? }' })
  @ApiResponse({ status: 400, description: 'Imagen rechazada o límite anti-troll alcanzado' })
  @UseInterceptors(FileInterceptor('file'))
  preValidar(
    @CurrentUser('id') asociadoId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)|application\/pdf$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: PreValidarDocumentoDto,
  ) {
    return this.documentosService.preValidar(asociadoId, file, dto.tipo);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Subir documento' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Documento subido y registrado' })
  @ApiResponse({ status: 400, description: 'Archivo inválido (máx 10MB, JPEG/PNG/WebP/PDF)' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @CurrentUser('id') asociadoId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10 MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)|application\/pdf$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentosService.uploadDocument(asociadoId, file, dto.tipo);
  }

  @Post('upload-para/:asociadoId')
  @UseGuards(PermisosGuard)
  @Permisos('documentos:cargar')
  @ApiOperation({ summary: 'Subir documento en nombre de un asociado (admin/operador)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Documento subido y registrado' })
  @ApiResponse({ status: 400, description: 'Archivo inválido (máx 10MB, JPEG/PNG/WebP/PDF)' })
  @ApiResponse({ status: 404, description: 'Asociado no encontrado' })
  @UseInterceptors(FileInterceptor('file'))
  uploadDocumentForAsociado(
    @Param('asociadoId') asociadoId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)|application\/pdf$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentosService.uploadDocumentForAsociado(asociadoId, file, dto.tipo);
  }

  @Get('mis-documentos')
  @ApiOperation({ summary: 'Listar mis documentos' })
  @ApiResponse({ status: 200, description: 'Lista de documentos del asociado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  getMyDocuments(@CurrentUser('id') asociadoId: string) {
    return this.documentosService.getMyDocuments(asociadoId);
  }

  @Get('pendientes')
  @UseGuards(PermisosGuard)
  @Permisos('documentos:ver')
  @ApiOperation({ summary: 'Listar documentos pendientes de revisión (admin)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de documentos pendientes' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  getPendingDocuments(@Query() query: PaginationQueryDto) {
    return this.documentosService.getPendingDocuments(query.page, query.limit);
  }

  @Get(':id/url')
  @ApiOperation({ summary: 'Obtener documento (stream binario)' })
  @ApiResponse({ status: 200, description: 'Contenido binario del documento' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin acceso al documento' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado' })
  async getDocument(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; tipo: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, contentType } = await this.documentosService.getDocumentBuffer(id, user.id, user.tipo);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=900');
    return new StreamableFile(buffer);
  }

  @Put(':id/estado')
  @UseGuards(PermisosGuard)
  @Permisos('documentos:revisar')
  @ApiOperation({ summary: 'Aprobar o rechazar documento' })
  @ApiResponse({ status: 200, description: 'Estado del documento actualizado' })
  @ApiResponse({ status: 400, description: 'Estado inválido o motivo faltante para rechazo' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado' })
  updateEstado(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentEstadoDto,
    @CurrentUser('id') usuarioId: string,
  ) {
    return this.documentosService.updateEstado(id, dto.estado, usuarioId, dto.motivoRechazo);
  }
}
