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
  @ApiProperty({ example: 'Talleres El Rápido S.A. de C.V.' })
  @IsString()
  razonSocial: string;

  @ApiProperty({ enum: TipoProveedor, example: 'taller' })
  @IsEnum(TipoProveedor)
  tipo: TipoProveedor;

  @ApiPropertyOptional({ example: 'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX' })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({ example: 19.3756 })
  @IsOptional()
  @IsNumber()
  latitud?: number;

  @ApiPropertyOptional({ example: -99.1641 })
  @IsOptional()
  @IsNumber()
  longitud?: number;

  @ApiPropertyOptional({ example: '+525512345678' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'contacto@tallereselrapido.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Carlos Méndez' })
  @IsOptional()
  @IsString()
  contactoNombre?: string;
}
