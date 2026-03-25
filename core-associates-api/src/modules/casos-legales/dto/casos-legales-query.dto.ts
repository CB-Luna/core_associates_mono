import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CasosLegalesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['abierto', 'en_atencion', 'escalado', 'resuelto', 'cerrado', 'cancelado'] })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({ enum: ['baja', 'media', 'alta', 'urgente'] })
  @IsOptional()
  @IsString()
  prioridad?: string;

  @ApiPropertyOptional({ description: 'Fecha desde (ISO 8601)', example: '2025-01-01' })
  @IsOptional()
  @IsString()
  fechaDesde?: string;

  @ApiPropertyOptional({ description: 'Fecha hasta (ISO 8601)', example: '2025-12-31' })
  @IsOptional()
  @IsString()
  fechaHasta?: string;
}
