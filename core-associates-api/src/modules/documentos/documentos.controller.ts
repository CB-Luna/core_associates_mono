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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
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
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @CurrentUser('id') asociadoId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentosService.uploadDocument(asociadoId, file, dto.tipo);
  }

  @Get('mis-documentos')
  @ApiOperation({ summary: 'Listar mis documentos' })
  getMyDocuments(@CurrentUser('id') asociadoId: string) {
    return this.documentosService.getMyDocuments(asociadoId);
  }

  @Get('pendientes')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Listar documentos pendientes de revisión (admin)' })
  getPendingDocuments(@Query() query: PaginationQueryDto) {
    return this.documentosService.getPendingDocuments(query.page, query.limit);
  }

  @Get(':id/url')
  @ApiOperation({ summary: 'Obtener URL presignada del documento' })
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
  updateEstado(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentEstadoDto,
    @CurrentUser('id') usuarioId: string,
  ) {
    return this.documentosService.updateEstado(id, dto.estado, usuarioId, dto.motivoRechazo);
  }
}
