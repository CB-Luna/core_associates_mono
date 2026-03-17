import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTemaDto } from './dto/create-tema.dto';
import { UpdateTemaDto } from './dto/update-tema.dto';

@Injectable()
export class TemasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tema.findMany({
      orderBy: { createdAt: 'desc' },
      include: { creador: { select: { id: true, nombre: true } } },
    });
  }

  async findOne(id: string) {
    const tema = await this.prisma.tema.findUnique({
      where: { id },
      include: { creador: { select: { id: true, nombre: true } } },
    });
    if (!tema) throw new NotFoundException(`Tema '${id}' no encontrado`);
    return tema;
  }

  /** Retorna el tema asignado al usuario, o el global, o null */
  async getMiTema(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { temaId: true },
    });

    if (user?.temaId) {
      return this.prisma.tema.findUnique({ where: { id: user.temaId } });
    }

    // Fallback: tema global
    return this.prisma.tema.findFirst({ where: { esGlobal: true } });
  }

  async create(dto: CreateTemaDto, userId: string) {
    // Si se marca esGlobal, quitar global de otros
    if (dto.esGlobal) {
      await this.prisma.tema.updateMany({
        where: { esGlobal: true },
        data: { esGlobal: false },
      });
    }

    return this.prisma.tema.create({
      data: {
        nombre: dto.nombre,
        categoria: dto.categoria ?? null,
        colores: dto.colores,
        fuente: dto.fuente ?? null,
        esGlobal: dto.esGlobal ?? false,
        creadoPor: userId,
      },
    });
  }

  async update(id: string, dto: UpdateTemaDto) {
    const tema = await this.prisma.tema.findUnique({ where: { id } });
    if (!tema) throw new NotFoundException(`Tema '${id}' no encontrado`);

    // Si se marca esGlobal, quitar global de otros
    if (dto.esGlobal) {
      await this.prisma.tema.updateMany({
        where: { esGlobal: true, NOT: { id } },
        data: { esGlobal: false },
      });
    }

    return this.prisma.tema.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.categoria !== undefined && { categoria: dto.categoria }),
        ...(dto.colores !== undefined && { colores: dto.colores }),
        ...(dto.fuente !== undefined && { fuente: dto.fuente }),
        ...(dto.esGlobal !== undefined && { esGlobal: dto.esGlobal }),
      },
    });
  }

  async remove(id: string) {
    const tema = await this.prisma.tema.findUnique({ where: { id } });
    if (!tema) throw new NotFoundException(`Tema '${id}' no encontrado`);

    // Desasignar usuarios que tenían este tema
    await this.prisma.usuario.updateMany({
      where: { temaId: id },
      data: { temaId: null },
    });

    await this.prisma.tema.delete({ where: { id } });
    return { message: `Tema '${tema.nombre}' eliminado` };
  }

  async asignarTema(userId: string, temaId: string | null) {
    if (temaId) {
      const tema = await this.prisma.tema.findUnique({ where: { id: temaId } });
      if (!tema) throw new NotFoundException(`Tema '${temaId}' no encontrado`);
    }

    return this.prisma.usuario.update({
      where: { id: userId },
      data: { temaId },
      select: { id: true, nombre: true, temaId: true },
    });
  }

  async updateLogo(id: string, logoUrl: string) {
    const tema = await this.prisma.tema.findUnique({ where: { id } });
    if (!tema) throw new NotFoundException(`Tema '${id}' no encontrado`);

    return this.prisma.tema.update({
      where: { id },
      data: { logoUrl },
    });
  }
}
