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
}
