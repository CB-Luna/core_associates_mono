import { Controller, Get, Put, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../../common/guards/permisos.guard';
import { Permisos } from '../../common/decorators/permisos.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificacionesCrmService } from './notificaciones-crm.service';
import { NotificacionesCrmQueryDto } from './dto/notificaciones-crm-query.dto';

@ApiTags('Notificaciones CRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('notificaciones-crm')
export class NotificacionesCrmController {
  constructor(private readonly notificacionesCrmService: NotificacionesCrmService) {}

  @Get()
  @Permisos('notificaciones-crm:ver')
  @ApiOperation({ summary: 'Bandeja de notificaciones del usuario' })
  @ApiResponse({ status: 200, description: 'Lista paginada de notificaciones' })
  findAll(
    @CurrentUser('id') usuarioId: string,
    @Query() query: NotificacionesCrmQueryDto,
  ) {
    return this.notificacionesCrmService.findAll(usuarioId, query);
  }

  @Get('no-leidas/count')
  @Permisos('notificaciones-crm:ver')
  @ApiOperation({ summary: 'Contador de notificaciones no leídas' })
  @ApiResponse({ status: 200, description: 'Contador' })
  countNoLeidas(@CurrentUser('id') usuarioId: string) {
    return this.notificacionesCrmService.countNoLeidas(usuarioId);
  }

  @Put(':id/leer')
  @Permisos('notificaciones-crm:marcar-leida')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  marcarLeida(
    @Param('id') id: string,
    @CurrentUser('id') usuarioId: string,
  ) {
    return this.notificacionesCrmService.marcarLeida(id, usuarioId);
  }

  @Put('leer-todas')
  @Permisos('notificaciones-crm:marcar-leida')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  @ApiResponse({ status: 200, description: 'Todas marcadas como leídas' })
  marcarTodasLeidas(@CurrentUser('id') usuarioId: string) {
    return this.notificacionesCrmService.marcarTodasLeidas(usuarioId);
  }
}
