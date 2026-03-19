import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const TIPOS_DOCUMENTO = ['ine_frente', 'ine_reverso', 'selfie', 'tarjeta_circulacion'] as const;

export class PreValidarDocumentoDto {
  @ApiProperty({
    enum: TIPOS_DOCUMENTO,
    example: 'ine_frente',
    description: 'Tipo de documento esperado',
  })
  @IsEnum(TIPOS_DOCUMENTO)
  tipo: (typeof TIPOS_DOCUMENTO)[number];
}
