import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AsociadosService } from './asociados.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateAsociadoDto } from './dto/update-asociado.dto';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';

@ApiTags('Asociados')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('asociados')
export class AsociadosController {
  constructor(private readonly asociadosService: AsociadosService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del asociado actual' })
  getMyProfile(@CurrentUser('id') asociadoId: string) {
    return this.asociadosService.getMyProfile(asociadoId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Actualizar perfil del asociado actual' })
  updateMyProfile(
    @CurrentUser('id') asociadoId: string,
    @Body() dto: UpdateAsociadoDto,
  ) {
    return this.asociadosService.updateMyProfile(asociadoId, dto);
  }

  @Get('me/vehiculos')
  @ApiOperation({ summary: 'Listar vehículos del asociado actual' })
  getMyVehiculos(@CurrentUser('id') asociadoId: string) {
    return this.asociadosService.getMyVehiculos(asociadoId);
  }

  @Post('me/vehiculos')
  @ApiOperation({ summary: 'Agregar vehículo' })
  addVehiculo(
    @CurrentUser('id') asociadoId: string,
    @Body() dto: CreateVehiculoDto,
  ) {
    return this.asociadosService.addVehiculo(asociadoId, dto);
  }
}
