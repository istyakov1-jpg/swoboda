'use client'
// Diagnostic-only оверлей поверх игрового ring buffer (transitions + warnings).
// Включается через ?debug=true в URL ИЛИ NEXT_PUBLIC_DEBUG=true в env.
// Никак не влияет на игровую логику — если выключен, вообще не подписывается
// на ring buffer (не вызывает даже getRingBuffer/subscribeRingBuffer).
import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { getRingBuffer, subscribeRingBuffer, type RingEntry } from '@/lib/gameRingBuffer'

const SEVERITY_COLOR: Record<string, string> = {
  HIGH: '#EF4444',
  WARNING: '#F59E0B',
}
const KIND_COLOR: Record<string, string> = {
  transition: '#60A5FA',
  warning: '#EF4444',
}

function entryPlayerId(e: RingEntry): string | undefined {
  if (e.kind === 'transition') return e.after?.currentTurn ?? undefined
  const d = e.details as Record<string, unknown> | undefined
  if (!d) return undefined
  return (d.attemptedPlayerId ?? d.expectedPlayerId ?? d.rolling_player_id ?? d.to) as string | undefined
}

function isEnabled(searchParamsDebug: string | null): boolean {
  if (searchParamsDebug === 'true') return true
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG === 'true') return true
  return false
}

export default function DebugOverlay() {
  const searchParams = useSearchParams()
  const enabled = isEnabled(searchParams.get('debug'))

  // Хуки должны быть безусловны (Rules of Hooks) — но подписка внутри
  // useEffect включается только если enabled, так что при выключенном
  // режиме нет вообще никакой нагрузки на ring buffer.
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<RingEntry[]>([])
  const [kindFilter, setKindFilter] = useState<'all' | 'transition' | 'warning'>('all')
  const [playerFilter, setPlayerFilter] = useState<string>('all')

  useEffect(() => {
    if (!enabled) return
    setEntries(getRingBuffer())
    const unsub = subscribeRingBuffer(entry => {
      setEntries(prev => {
        const next = [...prev, entry]
        return next.length > 200 ? next.slice(next.length - 200) : next
      })
    })
    return unsub
  }, [enabled])

  const players = useMemo(() => {
    const set = new Set<string>()
    entries.forEach(e => { const pid = entryPlayerId(e); if (pid) set.add(pid) })
    return [...set]
  }, [entries])

  const filtered = useMemo(() => {
    return entries
      .filter(e => kindFilter === 'all' || e.kind === kindFilter)
      .filter(e => playerFilter === 'all' || entryPlayerId(e) === playerFilter)
      .slice()
      .reverse() // новые сверху
  }, [entries, kindFilter, playerFilter])

  if (!enabled) return null

  return (
    <div style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 99999, fontFamily: 'monospace' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 40, height: 40, borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(0,0,0,0.85)', color: '#F5B843', fontSize: 18, cursor: 'pointer',
        }}
        title="Debug overlay"
      >
        {open ? '×' : '🔍'}
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 48, right: 0, width: 380, maxHeight: 480,
          background: 'rgba(5,5,10,0.96)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: '#F5B843', fontSize: 11, fontWeight: 700 }}>DEBUG ({entries.length})</span>
            <select value={kindFilter} onChange={e => setKindFilter(e.target.value as any)}
              style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6 }}>
              <option value="all">все</option>
              <option value="transition">transitions</option>
              <option value="warning">warnings</option>
            </select>
            <select value={playerFilter} onChange={e => setPlayerFilter(e.target.value)}
              style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6 }}>
              <option value="all">все игроки</option>
              {players.map(p => <option key={p} value={p}>{p.slice(0, 8)}</option>)}
            </select>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
            {filtered.length === 0 && (
              <div style={{ padding: 16, color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center' }}>Пока пусто</div>
            )}
            {filtered.map((e, i) => (
              <div key={i} style={{
                padding: '5px 12px', fontSize: 10, borderBottom: '1px solid rgba(255,255,255,0.04)',
                color: e.kind === 'warning' ? (SEVERITY_COLOR[e.severity ?? 'WARNING']) : 'rgba(255,255,255,0.7)',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>{new Date(e.ts).toISOString().slice(11, 23)}</span>
                {' '}
                <b style={{ color: KIND_COLOR[e.kind] }}>{e.kind === 'warning' ? e.warningType : e.action}</b>
                {e.kind === 'transition' && e.delta && Object.keys(e.delta).length > 0 && (
                  <span> Δ{JSON.stringify(e.delta)}</span>
                )}
                {e.kind === 'warning' && e.details && (
                  <span> {JSON.stringify(e.details).slice(0, 80)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
