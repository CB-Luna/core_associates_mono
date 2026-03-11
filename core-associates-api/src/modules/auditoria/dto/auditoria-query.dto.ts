import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class AuditoriaQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por entidad', example: 'asociado' })
  @IsOptional()
  @IsString()
  entidad?: string;

  @ApiPropertyOptional({ description: 'Filtrar por acción', example: 'CREAR' })
  @IsOptional()
  @IsString()
  accion?: string;

  @ApiPropertyOptional({ description: 'Fecha inicio', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ description: 'Fecha fin', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  hasta?: string;
}
