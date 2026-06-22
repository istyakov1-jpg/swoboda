-- Запусти в Supabase SQL Editor
CREATE TABLE IF NOT EXISTS game_debug_logs (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  room_id     TEXT NOT NULL,
  turn_id     TEXT NOT NULL,        -- uuid, общий для всех событий одного хода
  event_type  TEXT NOT NULL,        -- TURN_START, ROLL, SKIP_TURN и т.д.
  player_id   TEXT,
  player_name TEXT,
  payload     JSONB DEFAULT '{}'    -- произвольные данные события
);

CREATE INDEX IF NOT EXISTS idx_game_debug_room    ON game_debug_logs (room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_debug_turn    ON game_debug_logs (turn_id);
CREATE INDEX IF NOT EXISTS idx_game_debug_type    ON game_debug_logs (event_type);

-- Автоочистка логов старше 24 часов (опционально)
-- CREATE OR REPLACE FUNCTION cleanup_debug_logs() RETURNS void AS $$
--   DELETE FROM game_debug_logs WHERE created_at < NOW() - INTERVAL '24 hours';
-- $$ LANGUAGE SQL;

-- Права
GRANT SELECT, INSERT ON game_debug_logs TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE game_debug_logs_id_seq TO anon, authenticated;
