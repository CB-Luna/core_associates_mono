import { IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CambiarEstadoAbogadoDto {
  @ApiProperty({ description: 'Nuevo estado (limitado)', enum: ['en_atencion', 'escalado', 'resuelto'] })
  @IsString()
  @IsIn(['en_atencion', 'escalado', 'resuelto'])
  estado: 'en_atencion' | 'escalado' | 'resuelto';
}
