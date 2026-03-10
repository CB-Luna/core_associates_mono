import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MinLength } from 'class-validator';

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

  @ApiPropertyOptional({ enum: ['admin', 'operador', 'proveedor'], default: 'operador' })
  @IsEnum(['admin', 'operador', 'proveedor'])
  rol: string = 'operador';

  @ApiPropertyOptional({ description: 'ID del proveedor a vincular (requerido si rol=proveedor)' })
  @IsOptional()
  @IsUUID()
  proveedorId?: string;
}
