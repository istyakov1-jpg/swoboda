/**
 * marketEngine.ts
 * Pure market cell processing helpers.
 * No React, no Supabase, no side-effects.
 */
import { STOCKS, CRYPTO, getStockByTicker, getCryptoByTicker, getNewPrice, getPriceChangeEmoji } from './gameData'

/**
 * Resolve the ticker to use for a market cell, deduplicating from the
 * last market event's ticker so the same ticker never fires twice in a row.
 */
export function resolveMarketTicker(
  cellTicker: string,
  lastTicker: string | undefined | null,
  isStock: boolean,
): string {
  if (cellTicker !== lastTicker) return cellTicker
  const pool = isStock
    ? STOCKS.map((s: any) => s.ticker).filter((t: string) => t !== cellTicker)
    : CRYPTO.map((c: any) => c.ticker).filter((t: string) => t !== cellTicker)
  if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)]
  return cellTicker
}

/**
 * Build the market event payload and new price map entries for a market cell.
 * Returns null if the ticker is unknown.
 */
export function buildMarketUpdate(
  ticker: string,
  isStock: boolean,
  currentPrices: Record<string, number>,
  volatilityProfile: Record<string, number>,
  playerName: string,
): {
  marketPrices: Record<string, number>
  marketEvent: Record<string, any>
  marketData: Record<string, any>
} | null {
  const item = isStock ? getStockByTicker(ticker) : getCryptoByTicker(ticker)
  if (!item) return null

  const currentPrice = currentPrices?.[ticker] ?? item.price
  const newPrice = getNewPrice(
    currentPrice,
    item.min,
    item.max,
    item.volatility,
    volatilityProfile?.[ticker] ?? 1,
  )
  const pct = Math.round(((newPrice - currentPrice) / currentPrice) * 100)
  const md = {
    ...item,
    newPrice,
    oldPrice: currentPrice,
    emoji: getPriceChangeEmoji(currentPrice, newPrice),
    pct,
    isStock,
  }

  return {
    marketPrices: { ...currentPrices, [ticker]: newPrice },
    marketEvent: { ...md, player_name: playerName, timestamp: Date.now() },
    marketData: md,
  }
}
