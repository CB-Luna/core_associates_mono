import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';

const BUCKET_VEHICULOS = 'core-associates-vehicles';

@Injectable()
export class VehiculosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

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

  async uploadFoto(id: string, asociadoId: string, file: Express.Multer.File) {
    const vehiculo = await this.prisma.vehiculo.findUnique({ where: { id } });
    if (!vehiculo) throw new NotFoundException('Vehículo no encontrado');
    if (vehiculo.asociadoId !== asociadoId) throw new ForbiddenException('No puedes modificar este vehículo');

    if (vehiculo.fotoUrl) {
      await this.storage.deleteFile(BUCKET_VEHICULOS, vehiculo.fotoUrl).catch(() => {});
    }

    const ext = file.originalname.split('.').pop() || 'jpg';
    const s3Key = `${asociadoId}/vehiculos/${id}/${Date.now()}.${ext}`;
    await this.storage.uploadFile(BUCKET_VEHICULOS, s3Key, file.buffer, file.mimetype);

    return this.prisma.vehiculo.update({
      where: { id },
      data: { fotoUrl: s3Key },
    });
  }

  async getFotoBuffer(id: string, user: { id: string; tipo: string; rol?: string }): Promise<{ buffer: Buffer; contentType: string } | null> {
    const vehiculo = await this.prisma.vehiculo.findUnique({ where: { id } });
    if (!vehiculo) throw new NotFoundException('Vehículo no encontrado');

    // Admin/operador CRM users can view any vehicle photo
    const isStaff = user.tipo === 'usuario' && (user.rol === 'admin' || user.rol === 'operador');
    if (!isStaff && vehiculo.asociadoId !== user.id) {
      throw new ForbiddenException('No puedes ver este vehículo');
    }

    if (!vehiculo.fotoUrl) return null;

    const buffer = await this.storage.getFile(BUCKET_VEHICULOS, vehiculo.fotoUrl);
    const ext = vehiculo.fotoUrl.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    return { buffer, contentType: mimeMap[ext] || 'image/jpeg' };
  }
}
