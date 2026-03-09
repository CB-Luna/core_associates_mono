import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaQueryDto } from './dto/auditoria-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Auditoría')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Listar registros de auditoría con filtros' })
  @ApiResponse({ status: 200, description: 'Lista paginada de registros de auditoría' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin' })
  findAll(@Query() query: AuditoriaQueryDto) {
    return this.auditoriaService.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      entidad: query.entidad,
      accion: query.accion,
      desde: query.desde,
      hasta: query.hasta,
      search: query.search,
    });
  }
}
