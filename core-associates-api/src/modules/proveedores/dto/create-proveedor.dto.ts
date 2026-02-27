import { IsString, IsEnum, IsOptional, IsEmail, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum TipoProveedor {
  abogado = 'abogado',
  comida = 'comida',
  taller = 'taller',
  lavado = 'lavado',
  capacitacion = 'capacitacion',
  otro = 'otro',
}

export class CreateProveedorDto {
  @ApiProperty()
  @IsString()
  razonSocial: string;

  @ApiProperty({ enum: TipoProveedor })
  @IsEnum(TipoProveedor)
  tipo: TipoProveedor;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitud?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitud?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactoNombre?: string;
}
