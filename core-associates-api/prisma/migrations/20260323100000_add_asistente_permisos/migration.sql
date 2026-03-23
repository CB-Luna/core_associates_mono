-- K.5 — Permisos RBAC del chatbot (Asistente IA)
-- Nuevos permisos: asistente:ver, asistente:modo-avanzado, asistente:configurar

-- ═══════════════════════════════════════════════════════════
-- Insertar permisos del módulo "asistente"
-- ═══════════════════════════════════════════════════════════
INSERT INTO "permisos" ("id", "codigo", "grupo", "descripcion", "created_at") VALUES
  ('b0000000-0000-4000-8000-000000000110', 'asistente:ver',             'asistente', 'Puede ver y usar el chatbot (modo clásico)',                 NOW()),
  ('b0000000-0000-4000-8000-000000000111', 'asistente:modo-avanzado',   'asistente', 'Puede activar el modo avanzado (IA por API)',                NOW()),
  ('b0000000-0000-4000-8000-000000000112', 'asistente:configurar',      'asistente', 'Puede editar la configuración del chatbot en Configuración', NOW())
ON CONFLICT ("codigo") DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- Asignar permisos a roles existentes
-- ═══════════════════════════════════════════════════════════

-- Admin: los 3 permisos
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r."id", p."id"
FROM "roles" r, "permisos" p
WHERE r."nombre" = 'admin'
  AND p."codigo" IN ('asistente:ver', 'asistente:modo-avanzado', 'asistente:configurar')
ON CONFLICT DO NOTHING;

-- Operador: ver + modo-avanzado
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r."id", p."id"
FROM "roles" r, "permisos" p
WHERE r."nombre" = 'operador'
  AND p."codigo" IN ('asistente:ver', 'asistente:modo-avanzado')
ON CONFLICT DO NOTHING;

-- Abogado: solo ver
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r."id", p."id"
FROM "roles" r, "permisos" p
WHERE r."nombre" = 'abogado'
  AND p."codigo" IN ('asistente:ver')
ON CONFLICT DO NOTHING;
