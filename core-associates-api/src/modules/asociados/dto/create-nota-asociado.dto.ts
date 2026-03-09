import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotaAsociadoDto {
  @ApiProperty()
  @IsString()
  contenido!: string;

  @ApiPropertyOptional({ enum: ['nota', 'cambio_estado'] })
  @IsOptional()
  @IsIn(['nota', 'cambio_estado'])
  tipo?: string;
}
