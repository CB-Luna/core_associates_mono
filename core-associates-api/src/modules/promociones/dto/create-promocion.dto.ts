import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum TipoDescuento {
  porcentaje = 'porcentaje',
  monto_fijo = 'monto_fijo',
}

export class CreatePromocionDto {
  @ApiProperty()
  @IsString()
  proveedorId: string;

  @ApiProperty()
  @IsString()
  titulo: string;

  @ApiProperty()
  @IsString()
  descripcion: string;

  @ApiProperty({ enum: TipoDescuento })
  @IsEnum(TipoDescuento)
  tipoDescuento: TipoDescuento;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  valorDescuento: number;

  @ApiProperty()
  @IsDateString()
  fechaInicio: string;

  @ApiProperty()
  @IsDateString()
  fechaFin: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  vigenciaCupon: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  terminos?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxCupones?: number;
}
