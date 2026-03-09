-- CreateTable
CREATE TABLE "notas_asociado" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asociado_id" UUID NOT NULL,
    "autor_id" UUID NOT NULL,
    "contenido" TEXT NOT NULL,
    "tipo" VARCHAR(30) NOT NULL DEFAULT 'nota',
    "metadatos" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notas_asociado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_notas_asociado_asociado" ON "notas_asociado"("asociado_id");

-- AddForeignKey
ALTER TABLE "notas_asociado" ADD CONSTRAINT "notas_asociado_asociado_id_fkey" FOREIGN KEY ("asociado_id") REFERENCES "asociados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_asociado" ADD CONSTRAINT "notas_asociado_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
