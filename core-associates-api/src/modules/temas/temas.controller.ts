import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, UseGuards, ParseUUIDPipe,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { TemasService } from './temas.service';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../../common/guards/permisos.guard';
import { Permisos } from '../../common/decorators/permisos.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateTemaDto } from './dto/create-tema.dto';
import { UpdateTemaDto } from './dto/update-tema.dto';

const BUCKET = 'core-associates-themes';

@ApiTags('Temas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('temas')
export class TemasController {
  constructor(
    private readonly temasService: TemasService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los temas' })
  findAll() {
    return this.temasService.findAll();
  }

  @Get('mi-tema')
  @ApiOperation({ summary: 'Obtener tema asignado al usuario actual (o el global)' })
  getMiTema(@CurrentUser('id') userId: string) {
    return this.temasService.getMiTema(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tema por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.temasService.findOne(id);
  }

  @Post()
  @UseGuards(PermisosGuard)
  @Permisos('temas:gestionar')
  @ApiOperation({ summary: 'Crear un tema' })
  create(@Body() dto: CreateTemaDto, @CurrentUser('id') userId: string) {
    return this.temasService.create(dto, userId);
  }

  @Put(':id')
  @UseGuards(PermisosGuard)
  @Permisos('temas:gestionar')
  @ApiOperation({ summary: 'Actualizar un tema' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTemaDto) {
    return this.temasService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(PermisosGuard)
  @Permisos('temas:gestionar')
  @ApiOperation({ summary: 'Eliminar un tema' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.temasService.remove(id);
  }

  @Post(':id/logo')
  @UseGuards(PermisosGuard)
  @Permisos('temas:gestionar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir logo para un tema' })
  async uploadLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const key = `${id}/logo-${Date.now()}.${file.originalname.split('.').pop()}`;
    await this.storageService.uploadFile(BUCKET, key, file.buffer, file.mimetype);
    return this.temasService.updateLogo(id, key);
  }

  @Patch('asignar/:userId')
  @UseGuards(PermisosGuard)
  @Permisos('temas:gestionar')
  @ApiOperation({ summary: 'Asignar tema a un usuario (null para usar global)' })
  asignarTema(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: { temaId: string | null },
  ) {
    return this.temasService.asignarTema(userId, body.temaId);
  }
}
