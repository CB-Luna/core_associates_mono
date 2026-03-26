import { IsEnum, IsString, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum EstadoDocumento {
  aprobado = 'aprobado',
  rechazado = 'rechazado',
  pendiente = 'pendiente',
}

export class UpdateDocumentEstadoDto {
  @ApiProperty({ enum: EstadoDocumento })
  @IsEnum(EstadoDocumento)
  estado!: EstadoDocumento;

  @ApiPropertyOptional({ description: 'Requerido cuando estado es rechazado' })
  @ValidateIf((o) => o.estado === 'rechazado')
  @IsString()
  motivoRechazo?: string;
}
