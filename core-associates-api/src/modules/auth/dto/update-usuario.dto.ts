import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ example: 'nuevo@core.mx' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Nuevo Nombre' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ enum: ['admin', 'operador', 'proveedor'] })
  @IsOptional()
  @IsEnum(['admin', 'operador', 'proveedor'])
  rol?: string;

  @ApiPropertyOptional({ description: 'UUID del rol a asignar (preferido sobre campo rol)' })
  @IsOptional()
  @IsUUID()
  rolId?: string;

  @ApiPropertyOptional({ enum: ['activo', 'inactivo'] })
  @IsOptional()
  @IsEnum(['activo', 'inactivo'])
  estado?: string;

  @ApiPropertyOptional({ example: 'penal', description: 'Especialidad del abogado' })
  @IsOptional()
  @IsString()
  especialidad?: string;

  @ApiPropertyOptional({ description: 'Cédula profesional del abogado' })
  @IsOptional()
  @IsString()
  cedulaProfesional?: string;

  @ApiPropertyOptional({ description: 'Teléfono directo del abogado' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ description: 'Dirección de contacto del abogado' })
  @IsOptional()
  @IsString()
  direccion?: string;
}
