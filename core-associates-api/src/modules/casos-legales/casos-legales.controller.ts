import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CasosLegalesService } from './casos-legales.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCasoLegalDto } from './dto/create-caso-legal.dto';

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
}
