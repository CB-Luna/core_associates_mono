import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AsignarAbogadoDto {
  @ApiProperty({ description: 'ID del proveedor tipo abogado', example: 'uuid-abogado' })
  @IsUUID()
  abogadoId: string;
}
