import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ProveedoresQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['abogado', 'comida', 'taller', 'lavado', 'capacitacion', 'otro'] })
  @IsOptional()
  @IsString()
  tipo?: string;
}
