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
  pushRingEntry({
    ts: Date.now(), roomId: params.roomId, turnId: params.turnId, traceId: params.traceId,
    kind: 'transition', action: params.action, source: params.source,
    before: params.before, after: params.after, delta,
  })
  noteTransitionForStuckCheck(params.turnId)
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
}

let currentIntent: Intent | null = null

export function markIntent(type: IntentType, traceId: string): void {
  currentIntent = { type, createdAt: Date.now(), traceId }
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
}

// ── RAPID_TURN_CHANGE — вспомогательная функция для оценки порога ──────────
// <250мс = HIGH, 250-600мс = WARNING, больше — не аномалия. Не хранит состояние сама —
// вызывающая сторона (useGameRoom) передаёт время предыдущей смены хода.
export function classifyTurnChangeSpeed(deltaMs: number): 'HIGH' | 'WARNING' | null {
  if (deltaMs < 250) return 'HIGH'
  if (deltaMs <= 600) return 'WARNING'
  return null
}
