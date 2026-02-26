import { IsString, IsInt, IsOptional, IsBoolean, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehiculoDto {
  @ApiProperty({ example: 'Nissan' })
  @IsString()
  @MaxLength(50)
  marca: string;

  @ApiProperty({ example: 'Versa' })
  @IsString()
  @MaxLength(50)
  modelo: string;

  @ApiProperty({ example: 2022 })
  @IsInt()
  @Min(1990)
  @Max(2030)
  anio: number;

  @ApiProperty({ example: 'Blanco' })
  @IsString()
  @MaxLength(30)
  color: string;

  @ApiProperty({ example: 'ABC-123-D' })
  @IsString()
  @MaxLength(15)
  placas: string;

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
