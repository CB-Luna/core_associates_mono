import { Controller, Post, Get, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CasosLegalesService } from './casos-legales.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateCasoLegalDto } from './dto/create-caso-legal.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Casos Legales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('casos-legales')
export class CasosLegalesController {
  constructor(private readonly casosLegalesService: CasosLegalesService) {}

  @Post()
  @ApiOperation({ summary: 'Reportar percance (SOS)' })
  createCaso(
    @CurrentUser('id') asociadoId: string,
    @Body() dto: CreateCasoLegalDto,
  ) {
    return this.casosLegalesService.createCaso(asociadoId, dto);
  }

  @Get('mis-casos')
  @ApiOperation({ summary: 'Listar mis casos legales' })
  getMisCasos(@CurrentUser('id') asociadoId: string) {
    return this.casosLegalesService.getMisCasos(asociadoId);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Listar todos los casos (admin)' })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'prioridad', required: false })
  findAll(
    @Query() query: PaginationQueryDto,
    @Query('estado') estado?: string,
    @Query('prioridad') prioridad?: string,
  ) {
    return this.casosLegalesService.findAll({ ...query, estado, prioridad });
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Detalle de caso legal' })
  findOne(@Param('id') id: string) {
    return this.casosLegalesService.findOne(id);
  }

  @Put(':id/estado')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Cambiar estado de caso' })
  updateEstado(@Param('id') id: string, @Body('estado') estado: string) {
    return this.casosLegalesService.updateEstado(id, estado);
  }

  @Post(':id/notas')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Agregar nota al caso' })
  addNote(
    @Param('id') casoId: string,
    @CurrentUser('id') autorId: string,
    @Body() body: { contenido: string; esPrivada?: boolean },
  ) {
    return this.casosLegalesService.addNote(casoId, autorId, body.contenido, body.esPrivada);
  }
}
