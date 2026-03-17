import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { ReorderMenuDto } from './dto/reorder-menu.dto';

@ApiTags('Menu')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener menú según rol del usuario' })
  @ApiResponse({ status: 200, description: 'Árbol de menú filtrado por permisos del rol' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  getMenu(@CurrentUser() user: { id: string; rol: string; tipo: string }) {
    return this.menuService.getMenuTree(user.rol);
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener todos los items de menú (admin)' })
  findAll() {
    return this.menuService.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Crear item de menú' })
  create(@Body() dto: CreateMenuItemDto) {
    return this.menuService.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar item de menú' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuService.update(id, dto);
  }

  @Patch('reorder')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Reordenar items de menú' })
  reorder(@Body() dto: ReorderMenuDto) {
    return this.menuService.reorder(dto);
  }
}
