import { IsString, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PreguntarDto {
  @ApiProperty({ description: 'Pregunta del usuario', example: '¿Cuántos asociados hay?' })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  pregunta: string;

  @ApiPropertyOptional({ description: 'Usar modo avanzado (IA)', default: false })
  @IsOptional()
  @IsBoolean()
  modoAvanzado?: boolean;
}
