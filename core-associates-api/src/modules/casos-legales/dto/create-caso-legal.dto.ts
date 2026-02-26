import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCasoLegalDto {
  @ApiProperty({ enum: ['accidente', 'infraccion', 'robo', 'asalto', 'otro'] })
  @IsEnum(['accidente', 'infraccion', 'robo', 'asalto', 'otro'])
  tipoPercance: string;

  @ApiPropertyOptional({ example: 'Choque por alcance en Insurgentes' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: 19.4326 })
  @IsNumber()
  latitud: number;

  @ApiProperty({ example: -99.1332 })
  @IsNumber()
  longitud: number;

  @ApiPropertyOptional({ example: 'Av. Insurgentes Sur #1234' })
  @IsOptional()
  @IsString()
  direccionAprox?: string;
}
