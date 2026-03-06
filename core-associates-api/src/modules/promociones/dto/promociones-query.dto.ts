import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class PromocionesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['activa', 'pausada', 'finalizada'] })
  @IsOptional()
  @IsString()
  estado?: string;
}
