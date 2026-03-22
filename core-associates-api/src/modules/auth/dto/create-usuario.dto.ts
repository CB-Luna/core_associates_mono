import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MinLength, ValidateIf } from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'operador@core.mx' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ example: 'SecurePassword123' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, { message: 'La contraseña debe incluir mayúscula, minúscula y número' })
  password!: string;

  @ApiPropertyOptional({ enum: ['admin', 'operador', 'proveedor'], default: 'operador', description: 'Rol legacy (ignorado si se envía rolId)' })
  @ValidateIf((o) => !o.rolId)
  @IsEnum(['admin', 'operador', 'proveedor'])
  rol: string = 'operador';

  @ApiPropertyOptional({ description: 'UUID del rol a asignar (preferido sobre campo rol)' })
  @IsOptional()
  @IsUUID()
  rolId?: string;

  @ApiPropertyOptional({ description: 'ID del proveedor a vincular (requerido si rol=proveedor)' })
  @IsOptional()
  @IsUUID()
  proveedorId?: string;

  @ApiPropertyOptional({ description: 'Especialidad del abogado (solo aplica para rol abogado)' })
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
