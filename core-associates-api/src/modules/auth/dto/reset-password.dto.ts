import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'NuevaPassword123' })
  @IsString()
  @MinLength(6)
  password!: string;
}
