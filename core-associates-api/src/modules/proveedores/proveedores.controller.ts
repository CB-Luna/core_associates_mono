import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProveedoresService } from './proveedores.service';

@ApiTags('Proveedores')
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}
}
