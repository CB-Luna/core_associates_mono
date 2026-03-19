-- Fix: Corregir el campo enum "rol" de usuarios que fueron creados con rol "abogado"
-- pero el bug en createUser/updateUser les asignó 'operador' porque 'abogado'
-- no estaba en validEnumValues.
-- Se corrige comparando con el rolId que apunta al registro de rol "abogado".

UPDATE "usuarios"
SET "rol" = 'abogado'
WHERE "rol" = 'operador'
  AND "rol_id" IN (
    SELECT "id" FROM "roles" WHERE "nombre" = 'abogado'
  );
