import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePrioridadCasoDto {
  @ApiProperty({ enum: ['baja', 'media', 'alta', 'urgente'] })
  @IsEnum(['baja', 'media', 'alta', 'urgente'])
  prioridad!: string;
}
