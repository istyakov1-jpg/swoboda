'use client'

import { supabase } from './supabase'
import {
  HIT_EVENTS, GAME_EVENTS, SMALL_DEALS, LARGE_DEALS, AUCTION_ASSETS,
  SELL_OFFERS, PROFESSIONS, DREAMS, STOCKS, CRYPTO, KEY_RATE_DEFAULT,
  DIFFICULTY_CONFIG,
} from './gameData'
import type { GameDifficulty } from './gameData'

const db = supabase as any

export type DifficultySettings = {
  starting_cash_multiplier: number
  hit_multiplier: number
  salary_bonus: number
  label: string
  desc: string
  color: string
}

export type GameConfig = {
  hits: typeof HIT_EVENTS
  events: typeof GAME_EVENTS
  small_deals: typeof SMALL_DEALS
  large_deals: typeof LARGE_DEALS
  auctions: typeof AUCTION_ASSETS
  sell_offers: typeof SELL_OFFERS
  professions: typeof PROFESSIONS
  dreams: typeof DREAMS
  stocks: typeof STOCKS
  crypto: typeof CRYPTO
  difficulty: Record<GameDifficulty, DifficultySettings>
  defaults: {
    key_rate: number
    turn_time: number
    game_duration: number
    emergency_threshold: number
    hostile_multiplier: number
    charity_cost_pct: number
    charity_rounds: number
    events_per_game: number   // лимит событий в журнале
    sale_discount: number     // скидка при срочной продаже (0.5 = 50%)
    volatile_rate: boolean    // ЦБ скачет по умолчанию
    inflation: boolean        // инфляция по умолчанию
    unique_assets: boolean    // уникальные активы по умолчанию
    dividend_enabled: boolean // начислять ли дивиденды
    volatility_stable_min: number  // мин. множитель стабильных тикеров
    volatility_stable_max: number
    volatility_normal_min: number
    volatility_normal_max: number
    volatility_rocket_min: number  // мин. множитель ракет
    volatility_rocket_max: number
  }
}

const DEFAULT_CONFIG: GameConfig = {
  hits: HIT_EVENTS as any,
  events: GAME_EVENTS,
  small_deals: SMALL_DEALS as any,
  large_deals: LARGE_DEALS as any,
  auctions: AUCTION_ASSETS as any,
  sell_offers: SELL_OFFERS,
  professions: PROFESSIONS as any,
  dreams: DREAMS,
  stocks: STOCKS,
  crypto: CRYPTO,
  difficulty: {
    easy:   DIFFICULTY_CONFIG.easy,
    normal: DIFFICULTY_CONFIG.normal,
    hard:   DIFFICULTY_CONFIG.hard,
  },
  defaults: {
    key_rate: KEY_RATE_DEFAULT,
    turn_time: 60,
    game_duration: 30,
    emergency_threshold: -10000,
    hostile_multiplier: 2,
    charity_cost_pct: 0.10,
    charity_rounds: 3,
    events_per_game: 50,
    sale_discount: 0.50,
    volatile_rate: true,
    inflation: true,
    unique_assets: false,
    dividend_enabled: true,
    volatility_stable_min: 0.3,
    volatility_stable_max: 0.6,
    volatility_normal_min: 0.8,
    volatility_normal_max: 1.4,
    volatility_rocket_min: 2.0,
    volatility_rocket_max: 4.0,
  },
}

let _cachedConfig: GameConfig | null = null

export async function loadGameConfig(): Promise<GameConfig> {
  if (_cachedConfig) return _cachedConfig
  try {
    const { data } = await db.from('game_config').select('data').eq('id', 'main').single()
    if (data?.data && Object.keys(data.data).length > 0) {
      _cachedConfig = deepMerge(DEFAULT_CONFIG, data.data)
      return _cachedConfig!
    }
  } catch {}
  _cachedConfig = DEFAULT_CONFIG
  return DEFAULT_CONFIG
}

export async function saveGameConfig(config: Partial<GameConfig>): Promise<void> {
  _cachedConfig = null
  const current = await loadGameConfig()
  const merged = { ...current, ...config }
  await db.from('game_config').upsert({ id: 'main', data: merged, updated_at: new Date().toISOString() })
  _cachedConfig = merged
}

export function getDefaultConfig(): GameConfig {
  return DEFAULT_CONFIG
}

// Глубокое слияние для вложенных объектов (defaults, difficulty)
function deepMerge(base: any, override: any): any {
  if (!override) return base
  const result = { ...base }
  for (const key of Object.keys(override)) {
    if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
      result[key] = deepMerge(base[key] ?? {}, override[key])
    } else if (override[key] !== undefined) {
      result[key] = override[key]
    }
  }
  return result
}
