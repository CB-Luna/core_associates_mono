import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MenuItemOrdenDto {
  @ApiProperty({ description: 'ID del módulo de menú' })
  @IsUUID()
  moduloMenuId: string;

  @ApiProperty({ example: 0, description: 'Orden del item para este rol' })
  @IsInt()
  @Min(0)
  orden: number;
}

export class SetMenuItemsDto {
  @ApiProperty({
    type: [MenuItemOrdenDto],
    description: 'Items de menú a asignar al rol (reemplaza los existentes)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemOrdenDto)
  items: MenuItemOrdenDto[];
}
