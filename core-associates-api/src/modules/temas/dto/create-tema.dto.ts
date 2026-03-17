import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsObject, MaxLength } from 'class-validator';

export class CreateTemaDto {
  @ApiProperty({ example: 'Mi tema corporativo', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({ example: 'CORPORATIVO', description: 'Sección para agrupar el tema', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  categoria?: string;

  @ApiProperty({ description: 'JSON con colores del tema (primary, secondary, accent, etc.)' })
  @IsObject()
  colores: Record<string, any>;

  @ApiPropertyOptional({ example: 'Inter', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fuente?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  esGlobal?: boolean;
}
