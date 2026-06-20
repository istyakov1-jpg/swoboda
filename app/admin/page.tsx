'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { freedomProgress, netPassiveIncome, baseExpenses } from '@/lib/gameEngine'
import { KEY_RATE_DEFAULT, PROFESSIONS, SELL_OFFERS } from '@/lib/gameData'
import { loadGameConfig, saveGameConfig, getDefaultConfig, type GameConfig } from '@/lib/gameConfig'

const db = supabase as any

// ── Простая авторизация ──────────────────────────────────────────
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'svoboda2024'

// ── Типы ────────────────────────────────────────────────────────
type Section = 'dashboard' | 'games' | 'game-detail' | 'analytics' | 'content' | 'rules'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [section, setSection] = useState<Section>('dashboard')
  const [rooms, setRooms] = useState<any[]>([])
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState('')

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 3000) }

  const fetchRooms = useCallback(async () => {
    setLoading(true)
    const { data } = await db.from('rooms').select('*').order('created_at', { ascending: false }).limit(100)
    setRooms(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!authed) return
    fetchRooms()
    const interval = setInterval(fetchRooms, 10000)
    return () => clearInterval(interval)
  }, [authed, fetchRooms])

  // Загрузить детали комнаты
  const openRoom = async (room: any) => {
    const { data } = await db.from('rooms').select('*').eq('id', room.id).single()
    setSelectedRoom(data)
    setSection('game-detail')
  }

  const refreshRoom = async () => {
    if (!selectedRoom) return
    const { data } = await db.from('rooms').select('*').eq('id', selectedRoom.id).single()
    setSelectedRoom(data)
  }

  // ── Auth ──────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#07070D] flex items-center justify-center">
        <div className="w-[360px] rounded-[24px] border border-white/[0.08] bg-[#0B0B13] p-8">
          <div className="text-[28px] font-extrabold mb-1">Админ-панель</div>
          <div className="text-[13px] text-gray-500 mb-6">Свобода · Финансовая игра</div>
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && password === ADMIN_PASSWORD && setAuthed(true)}
            className="w-full rounded-[14px] border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-[15px] text-white placeholder:text-gray-600 focus:border-yellow-500/40 focus:outline-none mb-3"
          />
          <button
            onClick={() => password === ADMIN_PASSWORD ? setAuthed(true) : notify('Неверный пароль')}
            className="w-full rounded-[14px] py-3 text-[15px] font-bold text-[#1A1206]"
            style={{ background: 'linear-gradient(135deg,#FBD888,#F5B843 55%,#E0891F)' }}>
            Войти
          </button>
          {notification && <div className="mt-3 text-red-400 text-[13px] text-center">{notification}</div>}
        </div>
      </div>
    )
  }

  const activeRooms = rooms.filter(r => r.status === 'playing')
  const lobbyRooms = rooms.filter(r => r.status === 'lobby')
  const finishedRooms = rooms.filter(r => r.status === 'finished')

  const nav = [
    { id: 'dashboard', label: '📊 Дашборд' },
    { id: 'games',     label: '🎮 Игры' },
    { id: 'analytics', label: '📈 Аналитика' },
    { id: 'content',   label: '📋 Контент' },
    { id: 'rules',     label: '⚙️ Правила' },
  ]

  return (
    <div className="min-h-screen bg-[#07070D] text-white flex">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 border-r border-white/[0.06] bg-[#0B0B13] flex flex-col">
        <div className="px-6 py-6 border-b border-white/[0.06]">
          <div className="text-[16px] font-extrabold text-yellow-400">Свобода</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Admin Panel</div>
        </div>
        <nav className="flex-1 p-3">
          {nav.map(n => (
            <button key={n.id} onClick={() => setSection(n.id as Section)}
              className="w-full text-left px-3 py-2.5 rounded-[10px] text-[13px] font-medium mb-1 transition-all"
              style={{ background: section === n.id ? 'rgba(245,184,67,0.12)' : 'transparent', color: section === n.id ? '#F5B843' : '#9AA0B4' }}>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #34D399' }} />
            <span className="text-[11px] text-gray-500">{activeRooms.length} игр онлайн</span>
          </div>
          <button onClick={() => setAuthed(false)} className="w-full text-left px-3 py-2 text-[12px] text-gray-600 hover:text-gray-400 transition-colors">
            Выйти →
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-6">
          <div className="text-[14px] font-bold text-white">
            {section === 'dashboard' && 'Дашборд'}
            {section === 'games' && 'Управление играми'}
            {section === 'game-detail' && `Игра: ${selectedRoom?.code ?? '...'}`}
            {section === 'analytics' && 'Аналитика'}
            {section === 'content' && 'Контент'}
            {section === 'rules' && 'Правила и механики'}
          </div>
          <div className="flex items-center gap-3">
            {notification && <span className="text-[12px] text-yellow-400">{notification}</span>}
            <button onClick={fetchRooms} className="text-[12px] text-gray-500 hover:text-white px-3 py-1.5 rounded-[8px] border border-white/[0.06] transition-colors">
              ↻ Обновить
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* ── DASHBOARD ── */}
          {section === 'dashboard' && (
            <div>
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Всего игр', val: rooms.length, color: '#60A5FA' },
                  { label: 'Активные сейчас', val: activeRooms.length, color: '#34D399' },
                  { label: 'В лобби', val: lobbyRooms.length, color: '#FBBF24' },
                  { label: 'Завершено', val: finishedRooms.length, color: '#9AA0B4' },
                ].map(s => (
                  <div key={s.label} className="rounded-[16px] p-4 border border-white/[0.06] bg-[#0B0B13]">
                    <div className="text-[11px] text-gray-500 mb-1">{s.label}</div>
                    <div className="text-[28px] font-extrabold" style={{ color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Active games */}
              <div className="rounded-[16px] border border-white/[0.06] bg-[#0B0B13] overflow-hidden mb-6">
                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <span className="text-[13px] font-bold">🟢 Активные игры</span>
                  <span className="text-[11px] text-gray-500">{activeRooms.length} комнат</span>
                </div>
                {activeRooms.length === 0 ? (
                  <div className="px-5 py-8 text-center text-[13px] text-gray-600">Нет активных игр</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        {['Код', 'Игроки', 'Раунд', 'ЦБ', 'Создана', 'Действия'].map(h => (
                          <th key={h} className="text-left px-5 py-2.5 text-[11px] text-gray-500 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeRooms.map(r => {
                        const gs = r.game_state
                        const players = gs?.players ?? []
                        return (
                          <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-3 font-mono text-[13px] font-bold text-yellow-400">{r.code}</td>
                            <td className="px-5 py-3 text-[13px]">{players.length} чел.</td>
                            <td className="px-5 py-3 text-[13px]">{gs?.round ?? 1}</td>
                            <td className="px-5 py-3 text-[13px]" style={{ color: (gs?.key_rate ?? 0.16) >= 0.19 ? '#F87171' : '#34D399' }}>
                              {Math.round((gs?.key_rate ?? KEY_RATE_DEFAULT) * 100)}%
                            </td>
                            <td className="px-5 py-3 text-[12px] text-gray-500">{new Date(r.created_at).toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</td>
                            <td className="px-5 py-3">
                              <button onClick={() => openRoom(r)} className="text-[11px] font-bold px-3 py-1.5 rounded-[8px] text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/10 transition-colors">
                                Открыть →
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Recent rooms */}
              <div className="rounded-[16px] border border-white/[0.06] bg-[#0B0B13] overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.06]">
                  <span className="text-[13px] font-bold">📋 Все комнаты</span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      {['Код', 'Статус', 'Игроки', 'Создана', ''].map(h => (
                        <th key={h} className="text-left px-5 py-2.5 text-[11px] text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.slice(0, 20).map(r => (
                      <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-2.5 font-mono text-[13px] font-bold">{r.code}</td>
                        <td className="px-5 py-2.5">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-[6px]"
                            style={{ background: r.status==='playing'?'rgba(52,211,153,0.15)':r.status==='lobby'?'rgba(251,191,36,0.15)':'rgba(255,255,255,0.06)', color: r.status==='playing'?'#34D399':r.status==='lobby'?'#FBBF24':'#9AA0B4' }}>
                            {r.status==='playing'?'Активна':r.status==='lobby'?'Лобби':'Завершена'}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-[13px]">{r.game_state?.players?.length ?? 0}</td>
                        <td className="px-5 py-2.5 text-[12px] text-gray-500">{new Date(r.created_at).toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</td>
                        <td className="px-5 py-2.5">
                          <button onClick={() => openRoom(r)} className="text-[11px] text-gray-500 hover:text-white transition-colors">→</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── GAMES LIST ── */}
          {section === 'games' && (
            <GamesList rooms={rooms} openRoom={openRoom} onRefresh={fetchRooms} notify={notify} />
          )}

          {/* ── GAME DETAIL ── */}
          {section === 'game-detail' && selectedRoom && (
            <GameDetail room={selectedRoom} onRefresh={refreshRoom} notify={notify} onBack={() => setSection('games')} />
          )}

          {/* ── ANALYTICS ── */}
          {section === 'analytics' && <Analytics rooms={rooms} />}

          {/* ── CONTENT ── */}
          {section === 'content' && <ContentManager />}

          {/* ── RULES ── */}
          {section === 'rules' && <RulesManager notify={notify} />}
        </div>
      </main>
    </div>
  )
}

// ── GAMES LIST ──────────────────────────────────────────────────
function GamesList({ rooms, openRoom, onRefresh, notify }: any) {
  const [filter, setFilter] = useState<'all'|'playing'|'lobby'|'finished'>('all')
  const filtered = filter === 'all' ? rooms : rooms.filter((r: any) => r.status === filter)

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['all','playing','lobby','finished'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-[10px] text-[12px] font-bold transition-all"
            style={{ background: filter===f ? 'rgba(245,184,67,0.15)' : 'rgba(255,255,255,0.04)', color: filter===f ? '#F5B843' : '#9AA0B4', border: filter===f ? '1px solid rgba(245,184,67,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
            {f==='all'?'Все':f==='playing'?'🟢 Активные':f==='lobby'?'🟡 Лобби':'⬛ Завершённые'}
            <span className="ml-2 text-gray-500">{f==='all'?rooms.length:rooms.filter((r:any)=>r.status===f).length}</span>
          </button>
        ))}
      </div>
      <div className="rounded-[16px] border border-white/[0.06] bg-[#0B0B13] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Код','Статус','Игроки','Раунд','ЦБ','Сложность','Создана',''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r: any) => {
              const gs = r.game_state
              return (
                <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={() => openRoom(r)}>
                  <td className="px-4 py-3 font-mono font-bold text-yellow-400">{r.code}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-[6px]"
                      style={{ background: r.status==='playing'?'rgba(52,211,153,0.15)':r.status==='lobby'?'rgba(251,191,36,0.15)':'rgba(255,255,255,0.06)', color: r.status==='playing'?'#34D399':r.status==='lobby'?'#FBBF24':'#9AA0B4' }}>
                      {r.status==='playing'?'Активна':r.status==='lobby'?'Лобби':'Завершена'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px]">{gs?.players?.length ?? 0}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-400">{gs?.round ?? '—'}</td>
                  <td className="px-4 py-3 text-[13px]" style={{ color: (gs?.key_rate ?? 0.16) >= 0.19 ? '#F87171' : '#34D399' }}>{Math.round((gs?.key_rate ?? KEY_RATE_DEFAULT)*100)}%</td>
                  <td className="px-4 py-3 text-[12px] text-gray-400 capitalize">{gs?.settings?.difficulty ?? '—'}</td>
                  <td className="px-4 py-3 text-[12px] text-gray-500">{new Date(r.created_at).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</td>
                  <td className="px-4 py-3 text-yellow-400 text-[13px]">→</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── GAME DETAIL ─────────────────────────────────────────────────
function GameDetail({ room, onRefresh, notify, onBack }: any) {
  const gs = room.game_state
  const players: any[] = gs?.players ?? []
  const [newRate, setNewRate] = useState(Math.round((gs?.key_rate ?? KEY_RATE_DEFAULT) * 100))
  const [selectedPlayerId, setSelectedPlayerId] = useState<string|null>(null)
  const [cashAmount, setCashAmount] = useState(0)
  const [saving, setSaving] = useState(false)

  const save = async (newState: any) => {
    setSaving(true)
    await (supabase as any).from('rooms').update({ game_state: newState }).eq('id', room.id)
    await onRefresh()
    setSaving(false)
    notify('✓ Сохранено')
  }

  const setKeyRate = async () => {
    await save({ ...gs, key_rate: newRate / 100 })
  }

  const endGame = async () => {
    if (!confirm('Завершить игру?')) return
    await (supabase as any).from('rooms').update({ status: 'finished' }).eq('id', room.id)
    await onRefresh()
    notify('Игра завершена')
  }

  const deleteRoom = async () => {
    if (!confirm('Удалить комнату?')) return
    await (supabase as any).from('rooms').delete().eq('id', room.id)
    onBack()
    notify('Комната удалена')
  }

  const giveCash = async (pid: string, amount: number) => {
    const newPlayers = players.map((p: any) => p.id === pid ? { ...p, cash: p.cash + amount } : p)
    await save({ ...gs, players: newPlayers })
  }

  const eliminatePlayer = async (pid: string) => {
    const newPlayers = players.map((p: any) => p.id === pid ? { ...p, is_eliminated: true } : p)
    await save({ ...gs, players: newPlayers })
  }

  const restorePlayer = async (pid: string) => {
    const newPlayers = players.map((p: any) => p.id === pid ? { ...p, is_eliminated: false } : p)
    await save({ ...gs, players: newPlayers })
  }

  const kickPlayer = async (pid: string) => {
    if (!confirm('Кикнуть игрока?')) return
    const newPlayers = players.filter((p: any) => p.id !== pid)
    await save({ ...gs, players: newPlayers })
  }

  return (
    <div>
      {/* Back + header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-white text-[13px] transition-colors">← Назад</button>
        <div>
          <span className="font-mono text-[22px] font-extrabold text-yellow-400">{room.code}</span>
          <span className="ml-3 text-[12px] text-gray-500">id: {room.id.slice(0,8)}...</span>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={onRefresh} className="px-3 py-1.5 rounded-[8px] text-[12px] border border-white/[0.08] text-gray-400 hover:text-white transition-colors">↻</button>
          {room.status === 'playing' && (
            <button onClick={endGame} className="px-4 py-1.5 rounded-[8px] text-[12px] font-bold text-orange-400 border border-orange-400/30 hover:bg-orange-400/10 transition-colors">
              ⏹ Завершить
            </button>
          )}
          <button onClick={deleteRoom} className="px-4 py-1.5 rounded-[8px] text-[12px] font-bold text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors">
            🗑 Удалить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:'Статус', val: room.status==='playing'?'🟢 Активна':room.status==='lobby'?'🟡 Лобби':'⬛ Завершена' },
          { label:'Раунд', val: gs?.round ?? 1 },
          { label:'Сложность', val: gs?.settings?.difficulty ?? '—' },
          { label:'ЦБ ставка', val: `${Math.round((gs?.key_rate ?? KEY_RATE_DEFAULT)*100)}%` },
          { label:'Игроков', val: players.length },
          { label:'Время', val: room.game_state?.game_started_at ? `${Math.round((Date.now()-new Date(room.game_state.game_started_at).getTime())/60000)} мин` : '—' },
        ].map(s => (
          <div key={s.label} className="rounded-[14px] p-4 border border-white/[0.06] bg-[#0B0B13]">
            <div className="text-[11px] text-gray-500">{s.label}</div>
            <div className="text-[18px] font-bold mt-0.5">{s.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* ЦБ ставка */}
        <div className="rounded-[16px] border border-white/[0.06] bg-[#0B0B13] p-5">
          <div className="text-[13px] font-bold mb-3">🏦 Ключевая ставка ЦБ</div>
          <div className="flex gap-2">
            <input type="number" value={newRate} onChange={e=>setNewRate(Number(e.target.value))} min={5} max={30} step={1}
              className="flex-1 rounded-[10px] border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-[14px] font-bold text-center focus:outline-none focus:border-yellow-500/40" />
            <span className="flex items-center text-[14px] font-bold text-gray-400">%</span>
            <button onClick={setKeyRate} disabled={saving}
              className="px-4 py-2 rounded-[10px] text-[12px] font-bold text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/10 transition-colors disabled:opacity-50">
              Применить
            </button>
          </div>
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {[12,14,16,18,19,21].map(r => (
              <button key={r} onClick={() => { setNewRate(r) }}
                className="px-2.5 py-1 rounded-[7px] text-[11px] font-bold transition-all"
                style={{ background: newRate===r?'rgba(245,184,67,0.2)':'rgba(255,255,255,0.05)', color: newRate===r?'#F5B843':'#9AA0B4' }}>
                {r}%
              </button>
            ))}
          </div>
        </div>

        {/* Выдать/забрать деньги */}
        <div className="rounded-[16px] border border-white/[0.06] bg-[#0B0B13] p-5">
          <div className="text-[13px] font-bold mb-3">💰 Управление деньгами</div>
          <select value={selectedPlayerId ?? ''} onChange={e=>setSelectedPlayerId(e.target.value)}
            className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-[13px] mb-2 focus:outline-none">
            <option value="">Выбери игрока...</option>
            {players.map((p:any) => <option key={p.id} value={p.id}>{p.name} (₽{p.cash?.toLocaleString()})</option>)}
          </select>
          <div className="flex gap-2">
            <input type="number" value={cashAmount} onChange={e=>setCashAmount(Number(e.target.value))} placeholder="Сумма"
              className="flex-1 rounded-[10px] border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-[13px] focus:outline-none focus:border-yellow-500/40" />
            <button onClick={() => selectedPlayerId && giveCash(selectedPlayerId, cashAmount)} disabled={!selectedPlayerId||saving}
              className="px-3 py-2 rounded-[10px] text-[12px] font-bold text-green-400 border border-green-400/30 hover:bg-green-400/10 disabled:opacity-40 transition-colors">
              +Дать
            </button>
            <button onClick={() => selectedPlayerId && giveCash(selectedPlayerId, -cashAmount)} disabled={!selectedPlayerId||saving}
              className="px-3 py-2 rounded-[10px] text-[12px] font-bold text-red-400 border border-red-400/30 hover:bg-red-400/10 disabled:opacity-40 transition-colors">
              −Забрать
            </button>
          </div>
        </div>
      </div>

      {/* Players table */}
      <div className="rounded-[16px] border border-white/[0.06] bg-[#0B0B13] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <span className="text-[13px] font-bold">👥 Игроки ({players.length})</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {['Игрок','Профессия','Наличные','Пассив (чист.)','Расходы','Прогресс','Активы','Статус','Действия'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((p: any) => {
              const prog = freedomProgress(p)
              const netP = netPassiveIncome(p)
              const base = baseExpenses(p)
              const isElim = p.is_eliminated
              return (
                <tr key={p.id} className="border-b border-white/[0.03]" style={{ opacity: isElim ? 0.5 : 1 }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full text-[12px] font-bold text-[#0B0B13] flex items-center justify-center" style={{ background: p.color }}>
                        {p.avatar ?? p.initial}
                      </div>
                      <div>
                        <div className="text-[12px] font-bold">{p.name}</div>
                        <div className="text-[10px] text-gray-500">{p.is_bot?'🤖 Бот':'👤'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-gray-400">{p.profession?.icon} {p.profession?.name}</td>
                  <td className="px-4 py-3 text-[12px] font-bold" style={{ color: p.cash < 0 ? '#F87171' : '#F5B843' }}>₽{p.cash?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[12px] font-bold" style={{ color: netP > 0 ? '#34D399' : '#F87171' }}>₽{netP.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[12px] text-gray-400">₽{base.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-white/[0.08] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${prog}%`, background:'linear-gradient(90deg,#E0891F,#F5B843)' }}/>
                      </div>
                      <span className="text-[11px] font-bold text-yellow-400">{prog}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-gray-400">{p.assets?.length ?? 0} шт</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-[5px]"
                      style={{ background: isElim?'rgba(248,113,113,0.15)':p.is_free?'rgba(52,211,153,0.15)':'rgba(255,255,255,0.06)', color: isElim?'#F87171':p.is_free?'#34D399':'#9AA0B4' }}>
                      {isElim?'☠️ Выбыл':p.is_free?'🚀 Свобода':'🎮 Играет'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {!p.is_bot && (
                        isElim
                          ? <button onClick={()=>restorePlayer(p.id)} className="text-[10px] px-2 py-1 rounded-[6px] text-green-400 border border-green-400/30 hover:bg-green-400/10 transition-colors">↩ Вернуть</button>
                          : <button onClick={()=>eliminatePlayer(p.id)} className="text-[10px] px-2 py-1 rounded-[6px] text-orange-400 border border-orange-400/30 hover:bg-orange-400/10 transition-colors">⛔ Выбить</button>
                      )}
                      <button onClick={()=>kickPlayer(p.id)} className="text-[10px] px-2 py-1 rounded-[6px] text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors">✕ Кик</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── ANALYTICS ───────────────────────────────────────────────────
function Analytics({ rooms }: any) {
  const allGames = rooms.filter((r: any) => r.game_state?.players)
  const allPlayers = allGames.flatMap((r: any) => r.game_state?.players ?? [])
  const finished = rooms.filter((r: any) => r.status === 'finished')

  // Топ профессий
  const profCount: Record<string, number> = {}
  allPlayers.forEach((p: any) => { if (p.profession?.name) profCount[p.profession.name] = (profCount[p.profession.name] ?? 0) + 1 })
  const topProfs = Object.entries(profCount).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxProf = Math.max(...topProfs.map(x => x[1]), 1)

  // Сложность
  const diffCount: Record<string, number> = { easy: 0, normal: 0, hard: 0 }
  rooms.forEach((r: any) => { const d = r.game_state?.settings?.difficulty ?? 'normal'; diffCount[d] = (diffCount[d] ?? 0) + 1 })

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Summary */}
      <div className="col-span-2 grid grid-cols-4 gap-4">
        {[
          { label: 'Всего игр', val: rooms.length },
          { label: 'Уникальных игроков', val: new Set(allPlayers.map((p:any)=>p.name)).size },
          { label: 'Завершено', val: finished.length },
          { label: 'Средний игроков/игра', val: allGames.length ? (allPlayers.length / allGames.length).toFixed(1) : '—' },
        ].map(s => (
          <div key={s.label} className="rounded-[14px] p-4 border border-white/[0.06] bg-[#0B0B13]">
            <div className="text-[11px] text-gray-500">{s.label}</div>
            <div className="text-[24px] font-extrabold text-yellow-400 mt-1">{s.val}</div>
          </div>
        ))}
      </div>

      {/* Профессии */}
      <div className="rounded-[16px] border border-white/[0.06] bg-[#0B0B13] p-5">
        <div className="text-[13px] font-bold mb-4">Популярные профессии</div>
        <div className="flex flex-col gap-2.5">
          {topProfs.map(([name, count]) => (
            <div key={name}>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="text-gray-400">{PROFESSIONS.find(p=>p.name===name)?.icon} {name}</span>
                <span className="font-bold">{count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                <div className="h-full rounded-full bg-yellow-400" style={{ width:`${count/maxProf*100}%` }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Сложность */}
      <div className="rounded-[16px] border border-white/[0.06] bg-[#0B0B13] p-5">
        <div className="text-[13px] font-bold mb-4">Сложность игр</div>
        <div className="flex flex-col gap-4">
          {[['easy','Лёгкая','#34D399'],['normal','Стандарт','#F5B843'],['hard','Хардкор','#F87171']].map(([key,label,color]) => (
            <div key={key}>
              <div className="flex justify-between text-[12px] mb-1.5">
                <span style={{ color }}>{label}</span>
                <span className="font-bold">{diffCount[key] ?? 0} игр</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.07] overflow-hidden">
                <div className="h-full rounded-full" style={{ width:`${rooms.length?(diffCount[key]??0)/rooms.length*100:0}%`, background: color }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── CONTENT MANAGER ─────────────────────────────────────────────
function ContentManager() {
  const [tab, setTab] = useState<'hits'|'events'|'small_deals'|'large_deals'|'auctions'|'sell_offers'|'professions'|'dreams'|'stocks'|'crypto'>('hits')
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadGameConfig().then(setConfig) }, [])

  const save = async (patch: Partial<GameConfig>) => {
    setSaving(true)
    await saveGameConfig(patch)
    setConfig(c => c ? { ...c, ...patch } : c)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!config) return <div className="text-gray-500 text-center py-10">Загрузка...</div>

  const tabs = [
    ['hits','💥 Удары', config.hits.length],
    ['events','📰 События', config.events.length],
    ['small_deals','💼 Малые сделки', config.small_deals.length],
    ['large_deals','🏢 Крупные сделки', config.large_deals.length],
    ['auctions','🏆 Аукционы', config.auctions.length],
    ['sell_offers','🤝 Предложения продажи', config.sell_offers.length],
    ['professions','👤 Профессии', config.professions.length],
    ['dreams','🌟 Мечты', config.dreams.length],
    ['stocks','📈 Акции', config.stocks.length],
    ['crypto','₿ Крипта', config.crypto.length],
  ] as const

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {tabs.map(([id, label, count]) => (
            <button key={id} onClick={() => setTab(id as any)}
              className="px-3 py-1.5 rounded-[9px] text-[12px] font-bold transition-all"
              style={{ background: tab===id?'rgba(245,184,67,0.15)':'rgba(255,255,255,0.04)', color: tab===id?'#F5B843':'#9AA0B4', border: tab===id?'1px solid rgba(245,184,67,0.3)':'1px solid rgba(255,255,255,0.06)' }}>
              {label} <span className="opacity-50">{count}</span>
            </button>
          ))}
        </div>
        {saved && <span className="text-green-400 text-[12px] font-bold">✓ Сохранено</span>}
      </div>

      {/* HITS */}
      {tab === 'hits' && (
        <ListEditor
          title="Удары"
          items={config.hits}
          renderRow={(item: any, i: number, onChange: any, onDelete: any) => (
            <div className="grid grid-cols-[1fr_120px_100px_80px_32px] gap-2 items-center">
              <input value={item.desc} onChange={(e: any) => onChange({ ...item, desc: e.target.value })}
                className="input-admin" placeholder="Описание удара" />
              <input type="number" value={item.amount} onChange={(e: any) => onChange({ ...item, amount: Number(e.target.value) })}
                className="input-admin text-center" placeholder="Сумма ₽" />
              <select value={item.skip_turns ?? 0} onChange={(e: any) => onChange({ ...item, skip_turns: Number(e.target.value) || undefined })}
                className="input-admin text-center">
                <option value={0}>Без пропуска</option>
                <option value={1}>1 ход</option>
                <option value={2}>2 хода</option>
                <option value={3}>3 хода</option>
              </select>
              <select value={item.lose_salary ? '1' : '0'} onChange={(e: any) => onChange({ ...item, lose_salary: e.target.value === '1' })}
                className="input-admin text-center">
                <option value="0">Нет</option>
                <option value="1">−Зарплата</option>
              </select>
              <button onClick={() => onDelete(i)} className="text-red-400 hover:text-red-300 text-[16px]">×</button>
            </div>
          )}
          newItem={{ desc: 'Новый удар', amount: 30000 }}
          onSave={(items: any) => save({ hits: items })}
          saving={saving}
          headers={['Описание', 'Сумма', 'Пропуск хода', 'Доп. эффект', '']}
        />
      )}

      {/* EVENTS */}
      {tab === 'events' && (
        <ListEditor
          title="Игровые события"
          items={config.events}
          renderRow={(item: any, i: number, onChange: any, onDelete: any) => (
            <div className="grid grid-cols-[1fr_180px_32px] gap-2 items-center">
              <input value={item.desc} onChange={(e: any) => onChange({ ...item, desc: e.target.value })}
                className="input-admin" placeholder="Описание события" />
              <select value={item.effect} onChange={(e: any) => onChange({ ...item, effect: e.target.value })}
                className="input-admin">
                {['rate:0.12','rate:0.14','rate:0.16','rate:0.18','rate:0.19','rate:0.21','cash+salary','expenses+5%'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <button onClick={() => onDelete(i)} className="text-red-400 hover:text-red-300 text-[16px]">×</button>
            </div>
          )}
          newItem={{ desc: 'Новое событие', effect: 'cash+salary' }}
          onSave={(items: any) => save({ events: items })}
          saving={saving}
          headers={['Описание', 'Эффект', '']}
        />
      )}

      {/* SMALL DEALS */}
      {tab === 'small_deals' && (
        <DealEditor
          title="Малые сделки"
          items={config.small_deals}
          onSave={(items: any) => save({ small_deals: items })}
          saving={saving}
        />
      )}

      {/* LARGE DEALS */}
      {tab === 'large_deals' && (
        <DealEditor
          title="Крупные сделки"
          items={config.large_deals}
          onSave={(items: any) => save({ large_deals: items })}
          saving={saving}
        />
      )}

      {/* AUCTIONS */}
      {tab === 'auctions' && (
        <ListEditor
          title="Аукционные лоты"
          items={config.auctions}
          renderRow={(item: any, i: number, onChange: any, onDelete: any) => (
            <div className="grid grid-cols-[1fr_110px_110px_110px_110px_110px_32px] gap-2 items-center">
              <input value={item.name} onChange={(e: any) => onChange({ ...item, name: e.target.value })} className="input-admin" placeholder="Название" />
              <input type="number" value={item.price} onChange={(e: any) => onChange({ ...item, price: Number(e.target.value) })} className="input-admin text-center" placeholder="Цена" />
              <input type="number" value={item.down_payment} onChange={(e: any) => onChange({ ...item, down_payment: Number(e.target.value) })} className="input-admin text-center" placeholder="Взнос" />
              <input type="number" value={item.debt} onChange={(e: any) => onChange({ ...item, debt: Number(e.target.value) })} className="input-admin text-center" placeholder="Долг" />
              <input type="number" value={item.passive_income} onChange={(e: any) => onChange({ ...item, passive_income: Number(e.target.value) })} className="input-admin text-center" placeholder="Доход/мес" />
              <select value={item.type} onChange={(e: any) => onChange({ ...item, type: e.target.value })} className="input-admin">
                {['real_estate','business','gold'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={() => onDelete(i)} className="text-red-400 hover:text-red-300 text-[16px]">×</button>
            </div>
          )}
          newItem={{ id: `auction_new_${Date.now()}`, name: 'Новый лот', type: 'real_estate', price: 1000000, down_payment: 200000, passive_income: 50000, debt: 800000 }}
          onSave={(items: any) => save({ auctions: items })}
          saving={saving}
          headers={['Название', 'Цена', 'Взнос', 'Долг', 'Доход/мес', 'Тип', '']}
        />
      )}

      {/* SELL OFFERS */}
      {tab === 'sell_offers' && (
        <ListEditor
          title="Предложения о выкупе (появляются на событии если есть актив)"
          items={config.sell_offers}
          renderRow={(item: any, i: number, onChange: any, onDelete: any) => (
            <div className="grid grid-cols-[120px_1fr_1fr_90px_90px_32px] gap-2 items-start">
              <select value={item.type} onChange={(e: any) => onChange({ ...item, type: e.target.value })} className="input-admin">
                <option value="real_estate">🏠 Недвижимость</option>
                <option value="business">🏢 Бизнес</option>
              </select>
              <input value={item.title} onChange={(e: any) => onChange({ ...item, title: e.target.value })} className="input-admin" placeholder="Заголовок" />
              <input value={item.desc} onChange={(e: any) => onChange({ ...item, desc: e.target.value })} className="input-admin" placeholder="Описание" />
              <input type="number" step="0.05" value={item.multiplierMin} onChange={(e: any) => onChange({ ...item, multiplierMin: Number(e.target.value) })} className="input-admin text-center" placeholder="Мин ×" />
              <input type="number" step="0.05" value={item.multiplierMax} onChange={(e: any) => onChange({ ...item, multiplierMax: Number(e.target.value) })} className="input-admin text-center" placeholder="Макс ×" />
              <button onClick={() => onDelete(i)} className="text-red-400 hover:text-red-300 text-[16px]">×</button>
            </div>
          )}
          newItem={{ type: 'real_estate', title: 'Новое предложение', desc: 'Описание предложения', multiplierMin: 1.2, multiplierMax: 1.5 }}
          onSave={(items: any) => save({ sell_offers: items })}
          saving={saving}
          headers={['Тип актива', 'Заголовок', 'Описание', 'Мин ×', 'Макс ×', '']}
        />
      )}

      {/* PROFESSIONS */}
      {tab === 'professions' && (
        <ListEditor
          title="Профессии"
          items={config.professions}
          renderRow={(item: any, i: number, onChange: any, onDelete: any) => (
            <div className="flex flex-col gap-1.5 pb-3 border-b border-white/[0.05]">
              <div className="grid grid-cols-[40px_1fr_110px_110px_110px_32px] gap-2 items-center">
                <input value={item.icon} onChange={(e: any) => onChange({ ...item, icon: e.target.value })} className="input-admin text-center text-[18px]" />
                <input value={item.name} onChange={(e: any) => onChange({ ...item, name: e.target.value })} className="input-admin" placeholder="Название" />
                <input type="number" value={item.salary} onChange={(e: any) => onChange({ ...item, salary: Number(e.target.value) })} className="input-admin text-center" placeholder="Зарплата" />
                <input type="number" value={item.expenses} onChange={(e: any) => onChange({ ...item, expenses: Number(e.target.value) })} className="input-admin text-center" placeholder="Расходы" />
                <input type="number" value={item.initial_debt} onChange={(e: any) => onChange({ ...item, initial_debt: Number(e.target.value) })} className="input-admin text-center" placeholder="Долг" />
                <button onClick={() => onDelete(i)} className="text-red-400 hover:text-red-300 text-[16px]">×</button>
              </div>
              <div className="text-[10px] text-gray-500 pl-1">ЧП: ₽{(item.salary - item.expenses).toLocaleString()}/мес · Соотношение: {item.expenses > 0 ? Math.round(item.expenses/item.salary*100) : 0}% расходов от зарплаты</div>
            </div>
          )}
          newItem={{ id: `prof_${Date.now()}`, name: 'Новая профессия', icon: '💼', salary: 150000, expenses: 100000, initial_debt: 50000 }}
          onSave={(items: any) => save({ professions: items })}
          saving={saving}
          headers={['', 'Название', 'Зарплата', 'Расходы', 'Стартовый долг', '']}
        />
      )}

      {/* DREAMS */}
      {tab === 'dreams' && (
        <ListEditor
          title="Мечты"
          items={config.dreams}
          renderRow={(item: any, i: number, onChange: any, onDelete: any) => (
            <div className="grid grid-cols-[40px_1fr_140px_140px_32px] gap-2 items-center">
              <input value={item.icon} onChange={(e: any) => onChange({ ...item, icon: e.target.value })} className="input-admin text-center text-[18px]" />
              <input value={item.name} onChange={(e: any) => onChange({ ...item, name: e.target.value })} className="input-admin" placeholder="Название мечты" />
              <input type="number" value={item.price} onChange={(e: any) => onChange({ ...item, price: Number(e.target.value) })} className="input-admin text-center" placeholder="Цена" />
              <input type="number" value={item.passive_required} onChange={(e: any) => onChange({ ...item, passive_required: Number(e.target.value) })} className="input-admin text-center" placeholder="Нужен пассив" />
              <button onClick={() => onDelete(i)} className="text-red-400 hover:text-red-300 text-[16px]">×</button>
            </div>
          )}
          newItem={{ id: `dream_${Date.now()}`, name: 'Новая мечта', icon: '🌟', price: 50000000, passive_required: 200000 }}
          onSave={(items: any) => save({ dreams: items })}
          saving={saving}
          headers={['', 'Название', 'Цена ₽', 'Нужен пассив ₽/мес', '']}
        />
      )}

      {/* STOCKS */}
      {tab === 'stocks' && (
        <ListEditor
          title="Акции (дивиденд = % от текущей цены в мес.)"
          items={config.stocks}
          renderRow={(item: any, i: number, onChange: any, onDelete: any) => (
            <div className="grid grid-cols-[36px_80px_1fr_85px_85px_85px_75px_75px_60px_32px] gap-2 items-center">
              <input value={item.icon} onChange={(e: any) => onChange({ ...item, icon: e.target.value })} className="input-admin text-center" />
              <input value={item.ticker} onChange={(e: any) => onChange({ ...item, ticker: e.target.value })} className="input-admin text-center font-mono font-bold" />
              <input value={item.name} onChange={(e: any) => onChange({ ...item, name: e.target.value })} className="input-admin" />
              <input type="number" value={item.price} onChange={(e: any) => onChange({ ...item, price: Number(e.target.value) })} className="input-admin text-center" placeholder="Цена" />
              <input type="number" value={item.min} onChange={(e: any) => onChange({ ...item, min: Number(e.target.value) })} className="input-admin text-center" placeholder="Мин" />
              <input type="number" value={item.max} onChange={(e: any) => onChange({ ...item, max: Number(e.target.value) })} className="input-admin text-center" placeholder="Макс" />
              <input type="number" step="0.01" value={item.volatility} onChange={(e: any) => onChange({ ...item, volatility: Number(e.target.value) })} className="input-admin text-center" placeholder="Волат" />
              <input type="number" step="0.01" value={item.dividend ?? 0} onChange={(e: any) => onChange({ ...item, dividend: Number(e.target.value) })} className="input-admin text-center" placeholder="Дивид" />
              <input type="number" value={item.lot ?? 1} onChange={(e: any) => onChange({ ...item, lot: Number(e.target.value) })} className="input-admin text-center" placeholder="Лот" />
              <button onClick={() => onDelete(i)} className="text-red-400 text-[16px]">×</button>
            </div>
          )}
          newItem={{ id:`s_${Date.now()}`, name:'Новая акция', ticker:'NEW', icon:'📊', price:1000, min:500, max:5000, volatility:0.10, dividend:0, lot:1 }}
          onSave={(items: any) => save({ stocks: items })}
          saving={saving}
          headers={['','Тикер','Название','Цена','Мин','Макс','Волат.','Дивид.','Лот','']}
        />
      )}

      {/* CRYPTO */}
      {tab === 'crypto' && (
        <ListEditor
          title="Криптовалюты"
          items={config.crypto}
          renderRow={(item: any, i: number, onChange: any, onDelete: any) => (
            <div className="flex flex-col gap-1 pb-2 border-b border-white/[0.05]">
              <div className="grid grid-cols-[36px_80px_1fr_90px_90px_90px_80px_32px] gap-2 items-center">
                <input value={item.icon} onChange={(e: any) => onChange({ ...item, icon: e.target.value })} className="input-admin text-center" />
                <input value={item.ticker} onChange={(e: any) => onChange({ ...item, ticker: e.target.value })} className="input-admin text-center font-mono font-bold" />
                <input value={item.name} onChange={(e: any) => onChange({ ...item, name: e.target.value })} className="input-admin" />
                <input type="number" value={item.price} onChange={(e: any) => onChange({ ...item, price: Number(e.target.value) })} className="input-admin text-center" />
                <input type="number" value={item.min} onChange={(e: any) => onChange({ ...item, min: Number(e.target.value) })} className="input-admin text-center" />
                <input type="number" value={item.max} onChange={(e: any) => onChange({ ...item, max: Number(e.target.value) })} className="input-admin text-center" />
                <input type="number" step="0.01" value={item.volatility} onChange={(e: any) => onChange({ ...item, volatility: Number(e.target.value) })} className="input-admin text-center" />
                <button onClick={() => onDelete(i)} className="text-red-400 text-[16px]">×</button>
              </div>
              <input value={item.description ?? ''} onChange={(e: any) => onChange({ ...item, description: e.target.value })} className="input-admin" placeholder="Описание" />
            </div>
          )}
          newItem={{ id:`c_${Date.now()}`, name:'Новая крипта', ticker:'NEW', icon:'🪙', price:100, min:10, max:10000, volatility:0.40, description:'' }}
          onSave={(items: any) => save({ crypto: items })}
          saving={saving}
          headers={['','Тикер','Название','Цена','Мин','Макс','Волат.','']}
        />
      )}

      <style>{`.input-admin { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 6px 10px; font-size: 12px; color: white; width: 100%; outline: none; } .input-admin:focus { border-color: rgba(245,184,67,0.4); }`}</style>
    </div>
  )
}

// ── LIST EDITOR ─────────────────────────────────────────────────
function ListEditor({ title, items, renderRow, newItem, onSave, saving, headers }: any) {
  const [list, setList] = useState<any[]>(items)

  const update = (i: number, val: any) => setList(l => l.map((x, j) => j === i ? val : x))
  const remove = (i: number) => setList(l => l.filter((_, j) => j !== i))
  const add = () => setList(l => [...l, { ...newItem }])

  return (
    <div className="rounded-[16px] border border-white/[0.06] bg-[#0B0B13] overflow-hidden">
      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-[13px] font-bold">{title} ({list.length})</span>
        <div className="flex gap-2">
          <button onClick={add} className="px-3 py-1.5 rounded-[8px] text-[12px] font-bold text-green-400 border border-green-400/30 hover:bg-green-400/10 transition-colors">+ Добавить</button>
          <button onClick={() => onSave(list)} disabled={saving}
            className="px-4 py-1.5 rounded-[8px] text-[12px] font-bold text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/10 disabled:opacity-50 transition-colors">
            {saving ? 'Сохраняем...' : '💾 Сохранить'}
          </button>
        </div>
      </div>
      {headers && (
        <div className="px-5 py-2 border-b border-white/[0.04] grid text-[10px] text-gray-500 font-medium gap-2"
          style={{ gridTemplateColumns: `repeat(${headers.length}, 1fr)` }}>
          {headers.map((h: string) => <span key={h}>{h}</span>)}
        </div>
      )}
      <div className="p-4 flex flex-col gap-2 max-h-[500px] overflow-y-auto">
        {list.map((item, i) => (
          <div key={i} className="px-1">
            {renderRow(item, i, (val: any) => update(i, val), remove)}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── DEAL EDITOR ─────────────────────────────────────────────────
function DealEditor({ title, items, onSave, saving }: any) {
  return (
    <ListEditor
      title={title}
      items={items}
      renderRow={(item: any, i: number, onChange: any, onDelete: any) => (
        <div className="grid grid-cols-[1fr_100px_100px_100px_100px_100px_100px_32px] gap-2 items-center">
          <input value={item.name} onChange={(e: any) => onChange({ ...item, name: e.target.value })} className="input-admin" placeholder="Название" />
          <input type="number" value={item.price} onChange={(e: any) => onChange({ ...item, price: Number(e.target.value) })} className="input-admin text-center" placeholder="Цена" />
          <input type="number" value={item.down_payment} onChange={(e: any) => onChange({ ...item, down_payment: Number(e.target.value) })} className="input-admin text-center" placeholder="Взнос" />
          <input type="number" value={item.passive_income} onChange={(e: any) => onChange({ ...item, passive_income: Number(e.target.value) })} className="input-admin text-center" placeholder="Доход/мес" />
          <input type="number" value={item.debt} onChange={(e: any) => onChange({ ...item, debt: Number(e.target.value) })} className="input-admin text-center" placeholder="Долг" />
          <select value={item.type} onChange={(e: any) => onChange({ ...item, type: e.target.value })} className="input-admin">
            {['real_estate','business','stocks','crypto','gold'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={item.id} onChange={(e: any) => onChange({ ...item, id: e.target.value })} className="input-admin" placeholder="ID" />
          <button onClick={() => onDelete(i)} className="text-red-400 hover:text-red-300 text-[16px]">×</button>
        </div>
      )}
      newItem={{ id: `deal_${Date.now()}`, name: 'Новая сделка', type: 'real_estate', price: 500000, down_payment: 100000, passive_income: 20000, debt: 400000 }}
      onSave={onSave}
      saving={saving}
      headers={['Название', 'Цена', 'Взнос', 'Доход/мес', 'Долг', 'Тип', 'ID', '']}
    />
  )
}

// ── RULES MANAGER ───────────────────────────────────────────────
function RulesManager({ notify }: any) {
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const def = getDefaultConfig().defaults

  useEffect(() => { loadGameConfig().then(setConfig) }, [])

  const saveDefaults = async (d: GameConfig['defaults']) => {
    setSaving(true)
    await saveGameConfig({ defaults: d })
    setConfig(c => c ? { ...c, defaults: d } : c)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    notify('✓ Правила сохранены')
  }

  if (!config) return <div className="text-gray-500 text-center py-10">Загрузка...</div>

  const d = config.defaults
  const Field = ({ label, field, type = 'number', suffix = '' }: { label: string; field: keyof GameConfig['defaults']; type?: string; suffix?: string }) => (
    <div className="py-3 border-b border-white/[0.04]">
      <div className="text-[11px] text-gray-500 mb-1.5">{label}</div>
      <div className="flex items-center gap-2">
        <input
          type={type}
          step={type === 'number' ? 'any' : undefined}
          value={d[field] as any}
          onChange={e => setConfig(c => c ? { ...c, defaults: { ...c.defaults, [field]: type === 'number' ? Number(e.target.value) : e.target.value } } : c)}
          className="input-admin w-32"
        />
        {suffix && <span className="text-[12px] text-gray-500">{suffix}</span>}
        {field === 'key_rate' && <span className="text-[11px] text-gray-600">= {Math.round((d[field] as number) * 100)}%</span>}
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Редактируемые правила */}
      <div className="rounded-[16px] border border-white/[0.06] bg-[#0B0B13] p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-bold">⚙️ Настройки по умолчанию</span>
          <div className="flex items-center gap-2">
            {saved && <span className="text-green-400 text-[11px]">✓ Сохранено</span>}
            <button onClick={() => saveDefaults(d)} disabled={saving}
              className="px-4 py-1.5 rounded-[8px] text-[12px] font-bold text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/10 disabled:opacity-50 transition-colors">
              {saving ? 'Сохраняем...' : '💾 Сохранить'}
            </button>
          </div>
        </div>
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1 mt-1">Экономика</div>
        <Field label="ЦБ ставка по умолчанию" field="key_rate" suffix="(0.16 = 16%)" />
        <Field label="Скидка при срочной продаже" field="sale_discount" suffix="(0.5 = 50%)" />
        <Field label="Множитель враждебного выкупа" field="hostile_multiplier" suffix="× цены" />
        <Field label="Порог финансового кризиса (₽)" field="emergency_threshold" />
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1 mt-3">Лобби — настройки по умолчанию</div>
        <BoolField label="Волатильная ставка ЦБ" field="volatile_rate" config={config} setConfig={setConfig} />
        <BoolField label="Инфляция" field="inflation" config={config} setConfig={setConfig} />
        <BoolField label="Уникальные активы" field="unique_assets" config={config} setConfig={setConfig} />
        <BoolField label="Дивиденды от акций" field="dividend_enabled" config={config} setConfig={setConfig} />
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1 mt-3">Время</div>
        <Field label="Время одного хода (сек)" field="turn_time" suffix="сек" />
        <Field label="Время игры по умолчанию (мин)" field="game_duration" suffix="мин" />
        <Field label="Лимит событий в журнале" field="events_per_game" suffix="штук" />
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1 mt-3">Благотворительность</div>
        <Field label="Стоимость взноса" field="charity_cost_pct" suffix="от зарплаты (0.10 = 10%)" />
        <Field label="Кругов бонуса (2 кубика)" field="charity_rounds" suffix="круга" />
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1 mt-3">Волатильность тикеров</div>
        <Field label="Стабильные — мин. множитель" field="volatility_stable_min" />
        <Field label="Стабильные — макс. множитель" field="volatility_stable_max" />
        <Field label="Обычные — мин. множитель" field="volatility_normal_min" />
        <Field label="Обычные — макс. множитель" field="volatility_normal_max" />
        <Field label="Ракеты — мин. множитель" field="volatility_rocket_min" />
        <Field label="Ракеты — макс. множитель" field="volatility_rocket_max" />
        <div className="mt-3">
          <button onClick={() => { setConfig(c => c ? { ...c, defaults: getDefaultConfig().defaults } : c) }}
            className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors">
            ↺ Сбросить к значениям по умолчанию
          </button>
        </div>
      </div>

      {/* Дивиденды по акциям */}
      <div className="rounded-[16px] border border-white/[0.06] bg-[#0B0B13] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[13px] font-bold">💰 Дивиденды по акциям</div>
            <div className="text-[10px] text-gray-500 mt-0.5">% от текущей цены акции в месяц · начисляется при прохождении зарплаты</div>
          </div>
          <div className="flex items-center gap-2">
            <BoolField label="Включены" field="dividend_enabled" config={config} setConfig={setConfig} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {config.stocks.map((s: any, i: number) => (
            <div key={s.ticker} className="flex items-center gap-3 py-2 border-b border-white/[0.04]">
              <span className="text-[18px] w-7">{s.icon}</span>
              <div className="w-14 font-mono font-bold text-[12px] text-yellow-400">{s.ticker}</div>
              <span className="flex-1 text-[12px] text-gray-400">{s.name}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number" step="0.01" min="0" max="1"
                  value={s.dividend ?? 0}
                  onChange={e => {
                    const newStocks = config.stocks.map((st: any, j: number) =>
                      j === i ? { ...st, dividend: Number(e.target.value) } : st
                    )
                    setConfig((c: any) => c ? { ...c, stocks: newStocks } : c)
                  }}
                  className="input-admin w-20 text-center"
                />
                <span className="text-[11px] text-gray-500 w-20">
                  = {Math.round((s.dividend ?? 0) * 100)}% / мес
                </span>
                <span className="text-[11px] text-gray-600 w-32">
                  ≈ ₽{Math.round(s.price * (s.dividend ?? 0)).toLocaleString()} за акцию
                </span>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={async () => {
            setSaving(true)
            await saveGameConfig({ stocks: config.stocks })
            setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
            notify('✓ Дивиденды сохранены')
          }}
          disabled={saving}
          className="mt-4 px-4 py-2 rounded-[8px] text-[12px] font-bold text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/10 disabled:opacity-50 transition-colors">
          {saving ? 'Сохраняем...' : '💾 Сохранить дивиденды'}
        </button>
      </div>

      {/* Механики (только просмотр) */}
      <div className="rounded-[16px] border border-white/[0.06] bg-[#0B0B13] p-5">
        <div className="text-[13px] font-bold mb-4">📐 Формулы и механики</div>
        <div className="flex flex-col gap-0 text-[12px]">
          {[
            ['Прогресс к свободе', 'Чистый пассив ÷ Базовые расходы × 100%'],
            ['Чистый пассив', 'Пассив − Платежи по долгам активов'],
            ['Базовые расходы', 'Всего расходов − Платежи по долгам активов'],
            ['Платёж по кредиту', `Сумма × ЦБ% (${Math.round(d.key_rate*100)}%)/мес`],
            ['Мак. кредит', 'Ден. поток ÷ ЦБ%, кратно ₽50К'],
            ['Срочная продажа', '50% от первоначального взноса'],
            ['Враждебный выкуп', `${d.hostile_multiplier}× рыночная цена`],
            ['Благотворительность', `${Math.round(d.charity_cost_pct*100)}% зарплаты → 2 куб × ${d.charity_rounds} кр.`],
            ['Банкротство', 'Наличные < 0 И поток < 0, нет активов/лимита'],
            ['Срочная продажа (аукцион)', '50% от вложений → предложить другим'],
          ].map(([k,v]) => (
            <div key={k} className="py-2.5 border-b border-white/[0.04]">
              <div className="text-gray-500 text-[10px] mb-0.5">{k}</div>
              <div className="text-white">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Сложности — редактируемые */}
      <div className="col-span-2 rounded-[16px] border border-white/[0.06] bg-[#0B0B13] p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-bold">📊 Коэффициенты сложности</span>
          <button onClick={async () => {
            setSaving(true)
            await saveGameConfig({ difficulty: config.difficulty })
            setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2000)
            notify('✓ Коэффициенты сохранены')
          }} disabled={saving} className="px-4 py-1.5 rounded-[8px] text-[12px] font-bold text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/10 disabled:opacity-50 transition-colors">
            {saving ? 'Сохраняем...' : '💾 Сохранить'}
          </button>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Параметр','🟢 Лёгкая','🟡 Стандарт','🔴 Хардкор'].map(h=>(
                <th key={h} className="text-left py-2 px-4 text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(['starting_cash_multiplier','hit_multiplier','salary_bonus'] as const).map(field => (
              <tr key={field} className="border-b border-white/[0.04]">
                <td className="py-2.5 px-4 text-gray-400">{field==='starting_cash_multiplier'?'Стартовые наличные (× зарплату)':field==='hit_multiplier'?'Множитель ударов':'Бонус зарплатного события'}</td>
                {(['easy','normal','hard'] as const).map((diff,di) => (
                  <td key={diff} className="py-2 px-4">
                    <input type="number" step="0.1" value={config.difficulty[diff][field]}
                      onChange={e => setConfig(c => c ? { ...c, difficulty: { ...c.difficulty, [diff]: { ...c.difficulty[diff], [field]: Number(e.target.value) } } } : c)}
                      className="input-admin w-24 text-center"
                      style={{ color: di===0?'#34D399':di===1?'#F5B843':'#F87171' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`.input-admin { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 6px 10px; font-size: 12px; color: white; width: 100%; outline: none; } .input-admin:focus { border-color: rgba(245,184,67,0.4); }`}</style>
    </div>
  )
}

// ── BOOL TOGGLE FIELD ────────────────────────────────────────────
function BoolField({ label, field, config, setConfig }: { label: string; field: keyof GameConfig['defaults']; config: GameConfig; setConfig: any }) {
  const val = config.defaults[field] as boolean
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
      <span className="text-[12px] text-gray-300">{label}</span>
      <button onClick={() => setConfig((c: any) => c ? { ...c, defaults: { ...c.defaults, [field]: !val } } : c)}
        className="relative h-5 w-10 rounded-full transition-colors duration-200 shrink-0"
        style={{ background: val ? '#34D399' : 'rgba(255,255,255,0.1)' }}>
        <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: val ? 'calc(100% - 18px)' : '2px' }} />
      </button>
    </div>
  )
}
