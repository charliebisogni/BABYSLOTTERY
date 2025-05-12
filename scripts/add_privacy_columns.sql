-- Añadir columnas para el sistema de privacidad
ALTER TABLE IF EXISTS eventos_bebe
ADD COLUMN IF NOT EXISTS identificador_publico VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS contrasena_participantes_hash VARCHAR(255);

-- Actualizar eventos existentes con valores por defecto
UPDATE eventos_bebe 
SET 
  identificador_publico = CONCAT('Bebé ID ', id),
  contrasena_participantes_hash = password_hash
WHERE 
  identificador_publico IS NULL;
