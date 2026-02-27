import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum EstadoDocumento {
  aprobado = 'aprobado',
  rechazado = 'rechazado',
}

export class UpdateDocumentEstadoDto {
  @ApiProperty({ enum: EstadoDocumento })
  @IsEnum(EstadoDocumento)
  estado: EstadoDocumento;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motivoRechazo?: string;
}
