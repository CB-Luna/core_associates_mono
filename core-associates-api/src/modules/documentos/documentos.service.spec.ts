import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DocumentosService } from './documentos.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('DocumentosService', () => {
  let service: DocumentosService;
  let prisma: Record<string, any>;
  let storage: Record<string, any>;

  const mockDoc = {
    id: 'doc-1',
    asociadoId: 'asoc-1',
    tipo: 'ine_frente',
    s3Bucket: 'core-associates-documents',
    s3Key: 'asoc-1/ine_frente/123.jpg',
    contentType: 'image/jpeg',
    fileSize: 50000,
    estado: 'pendiente',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      documento: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    storage = {
      uploadFile: jest.fn(),
      getPresignedUrl: jest.fn().mockResolvedValue('https://minio/presigned-url'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentosService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get<DocumentosService>(DocumentosService);
  });

  describe('uploadDocument', () => {
    it('should upload file to storage and create document record', async () => {
      const file = {
        buffer: Buffer.from('test'),
        originalname: 'ine.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      prisma.documento.create.mockResolvedValue({ ...mockDoc });

      const result = await service.uploadDocument('asoc-1', file, 'ine_frente');
      expect(storage.uploadFile).toHaveBeenCalledWith(
        'core-associates-documents',
        expect.stringContaining('asoc-1/ine_frente/'),
        file.buffer,
        'image/jpeg',
      );
      expect(prisma.documento.create).toHaveBeenCalled();
      expect(result.tipo).toBe('ine_frente');
    });
  });

  describe('getMyDocuments', () => {
    it('should return documents for asociado', async () => {
      prisma.documento.findMany.mockResolvedValue([mockDoc]);

      const result = await service.getMyDocuments('asoc-1');
      expect(result).toHaveLength(1);
      expect(prisma.documento.findMany).toHaveBeenCalledWith({
        where: { asociadoId: 'asoc-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getDocumentUrl', () => {
    it('should return presigned URL for document owner', async () => {
      prisma.documento.findUnique.mockResolvedValue(mockDoc);

      const result = await service.getDocumentUrl('doc-1', 'asoc-1', 'asociado');
      expect(result.url).toBe('https://minio/presigned-url');
      expect(storage.getPresignedUrl).toHaveBeenCalledWith(
        mockDoc.s3Bucket,
        mockDoc.s3Key,
        900,
      );
    });

    it('should throw NotFoundException if document not found', async () => {
      prisma.documento.findUnique.mockResolvedValue(null);
      await expect(service.getDocumentUrl('nonexistent', 'asoc-1', 'asociado')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if asociado accesses other document', async () => {
      prisma.documento.findUnique.mockResolvedValue(mockDoc);
      await expect(service.getDocumentUrl('doc-1', 'other-asoc', 'asociado')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow CRM users to access any document', async () => {
      prisma.documento.findUnique.mockResolvedValue(mockDoc);

      const result = await service.getDocumentUrl('doc-1', 'admin-1', 'usuario');
      expect(result.url).toBe('https://minio/presigned-url');
    });
  });

  describe('updateEstado', () => {
    it('should approve document', async () => {
      prisma.documento.findUnique.mockResolvedValue(mockDoc);
      prisma.documento.update.mockResolvedValue({ ...mockDoc, estado: 'aprobado' });

      const result = await service.updateEstado('doc-1', 'aprobado', 'admin-1');
      expect(prisma.documento.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: expect.objectContaining({
          estado: 'aprobado',
          revisadoPorId: 'admin-1',
          motivoRechazo: null,
          fechaRevision: expect.any(Date),
        }),
      });
      expect(result.estado).toBe('aprobado');
    });

    it('should reject document with motivo', async () => {
      prisma.documento.findUnique.mockResolvedValue(mockDoc);
      prisma.documento.update.mockResolvedValue({
        ...mockDoc,
        estado: 'rechazado',
        motivoRechazo: 'Imagen borrosa',
      });

      await service.updateEstado('doc-1', 'rechazado', 'admin-1', 'Imagen borrosa');
      expect(prisma.documento.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: expect.objectContaining({
          estado: 'rechazado',
          motivoRechazo: 'Imagen borrosa',
        }),
      });
    });

    it('should throw NotFoundException if document not found', async () => {
      prisma.documento.findUnique.mockResolvedValue(null);
      await expect(service.updateEstado('nonexistent', 'aprobado', 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPendingDocuments', () => {
    it('should return paginated pending documents', async () => {
      prisma.documento.findMany.mockResolvedValue([mockDoc]);
      prisma.documento.count.mockResolvedValue(1);

      const result = await service.getPendingDocuments(1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
    });
  });
});
