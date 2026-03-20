import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { decryptApiKey } from '../../common/utils/crypto.util';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: any[];
}

interface AnthropicResponse {
  content: { type: string; text?: string }[];
  usage: { input_tokens: number; output_tokens: number };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiUrl = 'https://api.anthropic.com/v1/messages';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get the API key — first check DB config, then fall back to env var.
   */
  private async getApiKey(configKey = 'document_analyzer'): Promise<string> {
    const dbConfig = await this.prisma.configuracionIA.findUnique({
      where: { clave: configKey },
    }).catch(() => null);

    if (dbConfig?.apiKey) return decryptApiKey(dbConfig.apiKey);

    const envKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!envKey) throw new Error('ANTHROPIC_API_KEY no configurada');
    return envKey;
  }

  /**
   * Get AI model config from DB or defaults.
   */
  private async getConfig(configKey = 'document_analyzer') {
    const dbConfig = await this.prisma.configuracionIA.findUnique({
      where: { clave: configKey },
    }).catch(() => null);

    return {
      model: dbConfig?.modelo || 'claude-sonnet-4-5-20250929',
      temperature: dbConfig?.temperatura ?? 0.2,
      maxTokens: dbConfig?.maxTokens ?? 4096,
      promptSistema: dbConfig?.promptSistema || null,
    };
  }

  /**
   * Analyze a document image with Claude Vision.
   */
  async analyzeImage(
    imageBuffer: Buffer,
    contentType: string,
    prompt: string,
    configKey = 'document_analyzer',
  ): Promise<{ data: any; tokens: number; timeMs: number }> {
    const startTime = Date.now();
    const apiKey = await this.getApiKey(configKey);
    const config = await this.getConfig(configKey);

    const mediaType = contentType === 'application/pdf'
      ? 'application/pdf'
      : contentType.startsWith('image/')
        ? contentType
        : 'image/jpeg';

    const base64 = imageBuffer.toString('base64');

    const messages: AnthropicMessage[] = [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ];

    const body: Record<string, any> = {
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages,
    };

    if (config.promptSistema) {
      body.system = config.promptSistema;
    }

    this.logger.log(`Sending image to Claude (${config.model})...`);

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Anthropic API error: ${response.status} - ${errorText}`);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const result: AnthropicResponse = await response.json();
    const timeMs = Date.now() - startTime;
    const tokens = result.usage.input_tokens + result.usage.output_tokens;

    // Extract JSON from response
    const textContent = result.content.find((c) => c.type === 'text')?.text || '{}';

    // Try to parse JSON (handle markdown code blocks)
    let parsed: any;
    try {
      const jsonStr = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      this.logger.warn('Could not parse AI response as JSON, returning raw text');
      parsed = { raw_response: textContent, parse_error: true };
    }

    this.logger.log(`Claude responded in ${timeMs}ms, ${tokens} tokens`);

    return { data: parsed, tokens, timeMs };
  }
}
