import { Controller, Get, Put, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AsociadosService } from './asociados.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateAsociadoDto } from './dto/update-asociado.dto';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Asociados')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('asociados')
export class AsociadosController {
  constructor(private readonly asociadosService: AsociadosService) {}

  // ── Endpoints para asociado (app móvil) ──

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

  // ── Endpoints admin (CRM) ──

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Listar asociados (admin)' })
  @ApiQuery({ name: 'estado', required: false })
  findAll(
    @Query() query: PaginationQueryDto,
    @Query('estado') estado?: string,
  ) {
    return this.asociadosService.findAll({ ...query, estado });
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Detalle de asociado (admin)' })
  findOne(@Param('id') id: string) {
    return this.asociadosService.findOne(id);
  }

  @Put(':id/estado')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Cambiar estado de asociado' })
  updateEstado(
    @Param('id') id: string,
    @Body() dto: UpdateEstadoDto,
    @CurrentUser('id') usuarioId: string,
  ) {
    return this.asociadosService.updateEstado(id, dto.estado, usuarioId);
  }
}
