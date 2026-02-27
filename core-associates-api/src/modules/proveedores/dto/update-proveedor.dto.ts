import { PartialType } from '@nestjs/swagger';
import { CreateProveedorDto } from './create-proveedor.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

enum EstadoProveedor {
  activo = 'activo',
  inactivo = 'inactivo',
}

export class UpdateProveedorDto extends PartialType(CreateProveedorDto) {
  @ApiPropertyOptional({ enum: EstadoProveedor })
  @IsOptional()
  @IsEnum(EstadoProveedor)
  estado?: EstadoProveedor;
}
