'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { GameEventType } from '@/lib/gameLogger'

const db = supabase as any

const EVENT_COLORS: Record<string, string> = {
  TURN_START:        '#34D399',
  TURN_END:          '#6EE7B7',
  ADVANCE_TURN:      '#60A5FA',
  SKIP_TURN:         '#F87171',
  ROLL:              '#F5B843',
  BOT_ACTION:        '#A78BFA',
  TIMEOUT:           '#FB923C',
  BUY_ASSET:         '#34D399',
  SELL_ASSET:        '#FBBF24',
  AUCTION_START:     '#C084FC',
  AUCTION_END:       '#C084FC',
  PLAYER_ELIMINATED: '#EF4444',
  WINNER:            '#FBD888',
  REALTIME_UPDATE:   '#64748B',
  SKIP_EFFECT_START: '#F87171',
  SKIP_EFFECT_ABORT: '#EF4444',
  SKIP_EFFECT_DONE:  '#4ADE80',
  ADVANCE_BLOCKED:   '#EF4444',
}

interface LogEntry {
  id: number
  created_at: string
  room_id: string
  turn_id: string
  event_type: GameEventType
  player_id: string | null
  player_name: string | null
  payload: Record<string, unknown>
}

export default function DebugPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [roomFilter, setRoomFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState<string[]>([])
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    let q = db.from('game_debug_logs').select('*').order('created_at', { ascending: false }).limit(500)
    if (roomFilter) q = q.eq('room_id', roomFilter)
    if (typeFilter) q = q.eq('event_type', typeFilter)
    const { data, error } = await q
    if (!error && data) {
      setLogs(data)
      const uniqueRooms = [...new Set(data.map((l: LogEntry) => l.room_id))] as string[]
      setRooms(prev => [...new Set([...prev, ...uniqueRooms])])
    }
    setLoading(false)
  }, [roomFilter, typeFilter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // Группировка по turn_id
  const grouped = logs.reduce((acc, log) => {
    if (!acc[log.turn_id]) acc[log.turn_id] = []
    acc[log.turn_id].push(log)
    return acc
  }, {} as Record<string, LogEntry[]>)

  const turnGroups = Object.entries(grouped).sort(([, a], [, b]) =>
    new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime()
  )

  function exportJSON() {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `game_debug_${roomFilter || 'all'}_${Date.now()}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  async function clearLogs() {
    if (!confirm('Удалить все логи?')) return
    let q = db.from('game_debug_logs').delete()
    if (roomFilter) q = q.eq('room_id', roomFilter)
    else q = q.gt('id', 0)
    await q
    setLogs([])
  }

  const allTypes = [...new Set(logs.map(l => l.event_type))]

  return (
    <div style={{ fontFamily: 'Manrope, monospace', background: '#07070D', minHeight: '100vh', color: '#F4F5FA', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>🔍 Game Debug Logs</h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{logs.length} событий</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={fetchLogs} style={btnStyle('#34D399')}>↻ Обновить</button>
            <button onClick={exportJSON} style={btnStyle('#F5B843')}>↓ JSON</button>
            <button onClick={clearLogs} style={btnStyle('#F87171')}>✕ Очистить</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <select
            value={roomFilter}
            onChange={e => setRoomFilter(e.target.value)}
            style={selectStyle}>
            <option value=''>Все комнаты</option>
            {rooms.map(r => <option key={r} value={r}>{r.slice(0, 8)}...</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={selectStyle}>
            <option value=''>Все типы</option>
            {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            placeholder='room_id (полный)'
            value={roomFilter}
            onChange={e => setRoomFilter(e.target.value)}
            style={{ ...selectStyle, minWidth: 280 }}
          />
        </div>

        {loading && <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 40 }}>Загрузка...</div>}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {Object.entries(EVENT_COLORS).map(([type, color]) => (
            <span key={type} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${color}22`, border: `1px solid ${color}44`, color }}>
              {type}
            </span>
          ))}
        </div>

        {/* Turn groups */}
        {turnGroups.map(([turnId, events]) => {
          const isExpanded = expanded.has(events[0].id)
          const turnStart = events.find(e => e.event_type === 'TURN_START')
          const hasSkip = events.some(e => e.event_type === 'SKIP_TURN')
          const hasTimeout = events.some(e => e.event_type === 'TIMEOUT')
          const hasAbort = events.some(e => e.event_type === 'SKIP_EFFECT_ABORT')
          const hasAdvance = events.some(e => e.event_type === 'ADVANCE_TURN')

          return (
            <div key={turnId} style={{
              marginBottom: 8,
              border: `1px solid ${hasTimeout || hasAbort ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              {/* Turn header */}
              <div
                onClick={() => setExpanded(prev => {
                  const next = new Set(prev)
                  if (next.has(events[0].id)) next.delete(events[0].id)
                  else next.add(events[0].id)
                  return next
                })}
                style={{
                  padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                  background: hasTimeout || hasAbort ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                  {new Date(events[0].created_at).toLocaleTimeString('ru', { hour12: false })}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {turnStart?.player_name ?? '?'}
                  {turnStart && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>
                    ({turnStart.payload?.is_bot ? 'бот' : 'игрок'}) skip={(turnStart.payload?.skip_turns as number) > 0 ? `${turnStart.payload?.skip_turns}` : '0'}
                  </span>}
                </span>
                <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                  {hasSkip && <Tag color='#F87171'>SKIP</Tag>}
                  {hasTimeout && <Tag color='#FB923C'>TIMEOUT</Tag>}
                  {hasAbort && <Tag color='#EF4444'>ABORT</Tag>}
                  {hasAdvance && <Tag color='#60A5FA'>ADVANCE</Tag>}
                </div>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{isExpanded ? '▲' : '▼'} {events.length}</span>
              </div>

              {/* Events list */}
              {isExpanded && (
                <div style={{ padding: '4px 0' }}>
                  {[...events].reverse().map(ev => (
                    <div key={ev.id} style={{
                      display: 'grid', gridTemplateColumns: '80px 140px 1fr',
                      gap: 8, padding: '6px 16px',
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                      fontSize: 11, fontFamily: 'monospace',
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {new Date(ev.created_at).toISOString().slice(11, 23)}
                      </span>
                      <span style={{
                        color: EVENT_COLORS[ev.event_type] ?? '#fff',
                        fontWeight: 700, fontSize: 10,
                      }}>
                        {ev.event_type}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.player_name && <b style={{ color: '#fff' }}>{ev.player_name} </b>}
                        {JSON.stringify(ev.payload).slice(0, 120)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {logs.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div>Логов нет. Запусти игру — события появятся здесь.</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>Не забудь запустить SQL в Supabase: supabase/game_debug_logs.sql</div>
          </div>
        )}
      </div>
    </div>
  )
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 8, background: `${color}22`, color, border: `1px solid ${color}44` }}>
      {children}
    </span>
  )
}

const btnStyle = (color: string): React.CSSProperties => ({
  padding: '8px 16px', borderRadius: 10, border: `1px solid ${color}44`,
  background: `${color}18`, color, fontWeight: 700, fontSize: 13, cursor: 'pointer',
})

const selectStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)', color: '#F4F5FA', fontSize: 13, cursor: 'pointer',
}
