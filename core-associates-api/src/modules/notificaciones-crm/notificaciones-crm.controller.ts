import { Controller, Get, Put, Param, Query, Sse, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../../common/guards/permisos.guard';
import { Permisos } from '../../common/decorators/permisos.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificacionesCrmService } from './notificaciones-crm.service';
import { NotificacionesCrmQueryDto } from './dto/notificaciones-crm-query.dto';

@ApiTags('Notificaciones CRM')
@ApiBearerAuth()
@Controller('notificaciones-crm')
export class NotificacionesCrmController {
  constructor(
    private readonly notificacionesCrmService: NotificacionesCrmService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermisosGuard)
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
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @Permisos('notificaciones-crm:ver')
  @ApiOperation({ summary: 'Contador de notificaciones no leídas' })
  @ApiResponse({ status: 200, description: 'Contador' })
  countNoLeidas(@CurrentUser('id') usuarioId: string) {
    return this.notificacionesCrmService.countNoLeidas(usuarioId);
  }

  @Put(':id/leer')
  @UseGuards(JwtAuthGuard, PermisosGuard)
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
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @Permisos('notificaciones-crm:marcar-leida')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  @ApiResponse({ status: 200, description: 'Todas marcadas como leídas' })
  marcarTodasLeidas(@CurrentUser('id') usuarioId: string) {
    return this.notificacionesCrmService.marcarTodasLeidas(usuarioId);
  }

  @Sse('stream')
  @ApiOperation({ summary: 'Stream SSE de notificaciones en tiempo real' })
  @ApiQuery({ name: 'token', required: true, description: 'JWT access token' })
  streamNotificaciones(@Query('token') token: string): Observable<MessageEvent> {
    let payload: { id: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
    return this.notificacionesCrmService.getStream(payload.id);
  }
}
