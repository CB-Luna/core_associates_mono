-- Permiso de búsqueda rápida + asignar notificaciones CRM a operador
-- ═══════════════════════════════════════════════════════════
-- 1. Nuevo permiso: busqueda:ver
-- ═══════════════════════════════════════════════════════════
INSERT INTO "permisos" ("id", "codigo", "grupo", "descripcion", "created_at") VALUES
  ('b0000000-0000-4000-8000-000000000120', 'busqueda:ver', 'busqueda', 'Barra de búsqueda rápida (Cmd+K)', NOW())
ON CONFLICT ("codigo") DO NOTHING;

-- Asignar busqueda:ver a los 4 roles
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r."id", p."id"
FROM "roles" r, "permisos" p
WHERE r."nombre" IN ('admin', 'operador', 'proveedor', 'abogado')
  AND p."codigo" = 'busqueda:ver'
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 2. Asignar notificaciones-crm a operador (faltaba)
-- ═══════════════════════════════════════════════════════════
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r."id", p."id"
FROM "roles" r, "permisos" p
WHERE r."nombre" = 'operador'
  AND p."codigo" IN ('notificaciones-crm:ver', 'notificaciones-crm:marcar-leida')
ON CONFLICT DO NOTHING;
