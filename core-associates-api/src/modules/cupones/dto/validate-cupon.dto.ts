import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCuponDto {
  @ApiProperty({ description: 'QR payload JSON string' })
  @IsString()
  payload: string;

  @ApiProperty({ description: 'HMAC signature' })
  @IsString()
  firma: string;
}
