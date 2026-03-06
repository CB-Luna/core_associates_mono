import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
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
  registerToken(
    @CurrentUser('id') asociadoId: string,
    @Body() dto: RegisterTokenDto,
  ) {
    return this.notificacionesService.registerToken(asociadoId, dto);
  }

  @Delete('remove-token')
  @ApiOperation({ summary: 'Desactivar token FCM' })
  removeToken(
    @CurrentUser('id') asociadoId: string,
    @Body('token') token: string,
  ) {
    return this.notificacionesService.removeToken(asociadoId, token);
  }

  @Post('send')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Enviar notificación a un asociado (admin/operador)' })
  send(@Body() dto: SendNotificationDto) {
    return this.notificacionesService.send(dto);
  }
}
