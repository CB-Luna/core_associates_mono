import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RechazarAsignacionDto {
  @ApiPropertyOptional({ description: 'Motivo del rechazo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}
