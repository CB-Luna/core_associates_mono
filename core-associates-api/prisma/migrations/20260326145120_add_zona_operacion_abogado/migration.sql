-- AlterTable: Agregar campos de zona de operación al modelo Usuario (solo abogados)
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "zona_latitud" DOUBLE PRECISION;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "zona_longitud" DOUBLE PRECISION;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "zona_radio_km" INTEGER DEFAULT 80;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "zona_estado" VARCHAR(100);
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "zona_descripcion" VARCHAR(200);
