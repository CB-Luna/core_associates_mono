import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesService } from './roles.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { SetPermisosDto } from './dto/set-permisos.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los roles con sus permisos' })
  @ApiResponse({ status: 200, description: 'Lista de roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('permisos')
  @ApiOperation({ summary: 'Catálogo completo de permisos disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de permisos' })
  findAllPermisos() {
    return this.rolesService.findAllPermisos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un rol por ID' })
  @ApiResponse({ status: 200, description: 'Rol encontrado' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo rol' })
  @ApiResponse({ status: 201, description: 'Rol creado' })
  @ApiResponse({ status: 409, description: 'Ya existe un rol con ese nombre' })
  create(@Body() dto: CreateRolDto) {
    return this.rolesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un rol' })
  @ApiResponse({ status: 200, description: 'Rol actualizado' })
  update(@Param('id') id: string, @Body() dto: UpdateRolDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un rol (solo si no está protegido ni asignado)' })
  @ApiResponse({ status: 200, description: 'Rol eliminado' })
  @ApiResponse({ status: 400, description: 'Rol protegido o asignado a usuarios' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Put(':id/permisos')
  @ApiOperation({ summary: 'Asignar permisos a un rol (reemplaza los existentes)' })
  @ApiResponse({ status: 200, description: 'Permisos actualizados' })
  setPermisos(@Param('id') id: string, @Body() dto: SetPermisosDto) {
    return this.rolesService.setPermisos(id, dto.permisos);
  }
}
