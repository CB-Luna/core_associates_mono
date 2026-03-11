import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum TipoDescuento {
  porcentaje = 'porcentaje',
  monto_fijo = 'monto_fijo',
}

export class CreatePromocionDto {
  @ApiPropertyOptional({ description: 'Requerido para admin/operador, omitido por proveedor (se toma del JWT)' })
  @IsOptional()
  @IsString()
  proveedorId?: string;

  @ApiProperty({ example: '20% en cambio de aceite' })
  @IsString()
  titulo: string;

  @ApiProperty({ example: 'Descuento especial para asociados en cambio de aceite sintético' })
  @IsString()
  descripcion: string;

  @ApiProperty({ enum: TipoDescuento, example: 'porcentaje' })
  @IsEnum(TipoDescuento)
  tipoDescuento: TipoDescuento;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  valorDescuento: number;

  @ApiProperty({ example: '2025-07-01' })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({ example: '2025-12-31' })
  @IsDateString()
  fechaFin: string;

  @ApiProperty({ example: 72, description: 'Horas de vigencia del cupón generado' })
  @IsInt()
  @Min(1)
  vigenciaCupon: number;

  @ApiPropertyOptional({ example: 'Válido solo con cita previa. No acumulable con otras promociones.' })
  @IsOptional()
  @IsString()
  terminos?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxCupones?: number;
}
