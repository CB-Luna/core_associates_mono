import { IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CambiarEstadoAbogadoDto {
  @ApiProperty({ description: 'Nuevo estado (limitado)', enum: ['en_atencion', 'escalado'] })
  @IsString()
  @IsIn(['en_atencion', 'escalado'])
  estado: 'en_atencion' | 'escalado';
}
