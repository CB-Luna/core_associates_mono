-- CreateEnum
CREATE TYPE "EstadoAsociado" AS ENUM ('pendiente', 'activo', 'suspendido', 'baja', 'rechazado');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('ine_frente', 'ine_reverso', 'selfie', 'tarjeta_circulacion', 'otro');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- CreateEnum
CREATE TYPE "TipoProveedor" AS ENUM ('abogado', 'comida', 'taller', 'lavado', 'capacitacion', 'otro');

-- CreateEnum
CREATE TYPE "EstadoProveedor" AS ENUM ('activo', 'inactivo');

-- CreateEnum
CREATE TYPE "TipoDescuento" AS ENUM ('porcentaje', 'monto_fijo');

-- CreateEnum
CREATE TYPE "EstadoPromocion" AS ENUM ('activa', 'pausada', 'finalizada');

-- CreateEnum
CREATE TYPE "EstadoCupon" AS ENUM ('activo', 'canjeado', 'vencido', 'cancelado');

-- CreateEnum
CREATE TYPE "TipoPercance" AS ENUM ('accidente', 'infraccion', 'robo', 'asalto', 'otro');

-- CreateEnum
CREATE TYPE "EstadoCasoLegal" AS ENUM ('abierto', 'en_atencion', 'escalado', 'resuelto', 'cerrado', 'cancelado');

-- CreateEnum
CREATE TYPE "PrioridadCaso" AS ENUM ('baja', 'media', 'alta', 'urgente');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('admin', 'operador', 'proveedor');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('activo', 'inactivo');

-- CreateTable
CREATE TABLE "asociados" (
    "id" UUID NOT NULL,
    "id_unico" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido_pat" VARCHAR(100) NOT NULL,
    "apellido_mat" VARCHAR(100),
    "telefono" VARCHAR(15) NOT NULL,
    "email" VARCHAR(150),
    "fecha_nacimiento" DATE NOT NULL,
    "foto_url" VARCHAR(500),
    "estado" "EstadoAsociado" NOT NULL DEFAULT 'pendiente',
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_aprobacion" TIMESTAMP(3),
    "aprobado_por" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asociados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehiculos" (
    "id" UUID NOT NULL,
    "asociado_id" UUID NOT NULL,
    "marca" VARCHAR(50) NOT NULL,
    "modelo" VARCHAR(50) NOT NULL,
    "anio" INTEGER NOT NULL,
    "color" VARCHAR(30) NOT NULL,
    "placas" VARCHAR(15) NOT NULL,
    "numero_serie" VARCHAR(50),
    "es_principal" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" UUID NOT NULL,
    "asociado_id" UUID NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "s3_bucket" VARCHAR(100) NOT NULL,
    "s3_key" VARCHAR(500) NOT NULL,
    "content_type" VARCHAR(50) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "checksum_sha256" VARCHAR(64),
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'pendiente',
    "motivo_rechazo" TEXT,
    "revisado_por" UUID,
    "fecha_revision" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" UUID NOT NULL,
    "id_unico" VARCHAR(20) NOT NULL,
    "razon_social" VARCHAR(200) NOT NULL,
    "tipo" "TipoProveedor" NOT NULL,
    "direccion" TEXT,
    "latitud" DECIMAL(10,8),
    "longitud" DECIMAL(11,8),
    "telefono" VARCHAR(15),
    "email" VARCHAR(150),
    "logotipo_url" VARCHAR(500),
    "contacto_nombre" VARCHAR(100),
    "estado" "EstadoProveedor" NOT NULL DEFAULT 'activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promociones" (
    "id" UUID NOT NULL,
    "proveedor_id" UUID NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo_descuento" "TipoDescuento" NOT NULL,
    "valor_descuento" DECIMAL(10,2) NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "vigencia_cupon" INTEGER NOT NULL,
    "terminos" TEXT,
    "imagen_url" VARCHAR(500),
    "max_cupones" INTEGER,
    "estado" "EstadoPromocion" NOT NULL DEFAULT 'activa',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promociones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cupones" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "asociado_id" UUID NOT NULL,
    "promocion_id" UUID NOT NULL,
    "proveedor_id" UUID NOT NULL,
    "qr_payload" TEXT NOT NULL,
    "qr_firma" VARCHAR(128) NOT NULL,
    "estado" "EstadoCupon" NOT NULL DEFAULT 'activo',
    "fecha_generacion" TIMESTAMP(3) NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "fecha_canje" TIMESTAMP(3),
    "canjeado_por" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cupones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casos_legales" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "asociado_id" UUID NOT NULL,
    "abogado_id" UUID,
    "tipo_percance" "TipoPercance" NOT NULL,
    "descripcion" TEXT,
    "latitud" DECIMAL(10,8) NOT NULL,
    "longitud" DECIMAL(11,8) NOT NULL,
    "direccion_aprox" TEXT,
    "estado" "EstadoCasoLegal" NOT NULL DEFAULT 'abierto',
    "prioridad" "PrioridadCaso" NOT NULL DEFAULT 'media',
    "fecha_apertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_asignacion" TIMESTAMP(3),
    "fecha_cierre" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casos_legales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_caso" (
    "id" UUID NOT NULL,
    "caso_id" UUID NOT NULL,
    "autor_id" UUID NOT NULL,
    "contenido" TEXT NOT NULL,
    "es_privada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notas_caso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "proveedor_id" UUID,
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'activo',
    "ultimo_acceso" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" UUID NOT NULL,
    "usuario_id" UUID,
    "accion" VARCHAR(50) NOT NULL,
    "entidad" VARCHAR(50) NOT NULL,
    "entidad_id" UUID NOT NULL,
    "datos_anteriores" JSONB,
    "datos_nuevos" JSONB,
    "ip" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asociados_id_unico_key" ON "asociados"("id_unico");

-- CreateIndex
CREATE UNIQUE INDEX "asociados_telefono_key" ON "asociados"("telefono");

-- CreateIndex
CREATE INDEX "asociados_estado_idx" ON "asociados"("estado");

-- CreateIndex
CREATE INDEX "asociados_telefono_idx" ON "asociados"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_id_unico_key" ON "proveedores"("id_unico");

-- CreateIndex
CREATE INDEX "proveedores_tipo_idx" ON "proveedores"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "cupones_codigo_key" ON "cupones"("codigo");

-- CreateIndex
CREATE INDEX "cupones_estado_idx" ON "cupones"("estado");

-- CreateIndex
CREATE INDEX "cupones_asociado_id_idx" ON "cupones"("asociado_id");

-- CreateIndex
CREATE INDEX "cupones_proveedor_id_idx" ON "cupones"("proveedor_id");

-- CreateIndex
CREATE INDEX "cupones_fecha_vencimiento_idx" ON "cupones"("fecha_vencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "casos_legales_codigo_key" ON "casos_legales"("codigo");

-- CreateIndex
CREATE INDEX "casos_legales_estado_idx" ON "casos_legales"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "asociados" ADD CONSTRAINT "asociados_aprobado_por_fkey" FOREIGN KEY ("aprobado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_asociado_id_fkey" FOREIGN KEY ("asociado_id") REFERENCES "asociados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_asociado_id_fkey" FOREIGN KEY ("asociado_id") REFERENCES "asociados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_revisado_por_fkey" FOREIGN KEY ("revisado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promociones" ADD CONSTRAINT "promociones_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cupones" ADD CONSTRAINT "cupones_asociado_id_fkey" FOREIGN KEY ("asociado_id") REFERENCES "asociados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cupones" ADD CONSTRAINT "cupones_promocion_id_fkey" FOREIGN KEY ("promocion_id") REFERENCES "promociones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cupones" ADD CONSTRAINT "cupones_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cupones" ADD CONSTRAINT "cupones_canjeado_por_fkey" FOREIGN KEY ("canjeado_por") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos_legales" ADD CONSTRAINT "casos_legales_asociado_id_fkey" FOREIGN KEY ("asociado_id") REFERENCES "asociados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos_legales" ADD CONSTRAINT "casos_legales_abogado_id_fkey" FOREIGN KEY ("abogado_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_caso" ADD CONSTRAINT "notas_caso_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "casos_legales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_caso" ADD CONSTRAINT "notas_caso_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
