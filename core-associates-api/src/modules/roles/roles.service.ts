import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.rol.findMany({
      include: {
        permisos: { include: { permiso: true }, orderBy: { permiso: { grupo: 'asc' } } },
        _count: { select: { usuarios: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const rol = await this.prisma.rol.findUnique({
      where: { id },
      include: {
        permisos: { include: { permiso: true }, orderBy: { permiso: { grupo: 'asc' } } },
        _count: { select: { usuarios: true } },
      },
    });
    if (!rol) throw new NotFoundException('Rol no encontrado');
    return rol;
  }

  async create(data: { nombre: string; descripcion?: string; icono?: string; color?: string; esPorDefecto?: boolean }) {
    const existing = await this.prisma.rol.findUnique({ where: { nombre: data.nombre } });
    if (existing) throw new ConflictException('Ya existe un rol con ese nombre');

    return this.prisma.rol.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        icono: data.icono,
        color: data.color,
        esPorDefecto: data.esPorDefecto ?? false,
        esProtegido: false,
      },
      include: {
        permisos: { include: { permiso: true } },
        _count: { select: { usuarios: true } },
      },
    });
  }

  async update(id: string, data: { nombre?: string; descripcion?: string; icono?: string; color?: string; esPorDefecto?: boolean }) {
    const rol = await this.prisma.rol.findUnique({ where: { id } });
    if (!rol) throw new NotFoundException('Rol no encontrado');

    if (data.nombre && data.nombre !== rol.nombre) {
      if (rol.esProtegido) {
        throw new BadRequestException('No se puede renombrar un rol protegido');
      }
      const dup = await this.prisma.rol.findUnique({ where: { nombre: data.nombre } });
      if (dup) throw new ConflictException('Ya existe un rol con ese nombre');
    }

    return this.prisma.rol.update({
      where: { id },
      data: {
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.icono !== undefined && { icono: data.icono }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.esPorDefecto !== undefined && { esPorDefecto: data.esPorDefecto }),
      },
      include: {
        permisos: { include: { permiso: true } },
        _count: { select: { usuarios: true } },
      },
    });
  }

  async remove(id: string) {
    const rol = await this.prisma.rol.findUnique({
      where: { id },
      include: { _count: { select: { usuarios: true } } },
    });
    if (!rol) throw new NotFoundException('Rol no encontrado');
    if (rol.esProtegido) throw new BadRequestException('No se puede eliminar un rol protegido');
    if (rol._count.usuarios > 0) {
      throw new BadRequestException('No se puede eliminar un rol asignado a usuarios');
    }

    await this.prisma.rol.delete({ where: { id } });
    return { message: 'Rol eliminado' };
  }

  // ── Permisos de un rol ──

  async setPermisos(rolId: string, permisoCodigos: string[]) {
    const rol = await this.prisma.rol.findUnique({ where: { id: rolId } });
    if (!rol) throw new NotFoundException('Rol no encontrado');

    // Buscar IDs de permisos por código
    const permisos = await this.prisma.permiso.findMany({
      where: { codigo: { in: permisoCodigos } },
    });

    const foundCodigos = permisos.map((p) => p.codigo);
    const invalid = permisoCodigos.filter((c) => !foundCodigos.includes(c));
    if (invalid.length > 0) {
      throw new BadRequestException(`Permisos no encontrados: ${invalid.join(', ')}`);
    }

    // Reemplazar todos los permisos del rol
    await this.prisma.$transaction([
      this.prisma.rolPermiso.deleteMany({ where: { rolId } }),
      ...permisos.map((p) =>
        this.prisma.rolPermiso.create({ data: { rolId, permisoId: p.id } }),
      ),
    ]);

    return this.findOne(rolId);
  }

  // ── Catálogo de permisos ──

  async findAllPermisos() {
    return this.prisma.permiso.findMany({
      orderBy: [{ grupo: 'asc' }, { codigo: 'asc' }],
    });
  }

  // ── Menu items de un rol ──

  async getMenuItems(rolId: string) {
    const rol = await this.prisma.rol.findUnique({ where: { id: rolId } });
    if (!rol) throw new NotFoundException('Rol no encontrado');

    return this.prisma.rolModuloMenu.findMany({
      where: { rolId },
      include: { moduloMenu: true },
      orderBy: { orden: 'asc' },
    });
  }

  async setMenuItems(rolId: string, items: { moduloMenuId: string; orden: number }[]) {
    const rol = await this.prisma.rol.findUnique({ where: { id: rolId } });
    if (!rol) throw new NotFoundException('Rol no encontrado');

    // Verificar que todos los moduloMenuIds existen
    if (items.length > 0) {
      const ids = items.map((i) => i.moduloMenuId);
      const found = await this.prisma.moduloMenu.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });
      const foundIds = new Set(found.map((m) => m.id));
      const invalid = ids.filter((id) => !foundIds.has(id));
      if (invalid.length > 0) {
        throw new BadRequestException(`Módulos de menú no encontrados: ${invalid.join(', ')}`);
      }
    }

    // Reemplazar todos los menu items del rol
    await this.prisma.$transaction([
      this.prisma.rolModuloMenu.deleteMany({ where: { rolId } }),
      ...items.map((item) =>
        this.prisma.rolModuloMenu.create({
          data: { rolId, moduloMenuId: item.moduloMenuId, orden: item.orden },
        }),
      ),
    ]);

    return this.getMenuItems(rolId);
  }

  // ── Asignación masiva de usuarios a un rol ──

  async bulkAssignUsers(rolId: string, usuarioIds: string[]) {
    const rol = await this.prisma.rol.findUnique({ where: { id: rolId } });
    if (!rol) throw new NotFoundException('Rol no encontrado');

    const result = await this.prisma.usuario.updateMany({
      where: { id: { in: usuarioIds } },
      data: { rolId },
    });

    return { message: `${result.count} usuario(s) asignados al rol '${rol.nombre}'` };
  }
}
