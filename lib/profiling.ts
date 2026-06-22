'use client'
import { useEffect, useRef } from 'react'

const counters: Record<string, number> = {}
const reasons: Record<string, string[]> = {}
let turnStart = 0

export function markTurnStart(label = '') {
  turnStart = performance.now()
  Object.keys(counters).forEach(k => { counters[k] = 0; reasons[k] = [] })
  console.log(`%c[PERF] ─── Новый ход ${label}───`, 'color:#F5B843;font-weight:bold;font-size:13px')
}

export function flushReport(tag = '') {
  const ms = Math.round(performance.now() - turnStart)
  const rows = Object.entries(counters)
    .filter(([, n]) => n > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({
      Компонент: name,
      'Рендеров': count,
      'Топ-причины': (reasons[name] ?? []).slice(-4).join(' | ') || '—',
    }))
  console.log(`%c[PERF] Отчёт ${tag} за ${ms}мс`, 'color:#34D399;font-weight:bold;font-size:13px')
  console.table(rows)
}

export function useRenderCount(name: string, tracked: Record<string, unknown> = {}) {
  const countRef = useRef(0)
  const prevRef = useRef<Record<string, unknown>>({})
  const firstRef = useRef(true)

  countRef.current += 1
  counters[name] = (counters[name] ?? 0) + 1

  if (!firstRef.current) {
    const changed = Object.entries(tracked)
      .filter(([k, v]) => prevRef.current[k] !== v)
      .map(([k]) => k)
    if (changed.length > 0) {
      const r = changed.join('+')
      if (!reasons[name]) reasons[name] = []
      if (reasons[name][reasons[name].length - 1] !== r) reasons[name].push(r)
    }
  }
  firstRef.current = false
  prevRef.current = { ...tracked }

  useEffect(() => {
    const t = setTimeout(() => flushReport(name === 'GamePage' ? '(auto)' : ''), 3000)
    return () => clearTimeout(t)
  })
}
