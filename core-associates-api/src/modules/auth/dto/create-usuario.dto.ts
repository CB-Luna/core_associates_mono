import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

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
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ enum: ['admin', 'operador'], default: 'operador' })
  @IsEnum(['admin', 'operador'])
  rol: string = 'operador';
}
