import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAiConfigDto {
  @ApiProperty({ example: 'document_analyzer' })
  @IsString()
  @MaxLength(50)
  clave: string;

  @ApiProperty({ example: 'Analizador de Documentos' })
  @IsString()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ example: 'anthropic' })
  @IsString()
  @MaxLength(50)
  provider: string;

  @ApiProperty({ example: 'claude-sonnet-4-5-20250929' })
  @IsString()
  @MaxLength(100)
  modelo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  promptSistema?: string;

  @ApiPropertyOptional({ example: 0.3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperatura?: number;

  @ApiPropertyOptional({ example: 4096 })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(16384)
  maxTokens?: number;

  @ApiPropertyOptional({ example: 0.90, description: 'Umbral de confianza para auto-aprobar documento' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  umbralAutoAprobacion?: number;

  @ApiPropertyOptional({ example: 0.40, description: 'Umbral de confianza para auto-rechazar documento' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  umbralAutoRechazo?: number;

  @ApiPropertyOptional({ example: 5, description: 'Max rechazos pre-validacion antes de bloquear' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxRechazosPreval?: number;

  @ApiPropertyOptional({ example: 24, description: 'Horas de bloqueo tras exceder rechazos' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  horasBloqueoPreval?: number;
}

export class UpdateAiConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  provider?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  modelo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  promptSistema?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperatura?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(16384)
  maxTokens?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({ example: 0.90 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  umbralAutoAprobacion?: number;

  @ApiPropertyOptional({ example: 0.40 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  umbralAutoRechazo?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxRechazosPreval?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  horasBloqueoPreval?: number;

  // ── Campos chatbot ──
  @ApiPropertyOptional({ description: 'Chatbot globalmente activo' })
  @IsOptional()
  @IsBoolean()
  chatbotActivo?: boolean;

  @ApiPropertyOptional({ description: 'Modo avanzado disponible para usuarios con permiso' })
  @IsOptional()
  @IsBoolean()
  modoAvanzadoDisponible?: boolean;

  @ApiPropertyOptional({ example: 20, description: 'Máx preguntas IA por usuario/hora' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  maxPreguntasPorHora?: number;
}
