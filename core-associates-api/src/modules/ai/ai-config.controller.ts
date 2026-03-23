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
import { PermisosGuard } from '../../common/guards/permisos.guard';
import { Permisos } from '../../common/decorators/permisos.decorator';
import { CreateAiConfigDto, UpdateAiConfigDto } from './dto/ai-config.dto';
import { encryptApiKey, isEncrypted } from '../../common/utils/crypto.util';

@ApiTags('AI Config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Permisos('ia:configurar')
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
      apiKey: c.apiKey ? (isEncrypted(c.apiKey) ? '🔒 ••••(cifrada)' : '••••' + c.apiKey.slice(-8)) : null,
    }));
  }

  /**
   * Endpoint ligero para el ChatWidget: devuelve solo flags del chatbot.
   * Requiere JWT pero no requiere permiso ia:configurar (cualquier usuario con sesión).
   * IMPORTANTE: debe ir ANTES de :id para que NestJS no lo capture como param.
   */
  @Get('chatbot-status')
  @Permisos() // Solo JWT, sin permiso específico
  @ApiOperation({ summary: 'Estado del chatbot (flags públicos)' })
  async chatbotStatus() {
    const config = await this.prisma.configuracionIA.findUnique({
      where: { clave: 'chatbot_assistant' },
      select: {
        activo: true,
        chatbotActivo: true,
        modoAvanzadoDisponible: true,
        maxPreguntasPorHora: true,
      },
    });
    if (!config) {
      return { chatbotActivo: false, modoAvanzadoDisponible: false, maxPreguntasPorHora: 20 };
    }
    return {
      chatbotActivo: config.activo && config.chatbotActivo,
      modoAvanzadoDisponible: config.modoAvanzadoDisponible,
      maxPreguntasPorHora: config.maxPreguntasPorHora,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener configuración de IA por ID' })
  async findOne(@Param('id') id: string) {
    const config = await this.prisma.configuracionIA.findUniqueOrThrow({
      where: { id },
    });
    return {
      ...config,
      apiKey: config.apiKey ? (isEncrypted(config.apiKey) ? '🔒 ••••(cifrada)' : '••••' + config.apiKey.slice(-8)) : null,
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
        apiKey: dto.apiKey ? encryptApiKey(dto.apiKey) : null,
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
    if (dto.apiKey !== undefined) data.apiKey = dto.apiKey ? encryptApiKey(dto.apiKey) : dto.apiKey;
    if (dto.promptSistema !== undefined) data.promptSistema = dto.promptSistema;
    if (dto.temperatura !== undefined) data.temperatura = dto.temperatura;
    if (dto.maxTokens !== undefined) data.maxTokens = dto.maxTokens;
    if (dto.activo !== undefined) data.activo = dto.activo;
    if (dto.chatbotActivo !== undefined) data.chatbotActivo = dto.chatbotActivo;
    if (dto.modoAvanzadoDisponible !== undefined) data.modoAvanzadoDisponible = dto.modoAvanzadoDisponible;
    if (dto.maxPreguntasPorHora !== undefined) data.maxPreguntasPorHora = dto.maxPreguntasPorHora;

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
