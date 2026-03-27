import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

const BUCKET_PROVIDERS = 'core-associates-providers';

@Injectable()
export class ProveedoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findAll(query: PaginationQueryDto & { tipo?: string; estado?: string }) {
    const { page = 1, limit = 10, search, tipo, estado } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (tipo) {
      where.tipo = tipo;
    }
    if (estado) {
      where.estado = estado;
    }
    if (search) {
      where.OR = [
        { razonSocial: { contains: search, mode: 'insensitive' } },
        { idUnico: { contains: search, mode: 'insensitive' } },
        { contactoNombre: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.proveedor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { promociones: true, cuponesEmitidos: true } },
        },
      }),
      this.prisma.proveedor.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id },
      include: {
        promociones: { orderBy: { createdAt: 'desc' } },
        _count: { select: { cuponesEmitidos: true, cuponesCanjeados: true } },
      },
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // Compute effective estado for promotions
    const promociones = proveedor.promociones.map((p) => {
      const fechaFin = typeof p.fechaFin === 'string' ? new Date(p.fechaFin) : p.fechaFin;
      if (p.estado === 'activa' && fechaFin < new Date()) {
        return { ...p, estado: 'expirada' as const };
      }
      return p;
    });

    return { ...proveedor, promociones };
  }

  async create(dto: CreateProveedorDto) {
    const count = await this.prisma.proveedor.count();
    const idUnico = `PRV-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.proveedor.create({
      data: {
        idUnico,
        razonSocial: dto.razonSocial,
        tipo: dto.tipo,
        direccion: dto.direccion,
        latitud: dto.latitud,
        longitud: dto.longitud,
        telefono: dto.telefono,
        email: dto.email,
        contactoNombre: dto.contactoNombre,
      },
    });
  }

  async update(id: string, dto: UpdateProveedorDto) {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return this.prisma.proveedor.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id },
      include: {
        _count: { select: { cuponesEmitidos: true, promociones: true } },
      },
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    if (proveedor._count.cuponesEmitidos > 0 || proveedor._count.promociones > 0) {
      throw new ConflictException(
        'No se puede eliminar un proveedor con cupones o promociones asociadas. Desactívelo en su lugar.',
      );
    }

    await this.prisma.proveedor.delete({ where: { id } });
    return { message: 'Proveedor eliminado correctamente' };
  }

  async uploadLogotipo(id: string, file: Express.Multer.File) {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // Eliminar logotipo anterior si existe
    if (proveedor.logotipoUrl) {
      await this.storage.deleteFile(BUCKET_PROVIDERS, proveedor.logotipoUrl);
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase() || 'png';
    const key = `logotipos/${id}/${Date.now()}.${ext}`;
    await this.storage.uploadFile(BUCKET_PROVIDERS, key, file.buffer, file.mimetype);

    return this.prisma.proveedor.update({
      where: { id },
      data: { logotipoUrl: key },
    });
  }

  async getLogotipoBuffer(id: string): Promise<{ buffer: Buffer; contentType: string }> {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }
    if (!proveedor.logotipoUrl) {
      throw new NotFoundException('Este proveedor no tiene logotipo');
    }

    const buffer = await this.storage.getFile(BUCKET_PROVIDERS, proveedor.logotipoUrl);
    const extMatch = proveedor.logotipoUrl.match(/\.(\w+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'png';
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';

    return { buffer, contentType };
  }
}
