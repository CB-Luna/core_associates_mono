-- CreateTable
CREATE TABLE "documentos_caso" (
    "id" UUID NOT NULL,
    "caso_id" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "s3_bucket" VARCHAR(100) NOT NULL,
    "s3_key" VARCHAR(500) NOT NULL,
    "content_type" VARCHAR(50) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "subido_por_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_caso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documentos_caso_caso_id_idx" ON "documentos_caso"("caso_id");

-- AddForeignKey
ALTER TABLE "documentos_caso" ADD CONSTRAINT "documentos_caso_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "casos_legales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_caso" ADD CONSTRAINT "documentos_caso_subido_por_id_fkey" FOREIGN KEY ("subido_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
