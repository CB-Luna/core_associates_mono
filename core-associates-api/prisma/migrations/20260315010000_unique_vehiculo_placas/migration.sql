-- Eliminar duplicados (conservar el más reciente por placas)
DELETE FROM "vehiculos" a
USING "vehiculos" b
WHERE a.id < b.id AND a.placas = b.placas;

-- CreateIndex
CREATE UNIQUE INDEX "vehiculos_placas_key" ON "vehiculos"("placas");
