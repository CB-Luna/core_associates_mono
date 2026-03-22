-- D.3.8 — Eliminar columna legacy "permisos" de modulos_menu
-- El control de acceso por rol se hace exclusivamente via la tabla pivot rol_modulo_menu (RolModuloMenu).
ALTER TABLE "modulos_menu" DROP COLUMN IF EXISTS "permisos";
