// Layer: In-memory ring buffer для диагностических записей (transitions + warnings).
// Живёт только в памяти вкладки, не пишет в БД — это live-наблюдаемость текущей сессии.

export interface TransitionSnapshot {
  currentTurn: string | null
  rolling_player_id: string | null
  hasRolled: boolean
  timeLeft: number
}

export interface RingEntry {
  ts: number
  roomId: string
  turnId: string
  traceId?: string
  kind: 'transition' | 'warning'
  action?: string
  source?: string
  before?: TransitionSnapshot
  after?: TransitionSnapshot
  delta?: Partial<TransitionSnapshot>
  warningType?: string
  severity?: 'HIGH' | 'WARNING'
  details?: Record<string, unknown>
}

const MAX_ENTRIES = 200
const buffer: RingEntry[] = []
type Listener = (entry: RingEntry) => void
const listeners = new Set<Listener>()

export function pushRingEntry(entry: RingEntry): void {
  buffer.push(entry)
  if (buffer.length > MAX_ENTRIES) buffer.shift()
  listeners.forEach(l => l(entry))
}

export function getRingBuffer(): RingEntry[] {
  return [...buffer]
}

export function subscribeRingBuffer(cb: Listener): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

// Только для тестов — сброс состояния между тестами
export function __resetRingBufferForTests(): void {
  buffer.length = 0
  listeners.clear()
}
