-- CreateTable
CREATE TABLE "resumenes_diarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "casos_nuevos" INTEGER NOT NULL DEFAULT 0,
    "casos_en_atencion" INTEGER NOT NULL DEFAULT 0,
    "casos_resueltos" INTEGER NOT NULL DEFAULT 0,
    "casos_total_abiertos" INTEGER NOT NULL DEFAULT 0,
    "asociados_registrados" INTEGER NOT NULL DEFAULT 0,
    "cupones_generados" INTEGER NOT NULL DEFAULT 0,
    "cupones_canjeados" INTEGER NOT NULL DEFAULT 0,
    "docs_pendientes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumenes_diarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resumenes_diarios_fecha_key" ON "resumenes_diarios"("fecha");
