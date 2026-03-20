-- AlterTable: Add permiso sistema:super-admin for dynamic RBAC (D.3)
-- This permission replaces hardcoded `user.rol === 'admin'` checks everywhere

INSERT INTO "permisos" ("id", "codigo", "grupo", "descripcion", "created_at") VALUES
  ('b0000000-0000-4000-8000-0000000000ff', 'sistema:super-admin', 'sistema', 'Acceso total al sistema (super-administrador)', NOW())
ON CONFLICT ("codigo") DO NOTHING;

-- Assign to admin role
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r."id", p."id"
FROM "roles" r, "permisos" p
WHERE r."nombre" = 'admin'
  AND p."codigo" = 'sistema:super-admin'
ON CONFLICT DO NOTHING;
