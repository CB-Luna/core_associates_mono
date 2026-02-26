import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DocumentosService } from './documentos.service';

@ApiTags('Documentos')
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}
}
