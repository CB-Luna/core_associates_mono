-- ═══════════════════════════════════════════════════════════
-- Migración: Permiso documentos:cargar para subida por admin/operador
-- ═══════════════════════════════════════════════════════════

-- 1) Insertar permiso documentos:cargar
INSERT INTO "permisos" ("id", "codigo", "grupo", "descripcion", "created_at") VALUES
  ('b0000000-0000-4000-8000-000000000072', 'documentos:cargar', 'documentos', 'Subir documentos en nombre de un asociado', NOW())
ON CONFLICT ("codigo") DO NOTHING;

-- 2) Asignar a rol admin
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000072'
WHERE NOT EXISTS (
  SELECT 1 FROM "roles_permisos"
  WHERE "rol_id" = 'a0000000-0000-4000-8000-000000000001'
    AND "permiso_id" = 'b0000000-0000-4000-8000-000000000072'
);

-- 3) Asignar a rol operador
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000072'
WHERE NOT EXISTS (
  SELECT 1 FROM "roles_permisos"
  WHERE "rol_id" = 'a0000000-0000-4000-8000-000000000002'
    AND "permiso_id" = 'b0000000-0000-4000-8000-000000000072'
);
