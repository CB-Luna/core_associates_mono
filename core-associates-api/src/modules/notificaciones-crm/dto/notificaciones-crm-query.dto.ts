import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class NotificacionesCrmQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por leída/no leída' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  leida?: boolean;
}
