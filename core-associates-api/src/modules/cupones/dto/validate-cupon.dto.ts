import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCuponDto {
  @ApiProperty({ description: 'QR payload JSON string', example: '{"cuponId":"abc-123","asociadoId":"def-456","ts":1719849600}' })
  @IsString()
  payload: string;

  @ApiProperty({ description: 'HMAC signature', example: 'f7a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5' })
  @IsString()
  firma: string;
}
