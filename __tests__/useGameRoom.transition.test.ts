import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGameRoom } from '@/app/game/[roomId]/hooks/useGameRoom'
import { getRingBuffer, __resetRingBufferForTests } from '@/lib/gameRingBuffer'

// Мок Supabase — перехватываем реальный колбэк postgres_changes чтобы вызвать его вручную,
// как это сделал бы настоящий realtime-канал при получении UPDATE.
let capturedPostgresChangesCallback: ((payload: any) => void) | null = null

vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => {
      const chainable: any = {
        on: vi.fn((eventType: string, filterOrConfig: any, callback?: any) => {
          if (eventType === 'postgres_changes') {
            capturedPostgresChangesCallback = callback
          }
          return chainable
        }),
        subscribe: vi.fn((cb?: any) => {
          if (cb) cb('SUBSCRIBED')
          return chainable
        }),
      }
      return chainable
    }),
    removeChannel: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
    })),
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

function makeParams(overrides: Partial<any> = {}) {
  const gameStateRef = { current: { players: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }], rolling_player_id: null } }
  return {
    roomId: 'room1',
    setMyPlayerId: vi.fn(), setShowIntro: vi.fn(), setGameState: vi.fn(), setRoomStatus: vi.fn(),
    setRoomCode: vi.fn(), setIsHost: vi.fn(), setDiceValue: vi.fn(), setAnyoneRolling: vi.fn(),
    setGameStarting: vi.fn(),
    anyoneRollingTimerRef: { current: null }, broadcastAnimRef: { current: null },
    bcChannelRef: { current: null }, channelRef: { current: null },
    pollIntervalRef: { current: null }, roomStatusRef: { current: 'playing' },
    gameStateRef, hasRolledRef: { current: false }, timeLeftRef: { current: 60 },
    turnIdRef: { current: 'turn-abc' },
    ...overrides,
  }
}

beforeEach(() => {
  __resetRingBufferForTests()
  capturedPostgresChangesCallback = null
  localStorage.setItem('svoboda_player_room1', 'p1')
})

describe('useGameRoom → gameTransitionLogger integration', () => {
  it('logs a STATE_UPDATE transition with correct before/after when a real realtime UPDATE payload arrives', () => {
    const params = makeParams()
    renderHook(() => useGameRoom(params as any))

    expect(capturedPostgresChangesCallback).not.toBeNull()

    // Симулируем реальный payload, который Supabase Realtime прислал бы на UPDATE
    const fakePayload = {
      new: {
        game_state: { players: [{ id: 'p2', name: 'B' }, { id: 'p1', name: 'A' }], rolling_player_id: 'p2' },
        status: 'playing',
        host_id: 'p1',
      },
    }
    capturedPostgresChangesCallback!(fakePayload)

    const buf = getRingBuffer()
    const transitions = buf.filter(e => e.kind === 'transition')
    expect(transitions).toHaveLength(1)

    const t = transitions[0]
    expect(t.roomId).toBe('room1')
    expect(t.turnId).toBe('turn-abc')
    expect(t.action).toBe('STATE_UPDATE')
    expect(t.source).toBe('realtime')
    expect(t.before?.currentTurn).toBe('p1') // из gameStateRef.current (до обновления)
    expect(t.after?.currentTurn).toBe('p2')  // из payload.new.game_state (после)
    expect(t.before?.rolling_player_id).toBeNull()
    expect(t.after?.rolling_player_id).toBe('p2')
    expect(t.delta).toEqual({ currentTurn: 'p2', rolling_player_id: 'p2' })
  })

  it('still calls setGameState/setRoomStatus/setIsHost exactly as before (no behavior change)', () => {
    const params = makeParams()
    renderHook(() => useGameRoom(params as any))

    const fakePayload = {
      new: { game_state: { players: [{ id: 'p2' }], rolling_player_id: null }, status: 'playing', host_id: 'p1' },
    }
    capturedPostgresChangesCallback!(fakePayload)

    expect(params.setGameState).toHaveBeenCalledWith(fakePayload.new.game_state)
    expect(params.setRoomStatus).toHaveBeenCalledWith('playing')
    expect(params.setIsHost).toHaveBeenCalledWith(true) // host_id === pid ('p1')
  })

  it('handles null gameStateRef.current gracefully (first-load edge case)', () => {
    const params = makeParams({ gameStateRef: { current: null } })
    renderHook(() => useGameRoom(params as any))

    const fakePayload = {
      new: { game_state: { players: [{ id: 'p1' }], rolling_player_id: null }, status: 'playing', host_id: 'p1' },
    }
    expect(() => capturedPostgresChangesCallback!(fakePayload)).not.toThrow()

    const buf = getRingBuffer()
    const t = buf.find(e => e.kind === 'transition')
    expect(t?.before?.currentTurn).toBeNull()
    expect(t?.after?.currentTurn).toBe('p1')
  })
})
