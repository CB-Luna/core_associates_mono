-- CreateEnum
CREATE TYPE "EstadoAnalisis" AS ENUM ('procesando', 'completado', 'error');

-- AlterTable
ALTER TABLE "asociados" ALTER COLUMN "nombre" DROP NOT NULL,
ALTER COLUMN "apellido_pat" DROP NOT NULL,
ALTER COLUMN "fecha_nacimiento" DROP NOT NULL;

-- AlterTable
ALTER TABLE "notas_asociado" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "resumenes_diarios" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "analisis_documentos" (
    "id" UUID NOT NULL,
    "documento_id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "modelo" VARCHAR(100) NOT NULL,
    "estado" "EstadoAnalisis" NOT NULL DEFAULT 'procesando',
    "datos_extraidos" JSONB,
    "confianza" DOUBLE PRECISION,
    "validaciones" JSONB,
    "error_msg" TEXT,
    "tokens_usados" INTEGER,
    "tiempo_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analisis_documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_ia" (
    "id" UUID NOT NULL,
    "clave" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "modelo" VARCHAR(100) NOT NULL,
    "api_key" VARCHAR(500),
    "prompt_sistema" TEXT,
    "temperatura" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "max_tokens" INTEGER NOT NULL DEFAULT 4096,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispositivos_token" (
    "id" UUID NOT NULL,
    "asociado_id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "plataforma" VARCHAR(10) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispositivos_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "analisis_documentos_documento_id_key" ON "analisis_documentos"("documento_id");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_ia_clave_key" ON "configuracion_ia"("clave");

-- CreateIndex
CREATE INDEX "dispositivos_token_asociado_id_idx" ON "dispositivos_token"("asociado_id");

-- CreateIndex
CREATE UNIQUE INDEX "dispositivos_token_asociado_id_token_key" ON "dispositivos_token"("asociado_id", "token");

-- AddForeignKey
ALTER TABLE "analisis_documentos" ADD CONSTRAINT "analisis_documentos_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispositivos_token" ADD CONSTRAINT "dispositivos_token_asociado_id_fkey" FOREIGN KEY ("asociado_id") REFERENCES "asociados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_notas_asociado_asociado" RENAME TO "notas_asociado_asociado_id_idx";
