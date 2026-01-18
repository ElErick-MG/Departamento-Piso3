-- Departamento Piso 3 - Database Schema
-- Compatible con Vercel Postgres (PostgreSQL)

-- Tabla de usuarios (roommates)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  notification_days_before INTEGER DEFAULT 2, -- Días de anticipación para notificaciones
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

-- Tabla de log de notificaciones
CREATE TABLE IF NOT EXISTS notifications_log (
  id SERIAL PRIMARY KEY,
  supply_id INTEGER REFERENCES supplies(id),
  user_id INTEGER REFERENCES users(id),
  notification_type VARCHAR(50) NOT NULL, -- 'reminder', 'overdue'
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email_sent BOOLEAN DEFAULT FALSE,
  email_error TEXT
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_supplies_type ON supplies(supply_type);
CREATE INDEX IF NOT EXISTS idx_dish_records_date ON dish_records(record_date);
CREATE INDEX IF NOT EXISTS idx_supply_history_supply ON supply_history(supply_id);
CREATE INDEX IF NOT EXISTS idx_notifications_supply ON notifications_log(supply_id);

-- Datos iniciales de ejemplo (ajustar nombres y emails reales)
-- Nota: Las contraseñas deben ser hasheadas antes de insertar
-- Password por defecto para todos: "depto123" (cambiar en producción)

-- Usuarios (4 roommates)
INSERT INTO users (name, email, username, password_hash, is_admin, notification_days_before) VALUES
('Erick', 'erick@example.com', 'erick', '$2a$10$placeholder', TRUE, 2),
('Roommate 2', 'roommate2@example.com', 'roommate2', '$2a$10$placeholder', FALSE, 2),
('Roommate 3', 'roommate3@example.com', 'roommate3', '$2a$10$placeholder', FALSE, 2),
('Roommate 4', 'roommate4@example.com', 'roommate4', '$2a$10$placeholder', FALSE, 3)
ON CONFLICT (username) DO NOTHING;

-- Suministros iniciales
INSERT INTO supplies (name, supply_type, duration_days, current_user_id, rotation_order, last_purchase_date) VALUES
('Botellón de Agua', 'water_bottle', 7, 1, ARRAY[1, 2, 3, 4], CURRENT_TIMESTAMP),
('Lava Platos', 'dish_soap', 21, 2, ARRAY[1, 2, 3, 4], CURRENT_TIMESTAMP),
('Aseo General', 'cleaning', 7, 3, ARRAY[1, 2, 3, 4], CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
