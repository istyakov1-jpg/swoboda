// ВРЕМЕННЫЙ профайлинг — удалить после анализа
import { useEffect, useRef } from 'react'

const counters: Record<string, number> = {}
const reasons: Record<string, string[]> = {}
let turnStartTime = 0
let lastFlushTime = 0

export function markTurnStart() {
  turnStartTime = performance.now()
  Object.keys(counters).forEach(k => { counters[k] = 0; reasons[k] = [] })
  console.log('%c[PERF] ─── Новый ход ───', 'color:#F5B843;font-weight:bold;font-size:13px')
}

export function flushReport() {
  if (performance.now() - lastFlushTime < 500) return
  lastFlushTime = performance.now()
  const elapsed = Math.round(performance.now() - turnStartTime)
  const rows = Object.entries(counters)
    .filter(([, n]) => n > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ Компонент: name, Рендеров: count, Причины: (reasons[name] ?? []).slice(-3).join(', ') }))
  console.log(`%c[PERF] Отчёт за ${elapsed}мс`, 'color:#34D399;font-weight:bold')
  console.table(rows)
}

// Hook: считает рендеры и логирует изменившиеся пропсы/стейт
export function useRenderCount(name: string, tracked: Record<string, unknown> = {}) {
  const countRef = useRef(0)
  const prevRef = useRef<Record<string, unknown>>({})
  const isFirst = useRef(true)

  countRef.current += 1
  counters[name] = (counters[name] ?? 0) + 1

  if (!isFirst.current) {
    const changed = Object.entries(tracked)
      .filter(([k, v]) => prevRef.current[k] !== v)
      .map(([k]) => k)

    if (changed.length > 0) {
      const reason = changed.join('+')
      if (!reasons[name]) reasons[name] = []
      if (reasons[name][reasons[name].length - 1] !== reason) {
        reasons[name].push(reason)
      }
      console.log(
        `%c[PERF] ${name} #${countRef.current}`,
        'color:#A78BFA;font-size:11px',
        '← изменилось:', changed.join(', ')
      )
    }
  }

  isFirst.current = false
  prevRef.current = { ...tracked }

  useEffect(() => {
    // Flush отчёт через 2с после последнего рендера
    const t = setTimeout(flushReport, 2000)
    return () => clearTimeout(t)
  })
}

// Трекер изменений стейта
export function useStateChangeTracker(label: string, values: Record<string, unknown>) {
  const prev = useRef<Record<string, unknown>>({})
  const changed = Object.entries(values).filter(([k, v]) => prev.current[k] !== v)
  if (changed.length > 0) {
    console.log(
      `%c[STATE] ${label}`,
      'color:#60A5FA;font-size:11px',
      changed.map(([k, v]) => `${k}=${JSON.stringify(v)?.slice(0, 30)}`).join(', ')
    )
  }
  prev.current = { ...values }
}
