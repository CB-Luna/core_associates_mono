import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { DocumentosService } from './documentos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDocumentEstadoDto } from './dto/update-document-estado.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Documentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

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

  @Get('mis-documentos')
  @ApiOperation({ summary: 'Listar mis documentos' })
  @ApiResponse({ status: 200, description: 'Lista de documentos del asociado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  getMyDocuments(@CurrentUser('id') asociadoId: string) {
    return this.documentosService.getMyDocuments(asociadoId);
  }

  @Get('pendientes')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Listar documentos pendientes de revisión (admin)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de documentos pendientes' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  getPendingDocuments(@Query() query: PaginationQueryDto) {
    return this.documentosService.getPendingDocuments(query.page, query.limit);
  }

  @Get(':id/url')
  @ApiOperation({ summary: 'Obtener URL presignada del documento' })
  @ApiResponse({ status: 200, description: 'URL presignada (15 min)' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin acceso al documento' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado' })
  getDocumentUrl(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    return this.documentosService.getDocumentUrl(id, user.id, user.tipo);
  }

  @Put(':id/estado')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
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
