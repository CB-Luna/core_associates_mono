import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { ReorderMenuDto } from './dto/reorder-menu.dto';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenuTree(userRol: string) {
    const items = await this.prisma.moduloMenu.findMany({
      where: {
        visible: true,
        permisos: { has: userRol },
      },
      orderBy: { orden: 'asc' },
    });

    // Build hierarchical tree
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const item of items) {
      map.set(item.id, { ...item, children: [] });
    }

    for (const item of items) {
      const node = map.get(item.id);
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  /** Retorna TODOS los items (sin filtrar por rol) para admin */
  async findAll() {
    return this.prisma.moduloMenu.findMany({
      orderBy: { orden: 'asc' },
    });
  }

  async create(dto: CreateMenuItemDto) {
    const existing = await this.prisma.moduloMenu.findUnique({
      where: { codigo: dto.codigo },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un item con código '${dto.codigo}'`);
    }

    return this.prisma.moduloMenu.create({
      data: {
        codigo: dto.codigo,
        titulo: dto.titulo,
        ruta: dto.ruta ?? null,
        icono: dto.icono ?? null,
        permisos: dto.permisos ?? [],
        orden: dto.orden ?? 0,
        tipo: (dto.tipo as any) ?? 'enlace',
        visible: dto.visible ?? true,
        parentId: dto.parentId ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateMenuItemDto) {
    const item = await this.prisma.moduloMenu.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Item de menú '${id}' no encontrado`);
    }

    // Si se cambia el código, verificar unicidad
    if (dto.codigo && dto.codigo !== item.codigo) {
      const dupe = await this.prisma.moduloMenu.findUnique({
        where: { codigo: dto.codigo },
      });
      if (dupe) {
        throw new ConflictException(`Ya existe un item con código '${dto.codigo}'`);
      }
    }

    return this.prisma.moduloMenu.update({
      where: { id },
      data: {
        ...(dto.codigo !== undefined && { codigo: dto.codigo }),
        ...(dto.titulo !== undefined && { titulo: dto.titulo }),
        ...(dto.ruta !== undefined && { ruta: dto.ruta }),
        ...(dto.icono !== undefined && { icono: dto.icono }),
        ...(dto.permisos !== undefined && { permisos: dto.permisos }),
        ...(dto.orden !== undefined && { orden: dto.orden }),
        ...(dto.tipo !== undefined && { tipo: dto.tipo as any }),
        ...(dto.visible !== undefined && { visible: dto.visible }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      },
    });
  }

  async remove(id: string) {
    const item = await this.prisma.moduloMenu.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Item de menú '${id}' no encontrado`);
    }
    await this.prisma.moduloMenu.delete({ where: { id } });
    return { message: `Item '${item.titulo}' eliminado` };
  }

  async reorder(dto: ReorderMenuDto) {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.moduloMenu.update({
          where: { id: item.id },
          data: { orden: item.orden },
        }),
      ),
    );
    return { message: `${dto.items.length} items reordenados` };
  }
}
