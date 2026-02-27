import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum EstadoAsociado {
  pendiente = 'pendiente',
  activo = 'activo',
  suspendido = 'suspendido',
  baja = 'baja',
  rechazado = 'rechazado',
}

export class UpdateEstadoDto {
  @ApiProperty({ enum: EstadoAsociado })
  @IsEnum(EstadoAsociado)
  estado: EstadoAsociado;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motivo?: string;
}
