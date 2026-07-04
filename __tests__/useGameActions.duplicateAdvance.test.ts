import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGameActions } from '@/app/game/[roomId]/hooks/useGameActions'
import { getRingBuffer, __resetRingBufferForTests } from '@/lib/gameRingBuffer'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ error: null }),
    from: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}))

vi.mock('@/lib/gameLogger', () => ({ gameLog: vi.fn() }))

function baseParams(overrides: Partial<any> = {}) {
  return {
    roomId: 'room1', myPlayerId: 'p1', myPlayer: null as any, gameState: null as any,
    isMyTurn: true, hasRolled: false, currentCell: null,
    pickedHit: null, pickedEvent: null, auctionAsset: null, selectedDeal: null,
    hasRolledRef: { current: false }, isRollingRef: { current: false },
    isAdvancingRef: { current: false }, pickedHitRef: { current: null },
    notifPrefsRef: { current: {} }, bcChannelRef: { current: null }, latestStateRef: { current: null },
    setRolling: vi.fn(), setHasRolled: vi.fn(), setDiceValue: vi.fn(), setDiceValue2: vi.fn(),
    setTimeLeft: vi.fn(), setCurrentCell: vi.fn(), setSelectedDeal: vi.fn(), setDealPool: vi.fn(),
    setShowCredit: vi.fn(), setMarketData: vi.fn(), setAuctionSubmitted: vi.fn(), setMyBid: vi.fn(),
    setPickedHit: vi.fn(), setPickedEvent: vi.fn(), setAuctionAsset: vi.fn(), setShowTurnCard: vi.fn(),
    setShowEmergency: vi.fn(), setShowBankrupt: vi.fn(), setSellOffer: vi.fn(), setShowAuctionCredit: vi.fn(),
    setCashNotif: vi.fn(), setCashColor: vi.fn(), setNotification: vi.fn(),
    cashNotifTimerRef: { current: null }, snd: { dice: vi.fn(), buy: vi.fn(), salary: vi.fn(), hit: vi.fn() },
    turnIdRef: { current: 'turn1' },
    isHost: false, effectiveHost: false,
    ...overrides,
  }
}

beforeEach(() => { __resetRingBufferForTests() })

describe('advanceTurn → DUPLICATE_ADVANCE (real useGameActions hook)', () => {
  it('logs DUPLICATE_ADVANCE and does not proceed when isAdvancingRef is already true', async () => {
    const isAdvancingRef = { current: true } // уже идёт advance
    const params = baseParams({ isAdvancingRef })
    const { result } = renderHook(() => useGameActions(params as any))

    const state = { players: [{ id: 'p1', name: 'ИгрокА' }, { id: 'p2', name: 'ИгрокБ' }] }
    await result.current.advanceTurn(state)

    const warnings = getRingBuffer().filter(e => e.warningType === 'DUPLICATE_ADVANCE')
    expect(warnings).toHaveLength(1)
    expect(warnings[0].details).toMatchObject({ attemptedPlayerId: 'p1', attemptedPlayerName: 'ИгрокА' })
    // isAdvancingRef не должен был быть сброшен этим (дублирующим) вызовом
    expect(isAdvancingRef.current).toBe(true)
  })

  it('does NOT log DUPLICATE_ADVANCE on a normal single advanceTurn call', async () => {
    const params = baseParams()
    const { result } = renderHook(() => useGameActions(params as any))

    const state = { players: [{ id: 'p1', name: 'ИгрокА' }, { id: 'p2', name: 'ИгрокБ' }] }
    await result.current.advanceTurn(state)

    expect(getRingBuffer().filter(e => e.warningType === 'DUPLICATE_ADVANCE')).toHaveLength(0)
  })
})
