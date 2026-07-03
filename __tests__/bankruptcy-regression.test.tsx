import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGameEffects } from '@/app/game/[roomId]/hooks/useGameEffects'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}))

vi.mock('@/lib/gameLogger', () => ({
  gameLog: vi.fn(),
}))

function makePlayer(overrides: Partial<any> = {}) {
  return {
    id: 'me', name: 'ИгрокА', is_bot: false, is_eliminated: false,
    cash: -10000, passive_income: 5000, total_expenses: 40000,
    profession: { salary: 30000 },
    assets: [{ id: 'a1', down_payment: 100000, price: 100000, passive_income: 1000, debt: 0 }],
    debts: [],
    ...overrides,
  }
}

function makeOtherPlayer(overrides: Partial<any> = {}) {
  return {
    id: 'other1', name: 'ИгрокБ', is_bot: false, is_eliminated: false,
    cash: 50000, passive_income: 2000, total_expenses: 30000,
    profession: { salary: 40000 }, assets: [], debts: [],
    ...overrides,
  }
}

function makeGameState(myPlayer: any, otherPlayerOverrides: Partial<any> = {}) {
  return {
    players: [myPlayer, makeOtherPlayer(otherPlayerOverrides)],
    events: [],
    round: 1,
  }
}

function baseParams(overrides: Partial<any> = {}) {
  return {
    roomId: 'room1', myPlayerId: 'me', myPlayer: null as any, gameState: null as any,
    isMyTurn: true, isHost: false,
    rolling: false, hasRolled: false, roomStatus: 'playing', winner: null,
    showBankrupt: false, showEmergency: false, timeLeft: 60,
    notifPrefsRef: { current: {} }, anyoneRollingTimerRef: { current: null },
    latestStateRef: { current: null }, gameStateRef: { current: null },
    hasRolledRef: { current: false }, isRollingRef: { current: false },
    isAdvancingRef: { current: false },
    othersQueue: [], showTurnCard: false, marketData: null,
    setMarketQty: vi.fn(), setOthersQueue: vi.fn(), setMarketData: vi.fn(),
    setCurrentCell: vi.fn(), setQueueMode: vi.fn(), setShowTurnCard: vi.fn(),
    setBabyEvent: vi.fn(), setAnyoneRolling: vi.fn(), setWinner: vi.fn(),
    setTimeLeft: vi.fn(), setHasRolled: vi.fn(), setShowEmergency: vi.fn(),
    setShowBankrupt: vi.fn(), setGameTimeLeft: vi.fn(), setShowTimeUp: vi.fn(),
    setOnlinePlayers: vi.fn(), setReconnected: vi.fn(),
    wgs: vi.fn().mockResolvedValue(undefined), advanceTurn: vi.fn().mockResolvedValue(undefined),
    handleRoll: vi.fn(), showCashNotif: vi.fn(),
    turnIdRef: { current: 'turn1' },
    ...overrides,
  }
}

describe('REGRESSION: EmergencyModal single-crisis / repeat-crisis behavior', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('1. does NOT reopen EmergencyModal repeatedly within the SAME crisis episode', () => {
    const myPlayer = makePlayer() // cash=-10000, netFlow=-5000 (кризис)
    const gameState1 = makeGameState(myPlayer)
    const setShowEmergency = vi.fn()
    const params = baseParams({ myPlayer, gameState: gameState1, setShowEmergency })

    const { rerender } = renderHook((p) => useGameEffects(p), { initialProps: params })
    expect(setShowEmergency).toHaveBeenCalledTimes(1)
    expect(setShowEmergency).toHaveBeenNthCalledWith(1, true)

    // Игрок ещё в том же кризисе — cash/netFlow не меняются, только "шум" от других игроков
    for (let i = 0; i < 5; i++) {
      const gs = makeGameState(myPlayer, { cash: 40000 + i * 100 })
      rerender({ ...params, gameState: gs })
    }

    // Модалка не должна открываться повторно, пока кризис не разрешён
    expect(setShowEmergency).toHaveBeenCalledTimes(1)
  })

  it('2. DOES reopen EmergencyModal for a NEW, separate crisis episode after the first was resolved', () => {
    const setShowEmergency = vi.fn()

    // Эпизод 1: кризис
    const playerInCrisis1 = makePlayer({ cash: -10000 })
    const gsCrisis1 = makeGameState(playerInCrisis1)
    const params = baseParams({ myPlayer: playerInCrisis1, gameState: gsCrisis1, setShowEmergency })
    const { rerender } = renderHook((p) => useGameEffects(p), { initialProps: params })
    expect(setShowEmergency).toHaveBeenCalledTimes(1)

    // Игрок разрешает кризис — продал актив, cash стал положительным (>=0)
    const playerResolved = makePlayer({ cash: 5000 })
    const gsResolved = makeGameState(playerResolved)
    rerender({ ...params, myPlayer: playerResolved, gameState: gsResolved })
    expect(setShowEmergency).toHaveBeenCalledTimes(1) // всё ещё 1 — кризис разрешён, новый вызов не нужен

    // Проходит несколько ходов (cash положительный, меняется от игры)...
    const playerLater = makePlayer({ cash: 8000 })
    rerender({ ...params, myPlayer: playerLater, gameState: makeGameState(playerLater) })
    expect(setShowEmergency).toHaveBeenCalledTimes(1)

    // Эпизод 2: игрок СНОВА уходит в минус (отдельный, новый кризис)
    const playerInCrisis2 = makePlayer({ cash: -12000 })
    const gsCrisis2 = makeGameState(playerInCrisis2)
    rerender({ ...params, myPlayer: playerInCrisis2, gameState: gsCrisis2 })

    // Без bankruptProcessedRef модалка должна открыться СНОВА для нового эпизода
    expect(setShowEmergency).toHaveBeenCalledTimes(2)
    expect(setShowEmergency).toHaveBeenNthCalledWith(2, true)
  })
})
