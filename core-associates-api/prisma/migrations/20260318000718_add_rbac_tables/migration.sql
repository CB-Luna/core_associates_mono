-- AlterTable
ALTER TABLE "temas" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "rol_id" UUID;

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(200),
    "es_protegido" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(100) NOT NULL,
    "grupo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_permisos" (
    "rol_id" UUID NOT NULL,
    "permiso_id" UUID NOT NULL,

    CONSTRAINT "roles_permisos_pkey" PRIMARY KEY ("rol_id","permiso_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_codigo_key" ON "permisos"("codigo");

-- CreateIndex
CREATE INDEX "permisos_grupo_idx" ON "permisos"("grupo");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════
-- DATA MIGRATION: Roles, Permisos y asignaciones iniciales
-- ═══════════════════════════════════════════════════════════

-- Insertar 3 roles protegidos
INSERT INTO "roles" ("id", "nombre", "descripcion", "es_protegido", "created_at", "updated_at") VALUES
  ('a0000000-0000-4000-8000-000000000001', 'admin',     'Administrador con acceso total al sistema',  true, NOW(), NOW()),
  ('a0000000-0000-4000-8000-000000000002', 'operador',  'Operador de soporte y atención a asociados', true, NOW(), NOW()),
  ('a0000000-0000-4000-8000-000000000003', 'proveedor', 'Proveedor con acceso a sus propios datos',   true, NOW(), NOW());

-- Insertar permisos agrupados por módulo
INSERT INTO "permisos" ("id", "codigo", "grupo", "descripcion", "created_at") VALUES
  -- Dashboard
  ('b0000000-0000-4000-8000-000000000001', 'dashboard:ver',              'dashboard',      'Ver panel principal',                   NOW()),
  -- Asociados
  ('b0000000-0000-4000-8000-000000000010', 'asociados:ver',             'asociados',       'Ver lista y detalle de asociados',      NOW()),
  ('b0000000-0000-4000-8000-000000000011', 'asociados:editar',          'asociados',       'Editar datos de asociados',             NOW()),
  ('b0000000-0000-4000-8000-000000000012', 'asociados:aprobar',         'asociados',       'Aprobar o rechazar asociados',          NOW()),
  -- Proveedores
  ('b0000000-0000-4000-8000-000000000020', 'proveedores:ver',           'proveedores',     'Ver lista y detalle de proveedores',    NOW()),
  ('b0000000-0000-4000-8000-000000000021', 'proveedores:crear',         'proveedores',     'Crear nuevos proveedores',              NOW()),
  ('b0000000-0000-4000-8000-000000000022', 'proveedores:editar',        'proveedores',     'Editar datos de proveedores',           NOW()),
  ('b0000000-0000-4000-8000-000000000023', 'proveedores:eliminar',      'proveedores',     'Eliminar proveedores',                  NOW()),
  -- Promociones
  ('b0000000-0000-4000-8000-000000000030', 'promociones:ver',           'promociones',     'Ver promociones',                       NOW()),
  ('b0000000-0000-4000-8000-000000000031', 'promociones:crear',         'promociones',     'Crear promociones',                     NOW()),
  ('b0000000-0000-4000-8000-000000000032', 'promociones:editar',        'promociones',     'Editar promociones',                    NOW()),
  -- Cupones
  ('b0000000-0000-4000-8000-000000000040', 'cupones:ver',               'cupones',         'Ver lista de cupones',                  NOW()),
  ('b0000000-0000-4000-8000-000000000041', 'cupones:canjear',           'cupones',         'Canjear y validar cupones',             NOW()),
  -- Casos Legales
  ('b0000000-0000-4000-8000-000000000050', 'casos-legales:ver',         'casos-legales',   'Ver casos legales',                     NOW()),
  ('b0000000-0000-4000-8000-000000000051', 'casos-legales:asignar',     'casos-legales',   'Asignar abogado a caso',                NOW()),
  ('b0000000-0000-4000-8000-000000000052', 'casos-legales:cambiar-estado',    'casos-legales',   'Cambiar estado del caso',         NOW()),
  ('b0000000-0000-4000-8000-000000000053', 'casos-legales:cambiar-prioridad', 'casos-legales',   'Cambiar prioridad del caso',      NOW()),
  ('b0000000-0000-4000-8000-000000000054', 'casos-legales:ver-notas-privadas','casos-legales',   'Ver notas privadas de casos',     NOW()),
  -- Mapa SOS
  ('b0000000-0000-4000-8000-000000000060', 'mapa-sos:ver',              'mapa-sos',        'Ver mapa de emergencias',               NOW()),
  -- Documentos
  ('b0000000-0000-4000-8000-000000000070', 'documentos:ver',            'documentos',      'Ver documentos de asociados',           NOW()),
  ('b0000000-0000-4000-8000-000000000071', 'documentos:revisar',        'documentos',      'Aprobar o rechazar documentos',         NOW()),
  -- Reportes
  ('b0000000-0000-4000-8000-000000000080', 'reportes:ver',              'reportes',        'Ver reportes y estadísticas',           NOW()),
  ('b0000000-0000-4000-8000-000000000081', 'reportes:exportar',         'reportes',        'Exportar reportes a CSV/PDF',           NOW()),
  -- Usuarios
  ('b0000000-0000-4000-8000-000000000090', 'usuarios:ver',              'usuarios',        'Ver lista de usuarios CRM',             NOW()),
  ('b0000000-0000-4000-8000-000000000091', 'usuarios:crear',            'usuarios',        'Crear usuarios CRM',                    NOW()),
  ('b0000000-0000-4000-8000-000000000092', 'usuarios:editar',           'usuarios',        'Editar usuarios CRM',                   NOW()),
  -- Configuración
  ('b0000000-0000-4000-8000-0000000000a0', 'configuracion:ver',         'configuracion',   'Acceder a configuración del sistema',   NOW()),
  -- Auditoría
  ('b0000000-0000-4000-8000-0000000000b0', 'auditoria:ver',             'auditoria',       'Ver log de auditoría',                  NOW()),
  -- Temas
  ('b0000000-0000-4000-8000-0000000000c0', 'temas:gestionar',           'temas',           'Crear, editar y eliminar temas',        NOW()),
  -- Menú
  ('b0000000-0000-4000-8000-0000000000d0', 'menu:gestionar',            'menu',            'Gestionar menú dinámico',               NOW()),
  -- Notificaciones
  ('b0000000-0000-4000-8000-0000000000e0', 'notificaciones:enviar',     'notificaciones',  'Enviar notificaciones push',            NOW()),
  -- IA
  ('b0000000-0000-4000-8000-0000000000f0', 'ia:analizar',               'ia',              'Ejecutar análisis con IA',              NOW()),
  ('b0000000-0000-4000-8000-0000000000f1', 'ia:configurar',             'ia',              'Configurar proveedores de IA',          NOW());

-- Asignar permisos al rol ADMIN (todos)
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT 'a0000000-0000-4000-8000-000000000001', "id" FROM "permisos";

-- Asignar permisos al rol OPERADOR
INSERT INTO "roles_permisos" ("rol_id", "permiso_id") VALUES
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001'),  -- dashboard:ver
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000010'),  -- asociados:ver
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000011'),  -- asociados:editar
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000012'),  -- asociados:aprobar
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000020'),  -- proveedores:ver
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000030'),  -- promociones:ver
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000031'),  -- promociones:crear
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000032'),  -- promociones:editar
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000040'),  -- cupones:ver
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000050'),  -- casos-legales:ver
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000051'),  -- casos-legales:asignar
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000052'),  -- casos-legales:cambiar-estado
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000053'),  -- casos-legales:cambiar-prioridad
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000054'),  -- casos-legales:ver-notas-privadas
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000060'),  -- mapa-sos:ver
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000070'),  -- documentos:ver
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000071'),  -- documentos:revisar
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000080'),  -- reportes:ver
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-0000000000e0'),  -- notificaciones:enviar
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-0000000000f0');  -- ia:analizar

-- Asignar permisos al rol PROVEEDOR
INSERT INTO "roles_permisos" ("rol_id", "permiso_id") VALUES
  ('a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001'),  -- dashboard:ver
  ('a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000030'),  -- promociones:ver
  ('a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000031'),  -- promociones:crear
  ('a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000032'),  -- promociones:editar
  ('a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000040'),  -- cupones:ver
  ('a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000041'),  -- cupones:canjear
  ('a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000080');  -- reportes:ver

-- Migrar usuarios existentes: asignar rolId según el enum rol
UPDATE "usuarios" SET "rol_id" = 'a0000000-0000-4000-8000-000000000001' WHERE "rol" = 'admin';
UPDATE "usuarios" SET "rol_id" = 'a0000000-0000-4000-8000-000000000002' WHERE "rol" = 'operador';
UPDATE "usuarios" SET "rol_id" = 'a0000000-0000-4000-8000-000000000003' WHERE "rol" = 'proveedor';
