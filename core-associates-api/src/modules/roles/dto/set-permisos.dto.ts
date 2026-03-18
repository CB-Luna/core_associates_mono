import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SetPermisosDto {
  @ApiProperty({
    example: ['dashboard:ver', 'asociados:ver', 'asociados:editar'],
    description: 'Lista de códigos de permisos a asignar al rol (reemplaza los existentes)',
  })
  @IsArray()
  @IsString({ each: true })
  permisos: string[];
}
