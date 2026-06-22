import { supabase } from './supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export type GameEventType =
  | 'TURN_START'
  | 'TURN_END'
  | 'ADVANCE_TURN'
  | 'SKIP_TURN'
  | 'ROLL'
  | 'BOT_ACTION'
  | 'TIMEOUT'
  | 'BUY_ASSET'
  | 'SELL_ASSET'
  | 'AUCTION_START'
  | 'AUCTION_END'
  | 'PLAYER_ELIMINATED'
  | 'WINNER'
  | 'REALTIME_UPDATE'
  | 'SKIP_EFFECT_START'
  | 'SKIP_EFFECT_ABORT'
  | 'SKIP_EFFECT_DONE'
  | 'ADVANCE_BLOCKED'

export interface GameLogParams {
  roomId: string
  turnId: string
  eventType: GameEventType
  playerId?: string
  playerName?: string
  payload?: Record<string, unknown>
}

// Fire-and-forget — не блокирует игру
export function gameLog(params: GameLogParams): void {
  db.from('game_debug_logs').insert({
    room_id:     params.roomId,
    turn_id:     params.turnId,
    event_type:  params.eventType,
    player_id:   params.playerId ?? null,
    player_name: params.playerName ?? null,
    payload:     params.payload ?? {},
  }).then(({ error }: { error: any }) => {
    if (error) console.warn('[gameLog] insert failed:', error.message)
  })
}
