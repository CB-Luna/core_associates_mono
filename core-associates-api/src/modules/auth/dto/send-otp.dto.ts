import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '+521234567890', description: 'Número telefónico con código de país' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+52\d{10}$/, { message: 'Formato de teléfono inválido. Use +52 seguido de 10 dígitos' })
  telefono: string;
}
