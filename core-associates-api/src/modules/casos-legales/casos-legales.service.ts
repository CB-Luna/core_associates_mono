import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCasoLegalDto } from './dto/create-caso-legal.dto';
import { TipoPercance } from '@prisma/client';

@Injectable()
export class CasosLegalesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCaso(asociadoId: string, dto: CreateCasoLegalDto) {
    const count = await this.prisma.casoLegal.count();
    const codigo = `CAS-${String(count + 1).padStart(5, '0')}`;

    return this.prisma.casoLegal.create({
      data: {
        codigo,
        asociadoId,
        tipoPercance: dto.tipoPercance as TipoPercance,
        descripcion: dto.descripcion,
        latitud: dto.latitud,
        longitud: dto.longitud,
        direccionAprox: dto.direccionAprox,
        estado: 'abierto',
        prioridad: dto.tipoPercance === 'accidente' || dto.tipoPercance === 'asalto' ? 'alta' : 'media',
      },
      include: {
        notas: true,
      },
    });
  }

  async getMisCasos(asociadoId: string) {
    return this.prisma.casoLegal.findMany({
      where: { asociadoId },
      include: {
        abogado: {
          select: {
            razonSocial: true,
            telefono: true,
          },
        },
        notas: {
          where: { esPrivada: false },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { fechaApertura: 'desc' },
    });
  }
}
