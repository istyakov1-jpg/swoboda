import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGameEffects } from '@/app/game/[roomId]/hooks/useGameEffects'

// Мокаем Supabase — presence-канал не должен реально подключаться в тесте
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}))

// Мокаем gameLog — не должен реально писать в БД
vi.mock('@/lib/gameLogger', () => ({
  gameLog: vi.fn(),
}))

function makePlayer(overrides: Partial<any> = {}) {
  return {
    id: 'me',
    name: 'ИгрокА',
    is_bot: false,
    is_eliminated: false,
    cash: -10000,
    passive_income: 5000,
    total_expenses: 40000,
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
    players: [
      myPlayer, // players[0] — мой ход
      makeOtherPlayer(otherPlayerOverrides),
    ],
    events: [],
    round: 1,
  }
}

function baseParams(overrides: Partial<any> = {}) {
  return {
    roomId: 'room1', myPlayerId: 'me', myPlayer: null as any, gameState: null as any, isMyTurn: true, isHost: false,
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

describe('PROOF: bankruptcy effect during 10 unrelated realtime updates', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('does NOT re-invoke setShowEmergency when only OTHER players change', () => {
    const myPlayer = makePlayer() // cash=-10000, netFlow = 30000+5000-40000 = -5000 (crisis)
    const gameState1 = makeGameState(myPlayer)
    const setShowEmergency = vi.fn()

    const params = baseParams({ myPlayer, gameState: gameState1, setShowEmergency })
    const { rerender } = renderHook((p) => useGameEffects(p), { initialProps: params })

    // Первый рендер уже должен был вызвать setShowEmergency(true) один раз
    expect(setShowEmergency).toHaveBeenCalledTimes(1)
    expect(setShowEmergency).toHaveBeenCalledWith(true)

    // Симулируем 10 realtime-обновлений от ДРУГОГО игрока —
    // myPlayer (cash/passive_income/total_expenses/is_eliminated) не меняется
    for (let i = 0; i < 10; i++) {
      const newGameState = makeGameState(myPlayer, { cash: 50000 - i * 1000 }) // меняется ТОЛЬКО другой игрок
      rerender({ ...params, gameState: newGameState })
    }

    // Согласно React dependency array contract, эффект НЕ должен перезапуститься,
    // т.к. cash/passive_income/total_expenses/is_eliminated/isMyTurn МОЕГО игрока не изменились
    expect(setShowEmergency).toHaveBeenCalledTimes(1)
  })

  it('does NOT re-invoke doEliminate (via wgs) when only OTHER players change (no assets/credit case)', () => {
    // Игрок без активов и без кредитного лимита — ветка Б (авто-элиминация)
    const myPlayer = makePlayer({ assets: [], passive_income: 0, total_expenses: 40000 })
    const gameState1 = makeGameState(myPlayer)
    const wgs = vi.fn().mockResolvedValue(undefined)

    const params = baseParams({ myPlayer, gameState: gameState1, wgs })
    const { rerender } = renderHook((p) => useGameEffects(p), { initialProps: params })

    for (let i = 0; i < 10; i++) {
      const newGameState = makeGameState(myPlayer, { cash: 50000 - i * 1000 })
      rerender({ ...params, gameState: newGameState })
    }

    // doEliminate вызывает wgs() ровно один раз, а не 10
    expect(wgs).toHaveBeenCalledTimes(1)
  })
})
