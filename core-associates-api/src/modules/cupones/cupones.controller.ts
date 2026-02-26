import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CuponesService } from './cupones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCuponDto } from './dto/create-cupon.dto';

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
}
