import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, IsBoolean, IsUUID, Matches } from 'class-validator';

export class UpdateRolDto {
  @ApiPropertyOptional({ example: 'supervisor' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Rol de supervisor actualizado' })
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

  @ApiPropertyOptional({ description: 'UUID del tema de color por defecto para usuarios con este rol' })
  @IsOptional()
  @IsUUID()
  temaIdPorDefecto?: string;
}
