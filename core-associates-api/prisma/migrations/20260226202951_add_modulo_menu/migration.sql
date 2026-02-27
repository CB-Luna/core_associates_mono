-- CreateEnum
CREATE TYPE "TipoMenu" AS ENUM ('enlace', 'seccion', 'separador');

-- CreateTable
CREATE TABLE "modulos_menu" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "codigo" VARCHAR(50) NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "ruta" VARCHAR(200),
    "icono" VARCHAR(50),
    "permisos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "orden" INTEGER NOT NULL DEFAULT 0,
    "tipo" "TipoMenu" NOT NULL DEFAULT 'enlace',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modulos_menu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "modulos_menu_codigo_key" ON "modulos_menu"("codigo");

-- CreateIndex
CREATE INDEX "modulos_menu_parent_id_idx" ON "modulos_menu"("parent_id");

-- CreateIndex
CREATE INDEX "modulos_menu_orden_idx" ON "modulos_menu"("orden");

-- AddForeignKey
ALTER TABLE "modulos_menu" ADD CONSTRAINT "modulos_menu_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "modulos_menu"("id") ON DELETE SET NULL ON UPDATE CASCADE;
