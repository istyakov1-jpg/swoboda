export type CellType = 'salary' | 'opportunity' | 'hit' | 'market' | 'event' | 'auction' | 'child' | 'charity'

export type BotStrategy = 'conservative' | 'adventurer' | 'analyst' | 'predator'

export type Dream = {
  id: string
  name: string
  price: number
  passive_required: number
  icon: string
}

export type Profession = {
  id: string
  name: string
  icon: string
  salary: number
  expenses: number
  initial_debt: number
  expense_breakdown?: { n: string; a: number }[]
  debt_breakdown?: { n: string; a: number; r: number }[]
}

export type Asset = {
  id: string
  name: string
  type: 'real_estate' | 'business' | 'stocks' | 'crypto' | 'gold'
  price: number
  down_payment: number
  passive_income: number
  debt: number
}

export type Player = {
  id: string
  room_id: string
  name: string
  is_bot: boolean
  bot_strategy?: BotStrategy
  color: string
  initial: string
  profession?: Profession
  dream?: Dream
  cash: number
  position: number
  passive_income: number
  total_expenses: number
  is_free: boolean // вышел на скоростную дорожку
  children?: number
  avatar?: string
  skip_turns?: number // сколько ходов пропустить
  double_dice_rounds?: number // сколько кругов бросать 2 кубика (благотворительность)
  assets: Asset[]
  debts: { name: string; amount: number; monthly: number }[]
  is_host: boolean
  joined_at: string
}

export type GameEvent = {
  id: string
  room_id: string
  round: number
  player_id: string
  player_name: string
  type: 'roll' | 'buy' | 'pass' | 'auction_win' | 'auction_lose' | 'salary' | 'hit' | 'event' | 'freedom'
  description: string
  amount?: number
  asset?: string
  created_at: string
}

export type AuctionState = {
  phase: 'announce' | 'bidding' | 'reveal' | null
  asset?: Asset
  bids: { player_id: string; player_name: string; amount: number; color: string; initial: string }[]
  timer: number
  winner_id?: string
}

export type GameRoom = {
  id: string
  code: string
  status: 'lobby' | 'playing' | 'finished'
  host_id: string
  current_player_id: string
  round: number
  time_limit: number // минуты
  started_at?: string
  deck: 'classic' | 'sellers'
  players: Player[]
  events: GameEvent[]
  auction?: AuctionState
}

export type Database = {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          code: string
          status: string
          host_id: string
          current_player_id: string
          round: number
          time_limit: number
          deck: string
          started_at: string | null
          created_at: string
          game_state: any
        }
        Insert: Omit<Database['public']['Tables']['rooms']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['rooms']['Insert']>
      }
      game_events: {
        Row: {
          id: string
          room_id: string
          round: number
          player_id: string
          player_name: string
          type: string
          description: string
          amount: number | null
          asset: string | null
          raw_data: any
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['game_events']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
  }
}
