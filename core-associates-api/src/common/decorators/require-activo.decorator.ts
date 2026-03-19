import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { EstadoAsociadoGuard } from '../guards/estado-asociado.guard';

export const RequireActivo = () =>
  applyDecorators(
    UseGuards(EstadoAsociadoGuard),
    ApiResponse({ status: 403, description: 'Asociado no activo — requiere KYC aprobado' }),
  );
