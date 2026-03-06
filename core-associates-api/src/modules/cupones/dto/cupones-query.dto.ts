import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CuponesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['activo', 'canjeado', 'vencido', 'cancelado'] })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proveedorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  desde?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hasta?: string;
}
