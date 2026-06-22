'use client'
import { useEffect, useRef, useState } from 'react'
import { gameLog } from '@/lib/gameLogger'
import { supabase } from '@/lib/supabase'
import { freedomProgress, getCreditLimit } from '@/lib/gameEngine'
import { sounds, TIME_LIMIT } from '@/lib/gameConstants'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

interface Params {
  roomId: string
  myPlayerId: string
  gameState: any
  myPlayer: any
  isMyTurn: boolean
  isHost: boolean
  rolling: boolean
  hasRolled: boolean
  roomStatus: string
  winner: any
  showBankrupt: boolean
  showEmergency: boolean
  timeLeft: number
  notifPrefsRef: React.MutableRefObject<any>
  anyoneRollingTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  latestStateRef: React.MutableRefObject<any>
  gameStateRef: React.MutableRefObject<any>
  hasRolledRef: React.MutableRefObject<boolean>
  isRollingRef: React.MutableRefObject<boolean>
  isAdvancingRef: React.MutableRefObject<boolean>
  bankruptProcessedRef: React.MutableRefObject<boolean>
  // state from parent
  othersQueue: any[]
  showTurnCard: boolean
  marketData: any
  // setters
  setMarketQty: (v: number) => void
  setOthersQueue: React.Dispatch<React.SetStateAction<any[]>>
  setMarketData: (v: any) => void
  setCurrentCell: (v: any) => void
  setQueueMode: (v: boolean) => void
  setShowTurnCard: (v: boolean) => void
  setBabyEvent: (v: any) => void
  setAnyoneRolling: (v: boolean) => void
  setWinner: (v: any) => void
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>
  setHasRolled: (v: boolean) => void
  setShowEmergency: (v: boolean) => void
  setShowBankrupt: (v: boolean) => void
  setGameTimeLeft: (fn: any) => void
  setShowTimeUp: (v: boolean) => void
  setOnlinePlayers: (v: Set<string>) => void
  setReconnected: (v: boolean) => void
  // actions
  wgs: (state: any, playerId?: string) => Promise<void>
  advanceTurn: (state: any) => Promise<void>
  handleRoll: () => void
  showCashNotif: (label: string, amount: number, positive: boolean, color?: string, type?: string) => void
  turnIdRef: React.MutableRefObject<string>
}

export function useGameEffects(p: Params) {
  const seenOpenAuctionRef = useRef<string | null>(null)
  const seenGiftEventsRef = useRef<Set<string>>(new Set())
  const [lastMarketTimestamp, setLastMarketTimestamp] = useState(0)
  const [lastBabyTimestamp, setLastBabyTimestamp] = useState(0)

  // Боты скидываются на памперсы
  useEffect(() => {
    if (!p.gameState?.baby_event) return
    if (!p.gameState.baby_event.timestamp) return
    const bots = p.gameState.players.filter((bot: any) =>
      bot.is_bot && bot.id !== p.gameState.baby_event.player_id
    )
    if (bots.length === 0) return
    bots.forEach((bot: any) => {
      if (Math.random() > 0.6) return
      const maxGift = Math.min(bot.cash * 0.05, 5000)
      if (maxGift < 500) return
      const gift = Math.round(Math.random() * maxGift / 500) * 500 || 500
      setTimeout(async () => {
        const fresh = await db.from('rooms').select('game_state').eq('id', p.roomId).single()
        if (!fresh.data) return
        const state = fresh.data.game_state
        const recipient = state.players.find((pl: any) => pl.id === p.gameState.baby_event.player_id)
        const botPlayer = state.players.find((pl: any) => pl.id === bot.id)
        if (!recipient || !botPlayer || botPlayer.cash < gift) return
        const newPlayers = state.players.map((pl: any) =>
          pl.id === bot.id ? { ...pl, cash: pl.cash - gift } :
          pl.id === p.gameState.baby_event.player_id ? { ...pl, cash: pl.cash + gift } : pl
        )
        const newEvent = { id: crypto.randomUUID(), round: p.gameState?.round??1, player_id: bot.id, player_name: bot.name, type: 'child', description: `${bot.name} подарил ${p.gameState.baby_event.player_name} ₽${gift.toLocaleString()} на памперсы 🍼`, created_at: new Date().toISOString() }
        await db.from('rooms').update({
          game_state: { ...state, players: newPlayers, events: [newEvent, ...(state.events||[])].slice(0, 50) }
        }).eq('id', p.roomId)
      }, Math.random() * 3000 + 1000)
    })
  }, [p.gameState?.baby_event?.timestamp])

  // Сбрасываем количество когда меняется marketData
  useEffect(() => { p.setMarketQty(1) }, [p.marketData])

  // Показываем market события от других игроков
  useEffect(() => {
    if (!p.gameState?.market_event) return
    if (p.gameState.market_event.timestamp === lastMarketTimestamp) return
    setLastMarketTimestamp(p.gameState.market_event.timestamp)
    if (p.myPlayer && p.gameState.market_event.player_name !== p.myPlayer.name) {
      const ticker = p.gameState.market_event.ticker
      const prefs = p.notifPrefsRef.current
      if (prefs.market && !prefs.mutedTickers.includes(ticker)) {
        p.setOthersQueue(q => [...q, { kind: 'market', data: p.gameState.market_event }])
      }
    }
  }, [p.gameState?.market_event?.timestamp])

  // Показываем следующий элемент очереди когда turn card закрыта
  useEffect(() => {
    if (p.othersQueue.length === 0 || p.showTurnCard) return
    const item = p.othersQueue[0]
    if (item.kind === 'market') {
      p.setMarketData(item.data)
      p.setCurrentCell({ type: 'market', label: 'Биржа', data: { ticker: item.data.ticker, market_type: item.data.isStock ? 'stock' : 'crypto' } })
    } else if (item.kind === 'baby') {
      p.setBabyEvent(item.data)
      return
    }
    p.setQueueMode(true)
    p.setShowTurnCard(true)
  }, [p.othersQueue, p.showTurnCard])

  // Baby events от других
  useEffect(() => {
    if (!p.gameState?.baby_event) return
    if (p.gameState.baby_event.timestamp === lastBabyTimestamp) return
    setLastBabyTimestamp(p.gameState.baby_event.timestamp)
    if (p.gameState.baby_event.player_id !== p.myPlayerId && p.notifPrefsRef.current.baby_others) {
      p.setOthersQueue(q => [...q, { kind: 'baby', data: p.gameState.baby_event }])
    }
  }, [p.gameState?.baby_event?.timestamp])

  // Уведомление получателю подарка на памперсы
  useEffect(() => {
    if (!p.gameState?.events || !p.myPlayerId) return
    const myName = p.gameState.players?.find((pl: any) => pl.id === p.myPlayerId)?.name
    if (!myName) return
    for (const e of p.gameState.events) {
      if (e.type !== 'child' || e.player_id === p.myPlayerId || seenGiftEventsRef.current.has(e.id)) continue
      if (!e.description?.includes(myName)) continue
      seenGiftEventsRef.current.add(e.id)
      const match = e.description.match(/₽([\d\s]+)/)
      if (match) {
        const amount = parseInt(match[1].replace(/\s/g, ''))
        p.showCashNotif(`${e.player_name} подарил на памперсы 🍼`, amount, true)
      }
    }
  }, [p.gameState?.events])

  useEffect(() => {
    if (!p.gameState?.rolling_player_id || p.gameState.rolling_player_id === p.myPlayerId) return
    p.setAnyoneRolling(true)
    if (p.anyoneRollingTimerRef.current) clearTimeout(p.anyoneRollingTimerRef.current)
    p.anyoneRollingTimerRef.current = setTimeout(() => p.setAnyoneRolling(false), 2000)
  }, [p.gameState?.rolling_player_id])

  // Мгновенный показ аукционного лота всем игрокам кроме открывшего
  useEffect(() => {
    if (!p.gameState?.open_auction || !p.myPlayerId) return
    const offer = p.gameState.open_auction
    const key = `${offer.asset?.id}_${offer.from_id}`
    if (key === seenOpenAuctionRef.current) return
    if (offer.from_id === p.myPlayerId) return
    seenOpenAuctionRef.current = key
    if (p.notifPrefsRef.current.auction) {
      p.setOthersQueue(q => [...q, { kind: 'auction', data: offer }])
    }
  }, [p.gameState?.open_auction])

  // Сброс таймера и флага при смене хода
  useEffect(() => {
p.setTimeLeft(TIME_LIMIT)
    p.setHasRolled(false)
    p.hasRolledRef.current = false
    p.isRollingRef.current = false
  }, [p.gameState?.players?.[0]?.id])

  // Проверка победителя
  useEffect(() => {
    if (!p.gameState || p.roomStatus !== 'playing' || p.winner) return
    if (p.gameState.winner_id) {
      const w = (p.gameState.players || []).find((pl: any) => pl.id === p.gameState.winner_id)
      if (w) { p.setWinner(w); setTimeout(()=>sounds.drumroll(),300); setTimeout(()=>sounds.victory(),1000); return }
    }
    const w = (p.gameState.players || []).find((pl: any) => freedomProgress(pl) >= 100)
    if (w) {
      p.setWinner(w)
      setTimeout(()=>sounds.drumroll(),300); setTimeout(()=>sounds.victory(),1100)
      if (p.isHost) {
        db.from('rooms').update({ game_state: { ...p.gameState, winner_id: w.id } }).eq('id', p.roomId)
      }
    }
  }, [p.gameState?.winner_id, p.gameState?.players?.map((pl:any)=>pl.passive_income+'/'+pl.total_expenses).join(',')])

  // Автоматический пропуск хода при skip_turns > 0
  useEffect(() => {
    const skipLeft = (p.myPlayer as any)?.skip_turns ?? 0
    const ts = () => new Date().toISOString().slice(11,23)
    // Логируем КАЖДЫЙ запуск эффекта
}`)

    if (!p.isMyTurn || !p.myPlayer || !p.gameState || p.roomStatus !== 'playing') return
    if (skipLeft <= 0) return
const t = setTimeout(async () => {
      const gs = p.gameStateRef.current ?? p.gameState
      const mp = gs.players.find((pl: any) => pl.id === p.myPlayerId)
} myId=${p.myPlayerId?.slice(0,6)} match=${gs.players[0]?.id === p.myPlayerId} skip=${(mp as any)?.skip_turns}`)

      if (!mp || gs.players[0]?.id !== p.myPlayerId) {
return
      }
      const remaining = ((mp as any).skip_turns ?? 1) - 1
gameLog({ roomId: p.roomId, turnId: p.turnIdRef.current, eventType: 'SKIP_TURN',
        playerId: p.myPlayerId, playerName: mp.name,
        payload: { skip_before: skipLeft, skip_after: remaining, isAdvancingRef: p.isAdvancingRef.current } })

      const updatedPlayer = { ...mp, skip_turns: remaining }
      const allPlayers = gs.players.map((pl: any) => pl.id === p.myPlayerId ? updatedPlayer : pl)
      const [skipCur, ...skipRest] = allPlayers
      const ev = { id: crypto.randomUUID(), round: gs.round??1, player_id: p.myPlayerId, player_name: mp.name, type: 'hit', description: `${mp.name} пропускает ход${remaining > 0 ? ` (осталось: ${remaining})` : ' — возвращается в игру!'}`, created_at: new Date().toISOString() }
      const newState = { ...gs, players: [...skipRest, skipCur], events: [ev, ...(gs.events||[])].slice(0,50) }
      p.latestStateRef.current = newState
      await p.wgs(newState)
}, 1500)
    return () => {
clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.isMyTurn, (p.myPlayer as any)?.skip_turns, p.gameState?.players?.[0]?.id])

  // Проверка банкротства при каждом ходе
  useEffect(() => {
    if (!p.myPlayer || !p.gameState || p.roomStatus !== 'playing') return
    if ((p.myPlayer as any).is_eliminated) {
      if (p.isMyTurn && !p.rolling) { p.advanceTurn(p.gameState) }
      return
    }
    if (!p.isMyTurn) return
    const netFlow = (p.myPlayer.profession?.salary ?? 0) + p.myPlayer.passive_income - p.myPlayer.total_expenses
    if (p.myPlayer.cash < 0 && netFlow < 0 && !p.bankruptProcessedRef.current && !(p.myPlayer as any).is_eliminated) {
      p.bankruptProcessedRef.current = true
      const hasAssets = p.myPlayer.assets.length > 0
      const hasCreditLimit = getCreditLimit(p.myPlayer) > 0
      if (hasAssets || hasCreditLimit) {
        p.setShowEmergency(true)
      } else {
        const doEliminate = async () => {
          const ev = { id: crypto.randomUUID(), round: p.gameState.round??1, player_id: p.myPlayerId, player_name: p.myPlayer.name, type: 'hit', description: `${p.myPlayer.name} выбывает — нет средств для покрытия долгов`, created_at: new Date().toISOString() }
          const newPlayers = p.gameState.players.map((pl:any) => pl.id === p.myPlayerId ? {...pl, is_eliminated: true} : pl)
          const newState = {...p.gameState, players: newPlayers, events: [ev, ...(p.gameState.events||[])].slice(0,50)}
          p.latestStateRef.current = newState
          await p.wgs(newState)
          p.setShowBankrupt(true)
        }
        doEliminate()
      }
    }
  }, [p.isMyTurn, p.myPlayer?.cash, p.myPlayer?.passive_income, p.myPlayer?.total_expenses, (p.myPlayer as any)?.is_eliminated])

  // Отсчёт таймера хода
  useEffect(() => {
    if (p.roomStatus !== 'playing' || !p.gameState) return
    if (p.showBankrupt || p.showEmergency) return
    if (p.timeLeft <= 0) {
      if (p.isMyTurn && !p.rolling) {
        const mySkipTurns = (p.myPlayer as any)?.skip_turns ?? 0
        if (mySkipTurns > 0) {
gameLog({ roomId: p.roomId, turnId: p.turnIdRef.current, eventType: 'TIMEOUT',
            playerId: p.myPlayerId, playerName: p.myPlayer?.name,
            payload: { reason: 'skip_turns>0 but timeLeft=0', skip_turns: mySkipTurns, isAdvancingRef: p.isAdvancingRef.current } })
          p.advanceTurn(p.gameStateRef.current)
        } else if (!p.hasRolled) {
          p.handleRoll()
        } else {
          p.setShowTurnCard(false)
          p.advanceTurn(p.gameStateRef.current)
        }
      } else if (p.isHost && !p.rolling) {
        const gs = p.gameStateRef.current
        // isRollingRef проверяется синхронно — он устанавливается до DB write
        // это защищает от форс-advance пока игрок в процессе броска
        if (!gs?.rolling_player_id && !p.isRollingRef.current) { p.advanceTurn(gs) }
      }
      return
    }
    const t = setTimeout(() => p.setTimeLeft((prev: number) => prev - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.timeLeft, p.roomStatus, p.hasRolled, p.showBankrupt, p.showEmergency, p.isMyTurn, p.isHost, p.rolling])

  // Глобальный таймер игры
  useEffect(() => {
    if (p.roomStatus !== 'playing' || !p.gameState) return
    const duration = p.gameState.settings?.game_duration ?? 0
    if (!duration) return
    if (!p.gameState.game_started_at) return
    const elapsed = Math.floor((Date.now() - new Date(p.gameState.game_started_at).getTime()) / 1000)
    const totalSecs = duration * 60
    const remaining = totalSecs - elapsed
    if (remaining <= 0) { p.setGameTimeLeft(0); return }
    p.setGameTimeLeft(remaining)
    const t = setInterval(() => {
      p.setGameTimeLeft((prev: number | null) => {
        if (prev === null || prev <= 1) { clearInterval(t); p.setShowTimeUp(true); sounds.timeup(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [p.roomStatus, p.gameState?.game_started_at, p.gameState?.settings?.game_duration])

  // Presence
  useEffect(() => {
    if (!p.myPlayerId || !p.roomId) return
    const presenceChannel = supabase.channel(`presence-${p.roomId}`, { config: { presence: { key: p.myPlayerId } } })
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        p.setOnlinePlayers(new Set(Object.keys(state)))
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ player_id: p.myPlayerId, online_at: Date.now() })
        }
      })
    return () => { supabase.removeChannel(presenceChannel) }
  }, [p.myPlayerId, p.roomId])

  // Reconnect detection
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && p.roomStatus === 'playing') {
        p.setReconnected(true)
        setTimeout(() => p.setReconnected(false), 3000)
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [p.roomStatus])
}
