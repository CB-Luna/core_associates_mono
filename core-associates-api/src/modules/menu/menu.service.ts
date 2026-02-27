import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
}
