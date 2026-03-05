import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ example: 'nuevo@core.mx' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Nuevo Nombre' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ enum: ['admin', 'operador'] })
  @IsOptional()
  @IsEnum(['admin', 'operador'])
  rol?: string;

  @ApiPropertyOptional({ enum: ['activo', 'inactivo'] })
  @IsOptional()
  @IsEnum(['activo', 'inactivo'])
  estado?: string;
}
