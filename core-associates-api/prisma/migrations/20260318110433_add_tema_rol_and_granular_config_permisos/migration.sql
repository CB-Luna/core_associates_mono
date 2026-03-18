-- ═══════════════════════════════════════════════════════════
-- Migración: tema por defecto en roles + permisos granulares de configuración
-- ═══════════════════════════════════════════════════════════

-- 1) Agregar columna tema_id_por_defecto a roles
ALTER TABLE "roles" ADD COLUMN "tema_id_por_defecto" UUID;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tema_id_por_defecto_fkey" FOREIGN KEY ("tema_id_por_defecto") REFERENCES "temas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 2) Insertar permisos granulares de configuración
INSERT INTO "permisos" ("id", "codigo", "grupo", "descripcion", "created_at") VALUES
  -- Sub-tabs de Configuración
  ('b0000000-0000-4000-8000-0000000000a1', 'configuracion:usuarios',           'configuracion', 'Ver pestaña Usuarios en Configuración',        NOW()),
  ('b0000000-0000-4000-8000-0000000000a2', 'configuracion:usuarios:crear',     'configuracion', 'Crear nuevos usuarios del CRM',                 NOW()),
  ('b0000000-0000-4000-8000-0000000000a3', 'configuracion:usuarios:editar',    'configuracion', 'Editar datos de usuarios del CRM',              NOW()),
  ('b0000000-0000-4000-8000-0000000000a4', 'configuracion:usuarios:resetear',  'configuracion', 'Resetear contraseñas de usuarios',              NOW()),
  ('b0000000-0000-4000-8000-0000000000a5', 'configuracion:usuarios:estado',    'configuracion', 'Cambiar estado activo/inactivo de usuarios',    NOW()),
  ('b0000000-0000-4000-8000-0000000000a6', 'configuracion:roles',              'configuracion', 'Ver pestaña Roles y Permisos',                  NOW()),
  ('b0000000-0000-4000-8000-0000000000a7', 'configuracion:roles:crear',        'configuracion', 'Crear nuevos roles',                            NOW()),
  ('b0000000-0000-4000-8000-0000000000a8', 'configuracion:roles:editar',       'configuracion', 'Editar permisos y menú de roles',               NOW()),
  ('b0000000-0000-4000-8000-0000000000a9', 'configuracion:temas',              'configuracion', 'Ver pestaña Temas',                             NOW()),
  ('b0000000-0000-4000-8000-0000000000aa', 'configuracion:temas:gestionar',    'configuracion', 'Crear, editar y eliminar temas',                NOW()),
  ('b0000000-0000-4000-8000-0000000000ab', 'configuracion:info',               'configuracion', 'Ver pestaña Info del Sistema',                  NOW()),
  ('b0000000-0000-4000-8000-0000000000ac', 'configuracion:auditoria',          'configuracion', 'Ver pestaña Auditoría',                         NOW()),
  ('b0000000-0000-4000-8000-0000000000ad', 'configuracion:ai',                 'configuracion', 'Ver pestaña Conf AI',                           NOW()),
  ('b0000000-0000-4000-8000-0000000000ae', 'configuracion:ai:configurar',      'configuracion', 'Configurar proveedores y ajustes de IA',       NOW())
ON CONFLICT ("codigo") DO NOTHING;

-- 3) Asignar nuevos permisos al rol ADMIN (todos los nuevos)
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT 'a0000000-0000-4000-8000-000000000001', "id"
FROM "permisos"
WHERE "codigo" LIKE 'configuracion:%'
  AND "id" NOT IN (
    SELECT "permiso_id" FROM "roles_permisos"
    WHERE "rol_id" = 'a0000000-0000-4000-8000-000000000001'
  );
