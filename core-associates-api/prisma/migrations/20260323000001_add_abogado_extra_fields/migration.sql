-- G.2 — Agregar campos adicionales para abogados en la tabla usuarios
-- cedulaProfesional, telefono, direccion (todos opcionales)
ALTER TABLE "usuarios" ADD COLUMN "cedula_profesional" VARCHAR(50);
ALTER TABLE "usuarios" ADD COLUMN "telefono" VARCHAR(20);
ALTER TABLE "usuarios" ADD COLUMN "direccion" VARCHAR(300);
