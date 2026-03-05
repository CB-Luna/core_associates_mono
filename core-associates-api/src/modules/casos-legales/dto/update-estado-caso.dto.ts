import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEstadoCasoDto {
  @ApiProperty({ enum: ['abierto', 'en_atencion', 'escalado', 'resuelto', 'cerrado', 'cancelado'] })
  @IsEnum(['abierto', 'en_atencion', 'escalado', 'resuelto', 'cerrado', 'cancelado'])
  estado: string;
}
