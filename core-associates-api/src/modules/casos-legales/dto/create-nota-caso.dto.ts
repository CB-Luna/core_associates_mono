import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotaCasoDto {
  @ApiProperty({ example: 'Se contactó al asociado para seguimiento' })
  @IsString()
  @MinLength(1)
  contenido: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  esPrivada?: boolean;
}
