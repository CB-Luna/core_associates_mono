import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({ description: 'ID del asociado destinatario' })
  @IsUUID()
  asociadoId: string;

  @ApiProperty({ example: 'Cupón canjeado exitosamente' })
  @IsString()
  titulo: string;

  @ApiProperty({ example: 'Tu cupón de 20% en Talleres El Rápido ha sido canjeado.' })
  @IsString()
  mensaje: string;

  @ApiPropertyOptional({ enum: ['push', 'sms'], default: 'push' })
  @IsOptional()
  @IsEnum(['push', 'sms'])
  canal?: string;

  @ApiPropertyOptional({ description: 'Datos extra para deep linking' })
  @IsOptional()
  data?: Record<string, string>;
}
