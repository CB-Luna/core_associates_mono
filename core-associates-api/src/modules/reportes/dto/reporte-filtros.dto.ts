import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class ReporteFiltrosDto {
  @ApiPropertyOptional({ description: 'Fecha inicio (ISO string)', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ description: 'Fecha fin (ISO string)', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  hasta?: string;
}
