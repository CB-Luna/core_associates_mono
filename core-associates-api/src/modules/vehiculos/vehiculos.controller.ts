import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VehiculosService } from './vehiculos.service';

@ApiTags('Vehículos')
@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}
}
