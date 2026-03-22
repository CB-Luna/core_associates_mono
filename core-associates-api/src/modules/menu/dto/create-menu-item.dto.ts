import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'nuevo-modulo', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  codigo: string;

  @ApiProperty({ example: 'Nuevo Módulo', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  titulo: string;

  @ApiPropertyOptional({ example: '/nuevo-modulo', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ruta?: string;

  @ApiPropertyOptional({ example: 'FileText', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icono?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @ApiPropertyOptional({ enum: ['enlace', 'seccion', 'separador'], default: 'enlace' })
  @IsOptional()
  @IsEnum(['enlace', 'seccion', 'separador'])
  tipo?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @ApiPropertyOptional({ description: 'UUID del item padre (para sub-menús)' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
