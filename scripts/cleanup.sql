-- Limpieza de datos operativos (mantiene usuarios y catalogos)
-- Ejecutar con: psql $POSTGRES_URL -f scripts/cleanup.sql

BEGIN;

TRUNCATE TABLE
  dish_records,
  cleaning_groups,
  reserves,
  water_bottle_roulette,
  water_bottle_state,
  supply_history
RESTART IDENTITY CASCADE;

COMMIT;
