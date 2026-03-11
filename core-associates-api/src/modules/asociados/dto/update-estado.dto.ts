import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
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
  estado!: EstadoAsociado;

  @ApiPropertyOptional({ description: 'Requerido cuando estado es rechazado o suspendido', example: 'Documentación incompleta' })
  @ValidateIf((o) => o.estado === 'rechazado' || o.estado === 'suspendido')
  @IsString()
  motivo?: string;
}
