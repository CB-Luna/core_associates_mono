-- CreateTable
CREATE TABLE "temas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(100) NOT NULL,
    "colores" JSONB NOT NULL,
    "fuente" VARCHAR(100),
    "logo_url" VARCHAR(255),
    "es_global" BOOLEAN NOT NULL DEFAULT false,
    "creado_por" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temas_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "tema_id" UUID;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_tema_id_fkey" FOREIGN KEY ("tema_id") REFERENCES "temas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temas" ADD CONSTRAINT "temas_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
