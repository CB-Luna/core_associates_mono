import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotaAsociadoDto {
  @ApiProperty({ example: 'Se verificó documentación y se aprobó membresía' })
  @IsString()
  contenido!: string;

  @ApiPropertyOptional({ enum: ['nota', 'cambio_estado'] })
  @IsOptional()
  @IsIn(['nota', 'cambio_estado'])
  tipo?: string;
}
