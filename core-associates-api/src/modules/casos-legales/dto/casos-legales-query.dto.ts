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
}
