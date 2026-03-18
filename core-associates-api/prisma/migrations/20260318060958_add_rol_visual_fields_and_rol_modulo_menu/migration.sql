-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "color" VARCHAR(20),
ADD COLUMN     "es_por_defecto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "icono" VARCHAR(50);

-- CreateTable
CREATE TABLE "roles_modulos_menu" (
    "rol_id" UUID NOT NULL,
    "modulo_menu_id" UUID NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "roles_modulos_menu_pkey" PRIMARY KEY ("rol_id","modulo_menu_id")
);

-- AddForeignKey
ALTER TABLE "roles_modulos_menu" ADD CONSTRAINT "roles_modulos_menu_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_modulos_menu" ADD CONSTRAINT "roles_modulos_menu_modulo_menu_id_fkey" FOREIGN KEY ("modulo_menu_id") REFERENCES "modulos_menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
