import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class BulkAssignUsersDto {
  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description: 'IDs de usuarios a asignar a este rol',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  usuarioIds: string[];
}
