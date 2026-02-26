import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '+521234567890' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+52\d{10}$/, { message: 'Formato de teléfono inválido' })
  telefono: string;

  @ApiProperty({ example: '123456', description: 'Código OTP de 6 dígitos' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'El OTP debe ser de 6 dígitos' })
  otp: string;
}
