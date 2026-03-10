import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ProveedoresService } from './proveedores.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { ProveedoresQueryDto } from './dto/proveedores-query.dto';

@ApiTags('Proveedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Get('mi-perfil')
  @Roles('proveedor')
  @ApiOperation({ summary: 'Obtener datos del proveedor autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del proveedor' })
  @ApiResponse({ status: 404, description: 'Proveedor no vinculado' })
  getMyProfile(@CurrentUser('proveedorId') proveedorId: string) {
    return this.proveedoresService.findOne(proveedorId);
  }

  @Get()
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Listar proveedores' })
  @ApiResponse({ status: 200, description: 'Lista paginada de proveedores' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  findAll(@Query() query: ProveedoresQueryDto) {
    return this.proveedoresService.findAll(query);
  }

  @Get(':id')
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Detalle de proveedor' })
  @ApiResponse({ status: 200, description: 'Detalle del proveedor' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  findOne(@Param('id') id: string) {
    return this.proveedoresService.findOne(id);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crear proveedor' })
  @ApiResponse({ status: 201, description: 'Proveedor creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin' })
  create(@Body() dto: CreateProveedorDto) {
    return this.proveedoresService.create(dto);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  @ApiResponse({ status: 200, description: 'Proveedor actualizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  update(@Param('id') id: string, @Body() dto: UpdateProveedorDto) {
    return this.proveedoresService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar proveedor' })
  @ApiResponse({ status: 200, description: 'Proveedor eliminado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  @ApiResponse({ status: 409, description: 'Tiene cupones o promociones asociadas' })
  remove(@Param('id') id: string) {
    return this.proveedoresService.remove(id);
  }
}
