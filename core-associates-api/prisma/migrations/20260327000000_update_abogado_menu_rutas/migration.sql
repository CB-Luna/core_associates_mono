-- ═══════════════════════════════════════════════════════════
-- Actualizar rutas del menú del abogado para que apunten
-- a las páginas bajo el prefijo /abogado/ del CRM web
-- ═══════════════════════════════════════════════════════════

UPDATE "modulos_menu"
SET "ruta" = '/abogado/mis-casos', "updated_at" = NOW()
WHERE "codigo" = 'mis-casos';

UPDATE "modulos_menu"
SET "ruta" = '/abogado/casos-disponibles', "updated_at" = NOW()
WHERE "codigo" = 'casos-disponibles';
