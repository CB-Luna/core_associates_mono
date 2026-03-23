import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { decryptApiKey } from '../../common/utils/crypto.util';

interface AiProviderResult {
  text: string;
  tokens: number;
}

interface FullConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  promptSistema: string | null;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

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
    if (!envKey) throw new Error('API key de IA no configurada');
    return envKey;
  }

  /**
   * Get full AI config from DB (provider + model + params).
   */
  async getConfig(configKey = 'document_analyzer'): Promise<FullConfig> {
    const dbConfig = await this.prisma.configuracionIA.findUnique({
      where: { clave: configKey },
    }).catch(() => null);

    return {
      provider: dbConfig?.provider || 'anthropic',
      model: dbConfig?.modelo || 'claude-sonnet-4-5-20250929',
      temperature: dbConfig?.temperatura ?? 0.2,
      maxTokens: dbConfig?.maxTokens ?? 4096,
      promptSistema: dbConfig?.promptSistema || null,
    };
  }

  // ──────────────────────────────────────────────
  // Anthropic provider
  // ──────────────────────────────────────────────

  private async callAnthropic(
    apiKey: string,
    config: FullConfig,
    messages: any[],
  ): Promise<AiProviderResult> {
    const body: Record<string, any> = {
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages,
    };
    if (config.promptSistema) body.system = config.promptSistema;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
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

    const result = await response.json();
    const tokens = (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0);
    const text = result.content?.find((c: any) => c.type === 'text')?.text || '';
    return { text, tokens };
  }

  // ──────────────────────────────────────────────
  // Google Gemini provider
  // ──────────────────────────────────────────────

  private async callGemini(
    apiKey: string,
    config: FullConfig,
    parts: any[],
  ): Promise<AiProviderResult> {
    const model = config.model || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body: Record<string, any> = {
      contents: [{ parts }],
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
      },
    };
    if (config.promptSistema) {
      body.systemInstruction = { parts: [{ text: config.promptSistema }] };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Gemini API error: ${response.status} - ${errorText}`);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const usage = result.usageMetadata || {};
    const tokens = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
    return { text, tokens };
  }

  // ──────────────────────────────────────────────
  // Public methods (provider-agnostic)
  // ──────────────────────────────────────────────

  /**
   * Analyze a document image with the configured AI provider.
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
    const base64 = imageBuffer.toString('base64');
    const mediaType = contentType === 'application/pdf'
      ? 'application/pdf'
      : contentType.startsWith('image/') ? contentType : 'image/jpeg';

    this.logger.log(`Sending image to ${config.provider} (${config.model})...`);

    let result: AiProviderResult;

    if (config.provider === 'google') {
      // Gemini: inline_data for images
      const parts: any[] = [
        { inline_data: { mime_type: mediaType, data: base64 } },
        { text: prompt },
      ];
      result = await this.callGemini(apiKey, config, parts);
    } else {
      // Anthropic (default)
      const messages = [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: prompt },
        ],
      }];
      result = await this.callAnthropic(apiKey, config, messages);
    }

    const timeMs = Date.now() - startTime;

    // Parse JSON from response text
    let parsed: any;
    try {
      const jsonStr = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      this.logger.warn('Could not parse AI response as JSON, returning raw text');
      parsed = { raw_response: result.text, parse_error: true };
    }

    this.logger.log(`${config.provider} responded in ${timeMs}ms, ${result.tokens} tokens`);
    return { data: parsed, tokens: result.tokens, timeMs };
  }

  /**
   * Send a text-only chat message to the configured AI provider.
   * Used by the chatbot assistant (modo avanzado).
   */
  async chat(
    userMessage: string,
    systemPrompt: string,
    configKey = 'chatbot_assistant',
  ): Promise<{ text: string; tokens: number; timeMs: number }> {
    const startTime = Date.now();
    const apiKey = await this.getApiKey(configKey);
    const config = await this.getConfig(configKey);
    config.maxTokens = Math.min(config.maxTokens, 1024);

    this.logger.log(`Chatbot request to ${config.provider} (${config.model})`);

    let result: AiProviderResult;

    if (config.provider === 'google') {
      const configWithSystem = { ...config, promptSistema: systemPrompt };
      result = await this.callGemini(apiKey, configWithSystem, [{ text: userMessage }]);
    } else {
      const configWithSystem = { ...config, promptSistema: systemPrompt };
      const messages = [{ role: 'user', content: userMessage }];
      result = await this.callAnthropic(apiKey, configWithSystem, messages);
    }

    const timeMs = Date.now() - startTime;
    this.logger.log(`Chatbot responded in ${timeMs}ms, ${result.tokens} tokens`);
    return { text: result.text, tokens: result.tokens, timeMs };
  }
}
