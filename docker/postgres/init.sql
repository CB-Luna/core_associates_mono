-- ============================================================
-- CORE ASSOCIATES - PostgreSQL Initialization
-- ============================================================
-- Este script se ejecuta automáticamente al crear el contenedor
-- por primera vez (vía docker-entrypoint-initdb.d)

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Verificar que las extensiones se instalaron correctamente
DO $$
BEGIN
  RAISE NOTICE 'Core Associates DB initialized successfully';
  RAISE NOTICE 'Extensions: uuid-ossp, postgis, pg_trgm';
END
$$;
