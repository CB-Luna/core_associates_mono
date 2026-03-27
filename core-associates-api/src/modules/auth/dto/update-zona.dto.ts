import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateZonaDto {
  @ApiPropertyOptional({ example: 19.4326, description: 'Latitud del centro de la zona de operación' })
  @IsOptional()
  @IsNumber()
  zonaLatitud?: number;

  @ApiPropertyOptional({ example: -99.1332, description: 'Longitud del centro de la zona de operación' })
  @IsOptional()
  @IsNumber()
  zonaLongitud?: number;

  @ApiPropertyOptional({ example: 80, minimum: 10, maximum: 300, description: 'Radio de cobertura en kilómetros' })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(300)
  zonaRadioKm?: number;

  @ApiPropertyOptional({ example: 'Ciudad de México', description: 'Nombre del estado o ciudad' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  zonaEstado?: string;

  @ApiPropertyOptional({ example: 'CDMX y Área Metropolitana', description: 'Descripción libre de la zona' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  zonaDescripcion?: string;
}
