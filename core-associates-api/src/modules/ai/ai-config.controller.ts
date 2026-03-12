import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateAiConfigDto, UpdateAiConfigDto } from './dto/ai-config.dto';

@ApiTags('AI Config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('ai/config')
export class AiConfigController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar configuraciones de IA' })
  async findAll() {
    const configs = await this.prisma.configuracionIA.findMany({
      orderBy: { createdAt: 'asc' },
    });
    // Mask API keys for security
    return configs.map((c) => ({
      ...c,
      apiKey: c.apiKey ? '••••' + c.apiKey.slice(-8) : null,
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener configuración de IA por ID' })
  async findOne(@Param('id') id: string) {
    const config = await this.prisma.configuracionIA.findUniqueOrThrow({
      where: { id },
    });
    return {
      ...config,
      apiKey: config.apiKey ? '••••' + config.apiKey.slice(-8) : null,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Crear configuración de IA' })
  async create(@Body() dto: CreateAiConfigDto) {
    return this.prisma.configuracionIA.create({
      data: {
        clave: dto.clave,
        nombre: dto.nombre,
        provider: dto.provider,
        modelo: dto.modelo,
        apiKey: dto.apiKey || null,
        promptSistema: dto.promptSistema || null,
        temperatura: dto.temperatura ?? 0.3,
        maxTokens: dto.maxTokens ?? 4096,
      },
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar configuración de IA' })
  async update(@Param('id') id: string, @Body() dto: UpdateAiConfigDto) {
    const data: any = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.provider !== undefined) data.provider = dto.provider;
    if (dto.modelo !== undefined) data.modelo = dto.modelo;
    if (dto.apiKey !== undefined) data.apiKey = dto.apiKey;
    if (dto.promptSistema !== undefined) data.promptSistema = dto.promptSistema;
    if (dto.temperatura !== undefined) data.temperatura = dto.temperatura;
    if (dto.maxTokens !== undefined) data.maxTokens = dto.maxTokens;
    if (dto.activo !== undefined) data.activo = dto.activo;

    return this.prisma.configuracionIA.update({
      where: { id },
      data,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar configuración de IA' })
  async remove(@Param('id') id: string) {
    await this.prisma.configuracionIA.delete({ where: { id } });
    return { message: 'Configuración eliminada' };
  }
}
