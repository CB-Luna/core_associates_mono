import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'NuevaPassword123' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, { message: 'La contraseña debe incluir mayúscula, minúscula y número' })
  password!: string;
}
