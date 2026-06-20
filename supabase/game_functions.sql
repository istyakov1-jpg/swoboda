-- ============================================================
-- ЗАПУСТИ ЭТОТ ФАЙЛ ОДИН РАЗ В SUPABASE SQL EDITOR
-- Dashboard → SQL Editor → New query → вставь и нажми Run
-- ============================================================

-- 1. Атомарная ротация хода (идемпотентная)
--    Если p_expected_player_id уже не первый игрок — ничего не делаем.
--    Это исключает двойной advance_turn от хоста и игрока одновременно.
CREATE OR REPLACE FUNCTION advance_turn_safe(
  p_room_id              UUID,
  p_expected_player_id   TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_state    JSONB;
  v_players  JSONB;
  v_first    JSONB;
  v_rest     JSONB;
  v_new      JSONB;
BEGIN
  -- Захватываем блокировку строки — два одновременных вызова встают в очередь
  SELECT game_state INTO v_state
  FROM rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF v_state IS NULL THEN
    RETURN NULL;
  END IF;

  v_players := v_state->'players';
  v_first   := v_players->0;

  -- Идемпотентность: если ход уже передан другим вызовом — возвращаем без изменений
  IF (v_first->>'id') IS DISTINCT FROM p_expected_player_id THEN
    RETURN v_state;
  END IF;

  -- Ротируем массив: убираем первый элемент, добавляем в конец
  SELECT jsonb_agg(elem)
  INTO v_rest
  FROM jsonb_array_elements(v_players) WITH ORDINALITY arr(elem, ord)
  WHERE ord > 1;

  v_new := v_state
    || jsonb_build_object('players', v_rest || jsonb_build_array(v_first))
    || jsonb_build_object('rolling_player_id', NULL);

  UPDATE rooms SET game_state = v_new WHERE id = p_room_id;

  RETURN v_new;
END;
$$;

-- 2. Запись игрового стейта только если ход принадлежит игроку
--    Исключает запись устаревшего стейта от «опоздавшего» клиента
CREATE OR REPLACE FUNCTION write_game_state(
  p_room_id   UUID,
  p_player_id TEXT,
  p_new_state JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_state    JSONB;
  v_first_id TEXT;
BEGIN
  SELECT game_state INTO v_state
  FROM rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF v_state IS NULL THEN
    RETURN NULL;
  END IF;

  v_first_id := v_state->'players'->0->>'id';

  -- Отклоняем запись если сейчас не ход этого игрока
  IF v_first_id IS DISTINCT FROM p_player_id THEN
    RETURN v_state; -- возвращаем актуальный стейт без изменений
  END IF;

  UPDATE rooms SET game_state = p_new_state WHERE id = p_room_id;

  RETURN p_new_state;
END;
$$;

-- Права (если используешь RLS)
GRANT EXECUTE ON FUNCTION advance_turn_safe(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION write_game_state(UUID, TEXT, JSONB) TO anon, authenticated;
