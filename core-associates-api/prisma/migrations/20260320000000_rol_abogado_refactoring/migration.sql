-- ═══════════════════════════════════════════════════════════
-- Migración: Rol de Abogado — Refactoring completo (C.0)
-- ═══════════════════════════════════════════════════════════

-- C.0.1 — Enum RolUsuario: agregar 'abogado'
ALTER TYPE "RolUsuario" ADD VALUE 'abogado';

-- C.0.2 — CasoLegal: campo abogado_usuario_id (individuo)
ALTER TABLE "casos_legales" ADD COLUMN "abogado_usuario_id" UUID;

ALTER TABLE "casos_legales"
  ADD CONSTRAINT "casos_legales_abogado_usuario_id_fkey"
  FOREIGN KEY ("abogado_usuario_id") REFERENCES "usuarios"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "casos_legales_abogado_usuario_id_idx" ON "casos_legales"("abogado_usuario_id");

-- C.0.3 — DispositivoToken: soporte para usuarios CRM
-- Hacer asociadoId nullable
ALTER TABLE "dispositivos_token" ALTER COLUMN "asociado_id" DROP NOT NULL;

-- Agregar usuario_id
ALTER TABLE "dispositivos_token" ADD COLUMN "usuario_id" UUID;

ALTER TABLE "dispositivos_token"
  ADD CONSTRAINT "dispositivos_token_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Reemplazar unique constraint: drop la vieja, crear dos parciales
ALTER TABLE "dispositivos_token" DROP CONSTRAINT "dispositivos_token_asociado_id_token_key";

CREATE UNIQUE INDEX "dispositivos_token_asociado_id_token_key"
  ON "dispositivos_token"("asociado_id", "token")
  WHERE "asociado_id" IS NOT NULL;

CREATE UNIQUE INDEX "dispositivos_token_usuario_id_token_key"
  ON "dispositivos_token"("usuario_id", "token")
  WHERE "usuario_id" IS NOT NULL;

CREATE INDEX "dispositivos_token_usuario_id_idx" ON "dispositivos_token"("usuario_id");

-- C.0.4 — Modelo NotificacionCRM: bandeja persistente
CREATE TABLE "notificaciones_crm" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "referencia_id" UUID,
    "referencia_tipo" VARCHAR(50),
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_crm_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notificaciones_crm_usuario_id_leida_idx" ON "notificaciones_crm"("usuario_id", "leida");
CREATE INDEX "notificaciones_crm_created_at_idx" ON "notificaciones_crm"("created_at");

ALTER TABLE "notificaciones_crm"
  ADD CONSTRAINT "notificaciones_crm_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════
-- C.0.5 — Permisos específicos del abogado + Rol abogado
-- ═══════════════════════════════════════════════════════════

-- Rol "abogado" protegido (ON CONFLICT por si ya existe via CRM)
INSERT INTO "roles" ("id", "nombre", "descripcion", "icono", "color", "es_protegido", "created_at", "updated_at") VALUES
  ('a0000000-0000-4000-8000-000000000004', 'abogado', 'Abogado con acceso a casos legales asignados', 'Gavel', '#8B5CF6', true, NOW(), NOW())
ON CONFLICT ("nombre") DO UPDATE SET
  "descripcion" = EXCLUDED."descripcion",
  "icono" = EXCLUDED."icono",
  "color" = EXCLUDED."color",
  "es_protegido" = EXCLUDED."es_protegido",
  "updated_at" = NOW();

-- Permisos del abogado
INSERT INTO "permisos" ("id", "codigo", "grupo", "descripcion", "created_at") VALUES
  ('b0000000-0000-4000-8000-000000000100', 'casos-legales:ver-propios',            'casos-legales',   'Ver solo los casos asignados al abogado',                  NOW()),
  ('b0000000-0000-4000-8000-000000000101', 'casos-legales:agregar-notas',          'casos-legales',   'Agregar notas a casos propios',                            NOW()),
  ('b0000000-0000-4000-8000-000000000102', 'casos-legales:cambiar-estado-limitado', 'casos-legales',  'Cambiar a en_atencion o escalado',                         NOW()),
  ('b0000000-0000-4000-8000-000000000103', 'casos-legales:aceptar-rechazar',        'casos-legales',  'Aceptar o rechazar una asignación de caso',                NOW()),
  ('b0000000-0000-4000-8000-000000000104', 'casos-legales:ver-disponibles',         'casos-legales',  'Ver casos sin abogado para postularse',                    NOW()),
  ('b0000000-0000-4000-8000-000000000105', 'notificaciones-crm:ver',               'notificaciones',  'Ver notificaciones CRM propias',                           NOW()),
  ('b0000000-0000-4000-8000-000000000106', 'notificaciones-crm:marcar-leida',      'notificaciones',  'Marcar notificaciones como leídas',                        NOW())
ON CONFLICT ("codigo") DO NOTHING;

-- Asignar permisos al rol abogado
-- Usamos subquery para obtener el ID real del rol (por si fue creado con UUID distinto via CRM)
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r."id", p."id"
FROM "roles" r, "permisos" p
WHERE r."nombre" = 'abogado'
  AND p."codigo" IN (
    'dashboard:ver',
    'casos-legales:ver-propios',
    'casos-legales:agregar-notas',
    'casos-legales:cambiar-estado-limitado',
    'casos-legales:aceptar-rechazar',
    'casos-legales:ver-disponibles',
    'notificaciones-crm:ver',
    'notificaciones-crm:marcar-leida'
  )
ON CONFLICT DO NOTHING;

-- También dar permisos de notificaciones CRM a admin y operador
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r."id", p."id"
FROM "roles" r, "permisos" p
WHERE r."nombre" IN ('admin', 'operador')
  AND p."codigo" IN ('notificaciones-crm:ver', 'notificaciones-crm:marcar-leida')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- C.0.6 — Menú del abogado
-- ═══════════════════════════════════════════════════════════

-- Crear items de menú nuevos para el abogado
INSERT INTO "modulos_menu" ("id", "codigo", "titulo", "ruta", "icono", "permisos", "orden", "tipo", "visible", "created_at", "updated_at") VALUES
  ('d0000000-0000-4000-8000-000000000001', 'mis-casos',         'Mis Casos',          '/mis-casos',         'Briefcase',  ARRAY['abogado']::text[], 2, 'enlace', true, NOW(), NOW()),
  ('d0000000-0000-4000-8000-000000000002', 'casos-disponibles', 'Casos Disponibles',  '/casos-disponibles', 'FolderOpen', ARRAY['abogado']::text[], 3, 'enlace', true, NOW(), NOW())
ON CONFLICT ("codigo") DO UPDATE SET
  "titulo" = EXCLUDED."titulo",
  "ruta" = EXCLUDED."ruta",
  "icono" = EXCLUDED."icono",
  "updated_at" = NOW();

-- Asignar menú al rol abogado via RolModuloMenu
-- Dashboard + Mis Casos + Casos Disponibles
INSERT INTO "roles_modulos_menu" ("rol_id", "modulo_menu_id", "orden")
SELECT r."id", m."id", CASE m."codigo"
    WHEN 'dashboard' THEN 1
    WHEN 'mis-casos' THEN 2
    WHEN 'casos-disponibles' THEN 3
  END
FROM "roles" r, "modulos_menu" m
WHERE r."nombre" = 'abogado'
  AND m."codigo" IN ('dashboard', 'mis-casos', 'casos-disponibles')
ON CONFLICT DO NOTHING;
