import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, IsBoolean, Matches } from 'class-validator';

export class CreateRolDto {
  @ApiProperty({ example: 'supervisor' })
  @IsString()
  @MinLength(2)
  nombre: string;

  @ApiPropertyOptional({ example: 'Rol de supervisor con permisos limitados' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: 'Shield', description: 'Nombre de ícono Lucide' })
  @IsOptional()
  @IsString()
  icono?: string;

  @ApiPropertyOptional({ example: '#3B82F6', description: 'Color hex del rol' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color debe ser un hex válido (#RRGGBB)' })
  color?: string;

  @ApiPropertyOptional({ example: false, description: 'Rol asignado por defecto a nuevos usuarios' })
  @IsOptional()
  @IsBoolean()
  esPorDefecto?: boolean;
}
