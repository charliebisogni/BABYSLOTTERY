-- Verificar si la tabla eventos_bebe existe, si no, crearla
CREATE TABLE IF NOT EXISTS eventos_bebe (
  id SERIAL PRIMARY KEY,
  nombre_evento VARCHAR(255) NOT NULL,
  identificador_publico VARCHAR(255),
  contrasena_participantes_hash VARCHAR(255),
  email_admin VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  fecha_real DATE,
  hora_real TIME,
  peso_real_valor DECIMAL,
  peso_real_unidad VARCHAR(2),
  longitud_real DECIMAL,
  color_ojos_real VARCHAR(50),
  sexo_real VARCHAR(50),
  color_pelo_real VARCHAR(50),
  calculo_realizado BOOLEAN DEFAULT FALSE
);

-- Verificar si la tabla predicciones existe, si no, crearla
CREATE TABLE IF NOT EXISTS predicciones (
  id SERIAL PRIMARY KEY,
  nombre_participante VARCHAR(255) NOT NULL,
  email_participante VARCHAR(255) NOT NULL,
  fecha_predicha DATE NOT NULL,
  hora_predicha TIME NOT NULL,
  peso_predicho_valor DECIMAL NOT NULL,
  peso_predicho_unidad VARCHAR(2) NOT NULL,
  longitud_predicha DECIMAL NOT NULL,
  color_ojos_predicho VARCHAR(50) NOT NULL,
  sexo_predicho VARCHAR(50) NOT NULL,
  color_pelo_predicho VARCHAR(50),
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  puntuacion INTEGER DEFAULT 0,
  id_evento_bebe INTEGER NOT NULL REFERENCES eventos_bebe(id)
);

-- Añadir columnas para el sistema de privacidad si no existen
ALTER TABLE eventos_bebe
ADD COLUMN IF NOT EXISTS identificador_publico VARCHAR(255),
ADD COLUMN IF NOT EXISTS contrasena_participantes_hash VARCHAR(255);

-- Asegurar que identificador_publico sea único
ALTER TABLE eventos_bebe
DROP CONSTRAINT IF EXISTS eventos_bebe_identificador_publico_key;

ALTER TABLE eventos_bebe
ADD CONSTRAINT eventos_bebe_identificador_publico_key UNIQUE (identificador_publico);

-- Actualizar eventos existentes con valores por defecto
UPDATE eventos_bebe 
SET 
  identificador_publico = COALESCE(identificador_publico, CONCAT('Bebé ID ', id)),
  contrasena_participantes_hash = COALESCE(contrasena_participantes_hash, password_hash)
WHERE 
  identificador_publico IS NULL OR contrasena_participantes_hash IS NULL;
