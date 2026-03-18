import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateRolDto {
  @ApiProperty({ example: 'supervisor' })
  @IsString()
  @MinLength(2)
  nombre: string;

  @ApiPropertyOptional({ example: 'Rol de supervisor con permisos limitados' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}
