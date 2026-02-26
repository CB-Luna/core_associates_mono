import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCuponDto {
  @ApiProperty({ description: 'ID de la promoción' })
  @IsUUID()
  promocionId: string;
}
