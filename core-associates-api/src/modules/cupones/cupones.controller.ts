import { Controller, Post, Get, Param, Query, Body, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
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
  @ApiResponse({ status: 201, description: 'Cupón generado con firma HMAC-SHA256' })
  @ApiResponse({ status: 400, description: 'Promoción inválida o no disponible' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  generateCupon(
    @CurrentUser('id') asociadoId: string,
    @Body() dto: CreateCuponDto,
  ) {
    return this.cuponesService.generateCupon(asociadoId, dto.promocionId);
  }

  @Get('mis-cupones')
  @ApiOperation({ summary: 'Listar mis cupones' })
  @ApiResponse({ status: 200, description: 'Lista de cupones del asociado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  getMisCupones(@CurrentUser('id') asociadoId: string) {
    return this.cuponesService.getMisCupones(asociadoId);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Listar todos los cupones (admin)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de cupones' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  findAll(@Query() query: CuponesQueryDto) {
    return this.cuponesService.findAll(query);
  }

  @Get('estadisticas')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Estadísticas de cupones por estado' })
  @ApiResponse({ status: 200, description: 'Conteo de cupones por estado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador' })
  getEstadisticas() {
    return this.cuponesService.getEstadisticas();
  }

  @Get(':id/qr')
  @ApiOperation({ summary: 'Obtener QR del cupón como imagen PNG' })
  @ApiResponse({ status: 200, description: 'Imagen PNG del código QR' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No es dueño del cupón' })
  @ApiResponse({ status: 404, description: 'Cupón no encontrado' })
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
  @ApiResponse({ status: 200, description: 'Cupón válido y canjeado' })
  @ApiResponse({ status: 400, description: 'Firma inválida, cupón vencido o ya canjeado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin/operador/proveedor' })
  validateCoupon(
    @Body() dto: ValidateCuponDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    // For proveedor users, use their associated proveedorId
    return this.cuponesService.validateCoupon(dto.payload, dto.firma, user.id);
  }
}
