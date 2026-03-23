-- K.4 — Configuración del chatbot IA
-- Nuevos campos en configuracion_ia para parámetros del chatbot

-- Agregar columnas específicas del chatbot
ALTER TABLE "configuracion_ia" ADD COLUMN "chatbot_activo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "configuracion_ia" ADD COLUMN "modo_avanzado_disponible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "configuracion_ia" ADD COLUMN "max_preguntas_por_hora" INTEGER NOT NULL DEFAULT 20;

-- Insertar configuración por defecto para el chatbot asistente
INSERT INTO "configuracion_ia" (
  "id", "clave", "nombre", "provider", "modelo",
  "temperatura", "max_tokens", "activo",
  "prompt_sistema",
  "chatbot_activo", "modo_avanzado_disponible", "max_preguntas_por_hora",
  "created_at", "updated_at"
) VALUES (
  'c0000000-0000-4000-8000-000000000002',
  'chatbot_assistant',
  'Asistente IA (Chatbot CRM)',
  'anthropic',
  'claude-haiku-4-5-20251001',
  0.3,
  1024,
  true,
  'Eres el asistente virtual de Core Associates, una asociación civil de conductores en CDMX. Responde en español mexicano, de forma breve y profesional. Solo puedes ayudar con temas relacionados a la plataforma: asociados, proveedores, promociones, cupones, casos legales y reportes. No respondas preguntas fuera de este ámbito.',
  true,
  true,
  20,
  NOW(),
  NOW()
) ON CONFLICT ("clave") DO NOTHING;
