import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class AsociadosQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['pendiente', 'activo', 'suspendido', 'baja', 'rechazado'] })
  @IsOptional()
  @IsString()
  estado?: string;
}
