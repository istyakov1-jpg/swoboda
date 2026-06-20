'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateRoomCode, createPlayer } from '@/lib/gameEngine'
import { DREAMS, BOT_NAMES, PLAYER_COLORS, BOT_AVATARS, DEFAULT_SETTINGS, DIFFICULTY_CONFIG, KEY_RATE_DEFAULT, generateVolatilityProfile, type GameSettings, type GameDifficulty } from '@/lib/gameData'
import type { Player, Dream } from '@/types/database'
import { IconShare, IconBot, IconCheck, IconArrowRight } from '@/components/icons'

const BOT_STRATEGIES = [
  { id: 'conservative', name: 'Консерватор', desc: 'Только надёжные активы', color: '#5B9DF9' },
  { id: 'adventurer',   name: 'Авантюрист',  desc: 'Берёт всё подряд',       color: '#FB6B6B' },
  { id: 'analyst',      name: 'Аналитик',    desc: 'Считает ROI каждой сделки', color: '#34D399' },
  { id: 'predator',     name: 'Хищник',      desc: 'Мешает лидеру',          color: '#A78BFA' },
]

const PLAYER_AVATARS = ['😎','🤠','👨‍💻','🦸','🥷','🎯']

type BotEntry = { id: string; name: string; strategy: string; color: string }

export default function LobbyPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null)
  const [bots, setBots] = useState<BotEntry[]>([])
  const [showBotPicker, setShowBotPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [avatar, setAvatar] = useState('😎')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)

  function toggleSetting<K extends keyof GameSettings>(key: K, value: GameSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  function addBot(strategyId: string) {
    if (bots.length >= 5) return
    const strategy = BOT_STRATEGIES.find(s => s.id === strategyId)!
    const usedNames = bots.map(b => b.name)
    const availableNames = BOT_NAMES.filter(n => !usedNames.includes(n))
    const botName = availableNames[0] ?? `Бот ${bots.length + 1}`
    setBots(prev => [...prev, {
      id: crypto.randomUUID(),
      name: botName,
      strategy: strategyId,
      color: PLAYER_COLORS[(bots.length + 1) % PLAYER_COLORS.length],
    }])
    setShowBotPicker(false)
  }

  function removeBot(id: string) {
    setBots(prev => prev.filter(b => b.id !== id))
  }

  async function createRoom() {
    if (!name.trim()) { setError('Введи имя'); return }
    setLoading(true)
    try {
      const code = generateRoomCode()
      const playerId = crypto.randomUUID()
      const hostPlayer = createPlayer({ id: playerId, room_id: '', name: name.trim(), is_bot: false, is_host: true, color_index: 0, difficulty: settings.difficulty })
      hostPlayer.avatar = avatar
      if (selectedDream) hostPlayer.dream = selectedDream

      const botPlayers = bots.map((bot, i) => {
        const bp = createPlayer({
          id: bot.id, room_id: '', name: `Бот ${bot.name}`,
          is_bot: true, bot_strategy: bot.strategy as any,
          is_host: false, color_index: i + 1, difficulty: settings.difficulty,
        })
        bp.avatar = BOT_AVATARS[bot.name] ?? '🤖'
        return bp
      })

      const allPlayers = [hostPlayer, ...botPlayers]

      const { data: room, error: err } = await (supabase as any)
        .from('rooms')
        .insert({
          code, status: 'lobby', host_id: playerId,
          current_player_id: playerId, round: 1, time_limit: 90, deck: 'classic',
          game_state: {
            players: allPlayers.map(p => ({ ...p, room_id: '' })),
            events: [], auction: null,
            market_prices: { SBER: 305, OZON: 5000, NVDA: 16500, YDEX: 4800, GAZP: 120, GOLD: 11000, BTC: 95000, ETH: 33500, TON: 580, HMSTR: 2 },
            market_event: null, key_rate: KEY_RATE_DEFAULT, settings,
            volatility_profile: generateVolatilityProfile(['SBER','OZON','NVDA','YDEX','GAZP','GOLD','BTC','ETH','TON','HMSTR']),
          },
        })
        .select().single()

      if (err) throw err

      const updatedPlayers = allPlayers.map(p => ({ ...p, room_id: room.id }))
      await (supabase as any).from('rooms').update({
        game_state: {
          players: updatedPlayers, events: [], auction: null,
          market_prices: { SBER: 305, OZON: 5000, NVDA: 16500, YDEX: 4800, GAZP: 120, GOLD: 11000, BTC: 95000, ETH: 33500, TON: 580, HMSTR: 2 },
          market_event: null, key_rate: KEY_RATE_DEFAULT, settings,
        }
      }).eq('id', room.id)

      localStorage.setItem(`svoboda_player_${room.id}`, playerId)
      router.push(`/game/${room.id}`) // ожидалка покажется т.к. status='lobby'
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function joinRoom() {
    if (!name.trim()) { setError('Введи имя'); return }
    if (!joinCode.trim()) { setError('Введи код'); return }
    setLoading(true)
    try {
      const { data: room, error: err } = await (supabase as any)
        .from('rooms').select()
        .eq('code', joinCode.toUpperCase()).eq('status', 'lobby').single()

      if (err || !room) { setError('Комната не найдена'); setLoading(false); return }

      const state = room.game_state
      const playerId = crypto.randomUUID()
      const player = createPlayer({ id: playerId, room_id: room.id, name: name.trim(), is_bot: false, is_host: false, color_index: state.players.length })
      player.avatar = avatar
      if (selectedDream) player.dream = selectedDream

      await (supabase as any).from('rooms').update({ game_state: { ...state, players: [...state.players, player] } }).eq('id', room.id)
      localStorage.setItem(`svoboda_player_${room.id}`, playerId)
      router.push(`/game/${room.id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const totalPlayers = 1 + bots.length

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#07070D' }}>
      <div className="relative w-[390px] overflow-hidden rounded-[52px] border border-white/[0.08]"
        style={{ background: 'radial-gradient(420px 300px at 80% -5%,rgba(245,184,67,.14),transparent 60%),radial-gradient(380px 320px at 0% 30%,rgba(167,139,250,.10),transparent 60%), #0B0B13', height: '100vh', maxHeight: '844px' }}>
        <div style={{ height: '100%', display: 'grid', gridTemplateRows: '1fr auto' }}>

          <div className="overflow-y-auto px-[22px] pt-14 pb-4">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="text-[26px] font-extrabold tracking-[-.5px]">
                {tab === 'create' ? 'Новая игра' : 'Присоединиться'}
              </div>
              <button onClick={() => { if(navigator.share) navigator.share({ title:'Свобода', text:`Присоединяйся! Код: `, url: window.location.href }) }} className="flex h-[42px] w-[42px] items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.06] text-body">
                <IconShare size={20} sw={2} />
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.05] p-1">
              {(['create', 'join'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 rounded-xl py-[11px] text-center text-[14px] font-bold transition-all ${tab === t ? 'gold-grad text-[#1A1206]' : 'text-muted'}`}>
                  {t === 'create' ? 'Создать' : 'Присоединиться'}
                </button>
              ))}
            </div>

            {/* Name + Avatar */}
            <div className="mt-4">
              <div className="flex gap-2 items-center">
                {/* Avatar button */}
                <button
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="shrink-0 flex h-[50px] w-[50px] items-center justify-center rounded-[14px] text-[24px] transition-all"
                  style={{
                    border: showAvatarPicker ? '1.5px solid rgba(245,184,67,0.5)' : '1.5px solid rgba(255,255,255,0.08)',
                    background: showAvatarPicker ? 'rgba(245,184,67,0.1)' : 'rgba(255,255,255,0.045)',
                  }}
                >
                  {avatar}
                </button>
                {/* Name input */}
                <input
                  className="flex-1 rounded-[18px] border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-[15px] font-semibold text-hi placeholder:text-faint focus:border-gold/40 focus:outline-none"
                  placeholder="Твоё имя" value={name} onChange={e => { setName(e.target.value); setError('') }}
                />
              </div>
              {/* Avatar picker — opens below */}
              {showAvatarPicker && (
                <div className="mt-2 rounded-[18px] border border-white/[0.08] p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="grid grid-cols-6 gap-2">
                    {PLAYER_AVATARS.map(a => (
                      <button key={a} onClick={() => { setAvatar(a); setShowAvatarPicker(false) }}
                        className="flex items-center justify-center rounded-[12px] text-[22px] transition-all"
                        style={{
                          height: '44px',
                          border: avatar === a ? '1.5px solid rgba(245,184,67,0.6)' : '1.5px solid rgba(255,255,255,0.06)',
                          background: avatar === a ? 'rgba(245,184,67,0.15)' : 'rgba(255,255,255,0.04)',
                        }}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {tab === 'join' && (
              <input
                className="mt-3 w-full rounded-[18px] border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-[15px] font-semibold text-hi placeholder:text-faint focus:border-gold/40 focus:outline-none tracking-[4px] uppercase"
                placeholder="КОД КОМНАТЫ" value={joinCode} onChange={e => setJoinCode(e.target.value)} maxLength={5}
              />
            )}

            {error && <div className="mt-2 text-[13px] font-semibold text-neg">{error}</div>}

            {/* Bots */}
            {tab === 'create' && (
              <>
                <div className="mt-5 flex items-center justify-between">
                  <div className="text-[14px] font-bold text-body">За столом <span className="text-faint">{totalPlayers} / 6</span></div>
                </div>

                {/* Host */}
                <div className="mt-3 flex items-center gap-3 rounded-[18px] border border-gold/20 bg-gold/[0.06] px-4 py-3">
                  <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[11px] bg-gold text-[20px]">
                    {avatar}
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-bold">{name || 'Ты'}</div>
                    <div className="text-[11px] text-faint">Хост</div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-pos shadow-[0_0_6px_#34D399]" />
                </div>

                {/* Bot list */}
                {bots.map(bot => {
                  const strategy = BOT_STRATEGIES.find(s => s.id === bot.strategy)!
                  return (
                    <div key={bot.id} className="mt-2 flex items-center gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.045] px-4 py-3">
                      <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[11px] text-[20px]" style={{ background: bot.color }}>
                        {BOT_AVATARS[bot.name] ?? '🤖'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-bold">Бот {bot.name}</div>
                        <div className="text-[11px] text-faint">{strategy.name} · {strategy.desc}</div>
                      </div>
                      <button onClick={() => removeBot(bot.id)} className="text-[18px] text-dim hover:text-neg">×</button>
                    </div>
                  )
                })}

                {/* Add bot */}
                {totalPlayers < 6 && !showBotPicker && (
                  <button onClick={() => setShowBotPicker(true)}
                    className="mt-2 flex w-full items-center gap-3 rounded-[18px] border-[1.5px] border-dashed border-violet/30 px-4 py-3 text-violet">
                    <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[11px] border border-violet/30 bg-violet/[0.14] text-[18px]">🤖</div>
                    <div className="text-[14px] font-bold">+ Добавить бота</div>
                  </button>
                )}

                {showBotPicker && (
                  <div className="mt-2 rounded-[18px] border border-violet/20 bg-violet/[0.06] p-3">
                    <div className="mb-2 text-[12px] font-bold text-violet">Выбери стратегию бота:</div>
                    <div className="flex flex-col gap-2">
                      {BOT_STRATEGIES.map(s => (
                        <button key={s.id} onClick={() => addBot(s.id)}
                          className="flex items-center gap-3 rounded-[14px] border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-left">
                          <div className="h-3 w-3 rounded-full shrink-0" style={{ background: s.color }} />
                          <div>
                            <div className="text-[13px] font-bold">{s.name}</div>
                            <div className="text-[11px] text-faint">{s.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setShowBotPicker(false)} className="mt-2 w-full text-center text-[12px] text-faint">Отмена</button>
                  </div>
                )}
              </>
            )}

            {/* Dream selection */}
            <div className="mt-5 mb-2 text-[14px] font-bold text-body">Твоя мечта</div>
            <div className="-mx-[22px] flex gap-[11px] overflow-x-auto px-[22px] pb-2">
              {DREAMS.slice(0, 5).map(dream => (
                <button key={dream.id} onClick={() => setSelectedDream(dream)}
                  className={`relative w-[130px] shrink-0 rounded-[20px] border p-[13px] text-left transition-all ${selectedDream?.id === dream.id ? 'border-gold/55 [background:linear-gradient(160deg,rgba(245,184,67,.20),rgba(245,184,67,.05))]' : 'border-white/[0.08] bg-white/[0.045]'}`}>
                  {selectedDream?.id === dream.id && (
                    <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[#0B0B13]">
                      <IconCheck size={11} sw={3.5} />
                    </div>
                  )}
                  <div className="text-[26px]">{dream.icon}</div>
                  <div className="mt-2.5 text-[12px] font-extrabold leading-tight">{dream.name}</div>
                  <div className="mt-1 text-[10px] font-semibold text-gold-soft">₽{(dream.passive_required / 1000).toFixed(0)}К/мес</div>
                </button>
              ))}
            </div>

          </div>

          {/* НАСТРОЙКИ ИГРЫ */}
          {tab === 'create' && (
            <div className="px-[22px] pb-2">
              <button onClick={() => setShowSettings(s => !s)}
                className="flex w-full items-center justify-between rounded-[16px] border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                <span className="text-[13px] font-semibold text-faint">Настройки игры</span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold" style={{ color: DIFFICULTY_CONFIG[settings.difficulty].color }}>
                    {DIFFICULTY_CONFIG[settings.difficulty].label}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-faint" style={{ transform: showSettings ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </button>

              {showSettings && (
                <div className="mt-2 rounded-[16px] border border-white/[0.07] bg-white/[0.025] p-4 flex flex-col gap-4">
                  {/* Сложность */}
                  <div>
                    <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">Сложность</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['easy','normal','hard'] as GameDifficulty[]).map(d => {
                        const cfg = DIFFICULTY_CONFIG[d]
                        const on = settings.difficulty === d
                        return (
                          <button key={d} onClick={() => toggleSetting('difficulty', d)}
                            className={`rounded-[12px] border py-2.5 text-center transition-all ${on ? 'border-current' : 'border-white/[0.07] bg-white/[0.03]'}`}
                            style={on ? { background: `${cfg.color}18`, borderColor: `${cfg.color}55`, color: cfg.color } : { color: 'rgba(255,255,255,0.4)' }}>
                            <div className="text-[12px] font-bold">{cfg.label}</div>
                            <div className="mt-0.5 text-[9px] opacity-70 leading-tight px-1">{cfg.desc}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Время игры */}
                  <div>
                    <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">Ограничение времени</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[{v:0,label:'∞',desc:'Без лимита'},{v:15,label:'15м',desc:''},{v:30,label:'30м',desc:''},{v:60,label:'1ч',desc:''}].map(({v,label,desc})=>{
                        const on = settings.game_duration === v
                        return (
                          <button key={v} onClick={()=>toggleSetting('game_duration', v as any)}
                            className="rounded-[12px] border py-2.5 text-center transition-all"
                            style={on ? {background:'rgba(245,184,67,0.12)',borderColor:'rgba(245,184,67,0.4)',color:'#F5B843'} : {border:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.4)'}}>
                            <div className="text-[13px] font-bold">{label}</div>
                          </button>
                        )
                      })}
                    </div>
                    {settings.game_duration > 0 && <div className="mt-1.5 text-[10px] text-faint">Если никто не победил — выигрывает тот, кто ближе к финансовой свободе</div>}
                  </div>

                  {/* Тогглы */}
                  <div className="flex flex-col gap-2.5">
                    {([
                      { key: 'volatile_rate', label: 'Ключевая ставка ЦБ скачет', desc: 'События меняют ставку — новые кредиты дорожают' },
                      { key: 'inflation',     label: 'Инфляция',                  desc: 'Расходы растут через события' },
                      { key: 'unique_assets', label: 'Уникальные активы',         desc: 'Один и тот же актив нельзя купить дважды' },
                    ] as { key: keyof GameSettings; label: string; desc: string }[]).map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-body">{label}</div>
                          <div className="text-[10px] text-faint leading-tight">{desc}</div>
                        </div>
                        <button onClick={() => toggleSetting(key, !settings[key] as any)}
                          className="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200"
                          style={{ background: settings[key] ? '#34D399' : 'rgba(255,255,255,0.1)' }}>
                          <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200"
                            style={{ left: settings[key] ? 'calc(100% - 22px)' : '2px' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="px-[22px] pb-[40px] pt-3" style={{ background: 'linear-gradient(to top, #0B0B13 70%, transparent)' }}>
            <button onClick={tab === 'create' ? createRoom : joinRoom} disabled={loading}
              className="gold-grad flex w-full items-center justify-center gap-2.5 rounded-[20px] p-[17px] text-[17px] font-extrabold text-[#1A1206] disabled:opacity-60"
              style={{ boxShadow: '0 18px 40px -12px rgba(245,184,67,.65)' }}>
              {loading ? 'Загрузка...' : tab === 'create' ? `Начать игру (${totalPlayers} чел)` : 'Войти в игру'}
              {!loading && <IconArrowRight size={20} sw={2.6} />}
            </button>
            <div className="mt-2.5 text-center text-[12px] font-semibold text-faint">
              Профессии раздаются случайно — как в жизни 🐭
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}