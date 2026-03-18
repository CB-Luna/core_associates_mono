import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaQueryDto } from './dto/auditoria-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../../common/guards/permisos.guard';
import { Permisos } from '../../common/decorators/permisos.decorator';

@ApiTags('Auditoría')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @Permisos('auditoria:ver')
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
