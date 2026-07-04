// Layer 2 (Transition) + Intent tracking + Anomaly detection.
// Единственный источник истины для Transition — подтверждённый STATE_UPDATE из realtime.
// Никакая другая точка (ROLL/ADVANCE/SKIP/BOT_MOVE) не пишет Transition оптимистично —
// эти точки продолжают писать только Event через существующий lib/gameLogger.ts.

import { pushRingEntry, type TransitionSnapshot } from './gameRingBuffer'

export type { TransitionSnapshot }

// ── traceId ──────────────────────────────────────────────────────────────
// Общий идентификатор, который связывает цепочку: Event(ROLL) → STATE_UPDATE → Transition → Warning
export function newTraceId(): string {
  return crypto.randomUUID().slice(0, 8)
}

// ── Delta ────────────────────────────────────────────────────────────────
function computeDelta(before: TransitionSnapshot, after: TransitionSnapshot): Partial<TransitionSnapshot> {
  const delta: Partial<TransitionSnapshot> = {}
  ;(Object.keys(after) as (keyof TransitionSnapshot)[]).forEach(k => {
    if (before[k] !== after[k]) (delta as any)[k] = after[k]
  })
  return delta
}

// ── Transition (только из подтверждённого STATE_UPDATE) ────────────────────
// Здесь же живут все anomaly-проверки, которые можно вычислить чисто из before/after —
// STALE_ROLLING_PLAYER, RAPID_TURN_CHANGE, MISSING_ROLLING_PLAYER_ID_AFTER_ROLL.
// DUPLICATE_ADVANCE сюда не входит — это факт вызова функции, а не переход состояния,
// проверяется в useGameActions.ts прямо у guard'а isAdvancingRef.
export function logTransition(params: {
  roomId: string
  turnId: string
  traceId?: string
  action: 'STATE_UPDATE'
  source: 'realtime'
  before: TransitionSnapshot
  after: TransitionSnapshot
}): Partial<TransitionSnapshot> {
  const delta = computeDelta(params.before, params.after)

  // Если это подтверждение ожидаемого roll — подхватываем traceId из intent для корреляции
  const pendingRoll = currentIntent?.type === 'roll' ? currentIntent : null
  const effectiveTraceId = params.traceId
    ?? (pendingRoll && params.after.rolling_player_id === pendingRoll.playerId ? pendingRoll.traceId : undefined)

  pushRingEntry({
    ts: Date.now(), roomId: params.roomId, turnId: params.turnId, traceId: effectiveTraceId,
    kind: 'transition', action: params.action, source: params.source,
    before: params.before, after: params.after, delta,
  })
  noteTransitionForStuckCheck(params.turnId)

  const ctx = { roomId: params.roomId, turnId: params.turnId, traceId: effectiveTraceId }

  // STALE_ROLLING_PLAYER — кто-то отмечен как "бросает", но ход уже не его
  if (params.after.rolling_player_id && params.after.rolling_player_id !== params.after.currentTurn) {
    logWarning('STALE_ROLLING_PLAYER', {
      rolling_player_id: params.after.rolling_player_id,
      currentTurn: params.after.currentTurn,
    }, ctx)
  }

  // RAPID_TURN_CHANGE — currentTurn реально изменился
  if (delta.currentTurn !== undefined) {
    const now = Date.now()
    if (lastTurnChangeAt !== null) {
      const deltaMs = now - lastTurnChangeAt
      const severity = classifyTurnChangeSpeed(deltaMs)
      if (severity) {
        logWarning('RAPID_TURN_CHANGE', {
          deltaMs, from: lastKnownTurn, to: params.after.currentTurn,
        }, ctx, severity)
      }
    }
    lastTurnChangeAt = now
    lastKnownTurn = params.after.currentTurn
  }

  // MISSING_ROLLING_PLAYER_ID_AFTER_ROLL — проверяем незакрытый roll-intent
  if (pendingRoll) {
    if (params.after.rolling_player_id === pendingRoll.playerId) {
      clearIntent('roll') // подтверждено — всё хорошо
    } else {
      const elapsed = Date.now() - pendingRoll.createdAt
      if (elapsed > ROLL_CONFIRM_TIMEOUT_MS) {
        logWarning('MISSING_ROLLING_PLAYER_ID_AFTER_ROLL', {
          elapsedMs: elapsed,
          expectedPlayerId: pendingRoll.playerId,
          actualRollingPlayerId: params.after.rolling_player_id,
        }, { roomId: params.roomId, turnId: params.turnId, traceId: pendingRoll.traceId })
        clearIntent('roll') // не спамим на каждый последующий STATE_UPDATE
      }
      // elapsed <= 500мс — рано считать пропажей, ничего не делаем
    }
  }

  return delta
}

// ── Warning ──────────────────────────────────────────────────────────────
export type WarningType =
  | 'DUPLICATE_ADVANCE'
  | 'STALE_ROLLING_PLAYER'
  | 'MISSING_ROLLING_PLAYER_ID_AFTER_ROLL'
  | 'RAPID_TURN_CHANGE'
  | 'TURN_STUCK'

export function logWarning(
  warningType: WarningType,
  details: Record<string, unknown>,
  ctx: { roomId: string; turnId: string; traceId?: string },
  severity: 'HIGH' | 'WARNING' = 'WARNING'
): void {
  pushRingEntry({
    ts: Date.now(), roomId: ctx.roomId, turnId: ctx.turnId, traceId: ctx.traceId,
    kind: 'warning', warningType, severity, details,
  })
  console.warn(`[ANOMALY:${severity}] ${warningType}`, { roomId: ctx.roomId, turnId: ctx.turnId, ...details })
}

// ── Intent tracking ──────────────────────────────────────────────────────
// Отдельно от gameState. Без внутренних setTimeout — только createdAt,
// проверяется лениво в момент прихода следующего STATE_UPDATE.
export type IntentType = 'roll' | 'advance' | 'skip'

interface Intent {
  type: IntentType
  createdAt: number
  traceId: string
  playerId: string
}

const ROLL_CONFIRM_TIMEOUT_MS = 500

let currentIntent: Intent | null = null

export function markIntent(type: IntentType, traceId: string, playerId: string): void {
  currentIntent = { type, createdAt: Date.now(), traceId, playerId }
}

export function clearIntent(type: IntentType): void {
  if (currentIntent?.type === type) currentIntent = null
}

export function getIntent(): Intent | null {
  return currentIntent
}

// Только для тестов
export function __resetIntentForTests(): void {
  currentIntent = null
}

// ── RAPID_TURN_CHANGE: отслеживаем момент последней реальной смены хода ────
let lastTurnChangeAt: number | null = null
let lastKnownTurn: string | null = null

// ── TURN_STUCK: один глобальный таймер, не watchdog на каждый ход ──────────
let lastTransitionAt = Date.now()
let lastTurnId: string | null = null
let stuckWarned = false
let watcherIntervalId: ReturnType<typeof setInterval> | null = null

function noteTransitionForStuckCheck(turnId: string): void {
  if (turnId !== lastTurnId) {
    lastTurnId = turnId
    stuckWarned = false
  }
  lastTransitionAt = Date.now()
}

const TURN_STUCK_THRESHOLD_MS = 8000
const STUCK_CHECK_INTERVAL_MS = 2000

// Идемпотентно — можно вызывать из нескольких мест, реально стартует один раз.
export function startStuckWatcher(getContext: () => { roomId: string; turnId: string } | null): void {
  if (watcherIntervalId !== null) return
  watcherIntervalId = setInterval(() => {
    const ctx = getContext()
    if (!ctx) return
    const elapsed = Date.now() - lastTransitionAt
    if (elapsed >= TURN_STUCK_THRESHOLD_MS && !stuckWarned) {
      stuckWarned = true
      logWarning('TURN_STUCK', { elapsedMs: elapsed }, ctx, 'HIGH')
    }
  }, STUCK_CHECK_INTERVAL_MS)
}

// Только для тестов
export function __resetStuckWatcherForTests(): void {
  if (watcherIntervalId !== null) clearInterval(watcherIntervalId)
  watcherIntervalId = null
  lastTransitionAt = Date.now()
  lastTurnId = null
  stuckWarned = false
  lastTurnChangeAt = null
  lastKnownTurn = null
}

// ── RAPID_TURN_CHANGE — вспомогательная функция для оценки порога ──────────
// <250мс = HIGH, 250-600мс = WARNING, больше — не аномалия. Не хранит состояние сама —
// вызывающая сторона (useGameRoom) передаёт время предыдущей смены хода.
export function classifyTurnChangeSpeed(deltaMs: number): 'HIGH' | 'WARNING' | null {
  if (deltaMs < 250) return 'HIGH'
  if (deltaMs <= 600) return 'WARNING'
  return null
}
