-- Agregar campo especialidad a usuarios (para abogados)
ALTER TABLE "usuarios" ADD COLUMN "especialidad" VARCHAR(100);

-- Agregar item de menú "Abogados" para admin/operador
INSERT INTO "modulos_menu" ("id", "codigo", "titulo", "ruta", "icono", "permisos", "orden", "tipo", "visible", "created_at", "updated_at")
VALUES (
  'b0000000-0000-4000-8000-000000000011',
  'abogados',
  'Abogados',
  '/abogados',
  'Gavel',
  ARRAY['admin', 'operador'],
  7,
  'enlace',
  true,
  NOW(),
  NOW()
) ON CONFLICT ("codigo") DO NOTHING;

-- Asignar el nuevo menú al rol admin (orden 7)
INSERT INTO "rol_modulo_menu" ("rol_id", "modulo_menu_id", "orden")
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000011', 7),
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000011', 7)
ON CONFLICT DO NOTHING;
