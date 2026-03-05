import { Controller, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VehiculosService } from './vehiculos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';

@ApiTags('Vehículos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar vehículo propio' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVehiculoDto,
    @CurrentUser('id') asociadoId: string,
  ) {
    return this.vehiculosService.update(id, asociadoId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar vehículo propio' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') asociadoId: string,
  ) {
    return this.vehiculosService.remove(id, asociadoId);
  }
}
