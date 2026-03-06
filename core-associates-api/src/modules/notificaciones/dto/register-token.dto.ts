import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export class RegisterTokenDto {
  @ApiProperty({ description: 'FCM device token' })
  @IsString()
  token: string;

  @ApiProperty({ enum: ['android', 'ios'] })
  @IsEnum(['android', 'ios'])
  platform: string;
}
