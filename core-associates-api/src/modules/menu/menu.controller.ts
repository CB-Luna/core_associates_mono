import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

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
}
