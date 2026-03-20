-- ═══════════════════════════════════════════════════════════
-- Migración: Permiso asociados:ver_detalle (granular)
-- Separa "ver lista" de "ver detalle (ojito)" en la tabla de asociados.
-- ═══════════════════════════════════════════════════════════

-- 1) Actualizar descripción de asociados:ver
UPDATE "permisos"
SET "descripcion" = 'Ver lista de asociados en la tabla'
WHERE "codigo" = 'asociados:ver';

-- 2) Insertar nuevo permiso asociados:ver_detalle
INSERT INTO "permisos" ("id", "codigo", "grupo", "descripcion", "created_at") VALUES
  ('b0000000-0000-4000-8000-000000000080', 'asociados:ver_detalle', 'asociados', 'Ver detalle completo de un asociado (modal)', NOW())
ON CONFLICT ("codigo") DO NOTHING;

-- 3) Asignar a rol admin
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000080'
WHERE NOT EXISTS (
  SELECT 1 FROM "roles_permisos"
  WHERE "rol_id" = 'a0000000-0000-4000-8000-000000000001'
    AND "permiso_id" = 'b0000000-0000-4000-8000-000000000080'
);

-- 4) Asignar a rol operador
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000080'
WHERE NOT EXISTS (
  SELECT 1 FROM "roles_permisos"
  WHERE "rol_id" = 'a0000000-0000-4000-8000-000000000002'
    AND "permiso_id" = 'b0000000-0000-4000-8000-000000000080'
);
