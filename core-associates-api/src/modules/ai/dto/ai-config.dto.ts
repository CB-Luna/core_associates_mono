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
}
