-- Tabla de intentos de pre-validación (anti-troll)
CREATE TABLE "intentos_documentos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asociado_id" UUID NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "resultado" VARCHAR(20) NOT NULL,
    "motivo_rechazo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intentos_documentos_pkey" PRIMARY KEY ("id")
);

-- Campos de umbrales en configuracion_ia
ALTER TABLE "configuracion_ia" ADD COLUMN "umbral_auto_aprobacion" DOUBLE PRECISION NOT NULL DEFAULT 0.90;
ALTER TABLE "configuracion_ia" ADD COLUMN "umbral_auto_rechazo" DOUBLE PRECISION NOT NULL DEFAULT 0.40;
ALTER TABLE "configuracion_ia" ADD COLUMN "max_rechazos_preval" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "configuracion_ia" ADD COLUMN "horas_bloqueo_preval" INTEGER NOT NULL DEFAULT 24;

-- FK e índices
ALTER TABLE "intentos_documentos" ADD CONSTRAINT "intentos_documentos_asociado_id_fkey" FOREIGN KEY ("asociado_id") REFERENCES "asociados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "intentos_documentos_asociado_id_tipo_created_at_idx" ON "intentos_documentos"("asociado_id", "tipo", "created_at");
