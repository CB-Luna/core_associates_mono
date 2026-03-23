import {
  Controller,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../../common/guards/permisos.guard';
import { Permisos } from '../../common/decorators/permisos.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PreguntarDto } from './dto/preguntar.dto';
import { AsistenteIaService } from './asistente-ia.service';

@ApiTags('Asistente IA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('asistente')
export class AsistenteIaController {
  constructor(private readonly service: AsistenteIaService) {}

  @Post('preguntar')
  @Permisos('asistente:ver')
  @ApiOperation({ summary: 'Enviar pregunta al asistente' })
  @ApiResponse({ status: 200, description: 'Respuesta del asistente' })
  @ApiResponse({ status: 403, description: 'Sin permiso' })
  async preguntar(
    @Body() dto: PreguntarDto,
    @CurrentUser() user: { id: string; permisos: string[] },
  ) {
    // Validate advanced mode permission
    if (dto.modoAvanzado && !user.permisos?.includes('asistente:modo-avanzado')) {
      throw new ForbiddenException('No tienes permiso para el modo avanzado.');
    }

    return this.service.preguntar(
      dto.pregunta,
      dto.modoAvanzado ?? false,
    );
  }
}
