import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../../common/guards/permisos.guard';
import { Permisos } from '../../common/decorators/permisos.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificacionesService } from './notificaciones.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Post('register-token')
  @ApiOperation({ summary: 'Registrar token FCM del dispositivo' })
  @ApiResponse({ status: 201, description: 'Token registrado' })
  @ApiResponse({ status: 400, description: 'Token inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  registerToken(
    @CurrentUser('id') asociadoId: string,
    @Body() dto: RegisterTokenDto,
  ) {
    return this.notificacionesService.registerToken(asociadoId, dto);
  }

  @Delete('remove-token')
  @ApiOperation({ summary: 'Desactivar token FCM' })
  @ApiResponse({ status: 200, description: 'Token desactivado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  removeToken(
    @CurrentUser('id') asociadoId: string,
    @Body('token') token: string,
  ) {
    return this.notificacionesService.removeToken(asociadoId, token);
  }

  @Post('send')
  @UseGuards(PermisosGuard)
  @Permisos('notificaciones:enviar')
  @ApiOperation({ summary: 'Enviar notificación a un asociado (admin/operador)' })
  @ApiResponse({ status: 200, description: 'Notificación enviada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  send(@Body() dto: SendNotificationDto) {
    return this.notificacionesService.send(dto);
  }
}
