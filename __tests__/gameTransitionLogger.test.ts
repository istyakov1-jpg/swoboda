import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getRingBuffer, subscribeRingBuffer, __resetRingBufferForTests, pushRingEntry } from '@/lib/gameRingBuffer'
import {
  logTransition, logWarning, markIntent, clearIntent, getIntent,
  classifyTurnChangeSpeed, newTraceId,
  __resetIntentForTests, __resetStuckWatcherForTests, startStuckWatcher,
} from '@/lib/gameTransitionLogger'

beforeEach(() => {
  __resetRingBufferForTests()
  __resetIntentForTests()
  __resetStuckWatcherForTests()
})

describe('gameRingBuffer', () => {
  it('caps at 200 entries, dropping oldest first', () => {
    for (let i = 0; i < 210; i++) {
      pushRingEntry({ ts: i, roomId: 'r1', turnId: 't1', kind: 'warning', warningType: `W${i}` })
    }
    const buf = getRingBuffer()
    expect(buf.length).toBe(200)
    expect(buf[0].warningType).toBe('W10') // первые 10 вытеснены
    expect(buf[199].warningType).toBe('W209')
  })

  it('notifies subscribers on push, and unsubscribe stops notifications', () => {
    const received: string[] = []
    const unsub = subscribeRingBuffer(e => received.push(e.warningType ?? ''))
    pushRingEntry({ ts: 1, roomId: 'r1', turnId: 't1', kind: 'warning', warningType: 'A' })
    unsub()
    pushRingEntry({ ts: 2, roomId: 'r1', turnId: 't1', kind: 'warning', warningType: 'B' })
    expect(received).toEqual(['A'])
  })
})

describe('logTransition — delta computation', () => {
  it('computes delta with only changed fields', () => {
    const before = { currentTurn: 'p1', rolling_player_id: null, hasRolled: false, timeLeft: 60 }
    const after = { currentTurn: 'p1', rolling_player_id: 'p1', hasRolled: true, timeLeft: 59 }
    const delta = logTransition({ roomId: 'r1', turnId: 't1', action: 'STATE_UPDATE', source: 'realtime', before, after })
    expect(delta).toEqual({ rolling_player_id: 'p1', hasRolled: true, timeLeft: 59 })
    expect(delta.currentTurn).toBeUndefined() // не изменился — не должен попасть в delta
  })

  it('empty delta when nothing changed', () => {
    const snap = { currentTurn: 'p1', rolling_player_id: null, hasRolled: false, timeLeft: 60 }
    const delta = logTransition({ roomId: 'r1', turnId: 't1', action: 'STATE_UPDATE', source: 'realtime', before: snap, after: { ...snap } })
    expect(delta).toEqual({})
  })

  it('pushes a transition entry to the ring buffer', () => {
    const snap = { currentTurn: 'p1', rolling_player_id: null, hasRolled: false, timeLeft: 60 }
    logTransition({ roomId: 'r1', turnId: 't1', traceId: 'trace1', action: 'STATE_UPDATE', source: 'realtime', before: snap, after: { ...snap, hasRolled: true } })
    const buf = getRingBuffer()
    expect(buf).toHaveLength(1)
    expect(buf[0].kind).toBe('transition')
    expect(buf[0].traceId).toBe('trace1')
  })
})

describe('logWarning', () => {
  it('pushes a warning entry with severity', () => {
    logWarning('DUPLICATE_ADVANCE', { foo: 'bar' }, { roomId: 'r1', turnId: 't1' }, 'HIGH')
    const buf = getRingBuffer()
    expect(buf).toHaveLength(1)
    expect(buf[0].kind).toBe('warning')
    expect(buf[0].warningType).toBe('DUPLICATE_ADVANCE')
    expect(buf[0].severity).toBe('HIGH')
  })
})

describe('Intent tracking — no internal timers', () => {
  it('markIntent stores createdAt, clearIntent removes only matching type', () => {
    markIntent('roll', 'trace1')
    const intent = getIntent()
    expect(intent?.type).toBe('roll')
    expect(intent?.traceId).toBe('trace1')
    expect(typeof intent?.createdAt).toBe('number')

    clearIntent('advance') // не тот тип — не должен снять roll
    expect(getIntent()?.type).toBe('roll')

    clearIntent('roll')
    expect(getIntent()).toBeNull()
  })

  it('does not schedule any timers internally (pure createdAt-based)', () => {
    const spy = vi.spyOn(global, 'setTimeout')
    markIntent('advance', 'trace2')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('classifyTurnChangeSpeed thresholds', () => {
  it('classifies <250ms as HIGH', () => {
    expect(classifyTurnChangeSpeed(100)).toBe('HIGH')
    expect(classifyTurnChangeSpeed(249)).toBe('HIGH')
  })
  it('classifies 250-600ms as WARNING', () => {
    expect(classifyTurnChangeSpeed(250)).toBe('WARNING')
    expect(classifyTurnChangeSpeed(600)).toBe('WARNING')
  })
  it('classifies >600ms as not an anomaly (null)', () => {
    expect(classifyTurnChangeSpeed(601)).toBeNull()
    expect(classifyTurnChangeSpeed(5000)).toBeNull()
  })
})

describe('TURN_STUCK — single global watchdog, fires once per stuck turn', () => {
  it('fires TURN_STUCK after 8s of no transition for the same turnId', () => {
    vi.useFakeTimers()
    const ctx = { roomId: 'r1', turnId: 'stuck-turn' }
    // Регистрируем transition чтобы установить lastTurnId/lastTransitionAt
    logTransition({
      roomId: 'r1', turnId: 'stuck-turn', action: 'STATE_UPDATE', source: 'realtime',
      before: { currentTurn: 'p1', rolling_player_id: null, hasRolled: false, timeLeft: 60 },
      after: { currentTurn: 'p1', rolling_player_id: null, hasRolled: false, timeLeft: 60 },
    })
    startStuckWatcher(() => ctx)

    vi.advanceTimersByTime(9000) // > 8000мс порог, проверка каждые 2000мс
    const buf = getRingBuffer()
    const stuckWarnings = buf.filter(e => e.warningType === 'TURN_STUCK')
    expect(stuckWarnings.length).toBe(1) // сработал ровно один раз, не спамит

    vi.advanceTimersByTime(9000) // ещё 9с — не должен сработать снова для того же turnId
    const bufAfter = getRingBuffer()
    expect(bufAfter.filter(e => e.warningType === 'TURN_STUCK').length).toBe(1)

    vi.useRealTimers()
  })

  it('resets stuck-warned flag when a new turnId appears', () => {
    vi.useFakeTimers()
    const ctxRef = { current: { roomId: 'r1', turnId: 'turn-A' } }
    logTransition({
      roomId: 'r1', turnId: 'turn-A', action: 'STATE_UPDATE', source: 'realtime',
      before: { currentTurn: 'p1', rolling_player_id: null, hasRolled: false, timeLeft: 60 },
      after: { currentTurn: 'p1', rolling_player_id: null, hasRolled: false, timeLeft: 60 },
    })
    startStuckWatcher(() => ctxRef.current)
    vi.advanceTimersByTime(9000)
    expect(getRingBuffer().filter(e => e.warningType === 'TURN_STUCK').length).toBe(1)

    // Новый ход — должен сброситься флаг и снова быть способным сработать после 8с
    ctxRef.current = { roomId: 'r1', turnId: 'turn-B' }
    logTransition({
      roomId: 'r1', turnId: 'turn-B', action: 'STATE_UPDATE', source: 'realtime',
      before: { currentTurn: 'p2', rolling_player_id: null, hasRolled: false, timeLeft: 60 },
      after: { currentTurn: 'p2', rolling_player_id: null, hasRolled: false, timeLeft: 60 },
    })
    vi.advanceTimersByTime(9000)
    expect(getRingBuffer().filter(e => e.warningType === 'TURN_STUCK').length).toBe(2)

    vi.useRealTimers()
  })
})

describe('newTraceId', () => {
  it('generates unique short ids', () => {
    const a = newTraceId()
    const b = newTraceId()
    expect(a).not.toBe(b)
    expect(a.length).toBeGreaterThan(0)
  })
})
