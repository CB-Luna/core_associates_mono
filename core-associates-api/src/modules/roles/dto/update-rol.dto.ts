import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional } from 'class-validator';

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
}
