import { Controller, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
  @ApiResponse({ status: 200, description: 'Vehículo actualizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No es dueño del vehículo' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVehiculoDto,
    @CurrentUser('id') asociadoId: string,
  ) {
    return this.vehiculosService.update(id, asociadoId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar vehículo propio' })
  @ApiResponse({ status: 200, description: 'Vehículo eliminado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No es dueño del vehículo' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') asociadoId: string,
  ) {
    return this.vehiculosService.remove(id, asociadoId);
  }
}
