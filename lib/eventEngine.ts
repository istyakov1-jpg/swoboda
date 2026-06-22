/**
 * eventEngine.ts
 * Pure event-effect helpers extracted from handlePass in page.tsx.
 * No React, no Supabase, no side-effects.
 */
import type { Player } from '@/types/database'

export type EventEffectResult =
  | { kind: 'cash'; delta: number; description: string }
  | { kind: 'expenses'; delta: number; description: string }
  | { kind: 'rate'; newRate: number; description: string }
  | { kind: 'noop' }

/**
 * Compute the effect of a random event on a player.
 *
 * @param effect        The event's `effect` string (e.g. 'cash+salary', 'expenses+5%', 'rate:0.20')
 * @param desc          Human-readable description from the event card
 * @param player        Current player state
 * @param salaryBonus   diffConfig.salary_bonus multiplier
 * @param inflationOn   gameSettings.inflation flag
 * @param volatileRateOn gameSettings.volatile_rate flag
 */
export function applyEventEffect(
  effect: string,
  desc: string,
  player: Player,
  salaryBonus: number,
  inflationOn: boolean,
  volatileRateOn: boolean,
): EventEffectResult {
  if (effect === 'cash+salary') {
    const bonus = Math.round((player.profession?.salary ?? 0) * salaryBonus)
    return {
      kind: 'cash',
      delta: bonus,
      description: `${player.name}: ${desc} +₽${bonus.toLocaleString()}`,
    }
  }

  if (effect === 'expenses+5%') {
    if (!inflationOn) return { kind: 'noop' }
    const increase = Math.round(player.total_expenses * 0.05)
    return {
      kind: 'expenses',
      delta: increase,
      description: `${player.name}: ${desc} −₽${increase.toLocaleString()}/мес`,
    }
  }

  if (effect.startsWith('rate:')) {
    if (!volatileRateOn) return { kind: 'noop' }
    const newRate = parseFloat(effect.split(':')[1])
    return {
      kind: 'rate',
      newRate,
      description: desc,
    }
  }

  return { kind: 'noop' }
}
