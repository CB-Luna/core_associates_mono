import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AsignarAbogadoDto {
  @ApiProperty({ description: 'ID del usuario con rol abogado' })
  @IsUUID()
  abogadoUsuarioId: string;

  @ApiPropertyOptional({ description: 'ID del proveedor/firma (legacy, se deriva automáticamente)' })
  @IsOptional()
  @IsUUID()
  abogadoId?: string;
}
