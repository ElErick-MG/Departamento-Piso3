-- Departamento Piso 3 - Database Schema
-- Compatible con PostgreSQL (Vercel Postgres / Supabase)

-- Tabla de usuarios (roommates)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de suministros y sus rotaciones
CREATE TABLE IF NOT EXISTS supplies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  supply_type VARCHAR(50) NOT NULL, -- 'water_bottle', 'dish_soap', 'cleaning'
  duration_days INTEGER NOT NULL, -- Duración estimada en días
  current_user_id INTEGER REFERENCES users(id),
  last_purchase_date TIMESTAMP,
  is_blocked BOOLEAN DEFAULT FALSE, -- Bloqueo secuencial
  rotation_order INTEGER[] NOT NULL, -- Array de user_ids en orden de rotación
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de historial de compras
CREATE TABLE IF NOT EXISTS supply_history (
  id SERIAL PRIMARY KEY,
  supply_id INTEGER REFERENCES supplies(id),
  user_id INTEGER REFERENCES users(id),
  purchase_date TIMESTAMP NOT NULL,
  actual_duration_days INTEGER, -- Duración real calculada desde última compra
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de registros de lavado/secado de platos
CREATE TABLE IF NOT EXISTS dish_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  record_date DATE NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'wash', 'dry', 'both'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Catalogo de areas de limpieza (tareas semanales)
CREATE TABLE IF NOT EXISTS cleaning_areas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de grupos semanales de aseo
CREATE TABLE IF NOT EXISTS cleaning_groups (
  id SERIAL PRIMARY KEY,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  user_ids INTEGER[] NOT NULL,
  group_size INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_cleaning_group_size CHECK (group_size IN (2, 3)),
  CONSTRAINT uq_cleaning_groups_week_start UNIQUE (week_start)
);

-- Tabla de reservas/compras personales
CREATE TABLE IF NOT EXISTS reserves (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  item_name VARCHAR(150) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  category VARCHAR(50) NOT NULL DEFAULT 'otro',
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'consumed'
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  consumed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_reserves_status CHECK (status IN ('active', 'consumed'))
);

-- Historial de ruleta del botellon
CREATE TABLE IF NOT EXISTS water_bottle_roulette (
  id SERIAL PRIMARY KEY,
  cycle_number INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id),
  spun_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  confirmed_by_user_id INTEGER REFERENCES users(id),
  CONSTRAINT uq_water_bottle_cycle_user UNIQUE (cycle_number, user_id)
);

-- Estado de la ruleta del botellon (ciclo actual)
CREATE TABLE IF NOT EXISTS water_bottle_state (
  id SERIAL PRIMARY KEY,
  current_cycle_number INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_supplies_type ON supplies(supply_type);
CREATE INDEX IF NOT EXISTS idx_dish_records_date ON dish_records(record_date);
CREATE INDEX IF NOT EXISTS idx_supply_history_supply ON supply_history(supply_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_groups_week_start ON cleaning_groups(week_start);
CREATE INDEX IF NOT EXISTS idx_cleaning_groups_week_end ON cleaning_groups(week_end);
CREATE INDEX IF NOT EXISTS idx_cleaning_groups_user_ids ON cleaning_groups USING GIN (user_ids);
CREATE INDEX IF NOT EXISTS idx_reserves_user ON reserves(user_id);
CREATE INDEX IF NOT EXISTS idx_reserves_status ON reserves(status);
CREATE INDEX IF NOT EXISTS idx_reserves_category ON reserves(category);
CREATE INDEX IF NOT EXISTS idx_reserves_purchased_at ON reserves(purchased_at);
CREATE INDEX IF NOT EXISTS idx_water_bottle_cycle ON water_bottle_roulette(cycle_number);
CREATE INDEX IF NOT EXISTS idx_water_bottle_user ON water_bottle_roulette(user_id);
CREATE INDEX IF NOT EXISTS idx_water_bottle_spun_at ON water_bottle_roulette(spun_at);
CREATE INDEX IF NOT EXISTS idx_water_bottle_state_cycle ON water_bottle_state(current_cycle_number);

-- Datos iniciales de ejemplo (ajustar nombres y emails reales)
-- Nota: Las contraseñas deben ser hasheadas antes de insertar
-- Password por defecto para todos: "depto123" (cambiar en producción)

-- Usuarios (5 roommates)
INSERT INTO users (name, email, username, password_hash, is_admin) VALUES
('Erick', 'erick@depto3.com', 'erick', '$2a$10$placeholder', TRUE),
('Karla', 'karla@depto3.com', 'karla', '$2a$10$placeholder', FALSE),
('David', 'david@depto3.com', 'david', '$2a$10$placeholder', FALSE),
('Jhon', 'jhon@depto3.com', 'jhon', '$2a$10$placeholder', FALSE),
('Gaby', 'gaby@depto3.com', 'gaby', '$2a$10$placeholder', FALSE)
ON CONFLICT (username) DO NOTHING;

-- Suministros iniciales
INSERT INTO supplies (name, supply_type, duration_days, current_user_id, rotation_order, last_purchase_date) VALUES
('Botellón de Agua', 'water_bottle', 7, 1, ARRAY[1, 2, 3, 4, 5], CURRENT_TIMESTAMP),
('Lava Platos', 'dish_soap', 21, 2, ARRAY[1, 2, 3, 4, 5], CURRENT_TIMESTAMP),
('Aseo General', 'cleaning', 7, 3, ARRAY[1, 2, 3, 4, 5], CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Areas de limpieza iniciales
INSERT INTO cleaning_areas (name) VALUES
('Lavar la ducha'),
('Limpiar el tacho de basura / Cambiar funda'),
('Limpieza microondas'),
('Lavar manteles'),
('Limpieza nevera')
ON CONFLICT (name) DO NOTHING;
