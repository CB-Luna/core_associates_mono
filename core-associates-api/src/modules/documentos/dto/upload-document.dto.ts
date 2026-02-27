import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum TipoDocumento {
  ine_frente = 'ine_frente',
  ine_reverso = 'ine_reverso',
  selfie = 'selfie',
  tarjeta_circulacion = 'tarjeta_circulacion',
  otro = 'otro',
}

export class UploadDocumentDto {
  @ApiProperty({ enum: TipoDocumento })
  @IsEnum(TipoDocumento)
  tipo: TipoDocumento;
}
