import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../../common/guards/permisos.guard';
import { Permisos } from '../../common/decorators/permisos.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { PreguntarDto } from './dto/preguntar.dto';
import { AsistenteIaService } from './asistente-ia.service';

@ApiTags('Asistente IA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('asistente')
export class AsistenteIaController {
  constructor(
    private readonly service: AsistenteIaService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Estado del chatbot (flags globales para el widget).
   * Solo requiere asistente:ver — NO ia:configurar.
   */
  @Get('chatbot-status')
  @Permisos('asistente:ver')
  @ApiOperation({ summary: 'Estado del chatbot (flags públicos)' })
  async chatbotStatus() {
    const fallback = { chatbotActivo: true, modoAvanzadoDisponible: true, maxPreguntasPorHora: 20 };
    try {
      const config = await this.prisma.configuracionIA.findUnique({
        where: { clave: 'chatbot_assistant' },
        select: {
          activo: true,
          chatbotActivo: true,
          modoAvanzadoDisponible: true,
          maxPreguntasPorHora: true,
        },
      });
      if (!config) return fallback;
      return {
        chatbotActivo: config.activo && config.chatbotActivo,
        modoAvanzadoDisponible: config.modoAvanzadoDisponible,
        maxPreguntasPorHora: config.maxPreguntasPorHora,
      };
    } catch {
      return fallback;
    }
  }

  @Post('preguntar')
  @Permisos('asistente:ver')
  @ApiOperation({ summary: 'Enviar pregunta al asistente' })
  @ApiResponse({ status: 200, description: 'Respuesta del asistente' })
  @ApiResponse({ status: 403, description: 'Sin permiso' })
  async preguntar(
    @Body() dto: PreguntarDto,
    @CurrentUser() user: { id: string; permisos: string[] },
  ) {
    // Auto-escalation: service decides based on user permissions (toggle removed)
    return this.service.preguntar(
      dto.pregunta,
      false, // ignored — service auto-escalates if user has permission
      user.id,
      user.permisos ?? [],
    );
  }
}
