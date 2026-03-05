import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';

@Injectable()
export class VehiculosService {
  constructor(private readonly prisma: PrismaService) {}

  async update(id: string, asociadoId: string, dto: UpdateVehiculoDto) {
    const vehiculo = await this.prisma.vehiculo.findUnique({ where: { id } });
    if (!vehiculo) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    if (vehiculo.asociadoId !== asociadoId) {
      throw new ForbiddenException('No puedes modificar este vehículo');
    }

    // If marking as principal, unmark others
    if (dto.esPrincipal === true) {
      await this.prisma.vehiculo.updateMany({
        where: { asociadoId, esPrincipal: true, id: { not: id } },
        data: { esPrincipal: false },
      });
    }

    const data: Record<string, unknown> = {};
    if (dto.marca !== undefined) data.marca = dto.marca;
    if (dto.modelo !== undefined) data.modelo = dto.modelo;
    if (dto.anio !== undefined) data.anio = dto.anio;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.placas !== undefined) data.placas = dto.placas;
    if (dto.numeroSerie !== undefined) data.numeroSerie = dto.numeroSerie;
    if (dto.esPrincipal !== undefined) data.esPrincipal = dto.esPrincipal;

    return this.prisma.vehiculo.update({ where: { id }, data });
  }

  async remove(id: string, asociadoId: string) {
    const vehiculo = await this.prisma.vehiculo.findUnique({ where: { id } });
    if (!vehiculo) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    if (vehiculo.asociadoId !== asociadoId) {
      throw new ForbiddenException('No puedes eliminar este vehículo');
    }

    await this.prisma.vehiculo.delete({ where: { id } });

    // If deleted vehicle was principal, promote another
    if (vehiculo.esPrincipal) {
      const next = await this.prisma.vehiculo.findFirst({
        where: { asociadoId },
        orderBy: { createdAt: 'asc' },
      });
      if (next) {
        await this.prisma.vehiculo.update({
          where: { id: next.id },
          data: { esPrincipal: true },
        });
      }
    }

    return { message: 'Vehículo eliminado' };
  }
}
