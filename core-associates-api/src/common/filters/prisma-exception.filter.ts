import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = 500;
    let message = 'Error interno del servidor';

    switch (exception.code) {
      case 'P2002': {
        status = 409;
        const fields = (exception.meta?.target as string[])?.join(', ') || 'campo';
        message = `Ya existe un registro con ese valor de ${fields}`;
        break;
      }
      case 'P2025':
        status = 404;
        message = 'Registro no encontrado';
        break;
      case 'P2003':
        status = 400;
        message = 'Referencia a registro inválida (clave foránea)';
        break;
      default:
        this.logger.error(`Prisma error ${exception.code}`, exception.message);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.code,
    });
  }
}
