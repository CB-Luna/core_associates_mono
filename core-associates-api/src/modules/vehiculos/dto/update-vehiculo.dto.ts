import { IsString, IsInt, IsOptional, IsBoolean, MaxLength, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVehiculoDto {
  @ApiPropertyOptional({ example: 'Nissan' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  marca?: string;

  @ApiPropertyOptional({ example: 'Versa' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  modelo?: string;

  @ApiPropertyOptional({ example: 2022 })
  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(2030)
  anio?: number;

  @ApiPropertyOptional({ example: 'Blanco' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  color?: string;

  @ApiPropertyOptional({ example: 'ABC-123-D' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  placas?: string;

  @ApiPropertyOptional({ example: '3N1CN7AD0NL000001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  numeroSerie?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;
}
