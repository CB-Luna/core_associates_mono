import { Controller, Post, Get, Param, Query, Body, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CuponesService } from './cupones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateCuponDto } from './dto/create-cupon.dto';
import { ValidateCuponDto } from './dto/validate-cupon.dto';
import { CuponesQueryDto } from './dto/cupones-query.dto';

@ApiTags('Cupones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cupones')
export class CuponesController {
  constructor(private readonly cuponesService: CuponesService) {}

  @Post()
  @ApiOperation({ summary: 'Generar cupón desde promoción' })
  generateCupon(
    @CurrentUser('id') asociadoId: string,
    @Body() dto: CreateCuponDto,
  ) {
    return this.cuponesService.generateCupon(asociadoId, dto.promocionId);
  }

  @Get('mis-cupones')
  @ApiOperation({ summary: 'Listar mis cupones' })
  getMisCupones(@CurrentUser('id') asociadoId: string) {
    return this.cuponesService.getMisCupones(asociadoId);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Listar todos los cupones (admin)' })
  findAll(@Query() query: CuponesQueryDto) {
    return this.cuponesService.findAll(query);
  }

  @Get('estadisticas')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Estadísticas de cupones por estado' })
  getEstadisticas() {
    return this.cuponesService.getEstadisticas();
  }

  @Get(':id/qr')
  @ApiOperation({ summary: 'Obtener QR del cupón como imagen PNG' })
  async getQrImage(
    @Param('id') id: string,
    @CurrentUser('id') asociadoId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.cuponesService.getQrImage(id, asociadoId);
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length,
      'Cache-Control': 'no-store',
    });
    res.end(buffer);
  }

  @Post('validar')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador', 'proveedor')
  @ApiOperation({ summary: 'Validar y canjear cupón' })
  validateCoupon(
    @Body() dto: ValidateCuponDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    // For proveedor users, use their associated proveedorId
    return this.cuponesService.validateCoupon(dto.payload, dto.firma, user.id);
  }
}
