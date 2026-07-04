import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getRingBuffer, __resetRingBufferForTests } from '@/lib/gameRingBuffer'
import {
  logTransition, markIntent, getIntent,
  __resetIntentForTests, __resetStuckWatcherForTests,
} from '@/lib/gameTransitionLogger'

beforeEach(() => {
  __resetRingBufferForTests()
  __resetIntentForTests()
  __resetStuckWatcherForTests()
})

function snap(overrides: Partial<any> = {}) {
  return { currentTurn: 'p1', rolling_player_id: null, hasRolled: false, timeLeft: 60, ...overrides }
}

describe('STALE_ROLLING_PLAYER — detected inside logTransition from before/after alone', () => {
  it('fires when rolling_player_id belongs to someone who is no longer players[0]', () => {
    logTransition({
      roomId: 'r1', turnId: 't1', action: 'STATE_UPDATE', source: 'realtime',
      before: snap({ currentTurn: 'p1', rolling_player_id: 'p1' }),
      after: snap({ currentTurn: 'p2', rolling_player_id: 'p1' }), // p1 всё ещё "бросает", но ход уже у p2
    })
    const warnings = getRingBuffer().filter(e => e.warningType === 'STALE_ROLLING_PLAYER')
    expect(warnings).toHaveLength(1)
    expect(warnings[0].details).toMatchObject({ rolling_player_id: 'p1', currentTurn: 'p2' })
  })

  it('does NOT fire when rolling_player_id matches currentTurn', () => {
    logTransition({
      roomId: 'r1', turnId: 't1', action: 'STATE_UPDATE', source: 'realtime',
      before: snap({ rolling_player_id: null }),
      after: snap({ currentTurn: 'p1', rolling_player_id: 'p1' }),
    })
    expect(getRingBuffer().filter(e => e.warningType === 'STALE_ROLLING_PLAYER')).toHaveLength(0)
  })

  it('does NOT fire when rolling_player_id is null', () => {
    logTransition({
      roomId: 'r1', turnId: 't1', action: 'STATE_UPDATE', source: 'realtime',
      before: snap({ rolling_player_id: 'p1' }),
      after: snap({ currentTurn: 'p2', rolling_player_id: null }),
    })
    expect(getRingBuffer().filter(e => e.warningType === 'STALE_ROLLING_PLAYER')).toHaveLength(0)
  })
})

describe('RAPID_TURN_CHANGE — thresholds evaluated on real elapsed time between turn changes', () => {
  it('fires HIGH when currentTurn changes twice within <250ms', () => {
    vi.useFakeTimers()
    logTransition({
      roomId: 'r1', turnId: 't1', action: 'STATE_UPDATE', source: 'realtime',
      before: snap({ currentTurn: 'p1' }), after: snap({ currentTurn: 'p2' }),
    })
    vi.advanceTimersByTime(100) // <250ms
    logTransition({
      roomId: 'r1', turnId: 't2', action: 'STATE_UPDATE', source: 'realtime',
      before: snap({ currentTurn: 'p2' }), after: snap({ currentTurn: 'p3' }),
    })
    const warnings = getRingBuffer().filter(e => e.warningType === 'RAPID_TURN_CHANGE')
    expect(warnings).toHaveLength(1)
    expect(warnings[0].severity).toBe('HIGH')
    vi.useRealTimers()
  })

  it('fires WARNING when currentTurn changes twice within 250-600ms', () => {
    vi.useFakeTimers()
    logTransition({
      roomId: 'r1', turnId: 't1', action: 'STATE_UPDATE', source: 'realtime',
      before: snap({ currentTurn: 'p1' }), after: snap({ currentTurn: 'p2' }),
    })
    vi.advanceTimersByTime(400)
    logTransition({
      roomId: 'r1', turnId: 't2', action: 'STATE_UPDATE', source: 'realtime',
      before: snap({ currentTurn: 'p2' }), after: snap({ currentTurn: 'p3' }),
    })
    const warnings = getRingBuffer().filter(e => e.warningType === 'RAPID_TURN_CHANGE')
    expect(warnings).toHaveLength(1)
    expect(warnings[0].severity).toBe('WARNING')
    vi.useRealTimers()
  })

  it('does NOT fire when turn changes are >600ms apart (normal gameplay)', () => {
    vi.useFakeTimers()
    logTransition({
      roomId: 'r1', turnId: 't1', action: 'STATE_UPDATE', source: 'realtime',
      before: snap({ currentTurn: 'p1' }), after: snap({ currentTurn: 'p2' }),
    })
    vi.advanceTimersByTime(5000)
    logTransition({
      roomId: 'r1', turnId: 't2', action: 'STATE_UPDATE', source: 'realtime',
      before: snap({ currentTurn: 'p2' }), after: snap({ currentTurn: 'p3' }),
    })
    expect(getRingBuffer().filter(e => e.warningType === 'RAPID_TURN_CHANGE')).toHaveLength(0)
    vi.useRealTimers()
  })

  it('does NOT fire when currentTurn did not actually change', () => {
    vi.useFakeTimers()
    logTransition({
      roomId: 'r1', turnId: 't1', action: 'STATE_UPDATE', source: 'realtime',
      before: snap({ currentTurn: 'p1', hasRolled: false }), after: snap({ currentTurn: 'p1', hasRolled: true }),
    })
    vi.advanceTimersByTime(50)
    logTransition({
      roomId: 'r1', turnId: 't1', action: 'STATE_UPDATE', source: 'realtime',
      before: snap({ currentTurn: 'p1', hasRolled: true }), after: snap({ currentTurn: 'p1', timeLeft: 58 }),
    })
    expect(getRingBuffer().filter(e => e.warningType === 'RAPID_TURN_CHANGE')).toHaveLength(0)
    vi.useRealTimers()
  })
})

describe('MISSING_ROLLING_PLAYER_ID_AFTER_ROLL — intent-based, no internal timer', () => {
  it('does NOT fire before 500ms even if rolling_player_id is not yet confirmed', () => {
    vi.useFakeTimers()
    markIntent('roll', 'trace1', 'p1')
    vi.advanceTimersByTime(300) // < 500ms
    logTransition({
      roomId: 'r1', turnId: 't1', action: 'STATE_UPDATE', source: 'realtime',
      before: snap({ rolling_player_id: null }),
      after: snap({ rolling_player_id: null }), // всё ещё не подтверждено
    })
    expect(getRingBuffer().filter(e => e.warningType === 'MISSING_ROLLING_PLAYER_ID_AFTER_ROLL')).toHaveLength(0)
    // intent должен остаться висеть — ещё не истёк таймаут
    expect(getIntent()?.type).toBe('roll')
    vi.useRealTimers()
  })

  it('fires after 500ms if rolling_player_id still does not match the intended roller', () => {
    vi.useFakeTimers()
    markIntent('roll', 'trace1', 'p1')
    vi.advanceTimersByTime(600) // > 500ms
    logTransition({
      roomId: 'r1', turnId: 't1', action: 'STATE_UPDATE', source: 'realtime',
      before: snap({ rolling_player_id: null }),
      after: snap({ rolling_player_id: null }), // так и не пришло
    })
    const warnings = getRingBuffer().filter(e => e.warningType === 'MISSING_ROLLING_PLAYER_ID_AFTER_ROLL')
    expect(warnings).toHaveLength(1)
    expect(warnings[0].details).toMatchObject({ expectedPlayerId: 'p1' })
    // Интент должен быть снят после warning — не спамим на будущих STATE_UPDATE
    expect(getIntent()).toBeNull()
    vi.useRealTimers()
  })

  it('clears intent silently (no warning) when rolling_player_id DOES confirm the roll', () => {
    vi.useFakeTimers()
    markIntent('roll', 'trace1', 'p1')
    vi.advanceTimersByTime(100)
    logTransition({
      roomId: 'r1', turnId: 't1', action: 'STATE_UPDATE', source: 'realtime',
      before: snap({ rolling_player_id: null }),
      after: snap({ rolling_player_id: 'p1' }), // подтверждено вовремя
    })
    expect(getRingBuffer().filter(e => e.warningType === 'MISSING_ROLLING_PLAYER_ID_AFTER_ROLL')).toHaveLength(0)
    expect(getIntent()).toBeNull() // снято как подтверждённое
    vi.useRealTimers()
  })

  it('confirmed transition entry carries the original traceId from the roll intent', () => {
    vi.useFakeTimers()
    markIntent('roll', 'trace-xyz', 'p1')
    vi.advanceTimersByTime(50)
    logTransition({
      roomId: 'r1', turnId: 't1', action: 'STATE_UPDATE', source: 'realtime',
      before: snap({ rolling_player_id: null }),
      after: snap({ rolling_player_id: 'p1' }),
    })
    const transitions = getRingBuffer().filter(e => e.kind === 'transition')
    expect(transitions[0].traceId).toBe('trace-xyz')
    vi.useRealTimers()
  })
})
