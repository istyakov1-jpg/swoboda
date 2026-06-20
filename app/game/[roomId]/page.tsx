'use client'

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { rollDice, movePlayer, collectSalary, buyAsset, freedomProgress, netPassiveIncome, baseExpenses, botDecide, getCreditLimit, getTotalDebtPayments, repayDebt, takeCredit, calcDividends } from '@/lib/gameEngine'
import { ASSETS, BOARD_CELLS, SMALL_DEALS, LARGE_DEALS, STOCKS, CRYPTO, CREDIT_PRODUCTS, KEY_RATE_DEFAULT, DIFFICULTY_CONFIG, DEFAULT_SETTINGS, getBoardCells, getRandomDeal, getRandomDeals, getRandomHit, getRandomEvent, getRandomAuctionAsset, getNewPrice, getPriceChangeEmoji, getStockByTicker, getCryptoByTicker, getRandomSellOffer, type GameDifficulty } from '@/lib/gameData'
import type { Player } from '@/types/database'
import { IconCoins, IconBars, IconBolt, IconOpportunity, IconEvent, IconGavel, IconDice, IconTrendUp, IconLayers, IconWallet, IconPeople, IconList, GameIcon, IconSalary, IconSell, IconHit, IconRepay, IconCredit, IconFreedom, IconBaby, IconCharity, IconSkull, IconAlert, IconNews, IconDeal, IconHandshake, IconTrophy, IconSettings, IconAnalytics, IconDDS, IconDie } from '@/components/icons'
import BoardView from './BoardView'
import { Dice3D } from './Dice3D'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

type Tab = 'feed' | 'balance' | 'players' | 'journal'

const CELL_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  salary:      { color: 'text-body',   bg: 'bg-[#C7CBD6]/10',  border: 'border-[#C7CBD6]/20', label: 'Зарплата' },
  opportunity: { color: 'text-pos',    bg: 'bg-pos/[0.12]',    border: 'border-pos/[0.32]',   label: 'Сделка' },
  hit:         { color: 'text-neg',    bg: 'bg-neg/[0.12]',    border: 'border-neg/30',        label: 'Удар' },
  market:      { color: 'text-info',   bg: 'bg-info/[0.12]',   border: 'border-info/[0.28]',  label: 'Биржа' },
  event:       { color: 'text-warn',   bg: 'bg-warn/[0.12]',   border: 'border-warn/30',       label: 'Событие' },
  auction:     { color: 'text-violet', bg: 'bg-violet/[0.14]', border: 'border-violet/[0.32]', label: 'Аукцион' },
  child:       { color: 'text-gold',   bg: 'bg-gold/[0.12]',   border: 'border-gold/30',       label: 'Жизнь' },
  charity:     { color: 'text-[#E8A2C8]', bg: 'bg-[#E8A2C8]/[0.12]', border: 'border-[#E8A2C8]/30', label: 'Благотворительность' },
}

const CELL_ICONS: Record<string, JSX.Element> = {
  salary:      <IconCoins size={22} />,
  opportunity: <IconOpportunity size={22} sw={2} />,
  hit:         <IconBolt size={22} />,
  market:      <IconBars size={22} />,
  event:       <IconEvent size={22} />,
  auction:     <IconGavel size={22} />,
  child:       <span style={{fontSize:20}}>👶</span>,
  charity:     <span style={{fontSize:20}}>✨</span>,
}

// Вне компонента — не пересоздаётся при каждом рендере
const EV_CFG: Record<string,{icon:string,label:string,color:string,global?:boolean}> = {
  roll:        { icon:'die',       label:'Ход',        color:'rgba(255,255,255,0.5)' },
  buy:         { icon:'buy',       label:'Покупка',    color:'#34D399' },
  sell:        { icon:'sell',      label:'Продажа',    color:'#F5B843' },
  salary:      { icon:'salary',    label:'Зарплата',   color:'#34D399' },
  hit:         { icon:'hit',       label:'Удар',       color:'#F87171' },
  event:       { icon:'event',     label:'Событие',    color:'#A78BFA', global:true },
  credit:      { icon:'credit',    label:'Кредит',     color:'#60A5FA' },
  repay:       { icon:'repay',     label:'Погашение',  color:'#34D399' },
  freedom:     { icon:'freedom',   label:'Свобода!',   color:'#FBD888', global:true },
  auction_win: { icon:'trophy',    label:'Аукцион',    color:'#F59E0B', global:true },
  child:       { icon:'child',     label:'Ребёнок',    color:'#F5B843', global:true },
}

const sounds = {
  dice:    () => { try { const a = new AudioContext(); const o = a.createOscillator(); const g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.setValueAtTime(300,a.currentTime); o.frequency.exponentialRampToValueAtTime(150,a.currentTime+0.1); g.gain.setValueAtTime(0.3,a.currentTime); g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.15); o.start(); o.stop(a.currentTime+0.15); } catch(e) {} },
  buy:     () => { try { const a = new AudioContext(); const o = a.createOscillator(); const g = a.createGain(); o.type='sine'; o.connect(g); g.connect(a.destination); [523,659,784].forEach((f,i)=>o.frequency.setValueAtTime(f,a.currentTime+i*0.1)); g.gain.setValueAtTime(0.2,a.currentTime); g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.4); o.start(); o.stop(a.currentTime+0.4); } catch(e) {} },
  salary:  () => { try { const a = new AudioContext(); const o = a.createOscillator(); const g = a.createGain(); o.type='sine'; o.connect(g); g.connect(a.destination); o.frequency.setValueAtTime(440,a.currentTime); o.frequency.setValueAtTime(550,a.currentTime+0.08); g.gain.setValueAtTime(0.15,a.currentTime); g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.25); o.start(); o.stop(a.currentTime+0.25); } catch(e) {} },
  hit:     () => { try { const a = new AudioContext(); const o = a.createOscillator(); const g = a.createGain(); o.type='sawtooth'; o.connect(g); g.connect(a.destination); o.frequency.setValueAtTime(200,a.currentTime); o.frequency.exponentialRampToValueAtTime(80,a.currentTime+0.2); g.gain.setValueAtTime(0.2,a.currentTime); g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.2); o.start(); o.stop(a.currentTime+0.2); } catch(e) {} },
  // 🏆 Победа — торжественный фанфар с нарастанием
  victory: () => { try {
    const a = new AudioContext()
    const play = (freq: number, t: number, dur: number, vol = 0.25) => {
      const o = a.createOscillator(); const g = a.createGain()
      o.type='sine'; o.connect(g); g.connect(a.destination)
      o.frequency.setValueAtTime(freq,a.currentTime+t)
      g.gain.setValueAtTime(0,a.currentTime+t)
      g.gain.linearRampToValueAtTime(vol,a.currentTime+t+0.02)
      g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+t+dur)
      o.start(a.currentTime+t); o.stop(a.currentTime+t+dur)
    }
    // Та-да-дам! + восходящий аккорд
    play(392,0,0.15,0.3); play(523,0,0.15,0.2)
    play(523,0.18,0.15,0.3); play(659,0.18,0.15,0.2)
    play(659,0.36,0.15,0.3); play(784,0.36,0.15,0.2)
    play(784,0.55,0.5,0.35); play(1047,0.55,0.5,0.25); play(659,0.55,0.5,0.2)
  } catch(e) {} },
  // ☠️ Банкротство — тудудудум (нисходящий)
  bankrupt: () => { try {
    const a = new AudioContext()
    const play = (freq: number, t: number, dur: number) => {
      const o = a.createOscillator(); const g = a.createGain()
      o.type='sawtooth'; o.connect(g); g.connect(a.destination)
      o.frequency.setValueAtTime(freq,a.currentTime+t)
      o.frequency.exponentialRampToValueAtTime(freq*0.7,a.currentTime+t+dur)
      g.gain.setValueAtTime(0.25,a.currentTime+t)
      g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+t+dur)
      o.start(a.currentTime+t); o.stop(a.currentTime+t+dur+0.05)
    }
    play(220,0,0.2); play(196,0.25,0.2); play(175,0.5,0.2); play(147,0.75,0.6)
  } catch(e) {} },
  // ⏰ Время вышло — тревожный финал
  timeup: () => { try {
    const a = new AudioContext()
    const play = (freq: number, t: number, dur: number, type: OscillatorType = 'sine') => {
      const o = a.createOscillator(); const g = a.createGain()
      o.type=type; o.connect(g); g.connect(a.destination)
      o.frequency.setValueAtTime(freq,a.currentTime+t)
      g.gain.setValueAtTime(0.2,a.currentTime+t)
      g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+t+dur)
      o.start(a.currentTime+t); o.stop(a.currentTime+t+dur)
    }
    // Три удара + финальный спад
    play(880,0,0.1,'square'); play(880,0.15,0.1,'square'); play(880,0.3,0.1,'square')
    play(440,0.5,0.8,'sawtooth')
  } catch(e) {} },
  // 🥁 Дробь перед объявлением (напряжение)
  drumroll: () => { try {
    const a = new AudioContext()
    for(let i=0;i<12;i++){
      const o = a.createOscillator(); const g = a.createGain()
      o.type='square'; o.connect(g); g.connect(a.destination)
      const t = i*0.06
      o.frequency.setValueAtTime(150+i*5,a.currentTime+t)
      g.gain.setValueAtTime(0.08+i*0.01,a.currentTime+t)
      g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+t+0.05)
      o.start(a.currentTime+t); o.stop(a.currentTime+t+0.05)
    }
  } catch(e) {} },
}

export default function GamePage() {
  const { roomId } = useParams<{ roomId: string }>()
  const router = useRouter()
  const [gameState, setGameState] = useState<any>(null)
  const [myPlayerId, setMyPlayerId] = useState('')
  const [tab, setTab] = useState<Tab>('feed')
  const [showTurnCard, setShowTurnCard] = useState(false)
  const [queueMode, setQueueMode] = useState(false) // показываем карточку из очереди
  const [currentCell, setCurrentCell] = useState<typeof BOARD_CELLS[0] | null>(null)
  const [rolling, setRolling] = useState(false)
  const [anyoneRolling, setAnyoneRolling] = useState(false)
  const anyoneRollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [diceValue, setDiceValue] = useState<number | null>(null)
  const [diceValue2, setDiceValue2] = useState<number | null>(null) // второй кубик
  const [notification, setNotification] = useState<{msg:string,color:string}|null>(null)
  const [cashNotif, setCashNotif] = useState<{ label: string; amount: number; positive: boolean; color?: string } | null>(null)
  const [cashColor, setCashColor] = useState<'pos' | 'neg' | null>(null)
  const cashNotifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showIntro, setShowIntro] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<any>(null)
  const [dealPool, setDealPool] = useState<any[]>([])
  const [showCredit, setShowCredit] = useState(false)
  const [pickedHit, setPickedHit] = useState<{ desc: string; amount: number } | null>(null)
  const [pickedEvent, setPickedEvent] = useState<{ desc: string; effect: string } | null>(null)
  const [auctionAsset, setAuctionAsset] = useState<any>(null)
  const [myBid, setMyBid] = useState('')
  const [auctionSubmitted, setAuctionSubmitted] = useState(false)
  const [showOpenAuctionModal, setShowOpenAuctionModal] = useState(false)
  const [showDDS, setShowDDS] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showEmergency, setShowEmergency] = useState(false)
  const [showBankrupt, setShowBankrupt] = useState(false)
  const [winner, setWinner] = useState<any>(null)
  const [sellOffer, setSellOffer] = useState<{offer:any, asset:any, price:number}|null>(null)
  const [showAuctionCredit, setShowAuctionCredit] = useState(false)
  const [showNotifSettings, setShowNotifSettings] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState({
    hit: true,
    event: true,
    market: true,
    auction: true,
    opportunity: true,
    baby_others: true,
    sound: true,
    mutedTickers: [] as string[],
  })
  const notifPrefsRef = useRef(notifPrefs)
  useEffect(() => { notifPrefsRef.current = notifPrefs }, [notifPrefs])

  // Обёртки звука с проверкой настроек
  const snd = {
    dice:     () => { if(notifPrefsRef.current.sound) sounds.dice() },
    buy:      () => { if(notifPrefsRef.current.sound) sounds.buy() },
    salary:   () => { if(notifPrefsRef.current.sound) sounds.salary() },
    hit:      () => { if(notifPrefsRef.current.sound) sounds.hit() },
    victory:  () => { if(notifPrefsRef.current.sound) sounds.victory() },
    bankrupt: () => { if(notifPrefsRef.current.sound) sounds.bankrupt() },
    timeup:   () => { if(notifPrefsRef.current.sound) sounds.timeup() },
    drumroll: () => { if(notifPrefsRef.current.sound) sounds.drumroll() },
  }
  const [balanceTab, setBalanceTab] = useState<'overview'|'assets'|'debts'>('overview')
  const [journalFilter, setJournalFilter] = useState<'all'|'mine'|'money'|'global'>('all')
  const seenOpenAuctionRef = useRef<string | null>(null)
  const [marketData, setMarketData] = useState<any>(null)
  const [marketQty, setMarketQty] = useState(1)
  const [lastMarketTimestamp, setLastMarketTimestamp] = useState(0)
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [babyEvent, setBabyEvent] = useState<any>(null)
  const [othersQueue, setOthersQueue] = useState<any[]>([]) // очередь уведомлений от других игроков
  const [giftAmount, setGiftAmount] = useState(1000)
  const [boardView, setBoardView] = useState<'tape' | 'square'>('square')
  const channelRef = useRef<any>(null)
  const bcChannelRef = useRef<any>(null)
  const latestStateRef = useRef<any>(null) // последний сохранённый стейт после броска
  const bankruptProcessedRef = useRef(false) // флаг чтобы не запускать банкротство дважды
  const [roomStatus, setRoomStatus] = useState<string>('lobby')
  const [roomCode, setRoomCode] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [hasRolled, setHasRolled] = useState(false)
  const [onlinePlayers, setOnlinePlayers] = useState<Set<string>>(new Set())
  const [reconnected, setReconnected] = useState(false)
  const [gameTimeLeft, setGameTimeLeft] = useState<number|null>(null)
  const [showTimeUp, setShowTimeUp] = useState(false)
  const TIME_LIMIT = 60

  const myPlayer: Player | undefined = gameState?.players?.find((p: Player) => p.id === myPlayerId)
  const currentPlayer: Player | undefined = gameState?.players?.[0]
  const isMyTurn = currentPlayer?.id === myPlayerId

  // Активный управляющий ботами: хост если онлайн, иначе первый онлайн-игрок
  const humanPlayerIds = (gameState?.players ?? []).filter((p: any) => !p.is_bot).map((p: any) => p.id)
  const onlineHumans = humanPlayerIds.filter((id: string) => onlinePlayers.has(id) || id === myPlayerId)
  const effectiveHost = isHost || (onlineHumans.length > 0 && onlineHumans[0] === myPlayerId)

  // Показываем анимацию броска: мой бросок ИЛИ ход бота (не нужен state — вычисляем сразу)
  const showDiceRolling = rolling || anyoneRolling || (!isMyTurn && !!currentPlayer?.is_bot)

  useEffect(() => {
    const pid = localStorage.getItem(`svoboda_player_${roomId}`)
    if (!pid) { router.push('/lobby'); return }
    setMyPlayerId(pid)
    if (!localStorage.getItem(`svoboda_intro_${roomId}`)) setShowIntro(true)
    db.from('rooms').select('game_state, status, code, host_id').eq('id', roomId).single()
      .then(({ data }: {data: any}) => {
        if (data) {
          setGameState(data.game_state)
          setRoomStatus(data.status)
          setRoomCode(data.code)
          setIsHost(data.host_id === pid)
        }
      })
    const channel = supabase.channel(`room-${roomId}`)
    channel
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload: any) => {
          setGameState(payload.new.game_state)
          setRoomStatus(payload.new.status)
        }
      )
      .subscribe()
    channelRef.current = channel

    const bcChannel = supabase.channel(`bc-${roomId}`)
    bcChannelRef.current = bcChannel
    bcChannel
      .on('broadcast', { event: 'rolling' }, ({ payload }: any) => {
        if (payload?.player_id === pid) return
        setAnyoneRolling(true)
        let count = 0
        const anim = setInterval(() => {
          setDiceValue(Math.floor(Math.random() * 6) + 1)
          if (++count > 8) clearInterval(anim)
        }, 80)
        if (anyoneRollingTimerRef.current) clearTimeout(anyoneRollingTimerRef.current)
        anyoneRollingTimerRef.current = setTimeout(() => setAnyoneRolling(false), 2000)
      })
      .on('broadcast', { event: 'rolled' }, ({ payload }: any) => {
        if (payload?.player_id === pid) return
        if (payload?.roll) setDiceValue(payload.roll)
        setAnyoneRolling(false)
        if (anyoneRollingTimerRef.current) clearTimeout(anyoneRollingTimerRef.current)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel); supabase.removeChannel(bcChannel) }
  }, [roomId])

  useEffect(() => {
    if (!gameState || !currentPlayer?.is_bot) return
    // Анимация кубика для всех
    let botAnimCount = 0
    const botAnim = setInterval(() => { setDiceValue(Math.floor(Math.random()*6)+1); if(++botAnimCount>10) clearInterval(botAnim) }, 80)
    // Ход только у хоста
    if (!isHost) {
      return () => { clearInterval(botAnim) }
    }
    const timer = setTimeout(async () => {
      setAnyoneRolling(false)
      const roll = rollDice()
      setDiceValue(roll)
      const botDiff = (gameState?.settings?.difficulty ?? 'normal') as GameDifficulty
      const botBoard = getBoardCells(botDiff)
      const { player: movedPlayer, cell, passed_salary, salary_count } = movePlayer(currentPlayer, roll, botBoard)
      let updatedPlayer = movedPlayer
      const botR = gameState?.round ?? 1
      let botSalaryAmount = 0
      const botDivEnabled = gameState?.settings?.dividend_enabled !== false
      const botDivAmount = botDivEnabled ? calcDividends(updatedPlayer, gameState?.market_prices ?? {}, STOCKS) : 0
      if (passed_salary) {
        for (let s = 0; s < salary_count; s++) {
          const div = s === 0 ? botDivAmount : 0
          const { player: w, amount, dividends } = collectSalary(updatedPlayer, div)
          updatedPlayer = w; botSalaryAmount += amount + dividends
        }
      }
      if (cell.type === 'salary') {
        const { player: w, amount, dividends } = collectSalary(updatedPlayer, botDivAmount)
        updatedPlayer = w; botSalaryAmount += amount + dividends
      }
      const botEvents: any[] = [{ id: crypto.randomUUID(), round: botR, player_id: currentPlayer.id, player_name: currentPlayer.name, type: 'roll', description: `${currentPlayer.name} бросает кубик: ${roll} → ${cell.label}`, created_at: new Date().toISOString() }]

if ((cell.type === 'salary' || passed_salary) && botSalaryAmount > 0) {
  botEvents.push({ id: crypto.randomUUID(), round: botR, player_id: currentPlayer.id, player_name: currentPlayer.name, type: 'salary', description: `${currentPlayer.name} получает ${cell.type==='salary'?'зарплату':'денежный поток'}: +₽${botSalaryAmount.toLocaleString()}`, amount: botSalaryAmount, created_at: new Date().toISOString() })
}

if (cell.type === 'child') {
  const childExpense = Math.round((currentPlayer.profession?.salary ?? 100000) * 0.10)
  updatedPlayer = {
    ...updatedPlayer,
    total_expenses: updatedPlayer.total_expenses + childExpense,
    debts: [...updatedPlayer.debts, { name: 'Расходы на ребёнка 👶', amount: 0, monthly: childExpense }],
    children: (updatedPlayer.children ?? 0) + 1,
  }
  botEvents.push({ id: crypto.randomUUID(), round: gameState?.round??1, player_id: currentPlayer.id, player_name: currentPlayer.name, type: 'child', description: `${currentPlayer.name} — родился ребёнок! +₽${childExpense.toLocaleString()}/мес`, created_at: new Date().toISOString() })
}

if (cell.type === 'opportunity') {
  // Бот выбирает малую или крупную сделку случайно, потом решает покупать
  const size = Math.random() > 0.5 ? 'large' : 'small'
  const asset = getRandomDeal(size)
  if (asset && botDecide(updatedPlayer, asset) === 'buy') {
    const { player: w, success } = buyAsset(updatedPlayer, asset, gameState?.key_rate ?? KEY_RATE_DEFAULT)
    if (success) {
      updatedPlayer = w
      botEvents.push({ id: crypto.randomUUID(), round: botR, player_id: currentPlayer.id, player_name: currentPlayer.name, type: 'buy', description: `${currentPlayer.name} купил ${asset.name} за ₽${asset.down_payment.toLocaleString()}`, amount: asset.down_payment, created_at: new Date().toISOString() })
    }
  }
}

if (cell.type === 'hit') {
  const hitEvent = getRandomHit()
  const hitAmount = Math.round(hitEvent.amount * (DIFFICULTY_CONFIG[botDiff]?.hit_multiplier ?? 1))
  updatedPlayer = { ...updatedPlayer, cash: updatedPlayer.cash - hitAmount }
  botEvents.push({ id: crypto.randomUUID(), round: botR, player_id: currentPlayer.id, player_name: currentPlayer.name, type: 'hit', description: `${currentPlayer.name} — ${hitEvent.desc}: −₽${hitAmount.toLocaleString()}`, amount: hitAmount, created_at: new Date().toISOString() })
}

if (cell.type === 'auction') {
  const aAsset = getRandomAuctionAsset()
  if (aAsset && updatedPlayer.cash >= aAsset.down_payment) {
    const { player: w, success } = buyAsset(updatedPlayer, aAsset, gameState?.key_rate ?? KEY_RATE_DEFAULT)
    if (success) {
      updatedPlayer = w
      botEvents.push({ id: crypto.randomUUID(), round: botR, player_id: currentPlayer.id, player_name: currentPlayer.name, type: 'auction_win', description: `${currentPlayer.name} выиграл аукцион: ${aAsset.name} за ₽${aAsset.down_payment.toLocaleString()}`, amount: aAsset.down_payment, created_at: new Date().toISOString() })
    }
  }
}

const newPlayers = gameState.players.map((p: Player) => p.id === currentPlayer.id ? updatedPlayer : p)
const [cur, ...rest] = newPlayers
let botNewState: any = { ...gameState, players: [...rest, cur], events: [...botEvents, ...(gameState.events||[])].slice(0,50) }

if (cell.type === 'child') {
  botNewState.baby_event = { player_id: currentPlayer.id, player_name: currentPlayer.name, timestamp: Date.now() }
}




if (cell.type === 'market') {
  const isStock = cell.data?.market_type === 'stock'
  const lastBotTicker = gameState.market_event?.ticker
  let botTicker = cell.data.ticker
  if (botTicker === lastBotTicker) {
    const pool = isStock
      ? STOCKS.map((s:any) => s.ticker).filter((t:string) => t !== botTicker)
      : CRYPTO.map((c:any) => c.ticker).filter((t:string) => t !== botTicker)
    if (pool.length > 0) botTicker = pool[Math.floor(Math.random() * pool.length)]
  }
  const item = isStock ? getStockByTicker(botTicker) : getCryptoByTicker(botTicker)
  if (item) {
    const currentPrice = gameState.market_prices?.[botTicker] ?? item.price
    const newPrice = getNewPrice(currentPrice, item.min, item.max, item.volatility, gameState?.volatility_profile?.[botTicker] ?? 1)
    const pct = Math.round(((newPrice - currentPrice) / currentPrice) * 100)
    const md = { ...item, newPrice, oldPrice: currentPrice, emoji: getPriceChangeEmoji(currentPrice, newPrice), pct, isStock }
    botNewState.market_prices = { ...gameState.market_prices, [botTicker]: newPrice }
    botNewState.market_event = { ...md, player_name: currentPlayer.name, timestamp: Date.now() }
  }
}

await db.from('rooms').update({ game_state: botNewState }).eq('id', roomId)
    }, 1500)
    return () => { clearTimeout(timer); clearInterval(botAnim) }
  }, [gameState?.players?.[0]?.id])



  // Боты скидываются на памперсы
  useEffect(() => {
    if (!gameState?.baby_event) return
    if (!gameState.baby_event.timestamp) return
    const bots = gameState.players.filter((p: any) =>
      p.is_bot && p.id !== gameState.baby_event.player_id
    )
    if (bots.length === 0) return
    bots.forEach((bot: any) => {
      if (Math.random() > 0.6) return
      const maxGift = Math.min(bot.cash * 0.05, 5000)
      if (maxGift < 500) return
      const gift = Math.round(Math.random() * maxGift / 500) * 500 || 500
      setTimeout(async () => {
        const fresh = await db.from('rooms').select('game_state').eq('id', roomId).single()
        if (!fresh.data) return
        const state = fresh.data.game_state
        const recipient = state.players.find((p: any) => p.id === gameState.baby_event.player_id)
        const botPlayer = state.players.find((p: any) => p.id === bot.id)
        if (!recipient || !botPlayer || botPlayer.cash < gift) return
        const newPlayers = state.players.map((p: any) =>
          p.id === bot.id ? { ...p, cash: p.cash - gift } :
          p.id === gameState.baby_event.player_id ? { ...p, cash: p.cash + gift } : p
        )
        const newEvent = { id: crypto.randomUUID(), round: gameState?.round??1, player_id: bot.id, player_name: bot.name, type: 'child', description: `${bot.name} подарил ${gameState.baby_event.player_name} ₽${gift.toLocaleString()} на памперсы 🍼`, created_at: new Date().toISOString() }
        await db.from('rooms').update({
          game_state: { ...state, players: newPlayers, events: [newEvent, ...(state.events||[])].slice(0, 50) }
        }).eq('id', roomId)
      }, Math.random() * 3000 + 1000)
    })
  }, [gameState?.baby_event?.timestamp])


  // Сбрасываем количество когда меняется marketData
  useEffect(() => { setMarketQty(1) }, [marketData])



// После useEffect для marketQty
useEffect(() => {
  if (!gameState?.market_event) return
  if (gameState.market_event.timestamp === lastMarketTimestamp) return
  setLastMarketTimestamp(gameState.market_event.timestamp)
  if (myPlayer && gameState.market_event.player_name !== myPlayer.name) {
    const ticker = gameState.market_event.ticker
    const prefs = notifPrefsRef.current
    if (prefs.market && !prefs.mutedTickers.includes(ticker)) {
      // Добавляем в очередь, а не показываем сразу
      setOthersQueue(q => [...q, { kind: 'market', data: gameState.market_event }])
    }
  }
}, [gameState?.market_event?.timestamp])

// Показываем следующий элемент очереди когда turn card закрыта
useEffect(() => {
  if (othersQueue.length === 0 || showTurnCard) return
  const item = othersQueue[0]
  if (item.kind === 'market') {
    setMarketData(item.data)
    setCurrentCell({ type: 'market', label: 'Биржа', data: { ticker: item.data.ticker, market_type: item.data.isStock ? 'stock' : 'crypto' } })
  } else if (item.kind === 'baby') {
    setBabyEvent(item.data)
    return // baby показывается через свой модал
  }
  setQueueMode(true)
  setShowTurnCard(true)
}, [othersQueue, showTurnCard])

const [lastBabyTimestamp, setLastBabyTimestamp] = useState(0)
useEffect(() => {
  if (!gameState?.baby_event) return
  if (gameState.baby_event.timestamp === lastBabyTimestamp) return
  setLastBabyTimestamp(gameState.baby_event.timestamp)
  if (gameState.baby_event.player_id !== myPlayerId && notifPrefsRef.current.baby_others) {
    setOthersQueue(q => [...q, { kind: 'baby', data: gameState.baby_event }])
  }
}, [gameState?.baby_event?.timestamp])

// Уведомление получателю подарка на памперсы
const seenGiftEventsRef = useRef<Set<string>>(new Set())
useEffect(() => {
  if (!gameState?.events || !myPlayerId) return
  const myName = gameState.players?.find((p: any) => p.id === myPlayerId)?.name
  if (!myName) return
  for (const e of gameState.events) {
    if (e.type !== 'child' || e.player_id === myPlayerId || seenGiftEventsRef.current.has(e.id)) continue
    if (!e.description?.includes(myName)) continue
    seenGiftEventsRef.current.add(e.id)
    const match = e.description.match(/₽([\d\s]+)/)
    if (match) {
      const amount = parseInt(match[1].replace(/\s/g, ''))
      showCashNotif(`${e.player_name} подарил на памперсы 🍼`, amount, true)
    }
  }
}, [gameState?.events])

useEffect(() => {
  if (!gameState?.rolling_player_id || gameState.rolling_player_id === myPlayerId) return
  setAnyoneRolling(true)
  if (anyoneRollingTimerRef.current) clearTimeout(anyoneRollingTimerRef.current)
  anyoneRollingTimerRef.current = setTimeout(() => setAnyoneRolling(false), 2000)
}, [gameState?.rolling_player_id])

// Мгновенный показ аукционного лота всем игрокам кроме открывшего
useEffect(() => {
  if (!gameState?.open_auction || !myPlayerId) return
  const offer = gameState.open_auction
  const key = `${offer.asset?.id}_${offer.from_id}`
  if (key === seenOpenAuctionRef.current) return
  if (offer.from_id === myPlayerId) return // открывший уже видел
  seenOpenAuctionRef.current = key
  // Добавляем в очередь
  if (notifPrefsRef.current.auction) {
    setOthersQueue(q => [...q, { kind: 'auction', data: offer }])
  }
}, [gameState?.open_auction])

// Сброс таймера и флага при смене хода
useEffect(() => {
  setTimeLeft(TIME_LIMIT)
  setHasRolled(false)
}, [gameState?.players?.[0]?.id])

// Проверка победителя — следим за всеми игроками
useEffect(() => {
  if (!gameState || roomStatus !== 'playing' || winner) return
  // Если победитель уже записан в game_state (от другого клиента)
  if (gameState.winner_id) {
    const w = (gameState.players || []).find((p: any) => p.id === gameState.winner_id)
    if (w) { setWinner(w); setTimeout(()=>sounds.drumroll(),300); setTimeout(()=>sounds.victory(),1000); return }
}
  // Проверяем сами
  const w = (gameState.players || []).find((p: any) => freedomProgress(p) >= 100)
  if (w) {
    setWinner(w)
    setTimeout(()=>sounds.drumroll(),300); setTimeout(()=>sounds.victory(),1100)
    if (isHost) {
      db.from('rooms').update({ game_state: { ...gameState, winner_id: w.id } }).eq('id', roomId)
    }
  }
}, [gameState?.winner_id, gameState?.players?.map((p:any)=>p.passive_income+'/'+p.total_expenses).join(',')])

// Проверка банкротства при каждом ходе
useEffect(() => {
  if (!myPlayer || !gameState || roomStatus !== 'playing') return
  if ((myPlayer as any).is_eliminated) {
    // Уже выбыл — если наш ход, автоматически пропускаем
    if (isMyTurn && !rolling) {
      advanceTurn(gameState)
    }
    return
  }
  if (!isMyTurn) return
  // Проверяем условие кризиса: наличные < 0 И денежный поток < 0
  const netFlow = (myPlayer.profession?.salary ?? 0) + myPlayer.passive_income - myPlayer.total_expenses
  if (myPlayer.cash < 0 && netFlow < 0 && !bankruptProcessedRef.current && !(myPlayer as any).is_eliminated) {
    bankruptProcessedRef.current = true // блокируем повторный запуск
    const hasAssets = myPlayer.assets.length > 0
    const hasCreditLimit = getCreditLimit(myPlayer) > 0
    if (hasAssets || hasCreditLimit) {
      setShowEmergency(true)
    } else {
      const doEliminate = async () => {
        const ev = { id: crypto.randomUUID(), round: gameState.round??1, player_id: myPlayerId, player_name: myPlayer.name, type: 'hit', description: `${myPlayer.name} выбывает — нет средств для покрытия долгов`, created_at: new Date().toISOString() }
        const newPlayers = gameState.players.map((p:any) => p.id === myPlayerId ? {...p, is_eliminated: true} : p)
        const newState = {...gameState, players: newPlayers, events: [ev, ...(gameState.events||[])].slice(0,50)}
        latestStateRef.current = newState
        await db.from('rooms').update({ game_state: newState }).eq('id', roomId)
        setShowBankrupt(true)
      }
      doEliminate()
    }
  }
}, [isMyTurn, myPlayer?.cash, myPlayer?.passive_income, myPlayer?.total_expenses, (myPlayer as any)?.is_eliminated])

// Отсчёт таймера хода
useEffect(() => {
  if (roomStatus !== 'playing' || !gameState) return
  if (showBankrupt || showEmergency) return
  if (timeLeft <= 0) {
    if (isMyTurn && !rolling) {
      // Мой ход истёк
      if (!hasRolled) handleRoll()
      else { setShowTurnCard(false); advanceTurn(gameState) }
    } else if (isHost && !rolling) {
      // Застрял чужой ход — хост форсирует продолжение
      advanceTurn(gameState)
    }
    return
  }
  const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
  return () => clearTimeout(t)
}, [timeLeft, roomStatus, gameState, hasRolled, showBankrupt, showEmergency, isMyTurn, isHost, rolling])

// Глобальный таймер игры
useEffect(() => {
  if (roomStatus !== 'playing' || !gameState) return
  const duration = gameState.settings?.game_duration ?? 0
  if (!duration) return // без ограничения
  // Инициализируем из game_state или вычисляем
  if (!gameState.game_started_at) return
  const elapsed = Math.floor((Date.now() - new Date(gameState.game_started_at).getTime()) / 1000)
  const totalSecs = duration * 60
  const remaining = totalSecs - elapsed
  if (remaining <= 0) {
    setGameTimeLeft(0)
    return
  }
  setGameTimeLeft(remaining)
  const t = setInterval(() => {
    setGameTimeLeft(prev => {
      if (prev === null || prev <= 1) {
        clearInterval(t)
        setShowTimeUp(true)
        sounds.timeup()
        return 0
      }
      return prev - 1
    })
  }, 1000)
  return () => clearInterval(t)
}, [roomStatus, gameState?.game_started_at, gameState?.settings?.game_duration])

// Presence — отслеживаем кто онлайн
useEffect(() => {
  if (!myPlayerId || !roomId) return
  const presenceChannel = supabase.channel(`presence-${roomId}`, { config: { presence: { key: myPlayerId } } })
  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState()
      setOnlinePlayers(new Set(Object.keys(state)))
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({ player_id: myPlayerId, online_at: Date.now() })
      }
    })
  return () => { supabase.removeChannel(presenceChannel) }
}, [myPlayerId, roomId])

// Определяем переподключение через visibility API
useEffect(() => {
  const handler = () => {
    if (document.visibilityState === 'visible' && roomStatus === 'playing') {
      setReconnected(true)
      setTimeout(() => setReconnected(false), 3000)
    }
  }
  document.addEventListener('visibilitychange', handler)
  return () => document.removeEventListener('visibilitychange', handler)
}, [roomStatus])

  function showNotif(msg: string, color = '#34D399') { setNotification({msg,color}); setTimeout(() => setNotification(null), 2500) }

  function showCashNotif(label: string, amount: number, positive: boolean, color?: string, type?: string) {
    // Верхний баннер показывается ВСЕГДА — не зависит от настроек
    setCashNotif({ label, amount, positive, color })
    setCashColor(positive ? 'pos' : 'neg')
    if (cashNotifTimerRef.current) clearTimeout(cashNotifTimerRef.current)
    cashNotifTimerRef.current = setTimeout(() => { setCashNotif(null); setCashColor(null) }, 2500)
  }

  async function handleRoll() {
    if (!isMyTurn || rolling || !myPlayer || !gameState) return
    if ((myPlayer as any).is_eliminated) { advanceTurn(gameState); return }
    // Двойной кубик (благотворительность)
    const doubleDiceRounds = (myPlayer as any).double_dice_rounds ?? 0

    // Пропуск хода из-за сокращения/болезни
    if ((myPlayer as any).skip_turns > 0) {
      const remaining = (myPlayer as any).skip_turns - 1
      const updatedPlayer = { ...myPlayer, skip_turns: remaining }
      const newPlayers = gameState.players.map((p: Player) => p.id === myPlayerId ? updatedPlayer : p)
      const ev = { id: crypto.randomUUID(), round: gameState.round??1, player_id: myPlayerId, player_name: myPlayer.name, type: 'hit', description: `${myPlayer.name} пропускает ход (осталось: ${remaining})`, created_at: new Date().toISOString() }
      const newState = { ...gameState, players: newPlayers, events: [ev, ...(gameState.events||[])].slice(0,50) }
      latestStateRef.current = newState
      await db.from('rooms').update({ game_state: newState }).eq('id', roomId)
      showNotif(remaining > 0 ? `⏸ Пропуск хода (осталось ${remaining})` : '▶ Снова в игре!', remaining > 0 ? '#F87171' : '#34D399')
      advanceTurn(newState); return
    }
    setRolling(true)
    setHasRolled(true)
    const bc = bcChannelRef.current
    bc?.send({ type: 'broadcast', event: 'rolling', payload: { player_id: myPlayerId } })
    db.from('rooms').update({ game_state: { ...gameState, rolling_player_id: myPlayerId } }).eq('id', roomId)
  snd.dice()
    setDiceValue2(null)
    // Кубик крутится через CSS-анимацию (svDice3D), без JS-интервала
    setTimeout(async () => {
      const roll1 = rollDice()
      const roll2 = doubleDiceRounds > 0 ? rollDice() : null
      const roll = roll2 !== null ? roll1 + roll2 : roll1
      setDiceValue(roll1)
      if (roll2 !== null) setDiceValue2(roll2)
      setRolling(false)
      bc?.send({ type: 'broadcast', event: 'rolled', payload: { player_id: myPlayerId, roll } })
      const { player: movedPlayer, cell, passed_salary, salary_count } = movePlayer(myPlayer, roll, boardCells)
      let updatedPlayer = movedPlayer
      let salaryEvent: any = null
      // Дивиденды начисляются при каждом прохождении через зарплату
      const dividendEnabled = gameState?.settings?.dividend_enabled !== false
      const divAmount = dividendEnabled ? calcDividends(updatedPlayer, gameState?.market_prices ?? {}, STOCKS) : 0
      // Начисляем зарплату за каждую пройденную клетку зарплаты
      if (passed_salary) {
        let totalAmount = 0
        for (let s = 0; s < salary_count; s++) {
          const div = s === 0 ? divAmount : 0 // дивиденды 1 раз за оборот
          const { player: w, amount } = collectSalary(updatedPlayer, div)
          updatedPlayer = w
          totalAmount += amount + div
        }
        snd.salary(); showCashNotif('Денежный поток', totalAmount, true, undefined, 'salary')
        const divNote = divAmount > 0 ? ` + дивиденды ₽${divAmount.toLocaleString()}` : ''
        salaryEvent = { id: crypto.randomUUID(), round: gameState.round??1, player_id: myPlayerId, player_name: myPlayer.name, type: 'salary', description: `${myPlayer.name} получил денежный поток: +₽${totalAmount.toLocaleString()}${divNote}`, amount: totalAmount, created_at: new Date().toISOString() }
      }
      if (cell.type === 'salary') {
        const { player: w, amount, dividends } = collectSalary(updatedPlayer, divAmount)
        updatedPlayer = w
        const totalSalary = amount + dividends
        snd.salary(); showCashNotif('Зарплата', totalSalary, true, undefined, 'salary')
        const divNote = dividends > 0 ? ` + дивиденды ₽${dividends.toLocaleString()}` : ''
        salaryEvent = { id: crypto.randomUUID(), round: gameState.round??1, player_id: myPlayerId, player_name: myPlayer.name, type: 'salary', description: `${myPlayer.name} получил зарплату: +₽${totalSalary.toLocaleString()}${divNote}`, amount: totalSalary, created_at: new Date().toISOString() }
      }
      setCurrentCell(cell)
      setSelectedDeal(null)
      setSellOffer(null)
      setShowAuctionCredit(false)
      setDealPool([...getRandomDeals(3, SMALL_DEALS), ...getRandomDeals(3, LARGE_DEALS)])
      setShowCredit(false)
      setMarketData(null)
      setAuctionSubmitted(false)
      setMyBid('')
      if (cell.type === 'hit') {
        setPickedHit(getRandomHit())
      } else if (cell.type === 'event') {
        // 35% шанс получить предложение о продаже (если есть подходящие активы)
        const sellableAssets = updatedPlayer.assets.filter((a:any) => a.type === 'real_estate' || a.type === 'business')
        if (sellableAssets.length > 0 && Math.random() < 0.35) {
          const asset = sellableAssets[Math.floor(Math.random() * sellableAssets.length)]
          const offer = getRandomSellOffer(asset.type as 'real_estate'|'business')
          if (offer) {
            const mult = offer.multiplierMin + Math.random() * (offer.multiplierMax - offer.multiplierMin)
            const base = asset.down_payment ?? asset.price // считаем от первоначального взноса
            const offerPrice = Math.round(base * mult / 50000) * 50000
            setSellOffer({ offer, asset, price: offerPrice })
          } else {
            setPickedEvent(getRandomEvent())
          }
        } else {
          setPickedEvent(getRandomEvent())
        }
      } else if (cell.type === 'auction') {
        const aAsset = getRandomAuctionAsset()
        setAuctionAsset(aAsset)
        // timer removed — auction is immediate
      }
      // Уменьшаем счётчик двойного кубика
      if (doubleDiceRounds > 0) {
        updatedPlayer = { ...updatedPlayer, double_dice_rounds: doubleDiceRounds - 1 } as any
      }
      const newPlayers = gameState.players.map((p: Player) => p.id === myPlayerId ? updatedPlayer : p)
      const round = gameState.round ?? 1
      const diceDesc = doubleDiceRounds > 0 ? `🎲🎲 ${roll}` : `${roll}`
      const rollEvent = { id: crypto.randomUUID(), round, player_id: myPlayerId, player_name: myPlayer.name, type: 'roll', description: `${myPlayer.name} бросает кубик: ${diceDesc} → ${cell.label}`, created_at: new Date().toISOString() }
      const eventsToAdd = salaryEvent ? [salaryEvent, rollEvent] : [rollEvent]
      let newState: any = { ...gameState, players: newPlayers, events: [...eventsToAdd, ...(gameState.events||[])].slice(0,50), rolling_player_id: myPlayerId }

      if (cell.type === 'child') {
        newState.baby_event = { player_id: myPlayerId, player_name: myPlayer.name, timestamp: Date.now() }
      }
      if (cell.type === 'market') {
        const isStock = cell.data?.market_type === 'stock'
        const lastTicker = gameState.market_event?.ticker
        let ticker = cell.data.ticker
        // Если тот же тикер что и последний раз — берём случайный другой из той же категории
        if (ticker === lastTicker) {
          const pool = isStock
            ? STOCKS.map((s:any) => s.ticker).filter((t:string) => t !== ticker)
            : CRYPTO.map((c:any) => c.ticker).filter((t:string) => t !== ticker)
          if (pool.length > 0) ticker = pool[Math.floor(Math.random() * pool.length)]
        }
        const item = isStock ? getStockByTicker(ticker) : getCryptoByTicker(ticker)
        if (item) {
          const currentPrice = gameState.market_prices?.[ticker] ?? item.price
          const newPrice = getNewPrice(currentPrice, item.min, item.max, item.volatility, gameState?.volatility_profile?.[ticker] ?? 1)
          const pct = Math.round(((newPrice - currentPrice) / currentPrice) * 100)
          const md = { ...item, newPrice, oldPrice: currentPrice, emoji: getPriceChangeEmoji(currentPrice, newPrice), pct, isStock }
          if (!notifPrefsRef.current.mutedTickers.includes(ticker)) setMarketData(md)
          newState.market_prices = { ...gameState.market_prices, [ticker]: newPrice }
          newState.market_event = { ...md, player_name: myPlayer.name, timestamp: Date.now() }
        }
      }
      latestStateRef.current = newState
      await db.from('rooms').update({ game_state: newState }).eq('id', roomId)

      const prefs = notifPrefsRef.current

      // Удар отключён → списать деньги автоматически + верхний баннер
      if (cell.type === 'hit' && !prefs.hit && pickedHit) {
        const amount = Math.round(pickedHit.amount * diffConfig.hit_multiplier)
        const updatedAfterHit = { ...updatedPlayer, cash: updatedPlayer.cash - amount }
        const hitPlayers = gameState.players.map((p: Player) => p.id === myPlayerId ? updatedAfterHit : p)
        const hitEv = { id: crypto.randomUUID(), round: gameState.round??1, player_id: myPlayerId, player_name: myPlayer.name, type: 'hit', description: `${myPlayer.name} — ${pickedHit.desc}: −₽${amount.toLocaleString()}`, amount, created_at: new Date().toISOString() }
        const autoState = { ...newState, players: hitPlayers, events: [hitEv, ...(newState.events||[])].slice(0,50) }
        latestStateRef.current = autoState
        showCashNotif(pickedHit.desc, amount, false)
        snd.hit()
        await db.from('rooms').update({ game_state: autoState }).eq('id', roomId)
        setTimeout(() => advanceTurn(autoState), 800)
        return
      }

      // Событие отключено → применяем эффект автоматически
      if (cell.type === 'event' && !prefs.event && pickedEvent) {
        setTimeout(async () => { await handlePass() }, 800)
        return
      }

      // Биржа отключена / тикер заглушён → обновляем цену, передаём ход
      if (cell.type === 'market' && (!prefs.market || (cell.data?.ticker && prefs.mutedTickers.includes(cell.data.ticker)))) {
        setTimeout(() => advanceTurn(newState), 800)
        return
      }
      // Аукцион отключён → передаём ход без карточки
      if (cell.type === 'auction' && !prefs.auction) {
        setTimeout(() => advanceTurn(newState), 800)
        return
      }
      // Сделки отключены → передаём ход без карточки
      if (cell.type === 'opportunity' && !prefs.opportunity) {
        setTimeout(() => advanceTurn(newState), 800)
        return
      }

      if (['opportunity','hit','event','auction','market','child','charity'].includes(cell.type)) {
        setTimeout(() => setShowTurnCard(true), 400)
      } else {
        setTimeout(() => advanceTurn(newState), 800)
      }
    }, 800)
  }

  async function handleBuy(asset: any) {
    if (!myPlayer || !asset || !gameState || !isMyTurn || !hasRolled) return
    const { player: updatedPlayer, success, reason } = buyAsset(myPlayer, asset, keyRate)
    if (!success) { showNotif(reason || 'Недостаточно средств', '#F87171'); return }
    const newPlayers = gameState.players.map((p: Player) => p.id === myPlayerId ? updatedPlayer : p)
    const newEvent = { id: crypto.randomUUID(), round: gameState?.round??1, player_id: myPlayerId, player_name: myPlayer.name, type: 'buy', description: `${myPlayer.name} купил ${selectedDeal.name}`, amount: selectedDeal.down_payment, created_at: new Date().toISOString() }
    const newState = { ...gameState, players: newPlayers, events: [newEvent, ...(gameState.events||[])].slice(0,50) }
    snd.buy()
    showCashNotif(asset.name, selectedDeal.down_payment, false)
    setShowTurnCard(false)
    if (updatedPlayer.is_free) { await db.from('rooms').update({ game_state: newState }).eq('id', roomId); return } // победа поймается через useEffect
    await db.from('rooms').update({ game_state: newState }).eq('id', roomId)
    advanceTurn(newState)
  }

  async function handlePass() {
    setShowTurnCard(false)
    if (!isMyTurn || !hasRolled) return
    // Используем актуальный стейт из ref (с событиями от броска), чтобы не затереть их
    const baseState = latestStateRef.current ?? gameState
    if (currentCell?.type === 'hit' && pickedHit && myPlayer && baseState) {
      // Особый тип: пропуск ходов + потеря зарплаты
      if ((pickedHit as any).skip_turns) {
        const skipCount = (pickedHit as any).skip_turns as number
        const salaryLoss = (pickedHit as any).lose_salary ? (myPlayer.profession?.salary ?? 0) : 0
        const updatedPlayer = { ...myPlayer, cash: myPlayer.cash - salaryLoss, skip_turns: skipCount }
        const newPlayers = baseState.players.map((p: Player) => p.id === myPlayerId ? updatedPlayer : p)
        const newEvent = { id: crypto.randomUUID(), round: baseState?.round??1, player_id: myPlayerId, player_name: myPlayer.name, type: 'hit', description: `${myPlayer.name} — ${pickedHit.desc}. Пропускает ${skipCount} хода`, amount: salaryLoss, created_at: new Date().toISOString() }
        const newState = { ...baseState, players: newPlayers, events: [newEvent, ...(baseState.events||[])].slice(0,50) }
        latestStateRef.current = newState
        if (salaryLoss > 0) showCashNotif(`Потеря зарплаты: ${pickedHit.desc}`, salaryLoss, false)
        await db.from('rooms').update({ game_state: newState }).eq('id', roomId)
        advanceTurn(newState); return
      }
      const amount = Math.round(pickedHit.amount * diffConfig.hit_multiplier)
      snd.hit()
      showCashNotif(pickedHit.desc, amount, false, undefined, 'hit')
      const newCash = myPlayer.cash - amount
      const netFlow = (myPlayer.profession?.salary ?? 0) + myPlayer.passive_income - myPlayer.total_expenses
      const updatedPlayer = { ...myPlayer, cash: newCash }
      const newPlayers = baseState.players.map((p: Player) => p.id === myPlayerId ? updatedPlayer : p)
      const newEvent = { id: crypto.randomUUID(), round: baseState?.round??1, player_id: myPlayerId, player_name: myPlayer.name, type: 'hit', description: `${myPlayer.name} — ${pickedHit.desc}: −₽${amount.toLocaleString()}`, amount, created_at: new Date().toISOString() }
      const newState = { ...baseState, players: newPlayers, events: [newEvent, ...(baseState.events||[])].slice(0,50) }
      await db.from('rooms').update({ game_state: newState }).eq('id', roomId)
      // Экстренный экран при наличных < -10K (раньше выбывания)
      if (newCash < -10000) {
        latestStateRef.current = newState
        setShowEmergency(true); return
      }
      // Выбывание при отрицательном денежном потоке
      if (netFlow < 0) {
        const elimEvent = { id: crypto.randomUUID(), round: baseState?.round??1, player_id: myPlayerId, player_name: myPlayer.name, type: 'hit', description: `${myPlayer.name} выбывает — отрицательный денежный поток!`, created_at: new Date().toISOString() }
        const elimState = { ...newState, players: newState.players.map((p:any)=>p.id===myPlayerId?{...p,is_eliminated:true}:p), events: [elimEvent,...newState.events].slice(0,50) }
        latestStateRef.current = elimState
        await db.from('rooms').update({ game_state: elimState }).eq('id', roomId)
        setTimeout(()=>sounds.drumroll(),200); setTimeout(()=>sounds.bankrupt(),1000); setShowBankrupt(true); return
      }
      advanceTurn(newState); return
    }
    if (currentCell?.type === 'event' && pickedEvent && myPlayer && baseState) {
      const effect: string = pickedEvent.effect

      if (effect === 'cash+salary') {
        const bonus = Math.round((myPlayer.profession?.salary ?? 0) * diffConfig.salary_bonus)
        const updatedPlayer = { ...myPlayer, cash: myPlayer.cash + bonus }
        const newPlayers = baseState.players.map((p: Player) => p.id === myPlayerId ? updatedPlayer : p)
        const newEvent = { id: crypto.randomUUID(), round: baseState?.round??1, player_id: myPlayerId, player_name: myPlayer.name, type: 'event', description: `${myPlayer.name}: ${pickedEvent.desc} +₽${bonus.toLocaleString()}`, amount: bonus, created_at: new Date().toISOString() }
        const newState = { ...baseState, players: newPlayers, events: [newEvent, ...(baseState.events||[])].slice(0,50) }
        showCashNotif(pickedEvent.desc, bonus, true, undefined, 'event'); snd.salary()
        await db.from('rooms').update({ game_state: newState }).eq('id', roomId)
        advanceTurn(newState); return
      }

      if (effect === 'expenses+5%') {
        if (!gameSettings.inflation) { advanceTurn(baseState); return }
        const increase = Math.round(myPlayer.total_expenses * 0.05)
        const updatedPlayer = { ...myPlayer, total_expenses: myPlayer.total_expenses + increase }
        const newPlayers = baseState.players.map((p: Player) => p.id === myPlayerId ? updatedPlayer : p)
        const newEvent = { id: crypto.randomUUID(), round: baseState?.round??1, player_id: myPlayerId, player_name: myPlayer.name, type: 'event', description: `${myPlayer.name}: ${pickedEvent.desc} −₽${increase.toLocaleString()}/мес`, amount: -increase, created_at: new Date().toISOString() }
        const newState = { ...baseState, players: newPlayers, events: [newEvent, ...(baseState.events||[])].slice(0,50) }
        showCashNotif(pickedEvent.desc, increase, false, undefined, 'event')
        await db.from('rooms').update({ game_state: newState }).eq('id', roomId)
        advanceTurn(newState); return
      }

      if (effect.startsWith('rate:')) {
        if (!gameSettings.volatile_rate) { advanceTurn(baseState); return }
        const newRate = parseFloat(effect.split(':')[1])
        const newEvent = { id: crypto.randomUUID(), round: baseState?.round??1, player_id: myPlayerId, player_name: myPlayer.name, type: 'event', description: `${pickedEvent.desc}`, created_at: new Date().toISOString() }
        const newState = { ...baseState, key_rate: newRate, events: [newEvent, ...(baseState.events||[])].slice(0,50) }
        await db.from('rooms').update({ game_state: newState }).eq('id', roomId)
        advanceTurn(newState); return
      }
    }
    advanceTurn(baseState)
  }

  async function handleAuctionBuy(bidAmount: number) {
    if (!myPlayer || !auctionAsset || !gameState || !hasRolled) return
    if (myPlayer.cash < bidAmount) { showNotif('Недостаточно наличных', '#F87171'); return }
    const debt = Math.max(0, auctionAsset.price - bidAmount)
    const monthly = debt > 0 ? Math.round(debt * keyRate / 12) : 0
    const updatedPlayer: Player = {
      ...myPlayer,
      cash: myPlayer.cash - bidAmount,
      passive_income: myPlayer.passive_income + auctionAsset.passive_income,
      assets: [...myPlayer.assets, { ...auctionAsset, down_payment: bidAmount, debt }],
      debts: debt > 0 ? [...myPlayer.debts, { name: auctionAsset.name, amount: debt, monthly }] : myPlayer.debts,
      total_expenses: myPlayer.total_expenses + monthly,
    }
    const newPlayers = gameState.players.map((p: Player) => p.id === myPlayerId ? updatedPlayer : p)
    const newEvent = { id: crypto.randomUUID(), round: gameState?.round??1, player_id: myPlayerId, player_name: myPlayer.name, type: 'auction_win', description: `${myPlayer.name} выиграл аукцион: ${auctionAsset.name} за ₽${bidAmount.toLocaleString()}`, created_at: new Date().toISOString() }
    const newState = { ...gameState, players: newPlayers, events: [newEvent, ...(gameState.events||[])].slice(0,50) }
    snd.buy()
    showCashNotif(auctionAsset.name, bidAmount, false)
    setShowTurnCard(false)
    await db.from('rooms').update({ game_state: newState }).eq('id', roomId)
    advanceTurn(newState)
  }

  async function advanceTurn(state: any) {
    if (!state) return
    const [current, ...rest] = state.players
    console.log('[ADVANCE] current:', current?.name, '→ next:', rest[0]?.name, 'players count:', state.players?.length)
    const { error } = await db.from('rooms').update({ game_state: { ...state, players: [...rest, current], rolling_player_id: null } }).eq('id', roomId)
    console.log('[ADVANCE] DB error:', error)
  }

  if (!gameState || !myPlayerId) return (
    <div className="flex min-h-screen items-center justify-center bg-[#07070D]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
        <div className="text-[14px] font-semibold text-faint">Подключение...</div>
      </div>
    </div>
  )

  async function startGame() {
    const initState = gameState ? { ...gameState, key_rate: KEY_RATE_DEFAULT, game_started_at: new Date().toISOString() } : { key_rate: KEY_RATE_DEFAULT, game_started_at: new Date().toISOString() }
    await db.from('rooms').update({ status: 'playing', game_state: initState }).eq('id', roomId)
    setRoomStatus('playing')
  }

  function copyCode() {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (roomStatus === 'lobby') {
    const humanPlayers = (gameState?.players ?? []).filter((p: any) => !p.is_bot)
    const botPlayers   = (gameState?.players ?? []).filter((p: any) => p.is_bot)
    const me = humanPlayers.find((p: any) => p.id === myPlayerId)
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#07070D' }}>
        <div className="relative w-[390px] overflow-hidden rounded-[52px] border border-white/[0.08]"
          style={{ height: '100vh', maxHeight: '844px', background: 'radial-gradient(420px 300px at 80% -5%,rgba(245,184,67,.14),transparent 60%),radial-gradient(380px 320px at 0% 30%,rgba(167,139,250,.10),transparent 60%), #0B0B13' }}>
          <div className="flex h-full flex-col px-6 pt-14 pb-10">

            {/* Header */}
            <div className="mb-8">
              <div className="text-[13px] font-bold uppercase tracking-[2px] text-faint mb-1">Свобода</div>
              <div className="text-[28px] font-extrabold tracking-[-.5px]">Ожидание игроков</div>
              <div className="mt-1 text-[14px] text-faint">Поделись кодом с друзьями</div>
            </div>

            {/* Room code */}
            <button onClick={copyCode}
              className="mb-6 flex items-center justify-between rounded-[24px] border border-gold/30 px-6 py-5"
              style={{ background: 'linear-gradient(160deg,rgba(245,184,67,.14),rgba(245,184,67,.04))' }}>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[2px] text-gold/60 mb-1">Код комнаты</div>
                <div className="text-[40px] font-black tracking-[8px] text-gold leading-none">{roomCode}</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-gold/30 bg-gold/[0.14]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5B843" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {copied
                      ? <><path d="M20 6L9 17l-5-5"/></>
                      : <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>
                    }
                  </svg>
                </div>
                <div className="text-[10px] font-bold text-gold/70">{copied ? 'Скопировано' : 'Копировать'}</div>
              </div>
            </button>

            {/* Players */}
            <div className="flex-1 overflow-y-auto">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[13px] font-bold text-body">За столом</div>
                <div className="text-[12px] text-faint">{humanPlayers.length + botPlayers.length} / 6</div>
              </div>

              <div className="flex flex-col gap-2">
                {humanPlayers.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.045] px-4 py-3">
                    <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] text-[22px]"
                      style={{ background: `${p.color}33`, border: `1.5px solid ${p.color}60` }}>
                      {p.avatar ?? p.initial ?? '?'}
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-bold">{p.name}</div>
                      <div className="text-[11px] text-faint">{p.id === myPlayerId ? 'Ты' : onlinePlayers.has(p.id) ? 'Онлайн' : 'Ожидает...'} · {p.profession?.name ?? '...'}</div>
                    </div>
                    <div className={`h-2 w-2 rounded-full ${onlinePlayers.has(p.id) ? 'bg-pos shadow-[0_0_6px_#34D399]' : 'bg-white/20'}`} />
                  </div>
                ))}

                {botPlayers.length > 0 && (
                  <div className="flex items-center gap-3 rounded-[18px] border border-violet/20 bg-violet/[0.06] px-4 py-3">
                    <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] text-[20px] border border-violet/30 bg-violet/[0.14]">🤖</div>
                    <div className="flex-1">
                      <div className="text-[14px] font-bold">{botPlayers.length} {botPlayers.length === 1 ? 'бот' : 'бота'}</div>
                      <div className="text-[11px] text-faint">{botPlayers.map((b: any) => b.name).join(', ')}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6">
              {isHost ? (
                <button onClick={startGame}
                  className="gold-grad flex w-full items-center justify-center gap-2 rounded-[20px] p-[17px] text-[17px] font-extrabold text-[#1A1206]"
                  style={{ boxShadow: '0 18px 40px -12px rgba(245,184,67,.65)' }}>
                  Начать игру
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              ) : (
                <div className="flex items-center justify-center gap-3 rounded-[20px] border border-white/[0.08] bg-white/[0.04] p-[17px]">
                  <div className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                  <span className="text-[15px] font-semibold text-faint">Ждём хоста...</span>
                </div>
              )}
              <div className="mt-3 text-center text-[12px] text-faint">
                Игра начнётся для всех одновременно
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!myPlayer) return null

  const keyRate: number = gameState?.key_rate ?? KEY_RATE_DEFAULT
  const gameSettings = { ...DEFAULT_SETTINGS, ...(gameState?.settings ?? {}) }
  const diffConfig = DIFFICULTY_CONFIG[(gameSettings.difficulty ?? 'normal') as GameDifficulty]
  const boardCells = getBoardCells((gameSettings.difficulty ?? 'normal') as GameDifficulty)
  const progress = freedomProgress(myPlayer)
  const total = boardCells.length
  const pos = myPlayer.position
  const visibleCells = [-3,-2,-1,0,1,2,3].map(d => ({ cell: boardCells[(pos+d+total)%total], isCurrent: d===0, dist: Math.abs(d) }))
  const creditLimit = getCreditLimit(myPlayer)
  const usedDebtMonthly = getTotalDebtPayments(myPlayer)
  const maxMarketQty = marketData ? Math.max(0, Math.floor(myPlayer.cash / marketData.newPrice)) : 0
  const marketCost = marketData ? marketData.newPrice * marketQty : 0
  const notifAccent = cashNotif ? (cashNotif.positive ? '#34D399' : '#FB6B6B') : '#34D399'
  const skipTurnsLeft = (myPlayer as any)?.skip_turns ?? 0
  const isSkippingTurn = skipTurnsLeft > 0
  const doubleDiceActive = ((myPlayer as any)?.double_dice_rounds ?? 0) > 0
  const doubleDiceLeft = (myPlayer as any)?.double_dice_rounds ?? 0

  const evCfg = EV_CFG // ссылка на модульную константу
  // Новые события сверху — кэшируем пока events не меняется
  const eventsKey = gameState?.events?.length ?? 0
  const journalAllEvents: any[] = eventsKey > 0 ? [...(gameState.events)].reverse() : []
  const journalFiltered = journalAllEvents.filter((ev:any)=>{
    if(journalFilter==='mine')   return ev.player_id===myPlayerId
    if(journalFilter==='global') return !!evCfg[ev.type]?.global
    if(journalFilter==='money')  return ['buy','sell','hit','salary','repay','credit','auction_win'].includes(ev.type) && ev.amount != null && ev.amount !== 0
    return ev.type !== 'roll'
  })
  // Группировка активов — акции/крипта суммируются по базовому названию
  const groupedAssets = (() => {
    const result: any[] = []
    const map: Record<string, any> = {}
    myPlayer.assets.forEach((a:any) => {
      if (a.type === 'stocks' || a.type === 'crypto') {
        const base = a.name.replace(/ x\d+$/, '')
        const qty = parseInt(a.name.match(/x(\d+)$/)?.[1] ?? '1')
        if (map[base]) {
          map[base].qty += qty
          map[base].price += a.price
        } else {
          map[base] = { ...a, base, qty, price: a.price }
          result.push({ _grouped: true, _base: base })
        }
      } else {
        result.push({ ...a, _grouped: false })
      }
    })
    return result.map((g:any) => g._grouped ? { ...map[g._base], name: `${g._base} ×${map[g._base].qty}` } : g)
  })()

  const marketHoldings = marketData ? myPlayer.assets.filter((a:any)=>a.name?.includes(marketData.name)||a.id?.startsWith(marketData.id)) : []
  const marketHeldQty = marketHoldings.reduce((s:number,a:any)=>{const m=a.name?.match(/x(\d+)/);return s+(m?parseInt(m[1]):1)},0)
  const marketHeldValue = marketHoldings.reduce((s:number,a:any)=>s+(a.price||0),0)
  const marketCurrentHeldValue = marketData ? marketHeldQty * marketData.newPrice : 0
  const marketPnl = marketCurrentHeldValue - marketHeldValue

  const selectedDealMonthly = selectedDeal?.debt > 0 ? Math.round(selectedDeal.debt * keyRate / 12) : 0
  const selectedDealNet = selectedDeal ? selectedDeal.passive_income - selectedDealMonthly : 0
  const selectedDealCanAfford = selectedDeal ? myPlayer.cash >= selectedDeal.down_payment : false


  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07070D]">
      <div className="relative w-[390px] overflow-hidden rounded-[52px] border border-white/[0.08]" style={{ height:'100vh', maxHeight:'844px', background:'#0B0B13' }}>

        {notification && (
          <div className="absolute left-1/2 top-16 z-50 -translate-x-1/2 whitespace-nowrap rounded-2xl px-5 py-3 text-[14px] font-bold shadow-lg"
            style={{ color: notification.color, background: `${notification.color}18`, border: `1px solid ${notification.color}44` }}>
            {notification.msg}
          </div>
        )}

        {/* МОДАЛКА ОТКРЫТЫХ ТОРГОВ — появляется у всех остальных мгновенно */}
        {showOpenAuctionModal && gameState?.open_auction && (
          <div className="absolute inset-0 z-[60] flex items-end" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
            <div className="w-full rounded-t-[32px] border-t border-violet/30 p-6" style={{ background: '#13101F' }}>
              <div className="mb-1 text-[11px] font-bold tracking-[2px] text-violet/80">АУКЦИОН</div>
              <div className="mb-0.5 text-[20px] font-extrabold">{gameState.open_auction.asset?.name}</div>
              <div className="mb-4 text-[13px] text-faint">Выставил: {gameState.open_auction.from}</div>
              {gameState.open_auction.asset && (
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { label: 'Взнос', value: `₽${gameState.open_auction.asset.down_payment.toLocaleString()}`, cls: 'text-gold' },
                    { label: 'Доход/мес', value: `+₽${gameState.open_auction.asset.passive_income.toLocaleString()}`, cls: 'text-pos' },
                    { label: 'Чистый поток', value: `${(gameState.open_auction.asset.passive_income - Math.round(gameState.open_auction.asset.debt * keyRate / 12)) >= 0 ? '+' : ''}₽${(gameState.open_auction.asset.passive_income - Math.round(gameState.open_auction.asset.debt * keyRate / 12)).toLocaleString()}`, cls: (gameState.open_auction.asset.passive_income - Math.round(gameState.open_auction.asset.debt * keyRate / 12)) >= 0 ? 'text-pos' : 'text-neg' },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="rounded-[14px] border border-white/[0.08] bg-white/[0.04] p-3 text-center">
                      <div className="text-[10px] text-faint">{label}</div>
                      <div className={`text-[13px] font-extrabold ${cls}`}>{value}</div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={async () => {
                  if (!gameState?.open_auction || !myPlayer) return
                  const offer = gameState.open_auction
                  if (myPlayer.cash < offer.price) { showNotif('Недостаточно наличных', '#F87171'); return }
                  await handleAuctionBuy(offer.price)
                  const newState = { ...gameState, open_auction: null }
                  await db.from('rooms').update({ game_state: newState }).eq('id', roomId)
                  setShowOpenAuctionModal(false)
                }}
                disabled={myPlayer.cash < (gameState.open_auction.price ?? 0)}
                className="mb-3 w-full rounded-[18px] py-4 text-[16px] font-extrabold text-[#0A020F] disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#A78BFA,#7C3AED)' }}
              >
                Забрать за ₽{gameState.open_auction.price?.toLocaleString()}
              </button>
              <button
                onClick={() => setShowOpenAuctionModal(false)}
                className="w-full rounded-[18px] border border-white/[0.08] bg-white/[0.05] py-3.5 text-center text-[14px] font-bold text-muted"
              >
                Отказаться
              </button>
            </div>
          </div>
        )}
        {reconnected && (
          <div className="absolute left-1/2 top-16 z-50 -translate-x-1/2 whitespace-nowrap rounded-2xl border border-gold/30 bg-[#1A1206] px-5 py-3 text-[14px] font-bold text-gold shadow-lg">
            ✓ Переподключено
          </div>
        )}

        {/* FEED */}
        {tab === 'feed' && (
          <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
            <div className="flex items-center justify-between px-5 pt-8">
              <div className="flex items-center gap-3">
                <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] text-[17px] font-extrabold text-[#0B0B13]" style={{ background:myPlayer.color }}>
  {(myPlayer as any).avatar ? <span style={{fontSize:20}}>{(myPlayer as any).avatar}</span> : myPlayer.initial}
</div>
                <div>
                  <div className="text-[14px] font-bold">
  {myPlayer.name}{(myPlayer.children ?? 0) > 0 && <span className="ml-1">{(myPlayer.children ?? 0) > 3 ? `👶×${myPlayer.children}` : '👶'.repeat(myPlayer.children ?? 0)}</span>}
</div>
                  <div className="text-[17px] font-extrabold leading-none transition-all duration-500"
                    style={{ color: cashColor === 'pos' ? '#34D399' : cashColor === 'neg' ? '#FB6B6B' : '#F5B843' }}>
                    ₽{myPlayer.cash.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  {(()=>{
                    const net = (myPlayer.profession?.salary??0) + myPlayer.passive_income - myPlayer.total_expenses
                    const pos = net >= 0
                    return (
                      <div className={`flex items-center gap-1.5 rounded-[13px] border px-3 py-2 ${pos?'border-pos/30 bg-pos/[0.12]':'border-neg/20 bg-neg/[0.08]'}`}>
                        <IconTrendUp size={14} sw={2.4} className={pos?'text-pos':'text-neg'} />
                        <span className={`text-[13px] font-extrabold ${pos?'text-pos':'text-neg'}`}>{pos?'+':''}{net.toLocaleString()}<span className="text-[10px] opacity-70">/мес</span></span>
                      </div>
                    )
                  })()}
                  <button onClick={()=>setShowNotifSettings(true)}
                    className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] text-[16px] transition-all active:scale-90"
                    style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)'}}>
                    <IconSettings size={16} className="text-faint" />
                  </button>
                </div>
                <div className="flex items-center gap-1 px-1">
                  <span className="text-[10px] text-faint">ЦБ</span>
                  <span className="text-[10px] font-bold" style={{ color: keyRate >= 0.20 ? '#FB6B6B' : keyRate >= 0.17 ? '#F5B843' : '#34D399' }}>{Math.round(keyRate*100)}%</span>
                </div>
              </div>
            </div>

            <div className="mx-5 mt-3" style={{ height: 44 }}>
              {cashNotif ? (
                <div className="flex items-center justify-between rounded-[14px] px-4"
                  style={{
                    height: 44,
                    animation: 'fadeInUp .2s ease',
                    backdropFilter: 'blur(16px)',
                    background: 'rgba(13,13,20,0.88)',
                    borderLeft: `3px solid ${notifAccent}`,
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                  }}>
                  <span className="text-[13px] font-medium truncate pr-2" style={{ color: 'rgba(255,255,255,0.7)' }}>{cashNotif.label}</span>
                  {cashNotif.amount !== 0 && <span className="text-[16px] font-extrabold shrink-0" style={{ color: notifAccent }}>{cashNotif.positive ? '+' : '−'}₽{Math.abs(cashNotif.amount).toLocaleString()}</span>}
                </div>
              ) : (
                <div>
                  <div className="mb-1.5 flex justify-between text-[11px] font-semibold text-faint">
                    <span>До финансовой свободы</span>
                    <div className="flex items-center gap-2">
                      {gameTimeLeft !== null && gameTimeLeft > 0 && (
                        <span className={`font-bold tabular-nums ${gameTimeLeft < 120 ? 'text-neg' : 'text-faint'}`}>
                          ⏱ {Math.floor(gameTimeLeft/60)}:{String(gameTimeLeft%60).padStart(2,'0')}
                        </span>
                      )}
                      <span className="font-extrabold text-gold">{progress}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width:`${progress}%`, background:'linear-gradient(90deg,#F5B843,#FBD888)', boxShadow:'0 0 10px rgba(245,184,67,.5)' }} />
                  </div>
                </div>
              )}
            </div>
          <div style={{ flex:'1 1 auto', minHeight:0, marginTop:12 }}>
          <BoardView
            myPlayer={myPlayer}
            gameState={gameState}
            boardView={boardView}
            setBoardView={setBoardView}
            isMyTurn={isMyTurn}
            rolling={showDiceRolling}
            onRoll={handleRoll}
            diceValue={diceValue}
            boardCells={boardCells}
          />
          </div>



<div className="px-5 pb-4 pt-2" style={{height:78,flexShrink:0}}>
              {isMyTurn ? (
                <button onClick={handleRoll} disabled={rolling}
                  className="flex w-full h-full items-center justify-between rounded-[18px] px-4 disabled:opacity-50"
                  style={{
                    background: isSkippingTurn
                      ? 'linear-gradient(135deg,rgba(248,113,113,0.25),rgba(220,38,38,0.15))'
                      : 'linear-gradient(135deg,#FBD888,#F5B843 55%,#E0891F)',
                    border: isSkippingTurn ? '1.5px solid rgba(248,113,113,0.5)' : 'none',
                    boxShadow: isSkippingTurn ? '0 0 20px -8px rgba(248,113,113,0.5)' : rolling ? 'none' : '0 12px 28px -10px rgba(245,184,67,.55)',
                  }}>
                  <div className="flex flex-1 items-center gap-2">
                    {/* Кубик(и) */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Dice3D size={doubleDiceActive ? 34 : 40} diceValue={diceValue} rolling={showDiceRolling} />
                      {doubleDiceActive && (
                        <Dice3D size={34} diceValue={diceValue2} rolling={showDiceRolling} />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className={`text-[13px] font-extrabold ${isSkippingTurn ? 'text-neg' : 'text-[#1A1206]'}`}>
                        {isSkippingTurn ? `⏸ Пропуск хода (осталось ${skipTurnsLeft})` : doubleDiceActive ? `✨ 2 кубика · ещё ${doubleDiceLeft} ${doubleDiceLeft===1?'круг':doubleDiceLeft<5?'круга':'кругов'}` : 'Бросить кубик'}
                      </div>
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full" style={{background: isSkippingTurn ? 'rgba(248,113,113,0.2)' : 'rgba(0,0,0,0.2)'}}>
                        <div className="h-full rounded-full transition-all duration-1000"
                          style={{ width:`${(timeLeft/TIME_LIMIT)*100}%`, background: isSkippingTurn ? 'rgba(248,113,113,0.7)' : timeLeft > 10 ? 'rgba(0,0,0,0.4)' : '#FF3B3B' }} />
                      </div>
                    </div>
                  </div>
                  <div className={`text-[12px] font-black tabular-nums shrink-0 ${isSkippingTurn ? 'text-neg' : timeLeft <= 10 ? 'text-[#FF3B3B]' : 'text-[#1A1206]/60'}`}>{timeLeft}с</div>
                </button>
              ) : (
                <div className="flex w-full h-full items-center gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.045] px-4">
                  <Dice3D size={40} diceValue={diceValue} rolling={showDiceRolling} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-faint truncate">
                      {showDiceRolling ? `${currentPlayer?.name} бросает...` : `Ход: ${currentPlayer?.name}`}
                    </div>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.07]">
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width:`${(timeLeft/TIME_LIMIT)*100}%`, background: timeLeft > 20 ? 'linear-gradient(90deg,#E0891F,#F5B843)' : timeLeft > 10 ? '#FB6B6B' : '#FF3B3B', boxShadow: timeLeft <= 10 ? '0 0 8px #FF3B3B' : undefined }} />
                    </div>
                  </div>
                  <div className={`text-[12px] font-black tabular-nums shrink-0 ${timeLeft <= 10 ? 'text-neg' : 'text-faint'}`}>{timeLeft}с</div>
                </div>
              )}
            </div>
            <TabBar tab={tab} setTab={setTab} />
          </div>
        )}

        {/* BALANCE */}
        {tab === 'balance' && (
          <div style={{ height:'100%', display:'grid', gridTemplateRows:'1fr auto' }}>
            <div className="overflow-y-auto px-[22px] pt-10 pb-4">

              {/* ── Шапка ── */}
              <div className="mt-2 flex items-center justify-between">
                <div className="text-[22px] font-extrabold tracking-[-.5px]">Баланс</div>
                <div className="text-[11px] font-semibold text-faint">{myPlayer.profession?.icon} {myPlayer.profession?.name}</div>
              </div>

              {/* ── Главная карточка: наличные + денежный поток ── */}
              <div className="mt-3 rounded-[24px] p-5" style={{ background:'linear-gradient(145deg,rgba(245,184,67,.18) 0%,rgba(245,184,67,.04) 100%)', border:'1px solid rgba(245,184,67,.25)' }}>
                <div className="text-[11px] font-bold tracking-[1px] text-gold/70 uppercase">Наличные</div>
                <div className="gold-text mt-1 text-[38px] font-extrabold tracking-[-1.5px] leading-none">₽{myPlayer.cash.toLocaleString()}</div>

                {/* Денежный поток */}
                {(() => {
                  const totalIncome = (myPlayer.profession?.salary ?? 0) + myPlayer.passive_income
                  const netFlow = totalIncome - myPlayer.total_expenses
                  const isPos = netFlow >= 0
                  return (
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[13px] font-extrabold"
                        style={{ border: `1px solid ${isPos ? 'rgba(52,211,153,.35)' : 'rgba(248,113,113,.35)'}`, background: isPos ? 'rgba(52,211,153,.12)' : 'rgba(248,113,113,.12)', color: isPos ? '#34D399' : '#F87171' }}>
                        {isPos ? '↑' : '↓'} ₽{Math.abs(netFlow).toLocaleString()}/мес
                      </div>
                      <div className="text-[11px] text-faint">денежный поток</div>
                    </div>
                  )
                })()}

              </div>

              {/* ── Переключатели стиля Поле/Лента ── */}
              <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-[16px] p-1.5" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)' }}>
                {([['overview','Обзор'],['assets','Активы'],['debts','Долги']] as const).map(([id,label])=>{
                  const on = balanceTab === id
                  return (
                    <button key={id} onClick={()=>setBalanceTab(id)}
                      style={{ padding:'9px 0', borderRadius:11, border:'none', cursor:'pointer', fontSize:12, fontWeight:800, fontFamily:'Manrope,sans-serif',
                        color: on ? '#1A1206' : '#9AA0B4',
                        background: on ? 'linear-gradient(135deg,#FBD888,#F5B843 55%,#E0891F)' : 'transparent',
                        boxShadow: on ? '0 6px 16px -6px rgba(245,184,67,.6)' : 'none',
                        transition:'all .2s' }}>
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* ── Обзор ── */}
              {balanceTab === 'overview' && (
                <div className="mt-3 flex flex-col gap-3">
                  {/* Прогресс к свободе */}
                  <div className="rounded-[20px] p-4" style={{ background:'rgba(245,184,67,0.06)', border:'1px solid rgba(245,184,67,0.18)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-[12px] font-bold text-body">Финансовая свобода</span>
                        <div className="text-[10px] text-faint mt-0.5">пассивный доход ÷ расходы</div>
                      </div>
                      <span className="text-[22px] font-extrabold text-gold">{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full mt-2" style={{ background:'rgba(255,255,255,0.07)' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width:`${progress}%`, background:'linear-gradient(90deg,#E0891F,#F5B843,#FBD888)', boxShadow: progress > 0 ? '0 0 8px rgba(245,184,67,.5)' : 'none' }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold" style={{color:'#34D399'}}>Чистый пассив ₽{netPassiveIncome(myPlayer).toLocaleString()}/мес</span>
                      <span className="text-[11px] text-faint">из</span>
                      <span className="text-[11px] font-bold" style={{color:'#F87171'}}>₽{baseExpenses(myPlayer).toLocaleString()}/мес расходов</span>
                    </div>
                  </div>
                  {/* Доходы / Расходы */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-[18px] p-3.5" style={{ background:'rgba(52,211,153,0.07)', border:'1px solid rgba(52,211,153,0.18)' }}>
                      <div className="text-[10px] font-bold tracking-[.5px] uppercase" style={{ color:'#34D399' }}>Доходы</div>
                      <div className="mt-1 text-[20px] font-extrabold leading-none" style={{ color:'#34D399' }}>₽{((myPlayer.profession?.salary??0)+myPlayer.passive_income).toLocaleString()}</div>
                      <div className="mt-2.5 flex flex-col gap-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-faint truncate mr-1">Зарплата <span style={{opacity:0.5}}>(не в зачёт)</span></span>
                          <span className="font-bold shrink-0">₽{(myPlayer.profession?.salary??0).toLocaleString()}</span>
                        </div>
                        {myPlayer.assets.filter((a:any)=>a.passive_income>0).length === 0 && (
                          <div className="text-[9px] text-faint mt-1 leading-tight">Покупай активы — их доход идёт в зачёт свободы</div>
                        )}
                        {myPlayer.assets.filter((a:any)=>a.passive_income>0).map((a:any)=>(
                          <div key={a.id} className="flex justify-between text-[10px]"><span className="text-faint truncate mr-1">{a.name}</span><span className="font-bold shrink-0" style={{color:'#34D399'}}>+₽{a.passive_income.toLocaleString()}</span></div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[18px] p-3.5" style={{ background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.18)' }}>
                      <div className="text-[10px] font-bold tracking-[.5px] uppercase" style={{ color:'#F87171' }}>Расходы</div>
                      <div className="mt-1 text-[20px] font-extrabold leading-none" style={{ color:'#F87171' }}>₽{myPlayer.total_expenses.toLocaleString()}</div>
                      <div className="mt-2.5 flex flex-col gap-1">
                        {/* Детализация расходов профессии */}
                        {((myPlayer.profession as any)?.expense_breakdown ?? []).length > 0
                          ? (myPlayer.profession as any).expense_breakdown.map((e:any,i:number)=>(
                              <div key={i} className="flex justify-between text-[10px]"><span className="text-faint truncate mr-1">{e.n}</span><span className="font-bold shrink-0">₽{e.a.toLocaleString()}</span></div>
                            ))
                          : <div className="flex justify-between text-[10px]"><span className="text-faint truncate mr-1">Жизнь</span><span className="font-bold shrink-0">₽{(myPlayer.profession?.expenses??0).toLocaleString()}</span></div>
                        }
                        {/* Платежи по долгам */}
                        {myPlayer.debts.filter((d:any)=>d.amount>0).map((d:any,i:number)=>(
                          <div key={i} className="flex justify-between text-[10px]"><span className="text-faint truncate mr-1">{d.name}</span><span className="font-bold shrink-0" style={{color:'#F87171'}}>₽{d.monthly.toLocaleString()}</span></div>
                        ))}
                        {myPlayer.debts.filter((d:any)=>d.amount===0).map((d:any,i:number)=>(
                          <div key={`child_${i}`} className="flex justify-between text-[10px]"><span className="text-faint truncate mr-1">{d.name}</span><span className="font-bold shrink-0" style={{color:'#F87171'}}>₽{d.monthly.toLocaleString()}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Кредитный лимит */}
                  {creditLimit > 0 && (
                    <div className="rounded-[18px] p-3.5" style={{ background:'rgba(96,165,250,0.06)', border:'1px solid rgba(96,165,250,0.15)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold" style={{ color:'#60A5FA' }}>Кредитный лимит</span>
                        <span className="text-[12px] font-extrabold text-gold">₽{Math.max(0, creditLimit - usedDebtMonthly*10).toLocaleString()} доступно</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background:'rgba(255,255,255,0.07)' }}>
                        <div className="h-full rounded-full" style={{ width:`${Math.min(100,Math.round(usedDebtMonthly*10/creditLimit*100))}%`, background:'rgba(96,165,250,0.6)' }} />
                      </div>
                      <div className="mt-1.5 text-[10px] text-faint">Использовано ₽{(usedDebtMonthly*10).toLocaleString()} из ₽{creditLimit.toLocaleString()}</div>
                    </div>
                  )}
                  {/* Кнопки */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button onClick={()=>setShowDDS(true)} className="flex items-center justify-center gap-2 rounded-[14px] py-3 text-[12px] font-bold transition-all active:scale-95" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)' }}>
                      <IconDDS size={14}/> ДДС
                    </button>
                    <button onClick={()=>setShowAnalytics(true)} className="flex items-center justify-center gap-2 rounded-[14px] py-3 text-[12px] font-bold transition-all active:scale-95" style={{ background:'rgba(167,139,250,0.10)', border:'1px solid rgba(167,139,250,0.20)', color:'#C4B5FD' }}>
                      <IconAnalytics size={14}/> Аналитика
                    </button>
                  </div>
                </div>
              )}

              {/* ── Активы ── */}
              {balanceTab === 'assets' && (
                <div className="mt-3 mb-4 flex flex-col gap-2">
                  {myPlayer.assets.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="text-[32px] mb-2">📦</div>
                      <div className="text-[14px] font-bold text-faint">Пока нет активов</div>
                      <div className="text-[11px] text-faint mt-1">Купи первый актив на клетке Возможность</div>
                    </div>
                  ) : groupedAssets.map((a:any) => {
                    const typeColor: Record<string,string> = { real_estate:'#60A5FA', business:'#A78BFA', stocks:'#34D399', crypto:'#F59E0B', gold:'#FBD888' }
                    const typeLabel: Record<string,string> = { real_estate:'Недвижимость', business:'Бизнес', stocks:'Акции', crypto:'Крипто', gold:'Золото' }
                    const roi = a.price > 0 ? Math.round((a.passive_income??0) / a.price * 100) : 0
                    return (
                        <div key={a._key??a.id} className="rounded-[16px] p-4" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0 text-[16px]"
                              style={{ background:`${typeColor[a.type] ?? '#555'}22`, border:`1px solid ${typeColor[a.type] ?? '#555'}44` }}>
                              {a.type==='real_estate'?'🏠':a.type==='business'?'🏢':a.type==='stocks'?'📈':a.type==='crypto'?'₿':'🥇'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-bold truncate">{a.name}</div>
                              <div className="text-[10px] mt-0.5" style={{color: typeColor[a.type]??'#888'}}>{typeLabel[a.type]??a.type}</div>
                            </div>
                            {a.passive_income > 0 && (
                              <div className="text-[13px] font-extrabold shrink-0" style={{ color:'#34D399' }}>+₽{a.passive_income.toLocaleString()}</div>
                            )}
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            <div><div className="text-[9px] text-faint uppercase">Стоимость</div><div className="text-[12px] font-bold">₽{a.price.toLocaleString()}</div></div>
                            <div><div className="text-[9px] text-faint uppercase">Долг</div><div className="text-[12px] font-bold">{a.debt>0?`₽${a.debt.toLocaleString()}`:'—'}</div></div>
                            <div><div className="text-[9px] text-faint uppercase">ROI</div><div className="text-[12px] font-bold" style={{color: roi>20?'#34D399':roi>10?'#F5B843':'#9AA0B4'}}>{roi}%</div></div>
                          </div>
                        </div>
                    )
                  })}
                </div>
              )}

              {/* ── Долги ── */}
              {balanceTab === 'debts' && (
                <div className="mt-3 mb-4 flex flex-col gap-2">
                  {myPlayer.debts.filter((d:any)=>d.amount>0).length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="text-[32px] mb-2">✅</div>
                      <div className="text-[14px] font-bold text-faint">Долгов нет</div>
                      <div className="text-[11px] text-faint mt-1">Отличная финансовая позиция!</div>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-[16px] p-3.5 mb-1" style={{ background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.14)' }}>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-faint">Общий долг</span>
                          <span className="font-extrabold" style={{color:'#F87171'}}>₽{myPlayer.debts.filter((d:any)=>d.amount>0).reduce((s:number,d:any)=>s+d.amount,0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[11px] mt-1">
                          <span className="text-faint">Ежемес. платежи</span>
                          <span className="font-extrabold" style={{color:'#F87171'}}>₽{myPlayer.debts.filter((d:any)=>d.amount>0).reduce((s:number,d:any)=>s+d.monthly,0).toLocaleString()}/мес</span>
                        </div>
                      </div>
                      {myPlayer.debts.filter((d:any)=>d.amount>0).map((d:any,i:number)=>{
                        const canRepay = d.amount > 0 && myPlayer.cash >= d.amount
                        return (
                          <div key={i} className="rounded-[16px] p-4" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-bold truncate">{d.name}</div>
                                <div className="text-[10px] text-faint mt-0.5">Тело долга ₽{d.amount.toLocaleString()}</div>
                              </div>
                              {canRepay && (
                                <button onClick={async()=>{
                                  const {player:updated,success,reason} = repayDebt(myPlayer,i)
                                  if(!success){showNotif(reason??'Ошибка', '#F87171');return}
                                  const newPlayers = gameState.players.map((p:any)=>p.id===myPlayerId?updated:p)
                                  await db.from('rooms').update({game_state:{...gameState,players:newPlayers}}).eq('id',roomId)
                                  showCashNotif(d.name, d.amount, false)
                                }} className="shrink-0 rounded-[10px] px-3 py-1.5 text-[10px] font-extrabold transition-all active:scale-95"
                                  style={{ background:'rgba(52,211,153,0.15)', border:'1px solid rgba(52,211,153,0.35)', color:'#34D399' }}>
                                  Погасить
                                </button>
                              )}
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.07)'}}>
                                <div className="h-full rounded-full" style={{width:`${Math.min(100,Math.round(myPlayer.cash/d.amount*100))}%`, background: canRepay?'#34D399':'rgba(248,113,113,0.6)'}} />
                              </div>
                              <div className="text-[11px] font-extrabold shrink-0" style={{color:'#F87171'}}>₽{d.monthly.toLocaleString()}/мес</div>
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              )}

            </div>
            <TabBar tab={tab} setTab={setTab} />

            {/* ── Экран ДДС ── */}
            {showDDS && (()=>{
              const cfg: Record<string,{icon:string,label:string,category:string,dir:1|-1}> = {
                salary:      { icon:'salary',    label:'Зарплата / поток',    category:'Доходы',   dir:1 },
                sell:        { icon:'sell',      label:'Продажа актива',       category:'Доходы',   dir:1 },
                credit:      { icon:'credit',    label:'Кредит',              category:'Доходы',   dir:1 },
                auction_win: { icon:'trophy',    label:'Аукцион (выигрыш)',   category:'Расходы',  dir:-1 },
                buy:         { icon:'buy',       label:'Покупка актива',       category:'Расходы',  dir:-1 },
                hit:         { icon:'hit',       label:'Удар / штраф',         category:'Расходы',  dir:-1 },
                repay:       { icon:'repay',     label:'Погашение долга',      category:'Расходы',  dir:-1 },
                charity:     { icon:'charity',   label:'Благотворительность',  category:'Расходы',  dir:-1 },
              }
              // Все мои события с суммой — без фильтра по типу, берём всё что есть amount
              const allEvents: any[] = [...(gameState.events ?? [])]
                .filter((e:any) => {
                  if (e.player_id !== myPlayerId) return false
                  if (e.amount == null || e.amount === 0) return false
                  if (e.type === 'roll' || e.type === 'event' || e.type === 'child' || e.type === 'auction_lose') return false
                  return true
                })
                .reverse()

              const totalIn  = allEvents.filter((e:any) => cfg[e.type]?.dir === 1 || (!cfg[e.type] && e.amount > 0)).reduce((s:number,e:any) => s + Math.abs(e.amount), 0)
              const totalOut = allEvents.filter((e:any) => cfg[e.type]?.dir === -1 || (!cfg[e.type] && e.amount < 0)).reduce((s:number,e:any) => s + Math.abs(e.amount), 0)
              const net = totalIn - totalOut

              // Группировка по категориям
              const byCategory: Record<string, {total:number, events:any[]}> = {}
              allEvents.forEach((e:any) => {
                const cat = cfg[e.type]?.category ?? (e.amount > 0 ? 'Доходы' : 'Расходы')
                if (!byCategory[cat]) byCategory[cat] = {total:0, events:[]}
                byCategory[cat].total += Math.abs(e.amount)
                byCategory[cat].events.push(e)
              })

              return (
              <div className="absolute inset-0 z-40 flex flex-col" style={{ background:'#0B0B13' }}>
                {/* Шапка */}
                <div className="flex items-center gap-3 px-[22px] pt-12 pb-3 shrink-0" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                  <button onClick={()=>setShowDDS(false)} className="flex h-9 w-9 items-center justify-center rounded-[12px] text-[18px]" style={{ background:'rgba(255,255,255,0.06)' }}>←</button>
                  <div>
                    <div className="text-[18px] font-extrabold leading-none">ДДС</div>
                    <div className="text-[10px] text-faint mt-0.5">движение денежных средств · {allEvents.length} операций</div>
                  </div>
                </div>

                <div className="overflow-y-auto px-[22px] py-4 flex-1">
                  {/* Итоговые карточки */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-[14px] p-3" style={{ background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)' }}>
                      <div className="text-[9px] font-bold uppercase mb-1" style={{color:'#34D399'}}>Поступления</div>
                      <div className="text-[16px] font-extrabold" style={{color:'#34D399'}}>₽{totalIn.toLocaleString()}</div>
                    </div>
                    <div className="rounded-[14px] p-3" style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)' }}>
                      <div className="text-[9px] font-bold uppercase mb-1" style={{color:'#F87171'}}>Выбытие</div>
                      <div className="text-[16px] font-extrabold" style={{color:'#F87171'}}>₽{totalOut.toLocaleString()}</div>
                    </div>
                    <div className="rounded-[14px] p-3" style={{ background: net>=0?'rgba(245,184,67,0.08)':'rgba(248,113,113,0.06)', border: net>=0?'1px solid rgba(245,184,67,0.2)':'1px solid rgba(248,113,113,0.15)' }}>
                      <div className="text-[9px] font-bold uppercase mb-1 text-faint">Сальдо</div>
                      <div className="text-[16px] font-extrabold" style={{color: net>=0?'#F5B843':'#F87171'}}>{net>=0?'+':''}₽{net.toLocaleString()}</div>
                    </div>
                  </div>

                  {allEvents.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="text-[32px] mb-3">📭</div>
                      <div className="text-[14px] font-bold text-faint">Движений пока нет</div>
                      <div className="text-[12px] text-faint mt-1 opacity-60">Здесь появятся все доходы и расходы</div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {allEvents.map((e:any, i:number) => {
                        const c = cfg[e.type]
                        const isIn = c ? c.dir === 1 : e.amount > 0
                        const iconKey = c?.icon ?? (isIn ? 'sell' : 'hit')
                        const label = c?.label ?? e.type
                        const ts = e.created_at ? new Date(e.created_at) : null
                        const timeStr = ts ? ts.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}) : ''
                        return (
                          <div key={i} className="flex items-center gap-3 rounded-[13px] px-3.5 py-3"
                            style={{ background: isIn?'rgba(52,211,153,0.04)':'rgba(248,113,113,0.04)', border: isIn?'1px solid rgba(52,211,153,0.1)':'1px solid rgba(248,113,113,0.1)' }}>
                            <div className="shrink-0 flex items-center justify-center w-6"><GameIcon type={iconKey} size={18} color={isIn?'#34D399':'#F87171'}/></div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-semibold leading-tight truncate">{e.description}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[5px]"
                                  style={{ background: isIn?'rgba(52,211,153,0.15)':'rgba(248,113,113,0.15)', color: isIn?'#34D399':'#F87171' }}>
                                  {label}
                                </span>
                                {e.round && <span className="text-[9px] text-faint">Ход {e.round}</span>}
                                {timeStr && <span className="text-[9px] text-faint opacity-50">{timeStr}</span>}
                              </div>
                            </div>
                            <div className="text-[14px] font-extrabold shrink-0" style={{ color: isIn?'#34D399':'#F87171' }}>
                              {isIn?'+':'−'}₽{Math.abs(e.amount).toLocaleString()}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
              )
            })()}

            {/* ── Модал Аналитика ── */}
            {showAnalytics && (
              <div className="absolute inset-0 z-40 flex flex-col" style={{ background:'#0B0B13' }}>
                <div className="flex items-center gap-3 px-[22px] pt-12 pb-4 shrink-0" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                  <button onClick={()=>setShowAnalytics(false)} className="flex h-9 w-9 items-center justify-center rounded-[12px] text-[18px]" style={{ background:'rgba(255,255,255,0.06)' }}>←</button>
                  <div className="text-[18px] font-extrabold">Аналитика</div>
                </div>
                <div className="overflow-y-auto px-[22px] py-4 flex-1">
                  {(() => {
                    const totalIncome = (myPlayer.profession?.salary ?? 0) + myPlayer.passive_income
                    const typeLabel: Record<string,string> = { real_estate:'Недвижимость', business:'Бизнес', stocks:'Акции', crypto:'Крипто', gold:'Золото' }
                    const typeColor: Record<string,string> = { real_estate:'#60A5FA', business:'#A78BFA', stocks:'#34D399', crypto:'#F59E0B', gold:'#FBD888' }

                    // Группировка активов по типу
                    const byType: Record<string,{count:number,value:number,income:number}> = {}
                    myPlayer.assets.forEach((a:any)=>{
                      if(!byType[a.type]) byType[a.type]={count:0,value:0,income:0}
                      byType[a.type].count++
                      byType[a.type].value += a.price
                      byType[a.type].income += a.passive_income
                    })
                    const totalValue = Object.values(byType).reduce((s,v)=>s+v.value,0)

                    // SVG Пончик — портфель по типу
                    const donutR = 54, donutCx = 80, donutCy = 80
                    const circumference = 2 * Math.PI * donutR
                    let offset = 0
                    const segments = Object.entries(byType).map(([type,data])=>{
                      const pct = totalValue > 0 ? data.value / totalValue : 0
                      const dash = pct * circumference
                      const seg = { type, pct, dash, offset, color: typeColor[type] ?? '#555' }
                      offset += dash
                      return seg
                    })

                    // SVG Пончик — доход vs расходы
                    const incomeVsExp = [
                      { label:'Зарплата', val: myPlayer.profession?.salary ?? 0, color:'#34D399' },
                      { label:'Пассив', val: myPlayer.passive_income, color:'#60A5FA' },
                      { label:'Расходы', val: myPlayer.total_expenses, color:'#F87171' },
                    ].filter(x=>x.val>0)
                    const totalIVE = incomeVsExp.reduce((s,x)=>s+x.val,0)
                    let offsetIVE = 0
                    const segIVE = incomeVsExp.map(x=>{
                      const dash = totalIVE > 0 ? (x.val/totalIVE)*circumference : 0
                      const seg = { ...x, dash, offset: offsetIVE }
                      offsetIVE += dash
                      return seg
                    })

                    return (
                      <>
                        {/* Прогресс */}
                        <div className="rounded-[18px] p-4 mb-3" style={{ background:'rgba(245,184,67,0.07)', border:'1px solid rgba(245,184,67,0.18)' }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[12px] font-bold">Финансовая свобода</span>
                            <span className="text-[20px] font-extrabold text-gold">{progress}%</span>
                          </div>
                          <div className="h-2.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.07)'}}>
                            <div className="h-full rounded-full transition-all" style={{width:`${progress}%`,background:'linear-gradient(90deg,#E0891F,#F5B843,#FBD888)',boxShadow:'0 0 8px rgba(245,184,67,0.5)'}} />
                          </div>
                          <div className="mt-2 flex justify-between text-[10px] text-faint">
                            <span>Чистый пассив ₽{netPassiveIncome(myPlayer).toLocaleString()}/мес</span>
                            <span>Расходы ₽{baseExpenses(myPlayer).toLocaleString()}/мес</span>
                          </div>
                        </div>

                        {/* Доходы vs Расходы — пончик */}
                        <div className="rounded-[18px] p-4 mb-3" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                          <div className="text-[13px] font-bold mb-3">Структура денежного потока</div>
                          <div className="flex items-center gap-4">
                            <svg width="160" height="160" viewBox="0 0 160 160">
                              <circle cx="80" cy="80" r={donutR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="22" />
                              {segIVE.map((s,i)=>(
                                <circle key={i} cx="80" cy="80" r={donutR} fill="none" stroke={s.color} strokeWidth="22"
                                  strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                                  strokeDashoffset={-s.offset + circumference * 0.25}
                                  style={{transition:'all 0.6s'}} />
                              ))}
                              <text x="80" y="76" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">₽{(totalIncome).toLocaleString()}</text>
                              <text x="80" y="91" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9">/мес доход</text>
                            </svg>
                            <div className="flex flex-col gap-2 flex-1">
                              {segIVE.map((s,i)=>(
                                <div key={i} className="flex items-center gap-2">
                                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{background:s.color}} />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[10px] text-faint">{s.label}</div>
                                    <div className="text-[11px] font-bold">₽{s.val.toLocaleString()}</div>
                                  </div>
                                  <div className="text-[10px] font-bold text-faint">{totalIVE>0?Math.round(s.val/totalIVE*100):0}%</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Портфель по типу — пончик */}
                        {myPlayer.assets.length > 0 ? (
                          <div className="rounded-[18px] p-4 mb-3" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                            <div className="text-[13px] font-bold mb-3">Портфель активов</div>
                            <div className="flex items-center gap-4">
                              <svg width="160" height="160" viewBox="0 0 160 160">
                                <circle cx="80" cy="80" r={donutR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="22" />
                                {segments.map((s,i)=>(
                                  <circle key={i} cx="80" cy="80" r={donutR} fill="none" stroke={s.color} strokeWidth="22"
                                    strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                                    strokeDashoffset={-s.offset + circumference * 0.25}
                                    style={{transition:'all 0.6s'}} />
                                ))}
                                <text x="80" y="76" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">₽{(totalValue/1000).toFixed(0)}К</text>
                                <text x="80" y="91" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9">{myPlayer.assets.length} активов</text>
                              </svg>
                              <div className="flex flex-col gap-2 flex-1">
                                {Object.entries(byType).map(([type,data])=>(
                                  <div key={type} className="flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{background:typeColor[type]??'#555'}} />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[10px] text-faint">{typeLabel[type]??type}</div>
                                      <div className="text-[11px] font-bold">₽{data.value.toLocaleString()}</div>
                                    </div>
                                    <div className="text-[10px] font-bold text-faint">{totalValue>0?Math.round(data.value/totalValue*100):0}%</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-[18px] p-6 mb-3 text-center" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                            <div className="text-[28px] mb-2">📦</div>
                            <div className="text-[13px] font-bold text-faint">Пока нет активов</div>
                            <div className="text-[11px] text-faint mt-1">Купи первый актив — и тут появится аналитика</div>
                          </div>
                        )}

                        {/* Статистика по активам */}
                        {myPlayer.assets.length > 0 && (
                          <div className="rounded-[18px] p-4 mb-4" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                            <div className="text-[13px] font-bold mb-3">Показатели</div>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { label:'Всего активов', val: myPlayer.assets.length, unit:' шт' },
                                { label:'Стоимость портфеля', val:'₽'+(myPlayer.assets.reduce((s:number,a:any)=>s+a.price,0)/1000).toFixed(0)+'К', unit:'' },
                                { label:'Чистый пассив', val:'₽'+netPassiveIncome(myPlayer).toLocaleString(), unit:'/мес' },
                                { label:'Средний ROI', val: myPlayer.assets.length>0 ? Math.round(myPlayer.assets.reduce((s:number,a:any)=>s+(a.passive_income/a.price),0)/myPlayer.assets.length*100)+'%' : '—', unit:'' },
                              ].map((item,i)=>(
                                <div key={i} className="rounded-[13px] p-3" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
                                  <div className="text-[10px] text-faint">{item.label}</div>
                                  <div className="text-[14px] font-extrabold mt-0.5">{item.val}{item.unit}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            )}

          </div>
        )}

        {/* PLAYERS */}
        {tab === 'players' && (
          <div style={{ height:'100%', display:'grid', gridTemplateRows:'1fr auto' }}>
            <div className="overflow-y-auto px-[22px] pt-10 pb-4">
              <div className="mt-2 text-[22px] font-extrabold tracking-[-.5px]">Игроки</div>

              {/* Лидерборд — сортировка по прогрессу, порядок НЕ меняется во время рендера */}
              {(() => {
                const sorted = [...gameState.players].sort((a:Player,b:Player)=>freedomProgress(b)-freedomProgress(a))
                const currentId = gameState.current_player_id
                return (
                  <div className="mt-4 flex flex-col gap-2">
                    {sorted.map((p:Player, rank:number)=>{
                      const prog = freedomProgress(p)
                      const isCurrent = p.id === currentId
                      const isMe = p.id === myPlayerId
                      const isOnline = !p.is_bot && onlinePlayers.has(p.id)
                      const netFlow = (p.profession?.salary ?? 0) + p.passive_income - p.total_expenses
                      return (
                        <div key={p.id} onClick={()=>setSelectedPlayer(p)}
                          className="rounded-[18px] p-4 cursor-pointer active:opacity-80 transition-opacity"
                          style={{
                            border: isMe ? '1.5px solid rgba(245,184,67,0.35)' : isCurrent ? '1.5px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.07)',
                            background: isMe ? 'rgba(245,184,67,0.06)' : isCurrent ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                          }}>
                          <div className="flex items-center gap-3">
                            {/* Ранг */}
                            <div className="text-[13px] font-extrabold w-5 shrink-0 text-center" style={{color: rank===0?'#FBD888':rank===1?'#C0C0C0':rank===2?'#CD7F32':'#555'}}>
                              {rank===0?'🥇':rank===1?'🥈':rank===2?'🥉':`${rank+1}`}
                            </div>
                            {/* Аватар */}
                            <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] text-[17px] font-extrabold text-[#0B0B13] relative" style={{ background:p.color }}>
                              {(p as any).avatar ? <span style={{fontSize:21}}>{(p as any).avatar}</span> : p.initial}
                              {isCurrent && (
                                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-gold border-2 border-[#0B0B13]" style={{boxShadow:'0 0 6px rgba(245,184,67,0.8)'}} />
                              )}
                            </div>
                            {/* Инфо */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[14px] font-bold leading-none">{p.name}</span>
                                {isMe && <span className="text-[9px] font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded-[5px]">ТЫ</span>}
                                {p.is_bot && <span className="text-[9px] font-semibold text-violet bg-violet/10 px-1.5 py-0.5 rounded-[5px]">БОТ</span>}
                                {isOnline && !isMe && <span className="h-1.5 w-1.5 rounded-full bg-pos inline-block" style={{boxShadow:'0 0 4px #34D399'}}/>}
                                {!p.is_bot && !isOnline && !isMe && <span className="text-[9px] text-faint">офлайн</span>}
                              </div>
                              <div className="text-[11px] text-faint mt-0.5 truncate">{p.profession?.icon} {p.profession?.name}</div>
                            </div>
                            {/* Деньги */}
                            <div className="text-right shrink-0">
                              <div className="text-[13px] font-extrabold text-gold leading-none">₽{p.cash.toLocaleString()}</div>
                              <div className="text-[10px] mt-0.5" style={{color: netFlow>=0?'#34D399':'#F87171'}}>
                                {netFlow>=0?'+':''}{netFlow.toLocaleString()}/мес
                              </div>
                            </div>
                          </div>
                          {/* Прогресс-бар */}
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.07)'}}>
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{width:`${prog}%`, background: prog>=100?'linear-gradient(90deg,#34D399,#6EE7B7)':'linear-gradient(90deg,#E0891F,#F5B843,#FBD888)', boxShadow: prog>0?'0 0 6px rgba(245,184,67,0.4)':'none'}} />
                            </div>
                            <span className="text-[10px] font-extrabold text-gold shrink-0">{prog}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
            <TabBar tab={tab} setTab={setTab} />
          </div>
        )}

        {/* JOURNAL */}
        {tab === 'journal' && (()=>{
          // Конфиг всех типов событий
          const jCfg: Record<string,{icon:string,label:string,color:string,income?:boolean,expense?:boolean,global?:boolean,hide?:boolean}> = {
            roll:        { icon:'🎲', label:'Ход',             color:'rgba(255,255,255,0.35)', hide: journalFilter !== 'all' },
            buy:         { icon:'🏠', label:'Покупка',         color:'#60A5FA', expense:true },
            sell:        { icon:'💰', label:'Продажа',         color:'#F5B843', income:true },
            salary:      { icon:'💵', label:'Доход',           color:'#34D399', income:true },
            hit:         { icon:'💥', label:'Удар',            color:'#F87171', expense:true },
            event:       { icon:'📰', label:'Событие',         color:'#FBBF24', global:true },
            credit:      { icon:'🏦', label:'Кредит',          color:'#60A5FA', income:true },
            repay:       { icon:'✅', label:'Погашение',       color:'#34D399', expense:true },
            freedom:     { icon:'🚀', label:'Свобода!',        color:'#FBD888', global:true },
            auction_win: { icon:'🏆', label:'Аукцион',         color:'#A78BFA', expense:true },
            auction_lose:{ icon:'📢', label:'Торги открыты',   color:'#A78BFA' },
            child:       { icon:'👶', label:'Ребёнок',         color:'#F5B843', global:true },
            charity:     { icon:'✨', label:'Благотвор.',      color:'#E8A2C8', expense:true },
          }

          const allEvents: any[] = [...(gameState?.events??[])].reverse()
          const filtered = allEvents.filter((ev:any) => {
            const c = jCfg[ev.type]
            if(c?.hide) return false
            if(journalFilter==='mine') return ev.player_id===myPlayerId && ev.type!=='roll'
            if(journalFilter==='money') return (c?.income||c?.expense) && ev.amount!=null && ev.amount!==0
            if(journalFilter==='global') return c?.global
            return ev.type !== 'roll' // в Все — без бросков
          })

          // Группировка по игроку+раунду для визуального разделения
          const groups: {player_id:string,player_name:string,events:any[]}[] = []
          filtered.forEach((ev:any) => {
            const last = groups[groups.length-1]
            if(last && last.player_id===ev.player_id && last.events[last.events.length-1]?.round===ev.round) {
              last.events.push(ev)
            } else {
              groups.push({player_id:ev.player_id,player_name:ev.player_name,events:[ev]})
            }
          })

          return (
          <div style={{ height:'100%', display:'grid', gridTemplateRows:'auto auto 1fr auto' }}>
            {/* Шапка */}
            <div className="px-[22px] pt-10 pb-1">
              <div className="mt-2 flex items-center justify-between">
                <div className="text-[22px] font-extrabold tracking-[-.5px]">Журнал</div>
                <div className="text-[11px] text-faint">{allEvents.filter(e=>e.type!=='roll').length} событий</div>
              </div>
            </div>

            {/* Фильтры */}
            <div className="px-[22px] pt-2 pb-2">
              <div className="grid grid-cols-4 gap-1 rounded-[14px] p-1" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)'}}>
                {([['all','Все'],['mine','Мои'],['money','Деньги'],['global','Важное']] as const).map(([id,label])=>{
                  const on = journalFilter===id
                  const count = id==='all' ? allEvents.filter(e=>e.type!=='roll').length
                    : id==='mine' ? allEvents.filter(e=>e.player_id===myPlayerId&&e.type!=='roll').length
                    : id==='money' ? allEvents.filter(e=>(jCfg[e.type]?.income||jCfg[e.type]?.expense)&&e.amount).length
                    : allEvents.filter(e=>jCfg[e.type]?.global).length
                  return (
                    <button key={id} onClick={()=>setJournalFilter(id)}
                      style={{padding:'7px 2px',borderRadius:9,border:'none',cursor:'pointer',fontSize:11,fontWeight:800,fontFamily:'Manrope,sans-serif',
                        color: on?'#1A1206':'#9AA0B4',
                        background: on?'linear-gradient(135deg,#FBD888,#F5B843 55%,#E0891F)':'transparent',
                        boxShadow: on?'0 4px 12px -4px rgba(245,184,67,0.6)':'none',
                        transition:'all .2s'}}>
                      {label}{count>0&&<span style={{opacity:0.6,marginLeft:3}}>{count}</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Лента */}
            <div className="overflow-y-auto px-[22px] pb-4">
              {filtered.length===0 ? (
                <div className="py-14 text-center">
                  <div className="text-[32px] mb-2">📭</div>
                  <div className="text-[14px] font-bold text-faint">Пока пусто</div>
                  <div className="text-[11px] text-faint mt-1 opacity-60">Здесь будут все события игры</div>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {groups.map((group, gi) => {
                    const player = gameState.players.find((p:Player)=>p.id===group.player_id)
                    const isMe = group.player_id===myPlayerId
                    return (
                      <div key={gi} className="mb-2">
                        {/* Заголовок группы — только если несколько игроков */}
                        {!isMe && player && journalFilter==='all' && (
                          <div className="flex items-center gap-2 mb-1 mt-1">
                            <div className="h-4 w-4 rounded-full text-[8px] font-bold text-[#0B0B13] flex items-center justify-center shrink-0"
                              style={{background:player.color}}>
                              {(player as any).avatar ?? player.initial}
                            </div>
                            <span className="text-[10px] font-bold" style={{color:player.color}}>{player.name}</span>
                            <div className="flex-1 h-px" style={{background:`${player.color}20`}}/>
                          </div>
                        )}
                        {/* События группы */}
                        <div className="flex flex-col gap-1">
                          {group.events.map((ev:any, ei:number) => {
                            const c = jCfg[ev.type] ?? {icon:'•',label:ev.type,color:'rgba(255,255,255,0.3)'}
                            const isIncome = c.income
                            const isExpense = c.expense
                            const isGlobal = c.global
                            const amountColor = isIncome?'#34D399':isExpense?'#F87171':c.color
                            const ts = ev.created_at ? new Date(ev.created_at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}) : ''

                            // Глобальные события — выделены
                            if(isGlobal) return (
                              <div key={ev.id??ei} className="rounded-[13px] px-4 py-3 flex items-center gap-3"
                                style={{ background: ev.type==='freedom'?'rgba(245,184,67,0.12)':ev.type==='child'?'rgba(245,184,67,0.07)':'rgba(167,139,250,0.08)', border: ev.type==='freedom'?'1.5px solid rgba(245,184,67,0.4)':ev.type==='child'?'1px solid rgba(245,184,67,0.2)':'1px solid rgba(167,139,250,0.2)' }}>
                                <div className="shrink-0 flex items-center justify-center w-6 h-6"><GameIcon type={c.icon} size={18} color={c.color}/></div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[12px] font-bold leading-tight">{ev.description}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[5px]" style={{background:`${c.color}20`,color:c.color}}>{c.label}</span>
                                    {player && <><div className="h-1.5 w-1.5 rounded-full" style={{background:player.color}}/><span className="text-[9px] text-faint">{ev.player_name}</span></>}
                                    {ts && <span className="text-[9px] text-faint opacity-50">{ts}</span>}
                                  </div>
                                </div>
                                {ev.amount!=null&&ev.amount!==0 && <div className="text-[13px] font-extrabold shrink-0" style={{color:c.color}}>{isIncome?'+':'−'}₽{Math.abs(ev.amount).toLocaleString()}</div>}
                              </div>
                            )

                            // Обычные события
                            return (
                              <div key={ev.id??ei} className="flex items-center gap-2.5 rounded-[11px] px-3 py-2.5"
                                style={{ background: isMe?'rgba(255,255,255,0.045)':'rgba(255,255,255,0.02)', border: isMe?'1px solid rgba(255,255,255,0.08)':'1px solid rgba(255,255,255,0.04)' }}>
                                {/* Цветная полоска игрока */}
                                {journalFilter==='all' && <div className="w-0.5 h-6 rounded-full shrink-0" style={{background: player?.color ?? '#555'}}/>}
                                <div className="shrink-0 flex items-center justify-center w-5"><GameIcon type={c.icon} size={15} color={c.color}/></div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-semibold leading-tight">{ev.description}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[9px] px-1 py-0.5 rounded-[4px]" style={{background:`${c.color}15`,color:c.color}}>{c.label}</span>
                                    {journalFilter==='all' && !isMe && <span className="text-[9px] text-faint opacity-60">{ev.player_name}</span>}
                                    {ts && <span className="text-[9px] text-faint opacity-40">{ts}</span>}
                                  </div>
                                </div>
                                {ev.amount!=null&&ev.amount!==0 && (
                                  <div className="text-[12px] font-extrabold shrink-0" style={{color:amountColor}}>
                                    {isIncome?'+':isExpense?'−':''}{isIncome||isExpense?'₽':''}{isIncome||isExpense?Math.abs(ev.amount).toLocaleString():ev.amount.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <TabBar tab={tab} setTab={setTab} />
          </div>
          )
        })()}

        {/* INTRO */}
        {showIntro && myPlayer && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6" style={{ background:'radial-gradient(circle at 50% 40%, rgba(245,184,67,.15), transparent 60%), rgba(7,7,13,.95)' }}>
            <div className="text-[48px]">{myPlayer.profession?.icon}</div>
            <div className="mt-3 text-[13px] font-bold tracking-[2px] text-gold">ТВОЯ ПРОФЕССИЯ</div>
            <div className="mt-1 text-[28px] font-extrabold">{myPlayer.profession?.name}</div>
            <div className="mt-1 text-[15px] text-faint">₽{myPlayer.profession?.salary.toLocaleString()}/мес</div>
            <div className="mt-6 h-px w-full bg-white/10" />
            <div className="mt-6 text-[48px]">{myPlayer.dream?.icon}</div>
            <div className="mt-3 text-[13px] font-bold tracking-[2px] text-gold">ТВОЯ МЕЧТА</div>
            <div className="mt-1 text-[24px] font-extrabold text-center">{myPlayer.dream?.name}</div>
            <div className="mt-1 text-[14px] text-faint">₽{myPlayer.dream?.price.toLocaleString()}</div>
            <button onClick={()=>{setShowIntro(false);localStorage.setItem(`svoboda_intro_${roomId}`,'1')}} className="gold-grad mt-10 w-full rounded-[20px] py-4 text-[17px] font-extrabold text-[#1A1206]" style={{ boxShadow:'0 16px 36px -12px rgba(245,184,67,.6)' }}>
              Поехали! →
            </button>
          </div>
        )}



        {/* PLAYER PROFILE */}
{selectedPlayer && (
  <div className="absolute inset-0 z-40 flex flex-col" onClick={()=>setSelectedPlayer(null)}>
    <div className="flex-1 bg-[#07070D]/70 backdrop-blur-[2px]" />
    <div className="rounded-t-[36px] border-t-2 border-white/10 px-6 pb-10 pt-4 overflow-y-auto max-h-[75vh]"
      style={{ background:'linear-gradient(180deg,rgba(20,20,30,.98),rgba(11,11,19,.99))' }}
      onClick={e=>e.stopPropagation()}>
      <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20" />
      <div className="flex items-center gap-4 mb-5">
        <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[18px] text-[22px] font-extrabold text-[#0B0B13]" style={{ background:selectedPlayer.color }}>
  {(selectedPlayer as any).avatar ? <span style={{fontSize:26}}>{(selectedPlayer as any).avatar}</span> : selectedPlayer.initial}
</div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-extrabold">{selectedPlayer.name}</span>
            {selectedPlayer.id===myPlayerId&&<span className="text-[11px] font-bold text-gold">ТЫ</span>}
            {selectedPlayer.is_bot&&<span className="text-[11px] font-semibold text-violet">БОТ</span>}
          </div>
          <div className="text-[13px] text-faint">
  {selectedPlayer.profession?.icon} {selectedPlayer.profession?.name}
  {(selectedPlayer.children ?? 0) > 0 && <span className="ml-1">{'👶'.repeat(Math.min(selectedPlayer.children, 3))}</span>}
</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-4">
  {/* Прогресс */}
  <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.04] px-4 py-3">
    <div className="mb-1.5 flex justify-between text-[11px]">
      <span className="text-faint">До финансовой свободы</span>
      <span className="font-extrabold text-gold">{freedomProgress(selectedPlayer)}%</span>
    </div>
    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
      <div className="h-full rounded-full" style={{ width:`${freedomProgress(selectedPlayer)}%`, background:'linear-gradient(90deg,#F5B843,#FBD888)' }} />
    </div>
    <div className="mt-1.5 text-[10px] text-faint">
      Чистый пассив ₽{netPassiveIncome(selectedPlayer).toLocaleString()} из ₽{baseExpenses(selectedPlayer).toLocaleString()} расходов
    </div>
  </div>

  {/* Три цифры в ряд */}
  <div className="flex gap-2">
    <div className="flex-1 rounded-[16px] border border-gold/20 bg-gold/[0.07] p-3">
      <div className="text-[10px] text-faint">Наличные</div>
      <div className="mt-0.5 text-[15px] font-extrabold text-gold">₽{selectedPlayer.cash.toLocaleString()}</div>
    </div>
    <div className="flex-1 rounded-[16px] border border-pos/20 bg-pos/[0.07] p-3">
      <div className="text-[10px] text-faint">Пассив/мес</div>
      <div className="mt-0.5 text-[15px] font-extrabold text-pos">+₽{netPassiveIncome(selectedPlayer).toLocaleString()}</div>
    </div>
    <div className="flex-1 rounded-[16px] border border-neg/20 bg-neg/[0.06] p-3">
      <div className="text-[10px] text-faint">Расходы</div>
      <div className="mt-0.5 text-[15px] font-extrabold text-neg">₽{baseExpenses(selectedPlayer).toLocaleString()}</div>
    </div>
  </div>
</div>

      {selectedPlayer.assets.length > 0 && (
        <div className="mb-4 rounded-[18px] border border-white/[0.08] bg-white/[0.04] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-bold text-body">Активы ({selectedPlayer.assets.length})</span>
            {selectedPlayer.id !== myPlayerId && (
              <span className="text-[9px] font-bold text-faint uppercase tracking-wide">Враждебный выкуп · ×2 цены</span>
            )}
          </div>
          {selectedPlayer.assets.map((a:any, i:number)=>{
            const isOwn = selectedPlayer.id === myPlayerId
            const canHostile = !isOwn && ['real_estate','business','gold'].includes(a.type)
            const hostilePrice = Math.round(a.price * 2)
            const canAfford = myPlayer.cash >= hostilePrice
            return (
              <div key={i} className="rounded-[12px] px-3 py-2.5 mb-1.5 last:mb-0" style={{background: canHostile ? 'rgba(255,255,255,0.03)' : 'transparent', border: canHostile ? '1px solid rgba(255,255,255,0.05)' : 'none'}}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold truncate">{a.name}</div>
                    <div className="text-[10px] text-faint">₽{a.price?.toLocaleString()} · {a.passive_income>0?`+₽${a.passive_income.toLocaleString()}/мес`:'без дохода'}</div>
                  </div>
                  {canHostile && (
                    <button
                      disabled={!canAfford}
                      onClick={async()=>{
                        if(!myPlayer||!gameState||!canAfford) return
                        // Переводим актив от seller к buyer, seller получает 2x
                        const updBuyer = {
                          ...myPlayer,
                          cash: myPlayer.cash - hostilePrice,
                          assets: [...myPlayer.assets, {...a, down_payment: hostilePrice, debt: 0, id: `${a.id}_hostile_${Date.now()}`}],
                          passive_income: myPlayer.passive_income + (a.passive_income ?? 0),
                          total_expenses: myPlayer.total_expenses,
                        }
                        const updSeller = {
                          ...selectedPlayer,
                          cash: selectedPlayer.cash + hostilePrice,
                          assets: selectedPlayer.assets.filter((_:any,j:number)=>j!==i),
                          passive_income: selectedPlayer.passive_income - (a.passive_income ?? 0),
                        }
                        const ev = {id:crypto.randomUUID(),round:gameState.round??1,player_id:myPlayerId,player_name:myPlayer.name,type:'buy',description:`${myPlayer.name} враждебно выкупил ${a.name} у ${selectedPlayer.name} за ₽${hostilePrice.toLocaleString()}`,amount:hostilePrice,created_at:new Date().toISOString()}
                        const newPlayers = gameState.players.map((p:any)=>
                          p.id===myPlayerId ? updBuyer : p.id===selectedPlayer.id ? updSeller : p
                        )
                        const newState = {...gameState,players:newPlayers,events:[ev,...(gameState.events||[])].slice(0,50)}
                        await db.from('rooms').update({game_state:newState}).eq('id',roomId)
                        showCashNotif(`Выкуплено: ${a.name}`, hostilePrice, false)
                        snd.buy()
                        setSelectedPlayer(null)
                      }}
                      className="ml-2 shrink-0 rounded-[9px] px-2.5 py-1.5 text-[10px] font-extrabold transition-all active:scale-95 disabled:opacity-30"
                      style={{background:'rgba(248,113,113,0.15)',border:'1px solid rgba(248,113,113,0.35)',color:'#F87171'}}>
                      ×2 ₽{(hostilePrice/1000).toFixed(0)}К
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedPlayer.debts.filter((d:any)=>d.amount>0).length > 0 && (
        <div className="rounded-[18px] border border-neg/20 bg-neg/[0.04] p-3">
          <div className="mb-2 text-[12px] font-bold text-neg">Долги</div>
          {selectedPlayer.debts.filter((d:any)=>d.amount>0).map((d:any, i:number)=>(
            <div key={i} className="flex justify-between py-1 text-[12px]">
              <span className="text-faint">{d.name}</span>
              <span className="font-bold text-neg">₽{d.monthly.toLocaleString()}/мес</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={()=>setSelectedPlayer(null)} className="mt-4 w-full rounded-[18px] border border-white/[0.08] bg-white/[0.05] py-3 text-center text-[13px] font-bold text-muted">
        Закрыть
      </button>
    </div>
  </div>
)}


{/* Очередь рендерится через обычный showTurnCard + queueMode — см. useEffect выше */}

{/* ── ЭКСТРЕННЫЙ ЭКРАН ── */}
{showEmergency && myPlayer && gameState && (
  <div className="absolute inset-0 z-50 flex flex-col" style={{background:'rgba(7,7,13,0.97)'}}>
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="text-[52px] mb-3">🚨</div>
      <div className="text-[20px] font-extrabold text-neg">Финансовый кризис!</div>
      <div className="mt-2 text-[13px] text-faint">Наличные ниже −₽10 000. Нужно срочно решить проблему.</div>
      <div className="mt-2 text-[22px] font-extrabold" style={{color:'#F87171'}}>₽{myPlayer.cash.toLocaleString()}</div>
    </div>
    <div className="px-6 pb-10 flex flex-col gap-3">
      {/* Продать активы */}
      {myPlayer.assets.length > 0 && (
        <div className="rounded-[20px] p-4" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <div className="text-[12px] font-bold mb-2 text-faint">Срочная продажа (50% от вложенных средств)</div>
          <div className="flex flex-col gap-2">
            {myPlayer.assets.map((a:any,i:number)=>{
              const salePrice = Math.round((a.down_payment ?? a.price) * 0.5)
              const deficit = Math.abs(myPlayer.cash) // сколько нужно покрыть
              const covers = myPlayer.cash + salePrice >= 0 // хватит ли чтобы выйти в 0
              return (
                <button key={i}
                  disabled={!covers}
                  onClick={async()=>{
                    if(!covers) return
                    const debtIdx = myPlayer.debts.findIndex((d:any)=>d.name===a.name)
                    let updated = {
                      ...myPlayer,
                      cash: myPlayer.cash + salePrice,
                      assets: myPlayer.assets.filter((_:any,j:number)=>j!==i),
                      passive_income: myPlayer.passive_income - (a.passive_income??0),
                    }
                    if(debtIdx>=0){
                      const d = myPlayer.debts[debtIdx]
                      updated = {...updated, total_expenses: updated.total_expenses - d.monthly, debts: updated.debts.filter((_:any,j:number)=>j!==debtIdx)}
                    }
                    const ev = {id:crypto.randomUUID(),round:1,player_id:myPlayerId,player_name:myPlayer.name,type:'sell',description:`Срочная продажа: ${a.name} за ₽${salePrice.toLocaleString()} (−50%)`,amount:salePrice,created_at:new Date().toISOString()}
                    const newPlayers = gameState.players.map((p:any)=>p.id===myPlayerId?updated:p)
                    const newState = {...gameState,players:newPlayers,events:[ev,...(gameState.events||[])].slice(0,50)}
                    await db.from('rooms').update({game_state:newState}).eq('id',roomId)
                    showCashNotif(`Продано: ${a.name}`,salePrice,true)
                    setShowEmergency(false)
                    advanceTurn(newState)
                  }} className="flex items-center justify-between rounded-[13px] px-3 py-2.5 text-left transition-all active:scale-95"
                  style={{
                    background: covers ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.03)',
                    border: covers ? '1px solid rgba(248,113,113,0.2)' : '1px solid rgba(255,255,255,0.06)',
                    opacity: covers ? 1 : 0.5,
                    cursor: covers ? 'pointer' : 'not-allowed',
                  }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold">{a.name}</div>
                    <div className="text-[10px] mt-0.5" style={{color: covers ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.25)'}}>
                      Вложено ₽{(a.down_payment??a.price).toLocaleString()} → получишь ₽{salePrice.toLocaleString()}
                      {!covers && <span className="ml-1" style={{color:'#F87171'}}>· не хватит (нужно ₽{deficit.toLocaleString()})</span>}
                    </div>
                  </div>
                  <div className="text-[13px] font-extrabold ml-3 shrink-0" style={{color: covers ? '#F5B843' : 'rgba(255,255,255,0.25)'}}>
                    +₽{salePrice.toLocaleString()}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
      {/* Взять кредит */}
      {(() => {
        const limit = getCreditLimit(myPlayer)
        const available = Math.max(0, limit - usedDebtMonthly*10)
        if(available <= 0) return null
        const suggestAmount = Math.min(available, Math.abs(myPlayer.cash) + 50000)
        const monthly = Math.round(suggestAmount / 10)
        return (
          <button onClick={async()=>{
            const {player:updated,success,reason} = takeCredit(myPlayer, suggestAmount)
            if(!success){showNotif(reason??'Нет кредитного лимита', '#F87171');return}
            const ev = {id:crypto.randomUUID(),round:1,player_id:myPlayerId,player_name:myPlayer.name,type:'credit',description:`Экстренный кредит ₽${suggestAmount.toLocaleString()} (платёж ₽${monthly.toLocaleString()}/мес)`,amount:suggestAmount,created_at:new Date().toISOString()}
            const newPlayers = gameState.players.map((p:any)=>p.id===myPlayerId?updated:p)
            const newState = {...gameState,players:newPlayers,events:[ev,...(gameState.events||[])].slice(0,50)}
            await db.from('rooms').update({game_state:newState}).eq('id',roomId)
            showCashNotif('Кредит получен',suggestAmount,true)
            setShowEmergency(false)
            advanceTurn(newState)
          }} className="flex items-center justify-between rounded-[18px] px-4 py-3.5 transition-all active:scale-95"
            style={{background:'rgba(96,165,250,0.10)',border:'1px solid rgba(96,165,250,0.25)'}}>
            <div>
              <div className="text-[13px] font-bold" style={{color:'#60A5FA'}}>🏦 Взять кредит</div>
              <div className="text-[10px] text-faint mt-0.5">₽{suggestAmount.toLocaleString()} · платёж ₽{monthly.toLocaleString()}/мес</div>
            </div>
            <div className="text-[13px] font-extrabold" style={{color:'#60A5FA'}}>+₽{suggestAmount.toLocaleString()}</div>
          </button>
        )
      })()}
      {/* Банкротство — нет ни одного актива покрывающего дефицит, и нет кредитного лимита */}
      {(()=>{
        const anyCovers = myPlayer.assets.some((a:any) => myPlayer.cash + Math.round((a.down_payment??a.price)*0.5) >= 0)
        const hasCredit = getCreditLimit(myPlayer) > 0
        return (!anyCovers && !hasCredit)
      })() && (
        <button onClick={async()=>{
          const ev = {id:crypto.randomUUID(),round:gameState?.round??1,player_id:myPlayerId,player_name:myPlayer.name,type:'hit',description:`${myPlayer.name} объявляет банкротство`,created_at:new Date().toISOString()}
          const newPlayers = gameState.players.map((p:any)=>p.id===myPlayerId?{...p,is_eliminated:true}:p)
          const newState = {...(latestStateRef.current??gameState),players:newPlayers,events:[ev,...((latestStateRef.current??gameState).events||[])].slice(0,50)}
          latestStateRef.current = newState
          await db.from('rooms').update({game_state:newState}).eq('id',roomId)
          setShowEmergency(false)
          setTimeout(()=>sounds.drumroll(),200); setTimeout(()=>sounds.bankrupt(),1000); setShowBankrupt(true)
        }} className="w-full rounded-[18px] py-3.5 text-[13px] font-bold text-center" style={{background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.25)',color:'#F87171'}}>
          Объявить банкротство ☠️
        </button>
      )}
    </div>
  </div>
)}

{/* ── ВРЕМЯ ВЫШЛО ── */}
{/* ── ПОБЕДИТЕЛЬ ── */}
{winner && (
  <div className="absolute inset-0 z-[80] flex flex-col items-center justify-center px-6"
    style={{background:'radial-gradient(circle at 50% 35%,rgba(245,184,67,.20),transparent 60%),rgba(7,7,13,.97)'}}>
    <div className="text-[64px] mb-2">🏆</div>
    <div className="text-[13px] font-bold tracking-[2px] text-gold mb-1 uppercase">Финансовая свобода!</div>
    <div className="text-[24px] font-extrabold text-center mb-1">
      {winner.id === myPlayerId ? 'Ты победил!' : `${winner.name} победил!`}
    </div>
    <div className="text-[13px] text-faint text-center mb-6">Пассивный доход покрыл все расходы</div>

    <div className="w-full rounded-[24px] p-5 mb-4" style={{background:'linear-gradient(145deg,rgba(245,184,67,.18),rgba(245,184,67,.04))',border:'1px solid rgba(245,184,67,.3)'}}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-[16px] text-[28px] font-extrabold text-[#0B0B13]" style={{background:winner.color}}>
          {winner.avatar ?? winner.initial}
        </div>
        <div>
          <div className="text-[18px] font-extrabold">{winner.name}</div>
          <div className="text-[12px] text-faint">{winner.profession?.icon} {winner.profession?.name}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[22px] font-extrabold text-gold">{freedomProgress(winner)}%</div>
          <div className="text-[10px] text-faint">прогресс</div>
        </div>
      </div>
      <div className="flex justify-between text-[12px]">
        <span className="text-faint">Пассив</span><span className="font-bold text-pos">+₽{winner.passive_income?.toLocaleString()}/мес</span>
      </div>
      <div className="flex justify-between text-[12px] mt-1">
        <span className="text-faint">Расходы</span><span className="font-bold text-neg">₽{winner.total_expenses?.toLocaleString()}/мес</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden mt-3" style={{background:'rgba(255,255,255,0.07)'}}>
        <div className="h-full rounded-full" style={{width:'100%',background:'linear-gradient(90deg,#E0891F,#F5B843,#FBD888)',boxShadow:'0 0 10px rgba(245,184,67,.6)'}}/>
      </div>
    </div>

    {/* Итоговая таблица */}
    {gameState?.players?.length > 1 && (
      <div className="w-full flex flex-col gap-2 mb-6">
        {[...(gameState.players||[])].filter((p:any)=>p.id!==winner.id).sort((a:any,b:any)=>freedomProgress(b)-freedomProgress(a)).map((p:any,i:number)=>(
          <div key={p.id} className="flex items-center gap-3 rounded-[16px] px-4 py-3" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
            <span className="text-[13px] font-bold text-faint w-4">{i+2}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[16px] font-extrabold text-[#0B0B13]" style={{background:p.color}}>{p.avatar??p.initial}</div>
            <span className="flex-1 text-[13px] font-semibold truncate">{p.name}</span>
            <span className="text-[12px] font-bold text-gold">{freedomProgress(p)}%</span>
          </div>
        ))}
      </div>
    )}

    <button onClick={()=>router.push('/lobby')}
      className="gold-grad w-full rounded-[20px] py-4 text-[16px] font-extrabold text-[#1A1206]"
      style={{boxShadow:'0 16px 36px -12px rgba(245,184,67,.6)'}}>
      Новая игра →
    </button>
  </div>
)}

{/* ── БАНКРОТСТВО ── */}
{(showBankrupt || (myPlayer as any)?.is_eliminated) && (
  <div className="absolute inset-0 z-[70] flex flex-col items-center justify-center px-6"
    style={{background:'radial-gradient(circle at 50% 40%,rgba(248,113,113,.12),transparent 60%),rgba(7,7,13,.97)'}}>
    <div className="text-[56px] mb-3">☠️</div>
    <div className="text-[13px] font-bold tracking-[2px] text-neg mb-1 uppercase">Банкротство</div>
    <div className="text-[22px] font-extrabold text-center mb-2">Ты выбыл из игры</div>
    <div className="text-[13px] text-faint text-center mb-6">
      {(myPlayer as any)?.is_eliminated
        ? 'Денежный поток ушёл в минус — не удалось покрыть расходы'
        : 'Нет средств для продолжения игры'}
    </div>
    <div className="w-full rounded-[20px] p-4 mb-6" style={{background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.2)'}}>
      <div className="flex justify-between text-[13px] mb-2">
        <span className="text-faint">Наличные</span>
        <span className="font-bold text-neg">₽{myPlayer?.cash?.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-[13px] mb-2">
        <span className="text-faint">Пассивный доход</span>
        <span className="font-bold">₽{myPlayer?.passive_income?.toLocaleString()}/мес</span>
      </div>
      <div className="flex justify-between text-[13px]">
        <span className="text-faint">Расходы</span>
        <span className="font-bold text-neg">₽{myPlayer?.total_expenses?.toLocaleString()}/мес</span>
      </div>
    </div>
    <div className="text-[12px] text-faint text-center mb-4">Ты можешь наблюдать за игрой других участников</div>
    <button onClick={async()=>{
        setShowBankrupt(false)
        // НЕ сбрасываем bankruptProcessedRef — игрок уже eliminated, не нужен повторный запуск
        const base = latestStateRef.current ?? gameState
        if (base) await advanceTurn(base)
      }}
      className="w-full rounded-[20px] py-4 text-[15px] font-extrabold text-center"
      style={{background:'rgba(248,113,113,0.15)',border:'1px solid rgba(248,113,113,0.35)',color:'#F87171',cursor:'pointer'}}>
      Продолжить наблюдать →
    </button>
  </div>
)}

{(showTimeUp || gameTimeLeft === 0) && gameState && (()=>{
  const activePlayers = (gameState.players||[]).filter((p:any)=>!p.is_eliminated)
  const winner = [...activePlayers].sort((a:any,b:any)=>freedomProgress(b)-freedomProgress(a))[0]
  if(!winner) return null
  const winProgress = freedomProgress(winner)
  return (
    <div className="absolute inset-0 z-[70] flex flex-col items-center justify-center px-6"
      style={{background:'radial-gradient(circle at 50% 40%,rgba(245,184,67,.18),transparent 60%),rgba(7,7,13,.97)'}}>
      <div className="text-[52px] mb-2">⏰</div>
      <div className="text-[13px] font-bold tracking-[2px] text-gold mb-1">ВРЕМЯ ВЫШЛО</div>
      <div className="text-[22px] font-extrabold text-center mb-4">Игра завершена!</div>
      <div className="w-full rounded-[24px] p-5 mb-4" style={{background:'linear-gradient(145deg,rgba(245,184,67,.18),rgba(245,184,67,.04))',border:'1px solid rgba(245,184,67,.3)'}}>
        <div className="text-[11px] font-bold tracking-[1px] text-gold/70 uppercase mb-1">Победитель</div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[14px] text-[24px] font-extrabold text-[#0B0B13]" style={{background:winner.color}}>
            {(winner as any).avatar ? (winner as any).avatar : winner.initial}
          </div>
          <div className="flex-1">
            <div className="text-[18px] font-extrabold">{winner.name}</div>
            <div className="text-[12px] text-faint">{winner.profession?.icon} {winner.profession?.name}</div>
          </div>
          <div className="text-right">
            <div className="text-[22px] font-extrabold text-gold">{winProgress}%</div>
            <div className="text-[10px] text-faint">прогресс</div>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.07)'}}>
          <div className="h-full rounded-full" style={{width:`${winProgress}%`,background:'linear-gradient(90deg,#E0891F,#F5B843,#FBD888)',boxShadow:'0 0 8px rgba(245,184,67,.5)'}}/>
        </div>
      </div>
      {/* Итоговая таблица */}
      <div className="w-full flex flex-col gap-2 mb-6">
        {[...activePlayers].sort((a:any,b:any)=>freedomProgress(b)-freedomProgress(a)).slice(1).map((p:any,i:number)=>(
          <div key={p.id} className="flex items-center gap-3 rounded-[16px] px-4 py-3" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
            <span className="text-[13px] font-bold text-faint w-4">{i+2}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[16px] font-extrabold text-[#0B0B13]" style={{background:p.color}}>
              {(p as any).avatar ?? p.initial}
            </div>
            <span className="flex-1 text-[13px] font-semibold">{p.name}</span>
            <span className="text-[13px] font-bold text-gold">{freedomProgress(p)}%</span>
          </div>
        ))}
      </div>
      <button onClick={()=>router.push('/lobby')}
        className="gold-grad w-full rounded-[20px] py-4 text-[16px] font-extrabold text-[#1A1206]"
        style={{boxShadow:'0 16px 36px -12px rgba(245,184,67,.6)'}}>
        Новая игра →
      </button>
    </div>
  )
})()}

{/* ── НАСТРОЙКИ УВЕДОМЛЕНИЙ ── */}
{showNotifSettings && (
  <div className="absolute inset-0 z-[60] flex flex-col" style={{background:'#0B0B13'}}>
    <div className="flex items-center gap-3 px-[22px] pt-12 pb-4 shrink-0" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
      <button onClick={()=>setShowNotifSettings(false)} className="flex h-9 w-9 items-center justify-center rounded-[12px] text-[18px]" style={{background:'rgba(255,255,255,0.06)'}}>←</button>
      <div>
        <div className="text-[18px] font-extrabold">Настройки</div>
        <div className="text-[10px] text-faint mt-0.5">персональные · только для тебя</div>
      </div>
    </div>
    <div className="overflow-y-auto px-[22px] py-4 flex-1 flex flex-col gap-4">

      {/* Уведомления */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-faint mb-2">Уведомления</div>
        <div className="rounded-[18px] flex flex-col divide-y divide-white/[0.05]" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
          {([
            {key:'hit',         icon:'hit',     label:'Удары',              desc:'Карточка с неожиданным расходом'},
            {key:'event',       icon:'event',   label:'События',            desc:'ЦБ, инфляция и бонусы'},
            {key:'market',      icon:'sell',    label:'Биржа',              desc:'Карточка покупки акций и крипты'},
            {key:'auction',     icon:'trophy',  label:'Аукцион',            desc:'Карточка уникального актива'},
            {key:'opportunity', icon:'buy',     label:'Сделки',             desc:'Карточка инвестиционных предложений'},
            {key:'baby_others', icon:'child',   label:'Дети у других',      desc:'Окно подарка когда у другого ребёнок'},
          ] as {key: keyof typeof notifPrefs, icon:string, label:string, desc:string}[]).map(({key,icon,label,desc})=>(
            <div key={key} className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center"><GameIcon type={icon} size={18}/></div>
                <div>
                  <div className="text-[13px] font-semibold">{label}</div>
                  <div className="text-[10px] text-faint">{desc}</div>
                </div>
              </div>
              <button onClick={()=>setNotifPrefs(p=>({...p,[key]:!p[key]}))}
                className="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200"
                style={{background: (notifPrefs[key] as boolean) ? '#34D399' : 'rgba(255,255,255,0.1)'}}>
                <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200"
                  style={{left: (notifPrefs[key] as boolean) ? 'calc(100% - 22px)' : '2px'}} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Звук */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-faint mb-2">Звук</div>
        <div className="rounded-[18px]" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center"><GameIcon type="salary" size={18}/></div>
              <div>
                <div className="text-[13px] font-semibold">Звуковые эффекты</div>
                <div className="text-[10px] text-faint">Кубик, зарплата, покупка</div>
              </div>
            </div>
            <button onClick={()=>setNotifPrefs(p=>({...p,sound:!p.sound}))}
              className="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200"
              style={{background: notifPrefs.sound ? '#34D399' : 'rgba(255,255,255,0.1)'}}>
              <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200"
                style={{left: notifPrefs.sound ? 'calc(100% - 22px)' : '2px'}} />
            </button>
          </div>
        </div>
      </div>

      {/* Фильтр по тикерам */}
      {notifPrefs.market && (
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-faint mb-2">Уведомления по тикерам</div>
          <div className="text-[10px] text-faint mb-2">Отключи тикеры, изменения цен которых тебя не интересуют</div>
          <div className="flex flex-wrap gap-2">
            {['SBER','OZON','NVDA','YDEX','GAZP','GOLD','BTC','ETH','TON','HMSTR'].map(ticker=>{
              const muted = notifPrefs.mutedTickers.includes(ticker)
              const icons: Record<string,string> = {SBER:'🏦',OZON:'📦',NVDA:'💻',YDEX:'🔍',GAZP:'⛽',GOLD:'🥇',BTC:'₿',ETH:'⟠',TON:'💎',HMSTR:'🐹'}
              return (
                <button key={ticker} onClick={()=>setNotifPrefs(p=>({
                  ...p,
                  mutedTickers: muted ? p.mutedTickers.filter(t=>t!==ticker) : [...p.mutedTickers, ticker]
                }))} className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[12px] font-bold transition-all active:scale-95"
                  style={{
                    background: muted ? 'rgba(255,255,255,0.04)' : 'rgba(96,165,250,0.12)',
                    border: muted ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(96,165,250,0.3)',
                    color: muted ? 'rgba(255,255,255,0.3)' : '#60A5FA',
                    textDecoration: muted ? 'line-through' : 'none',
                  }}>
                  {icons[ticker]} {ticker}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {notifPrefs.mutedTickers.length > 0 && (
        <button onClick={()=>setNotifPrefs(p=>({...p,mutedTickers:[]}))}
          className="text-[12px] text-faint text-center py-2 active:opacity-60">
          Сбросить фильтр тикеров
        </button>
      )}
    </div>
  </div>
)}

{babyEvent && (
  <div className="absolute inset-0 z-50 flex flex-col">
    <div className="flex-1 bg-[#07070D]/70" onClick={()=>{setBabyEvent(null); setOthersQueue(q => q.filter((i:any) => i.kind !== 'baby'))}} />
    <div className="rounded-t-[36px] border-t-2 border-gold/30 px-6 pb-10 pt-4"
      style={{ background:'linear-gradient(180deg,rgba(20,15,5,.98),rgba(11,11,19,.99))', boxShadow:'0 -24px 60px -16px rgba(245,184,67,.3)' }}>
      <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20" />
      <div className="text-center mb-4">
        <div className="text-[48px]">👶</div>
        <div className="mt-2 text-[18px] font-extrabold">У {babyEvent.player_name} родился ребёнок!</div>
        <div className="mt-1 text-[13px] text-faint">Скинься на памперсы 🍼</div>
      </div>
      <div className="mb-3 rounded-[16px] border border-white/[0.08] bg-white/[0.045] p-3">
        <div className="flex justify-between mb-2">
          <span className="text-[12px] text-faint">Сумма подарка</span>
          <span className="text-[13px] font-extrabold text-gold">₽{giftAmount.toLocaleString()}</span>
        </div>
        <input type="range" min={500} max={Math.max(500, Math.min(myPlayer?.cash ?? 0, 50000))} step={500}
          value={Math.min(giftAmount, Math.max(500, Math.min(myPlayer?.cash ?? 0, 50000)))}
          onChange={e=>setGiftAmount(Number(e.target.value))}
          className="w-full" disabled={(myPlayer?.cash ?? 0) < 500} />
        <div className="flex justify-between mt-1 text-[10px] text-faint">
          <span>₽500</span><span>₽{Math.min(myPlayer?.cash ?? 0, 50000).toLocaleString()} (у тебя)</span>
        </div>
      </div>
      {(myPlayer?.cash ?? 0) < 500 && (
        <div className="mb-3 rounded-[12px] px-3 py-2 text-[12px] font-semibold text-center" style={{background:'rgba(248,113,113,0.1)',color:'#F87171'}}>
          Недостаточно наличных для подарка
        </div>
      )}
      <button onClick={async()=>{
        if (!myPlayer || !gameState) return
        if (myPlayer.cash < giftAmount) { showNotif('Недостаточно наличных', '#F87171'); return }
        const recipient = gameState.players.find((p:any) => p.id === babyEvent.player_id)
        if (!recipient) return
        const updatedMe = { ...myPlayer, cash: myPlayer.cash - giftAmount }
        const updatedRecipient = { ...recipient, cash: recipient.cash + giftAmount }
        const newPlayers = gameState.players.map((p:any) =>
          p.id === myPlayerId ? updatedMe : p.id === babyEvent.player_id ? updatedRecipient : p
        )
        const newEvent = { id: crypto.randomUUID(), round: gameState?.round??1, player_id: myPlayerId, player_name: myPlayer.name, type: 'child', description: `${myPlayer.name} подарил ${babyEvent.player_name} ₽${giftAmount.toLocaleString()} на памперсы 🍼`, created_at: new Date().toISOString() }
        const newState = { ...gameState, players: newPlayers, events: [newEvent,...(gameState.events||[])].slice(0,50) }
        await db.from('rooms').update({game_state:newState}).eq('id',roomId)
        showCashNotif('Подарок на памперсы 🍼', giftAmount, false)
        setBabyEvent(null); setOthersQueue(q => q.filter(i => i.kind !== 'baby'))
      }} disabled={(myPlayer?.cash ?? 0) < 500 || giftAmount > (myPlayer?.cash ?? 0)}
        className="gold-grad w-full rounded-[18px] py-4 text-[16px] font-extrabold text-[#1A1206] mb-2 disabled:opacity-40">
        🎁 Подарить ₽{giftAmount.toLocaleString()}
      </button>
      <button onClick={()=>{setBabyEvent(null); setOthersQueue(q => q.filter((i:any) => i.kind !== 'baby'))}} className="w-full rounded-[18px] border border-white/[0.08] bg-white/[0.05] py-3 text-center text-[13px] font-bold text-muted">
        Пропустить
      </button>
    </div>
  </div>
)}


        {/* TURN CARD */}
        {showTurnCard && currentCell && (
          <div className="absolute inset-0 z-20 flex flex-col">
            <div className="flex-1 bg-[#07070D]/60 backdrop-blur-[2px]" onClick={handlePass} />
            <div className="rounded-t-[36px] border-t-2 px-6 pb-10 pt-3 overflow-y-auto max-h-[80vh]"
              style={{
                background: currentCell.type==='market' ? 'linear-gradient(180deg,rgba(11,18,28,.97),rgba(11,11,19,.99))' : currentCell.type==='hit' ? 'linear-gradient(180deg,rgba(24,11,11,.97),rgba(11,11,19,.99))' : currentCell.type==='event' ? 'linear-gradient(180deg,rgba(22,18,5,.97),rgba(11,11,19,.99))' : currentCell.type==='auction' ? 'linear-gradient(180deg,rgba(18,14,26,.97),rgba(11,11,19,.99))' : currentCell.type==='charity' ? 'linear-gradient(180deg,rgba(22,14,20,.97),rgba(11,11,19,.99))' : currentCell.type==='child'||currentCell.type==='salary' ? 'linear-gradient(180deg,rgba(22,18,5,.97),rgba(11,11,19,.99))' : 'linear-gradient(180deg,rgba(14,22,16,.97),rgba(11,11,19,.99))',
                borderColor: currentCell.type==='market' ? 'rgba(96,165,250,0.5)' : currentCell.type==='hit' ? 'rgba(248,113,113,0.5)' : currentCell.type==='event' ? 'rgba(245,184,67,0.5)' : currentCell.type==='auction' ? 'rgba(167,139,250,0.5)' : currentCell.type==='charity' ? 'rgba(232,162,200,0.5)' : currentCell.type==='child'||currentCell.type==='salary' ? 'rgba(245,184,67,0.5)' : 'rgba(52,211,153,0.5)',
                boxShadow: currentCell.type==='market' ? '0 -24px 60px -16px rgba(96,165,250,.35)' : currentCell.type==='hit' ? '0 -24px 60px -16px rgba(248,113,113,.35)' : currentCell.type==='event' ? '0 -24px 60px -16px rgba(245,184,67,.35)' : currentCell.type==='auction' ? '0 -24px 60px -16px rgba(167,139,250,.35)' : currentCell.type==='charity' ? '0 -24px 60px -16px rgba(232,162,200,.35)' : currentCell.type==='child'||currentCell.type==='salary' ? '0 -24px 60px -16px rgba(245,184,67,.35)' : '0 -24px 60px -16px rgba(52,211,153,.35)',
              }}>
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20" />

              <div className="flex items-center gap-3.5 mb-4">
                <div className={`grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[16px] border-[1.5px] ${CELL_CONFIG[currentCell.type]?.bg} ${CELL_CONFIG[currentCell.type]?.border} ${CELL_CONFIG[currentCell.type]?.color}`}>
                  {CELL_ICONS[currentCell.type]}
                </div>
                <div>
                  {currentCell.type === 'market' || currentCell.type === 'opportunity' ? (
                    // Биржа и Сделка — только тип крупно
                    <div className={`text-[22px] font-extrabold tracking-[-.3px] ${CELL_CONFIG[currentCell.type]?.color}`}>
                      {CELL_CONFIG[currentCell.type]?.label}
                    </div>
                  ) : (
                    <>
                      <div className={`text-[11px] font-extrabold tracking-[2px] ${CELL_CONFIG[currentCell.type]?.color}`}>{CELL_CONFIG[currentCell.type]?.label.toUpperCase()}</div>
                      <div className="mt-0.5 text-[18px] font-extrabold tracking-[-.3px]">
                        {currentCell.type==='hit'&&pickedHit?pickedHit.desc:currentCell.type==='event'&&pickedEvent?pickedEvent.desc:currentCell.type==='auction'&&auctionAsset?auctionAsset.name:currentCell.label}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ВОЗМОЖНОСТЬ */}
              {currentCell.type==='opportunity' && (
                <div>
                  {!selectedDeal && !showCredit && (
                    <>
                      <div className="mb-3 text-[12px] text-faint">Какую сделку рассматриваешь?</div>
                      <div className="flex gap-2.5 mb-3">
                        <button onClick={()=>setSelectedDeal(getRandomDeal('small'))} className="flex-1 rounded-[18px] border border-pos/30 bg-pos/[0.08] p-4 text-center">
                          <div className="text-[22px]">🏪</div>
                          <div className="mt-1.5 text-[14px] font-extrabold text-pos">Малая</div>
                          <div className="text-[10px] text-faint mt-0.5">взнос до 800К</div>
                        </button>
                        <button onClick={()=>setSelectedDeal(getRandomDeal('large'))} className="flex-1 rounded-[18px] border border-gold/30 bg-gold/[0.08] p-4 text-center">
                          <div className="text-[22px]">🏢</div>
                          <div className="mt-1.5 text-[14px] font-extrabold text-gold">Крупная</div>
                          <div className="text-[10px] text-faint mt-0.5">взнос от 280К</div>
                        </button>
                      </div>
                      <button onClick={handlePass} className="w-full rounded-[18px] border border-white/[0.08] bg-white/[0.05] py-3 text-center text-[13px] font-bold text-muted">Пропустить</button>
                    </>
                  )}

                  {selectedDeal && !showCredit && (
                      <div>
                        <button onClick={()=>setSelectedDeal(null)} className="mb-3 text-[12px] text-faint">← Другая сделка</button>
                        <div className="mb-2 text-[15px] font-extrabold">{selectedDeal.name}</div>
                        <div className="mb-3 grid grid-cols-2 gap-2">
                          {[
                            {label:'Цена',value:`₽${(selectedDeal.price/1000000).toFixed(1)}М`,cls:''},
                            {label:'Взнос',value:`₽${selectedDeal.down_payment.toLocaleString()}`,cls:'text-gold'},
                            {label:'Доход/мес',value:`+₽${selectedDeal.passive_income.toLocaleString()}`,cls:'text-pos'},
                            {label:'Платёж/мес',value:selectedDealMonthly>0?`-₽${selectedDealMonthly.toLocaleString()}`:'нет',cls:'text-neg'},
                          ].map(({label,value,cls})=>(
                            <div key={label} className="rounded-[14px] border border-white/[0.08] bg-white/[0.045] p-2.5">
                              <div className="text-[10px] text-faint">{label}</div>
                              <div className={`mt-0.5 text-[13px] font-extrabold ${cls}`}>{value}</div>
                            </div>
                          ))}
                        </div>
                        <div className={`mb-3 rounded-[14px] border p-2.5 text-center ${selectedDealNet>=0?'border-pos/30 bg-pos/[0.08]':'border-neg/30 bg-neg/[0.08]'}`}>
                          <div className="text-[10px] text-faint">Чистый поток</div>
                          <div className={`text-[16px] font-extrabold ${selectedDealNet>=0?'text-pos':'text-neg'}`}>{selectedDealNet>=0?'+':''}₽{selectedDealNet.toLocaleString()}/мес</div>
                        </div>
                        {selectedDealCanAfford ? (
                          <button onClick={()=>handleBuy(selectedDeal)} className="green-grad mb-2.5 w-full rounded-[18px] py-4 text-[16px] font-extrabold text-[#081208]" style={{ boxShadow:'0 14px 30px -12px rgba(52,211,153,.55)' }}>
                            Купить ₽{selectedDeal.down_payment.toLocaleString()}
                          </button>
                        ) : (
                          <button onClick={()=>setShowCredit(true)} className="gold-grad mb-2.5 w-full rounded-[18px] py-4 text-[16px] font-extrabold text-[#1A1206]">
                            💳 Взять кредит
                          </button>
                        )}
                        <button onClick={handlePass} className="w-full rounded-[18px] border border-white/[0.08] bg-white/[0.05] py-3 text-center text-[13px] font-bold text-muted">Пас</button>
                      </div>
                  )}

                  {showCredit && selectedDeal && (()=>{
                    // Платёж = сумма × ЦБ%, выдаётся кратно 50К
                    // Макс кредит = денежный поток / ЦБ% (чтобы платёж не превысил поток)
                    const cashFlow = Math.max(0, (myPlayer.profession?.salary??0) + myPlayer.passive_income - myPlayer.total_expenses)
                    const maxByFlow = cashFlow > 0 ? Math.floor(cashFlow / keyRate / 50000) * 50000 : 0
                    const needed = selectedDeal.down_payment - myPlayer.cash
                    // Варианты кратно 50К от 50К до лимита
                    const options: number[] = []
                    for (let a = 50000; a <= Math.min(maxByFlow, 2000000); a += 50000) {
                      options.push(a)
                    }
                    // Показываем 6 вариантов вокруг нужной суммы
                    const minIdx = Math.max(0, options.findIndex(a => a >= needed) - 1)
                    const shown = options.length > 0 ? options.slice(minIdx, minIdx + 6) : []

                    return (
                    <div>
                      <button onClick={()=>setShowCredit(false)} className="mb-3 text-[12px] text-faint">← Назад</button>
                      <div className="mb-3 rounded-[14px] p-3 text-[11px]" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                        <div className="flex justify-between"><span className="text-faint">Нужно на взнос</span><span className="font-bold text-neg">₽{Math.max(0,needed).toLocaleString()}</span></div>
                        <div className="flex justify-between mt-1"><span className="text-faint">Ставка ЦБ сейчас</span><span className="font-bold" style={{color:'#60A5FA'}}>{Math.round(keyRate*100)}%</span></div>
                        <div className="flex justify-between mt-1"><span className="text-faint">Платёж по кредиту</span><span className="font-bold" style={{color:'#F87171'}}>сумма × {Math.round(keyRate*100)}%/мес</span></div>
                        <div className="flex justify-between mt-1"><span className="text-faint">Твой денежный поток</span><span className={`font-bold ${cashFlow>0?'text-pos':'text-neg'}`}>₽{cashFlow.toLocaleString()}/мес</span></div>
                        {cashFlow <= 0 && <div className="mt-1 text-[10px] text-neg">Нельзя брать кредит — денежный поток нулевой или отрицательный</div>}
                        {cashFlow > 0 && maxByFlow === 0 && <div className="mt-1 text-[10px] text-neg">Поток слишком мал для кредита от ₽50К</div>}
                        <div className="mt-1.5 text-[10px] text-faint">Макс. кредит = поток ÷ ЦБ% · кратно ₽50К</div>
                      </div>
                      <div className="flex flex-col gap-2 mb-3">
                        {shown.length === 0 && (
                          <div className="text-center py-4 text-[13px] text-faint">Нет доступных вариантов</div>
                        )}
                        {shown.map(amount=>{
                          const monthly = Math.round(amount * keyRate) // сумма × ЦБ%
                          const canBuy = myPlayer.cash + amount >= selectedDeal.down_payment
                          const newTotal = myPlayer.total_expenses + monthly
                          const netFlow = (myPlayer.profession?.salary??0) + myPlayer.passive_income - newTotal
                          const wouldBeNeg = netFlow < 0
                          return (
                            <button key={amount}
                              onClick={async()=>{
                                if(!myPlayer||!gameState) return
                                const updPlayer = { ...myPlayer, cash:myPlayer.cash+amount, total_expenses:myPlayer.total_expenses+monthly, debts:[...myPlayer.debts,{name:`Кредит ₽${(amount/1000).toFixed(0)}К`,amount,monthly}] }
                                const ev = {id:crypto.randomUUID(),round:gameState.round??1,player_id:myPlayerId,player_name:myPlayer.name,type:'credit',description:`${myPlayer.name} взял кредит ₽${amount.toLocaleString()}`,amount,created_at:new Date().toISOString()}
                                const newPlayers = gameState.players.map((p:any)=>p.id===myPlayerId?updPlayer:p)
                                const newState = {...(latestStateRef.current??gameState),players:newPlayers,events:[ev,...((latestStateRef.current??gameState).events||[])].slice(0,50)}
                                latestStateRef.current = newState
                                await db.from('rooms').update({game_state:newState}).eq('id',roomId)
                                setShowCredit(false)
                                showCashNotif(`Кредит ₽${(amount/1000).toFixed(0)}К`, amount, true)
                              }}
                              className="rounded-[14px] border p-3 text-left transition-all active:scale-[0.98]"
                              style={{
                                border: canBuy ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(255,255,255,0.08)',
                                background: canBuy ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.03)',
                              }}>
                              <div className="flex justify-between items-center">
                                <span className="text-[15px] font-extrabold">₽{(amount/1000).toFixed(0)}К</span>
                                <div className="text-right">
                                  {canBuy && <span className="text-[10px] font-bold text-pos block">✓ хватит на взнос</span>}
                                  {wouldBeNeg && <span className="text-[9px] text-neg block">⚠ поток уйдёт в минус</span>}
                                </div>
                              </div>
                              <div className="mt-1 text-[11px] text-faint">
                                Платёж <span className="font-bold" style={{color:'#F87171'}}>₽{monthly.toLocaleString()}/мес</span>
                                <span className="ml-2 text-faint opacity-60">({amount/1000}К × {Math.round(keyRate*100)}%)</span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                      <button onClick={handlePass} className="w-full rounded-[18px] border border-white/[0.08] bg-white/[0.05] py-3 text-center text-[13px] font-bold text-muted">Отказаться</button>
                    </div>
                    )
                  })()}
                </div>
              )}

              {/* БИРЖА / КРИПТА */}
              {currentCell.type==='market' && marketData && (
                <div className="flex flex-col gap-3">
                  {/* Цена и изменение — название уже в заголовке карточки */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[26px]">{marketData.icon}</span>
                      <div>
                        <div className="text-[13px] font-bold leading-none">{marketData.name}</div>
                        <div className="text-[11px] text-faint">{marketData.ticker} · {marketData.isStock ? 'Акция' : 'Крипто'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[22px] font-extrabold text-gold leading-none">₽{marketData.newPrice.toLocaleString()}</div>
                      <div className={`text-[12px] font-bold mt-0.5 ${marketData.pct>=0?'text-pos':'text-neg'}`}>{marketData.emoji} {marketData.pct>=0?'+':''}{marketData.pct}% · б.₽{marketData.oldPrice.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* График цены */}
                  {(()=>{
                    const W=310, H=72, pts=24
                    const lo=marketData.min||marketData.newPrice*0.6
                    const hi=marketData.max||marketData.newPrice*1.4
                    const range=hi-lo||1
                    const isUp=marketData.pct>=0
                    const color=isUp?'#34D399':'#F87171'
                    const colorDim=isUp?'rgba(52,211,153,0.15)':'rgba(248,113,113,0.15)'
                    // Генерируем псевдо-историю на основе seed от ticker
                    const seed=marketData.ticker.split('').reduce((a:number,c:string)=>a+c.charCodeAt(0),0)
                    const rng=(i:number)=>{
                      const x=Math.sin(seed*i*0.7+i*1.3)*10000
                      return x-Math.floor(x)
                    }
                    // Строим точки: начало ~oldPrice, конец = newPrice
                    const prices:number[]=[]
                    const startPrice=marketData.oldPrice
                    const endPrice=marketData.newPrice
                    for(let i=0;i<pts;i++){
                      const t=i/(pts-1)
                      const trend=startPrice+(endPrice-startPrice)*t
                      const noise=(rng(i)-0.5)*range*0.18
                      prices.push(Math.max(lo,Math.min(hi,trend+noise)))
                    }
                    prices[pts-1]=endPrice
                    // SVG координаты
                    const px=(p:number)=>Math.round(((p-lo)/range)*(H-8)+4)
                    const points=prices.map((p,i)=>`${Math.round(i/(pts-1)*(W-2)+1)},${H-px(p)}`).join(' ')
                    const areaPoints=`1,${H} ${points} ${W-1},${H}`
                    const gradId=`cg${seed}`
                    return (
                      <div className="rounded-[14px] overflow-hidden" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                        {/* Мин/Макс/Текущая над графиком */}
                        <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                          <div>
                            <div className="text-[9px] text-faint uppercase tracking-wide">Мин</div>
                            <div className="text-[11px] font-bold" style={{color:'#F87171'}}>₽{lo.toLocaleString()}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[9px] text-faint uppercase tracking-wide">Сейчас</div>
                            <div className="text-[12px] font-extrabold" style={{color}}>{marketData.pct>=0?'+':''}{marketData.pct}%</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] text-faint uppercase tracking-wide">Макс</div>
                            <div className="text-[11px] font-bold" style={{color:'#34D399'}}>₽{hi.toLocaleString()}</div>
                          </div>
                        </div>
                        {/* SVG график */}
                        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{display:'block'}}>
                          <defs>
                            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
                              <stop offset="100%" stopColor={color} stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                          {/* Область под графиком */}
                          <polygon points={areaPoints} fill={`url(#${gradId})`}/>
                          {/* Линия графика */}
                          <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
                          {/* Точка последней цены */}
                          <circle cx={W-1} cy={H-px(endPrice)} r="3" fill={color} stroke="rgba(11,11,19,0.9)" strokeWidth="1.5"/>
                          {/* Горизонтальная пунктирная линия текущей цены */}
                          <line x1="0" y1={H-px(endPrice)} x2={W} y2={H-px(endPrice)} stroke={color} strokeWidth="0.5" strokeDasharray="3,4" strokeOpacity="0.4"/>
                        </svg>
                      </div>
                    )
                  })()}

                  {/* Описание */}
                  {marketData.description && <div className="text-[11px] text-faint italic leading-relaxed">{marketData.description}</div>}

                  {/* Позиция (если есть) */}
                  {marketHeldQty > 0 && (
                    <div className="rounded-[14px] p-3" style={{background:'rgba(96,165,250,0.07)',border:'1px solid rgba(96,165,250,0.18)'}}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-[10px] text-faint uppercase tracking-wide">Моя позиция</div>
                          <div className="text-[14px] font-extrabold mt-0.5" style={{color:'#60A5FA'}}>{marketHeldQty} шт · ₽{marketCurrentHeldValue.toLocaleString()}</div>
                          <div className="text-[10px] text-faint mt-0.5">куплено за ₽{marketHeldValue.toLocaleString()}</div>
                        </div>
                        <div className={`text-[14px] font-extrabold ${marketPnl>=0?'text-pos':'text-neg'}`}>{marketPnl>=0?'+':''}₽{marketPnl.toLocaleString()}</div>
                      </div>
                      <button onClick={async()=>{
                        if(!myPlayer||!gameState) return
                        const newAssets = myPlayer.assets.filter((a:any)=>!a.name?.includes(marketData.name)&&!a.id?.startsWith(marketData.id))
                        const updated = {...myPlayer,cash:myPlayer.cash+marketCurrentHeldValue,assets:newAssets}
                        const ev = {id:crypto.randomUUID(),round:1,player_id:myPlayerId,player_name:myPlayer.name,type:'sell',description:`${myPlayer.name} продал ${marketData.name} x${marketHeldQty} за ₽${marketCurrentHeldValue.toLocaleString()} (${marketPnl>=0?'+':''}₽${marketPnl.toLocaleString()})`,created_at:new Date().toISOString()}
                        const newState = {...gameState,players:gameState.players.map((p:any)=>p.id===myPlayerId?updated:p),events:[ev,...(gameState.events||[])].slice(0,50)}
                        await db.from('rooms').update({game_state:newState}).eq('id',roomId)
                        snd.buy(); showCashNotif(`Продано ${marketData.name}`,marketCurrentHeldValue,true)
                        setShowTurnCard(false); if(isMyTurn&&hasRolled) advanceTurn(newState)
                      }} className="mt-2 w-full rounded-[10px] py-2 text-[11px] font-bold text-center transition-all active:scale-95"
                        style={{background:'rgba(96,165,250,0.1)',border:'1px solid rgba(96,165,250,0.25)',color:'#60A5FA'}}>
                        Продать всё · ₽{marketCurrentHeldValue.toLocaleString()}
                      </button>
                    </div>
                  )}

                  {/* Покупка */}
                  {maxMarketQty > 0 ? (
                    <div className="rounded-[14px] p-3" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] text-faint">Количество</span>
                        <span id="market-qty-display" className="text-[13px] font-extrabold text-gold">{marketQty} шт · ₽{marketCost.toLocaleString()}</span>
                      </div>
                      <input type="range" min={1} max={maxMarketQty} defaultValue={marketQty}
                        onInput={e => {
                          // Обновляем отображение напрямую без React ре-рендера
                          const qty = Number((e.target as HTMLInputElement).value)
                          const cost = qty * (marketData?.newPrice ?? 0)
                          const el = document.getElementById('market-qty-display')
                          if (el) el.textContent = `${qty} шт · ₽${cost.toLocaleString('ru-RU')}`
                        }}
                        onPointerUp={e => setMarketQty(Number((e.target as HTMLInputElement).value))}
                        onTouchEnd={e => setMarketQty(Number((e.target as HTMLInputElement).value))}
                        className="w-full blue-range"/>
                      <div className="flex justify-between mt-1 text-[10px] text-faint">
                        <span>1 шт</span><span>{maxMarketQty} шт (макс · ₽{myPlayer.cash.toLocaleString()} у тебя)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[14px] p-3 text-center text-[12px] font-bold" style={{background:'rgba(248,113,113,0.07)',border:'1px solid rgba(248,113,113,0.2)',color:'#F87171'}}>
                      Недостаточно средств для покупки
                    </div>
                  )}

                  {/* Кнопки */}
                  <div className="flex gap-2">
                    <button disabled={maxMarketQty===0||myPlayer.cash<=0||marketCost>myPlayer.cash}
                      onClick={async()=>{
                        if(!myPlayer||!gameState) return
                        if(myPlayer.cash<marketCost){showNotif('Недостаточно наличных','#F87171');return}
                        const updated = {...myPlayer,cash:myPlayer.cash-marketCost,assets:[...myPlayer.assets,{id:`${marketData.id}_${Date.now()}`,name:`${marketData.name} x${marketQty}`,price:marketCost,down_payment:marketCost,passive_income:0,debt:0,type:marketData.isStock?'stocks':'crypto'}]}
                        const newPlayers = gameState.players.map((p:any)=>p.id===myPlayerId?updated:p)
                        await db.from('rooms').update({game_state:{...gameState,players:newPlayers}}).eq('id',roomId)
                        snd.buy(); showCashNotif(`Куплено ${marketData.name} x${marketQty}`,marketCost,false)
                        setShowTurnCard(false)
                        if(queueMode){ setQueueMode(false); setOthersQueue(q=>q.slice(1)) }
                        else if(isMyTurn&&hasRolled) advanceTurn({...gameState,players:newPlayers})
                      }}
                      className="flex-1 rounded-[16px] py-3.5 text-[14px] font-extrabold text-center disabled:opacity-40 transition-all active:scale-95"
                      style={{background:'linear-gradient(135deg,rgba(96,165,250,0.2),rgba(96,165,250,0.1))',border:'1.5px solid rgba(96,165,250,0.4)',color:'#60A5FA'}}>
                      Купить {marketQty} шт
                    </button>
                    <button onClick={()=>{
                      if(queueMode){
                        setShowTurnCard(false)
                        setQueueMode(false)
                        setOthersQueue(q=>q.slice(1))
                      } else {
                        handlePass()
                      }
                    }} className="rounded-[16px] px-5 py-3.5 text-[14px] font-bold"
                      style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#9AA0B4'}}>
                      {queueMode && othersQueue.length>1 ? `Пас (ещё ${othersQueue.length-1})` : 'Пас'}
                    </button>
                  </div>
                </div>
              )}


              {currentCell.type==='child' && (
  <div>
    <div className="mb-4 rounded-[16px] border border-gold/20 bg-gold/[0.06] p-5 text-center">
      <div className="text-[56px] mb-3">👶</div>
      <div className="text-[18px] font-extrabold">Родился ребёнок!</div>
      <div className="mt-2 text-[13px] text-faint">
        Ежемесячные расходы вырастут на{' '}
        <span className="font-bold text-neg">
          ₽{Math.round((myPlayer.profession?.salary??100000)*0.10).toLocaleString()}/мес
        </span>
      </div>
      {(myPlayer.children ?? 0) > 0 && (
        <div className="mt-2 text-[20px]">{(myPlayer.children ?? 0) > 3 ? `👶×${myPlayer.children}` : '👶'.repeat(myPlayer.children ?? 0)}</div>
      )}
    </div>
    <button onClick={async()=>{
      if (!myPlayer || !gameState || !isMyTurn || !hasRolled) return
      const childExpense = Math.round((myPlayer.profession?.salary ?? 100000) * 0.10)
      const updatedPlayer = {
        ...myPlayer,
        total_expenses: myPlayer.total_expenses + childExpense,
        debts: [...myPlayer.debts, { name: 'Расходы на ребёнка 👶', amount: 0, monthly: childExpense }],
        children: (myPlayer.children ?? 0) + 1,
      }
      const newPlayers = gameState.players.map((p:Player)=>p.id===myPlayerId?updatedPlayer:p)
      const newEvent = { id: crypto.randomUUID(), round: gameState?.round??1, player_id: myPlayerId, player_name: myPlayer.name, type: 'child', description: `${myPlayer.name} — родился ребёнок! +₽${childExpense.toLocaleString()}/мес`, created_at: new Date().toISOString() }
      const newState = {...gameState, players: newPlayers, events: [newEvent,...(gameState.events||[])].slice(0,50)}
await db.from('rooms').update({game_state: newState}).eq('id', roomId)
setShowTurnCard(false)
advanceTurn(newState)
    }} className="gold-grad w-full rounded-[18px] py-4 text-[16px] font-extrabold text-[#1A1206]">
      Поздравить себя 🎉
    </button>
  </div>
)}


              {/* УДАР */}
              {currentCell.type==='hit' && pickedHit && (
                <div>
                  <div className="mb-2 rounded-[16px] border border-neg/20 bg-neg/[0.08] p-4">
                    <div className="text-[14px] font-bold text-body mb-2">{pickedHit.desc}</div>
                    {(pickedHit as any).skip_turns ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[20px]">⏸</span>
                          <span className="text-[16px] font-extrabold text-neg">Пропуск {(pickedHit as any).skip_turns} хода</span>
                        </div>
                        {(pickedHit as any).lose_salary && (
                          <div className="text-[13px] font-bold text-neg">
                            −₽{(myPlayer.profession?.salary ?? 0).toLocaleString()} (1 зарплата)
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[22px] font-extrabold text-neg">−₽{Math.round(pickedHit.amount * diffConfig.hit_multiplier).toLocaleString()}</div>
                    )}
                  </div>
                  <button onClick={handlePass} className="w-full rounded-[18px] border border-white/[0.08] bg-white/[0.05] py-3.5 text-center text-[14px] font-bold text-muted">Принять и продолжить</button>
                </div>
              )}

              {/* ПРЕДЛОЖЕНИЕ О ПРОДАЖЕ АКТИВА */}
              {currentCell.type==='event' && sellOffer && !pickedEvent && (
                <div>
                  <div className="mb-3 rounded-[16px] p-4" style={{background:'rgba(245,184,67,0.08)',border:'1px solid rgba(245,184,67,0.25)'}}>
                    <div className="text-[11px] font-bold tracking-[1.5px] text-gold/70 uppercase mb-1">
                      {sellOffer.asset.type === 'real_estate' ? '🏠 Недвижимость' : '🏢 Бизнес'} · Входящее предложение
                    </div>
                    <div className="text-[15px] font-extrabold mb-2">{sellOffer.offer.title}</div>
                    <div className="text-[12px] text-faint mb-3">{sellOffer.offer.desc}</div>
                    <div className="rounded-[12px] p-3" style={{background:'rgba(255,255,255,0.04)'}}>
                      <div className="flex justify-between text-[12px] mb-1">
                        <span className="text-faint">Актив</span>
                        <span className="font-bold truncate ml-2">{sellOffer.asset.name}</span>
                      </div>
                      <div className="flex justify-between text-[12px] mb-1">
                        <span className="text-faint">Вы вложили (взнос)</span>
                        <span className="font-bold">₽{(sellOffer.asset.down_payment??sellOffer.asset.price).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[12px]">
                        <span className="text-faint">Предлагают</span>
                        <span className="text-[14px] font-extrabold text-gold">₽{sellOffer.price.toLocaleString()}</span>
                      </div>
                      <div className="mt-1 text-[11px] font-bold" style={{color:'#34D399'}}>
                        {(()=>{ const base = sellOffer.asset.down_payment??sellOffer.asset.price; return `+₽${(sellOffer.price-base).toLocaleString()} прибыль (${Math.round((sellOffer.price/base-1)*100)}%)` })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={async()=>{
                      if(!myPlayer||!gameState) return
                      const asset = sellOffer.asset
                      const salePrice = sellOffer.price
                      const debtIdx = myPlayer.debts.findIndex((d:any)=>d.name===asset.name)
                      let updated = {
                        ...myPlayer,
                        cash: myPlayer.cash + salePrice,
                        assets: myPlayer.assets.filter((a:any)=>a.id!==asset.id),
                        passive_income: myPlayer.passive_income - (asset.passive_income??0),
                      }
                      if(debtIdx>=0){
                        const d = myPlayer.debts[debtIdx]
                        updated = {...updated, total_expenses: updated.total_expenses - d.monthly, debts: updated.debts.filter((_:any,j:number)=>j!==debtIdx)}
                      }
                      const ev = {id:crypto.randomUUID(),round:gameState.round??1,player_id:myPlayerId,player_name:myPlayer.name,type:'sell',description:`${myPlayer.name} продал ${asset.name} за ₽${salePrice.toLocaleString()} (+${Math.round((salePrice/asset.price-1)*100)}%)`,amount:salePrice,created_at:new Date().toISOString()}
                      const newPlayers = gameState.players.map((p:any)=>p.id===myPlayerId?updated:p)
                      const newState = {...(latestStateRef.current??gameState),players:newPlayers,events:[ev,...((latestStateRef.current??gameState).events||[])].slice(0,50)}
                      latestStateRef.current = newState
                      await db.from('rooms').update({game_state:newState}).eq('id',roomId)
                      showCashNotif(`Продано: ${asset.name}`, salePrice, true)
                      snd.buy()
                      setSellOffer(null)
                      setShowTurnCard(false)
                      advanceTurn(newState)
                    }} className="flex-1 rounded-[16px] py-3.5 text-[14px] font-extrabold text-center text-[#1A1206]"
                      style={{background:'linear-gradient(135deg,#FBD888,#F5B843 55%,#E0891F)',boxShadow:'0 8px 20px -8px rgba(245,184,67,.6)'}}>
                      Продать за ₽{(sellOffer.price/1000).toFixed(0)}К
                    </button>
                    <button onClick={()=>{
                      setSellOffer(null)
                      setShowTurnCard(false)
                      advanceTurn(latestStateRef.current??gameState)
                    }} className="rounded-[16px] px-4 py-3.5 text-[14px] font-bold"
                      style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#9AA0B4'}}>
                      Отказать
                    </button>
                  </div>
                </div>
              )}

              {/* СОБЫТИЕ */}
              {currentCell.type==='event' && pickedEvent && (
                <div>
                  <div className="mb-3 rounded-[16px] border border-warn/20 bg-warn/[0.07] p-4">
                    <div className="text-[14px] font-bold text-body">{pickedEvent.desc}</div>
                    <div className="mt-2 text-[11px] text-faint">
                      {pickedEvent.effect === 'cash+salary' && '💰 Получишь бонус к зарплате'}
                      {pickedEvent.effect === 'expenses+5%' && (gameSettings.inflation ? '📈 Расходы вырастут на 5%' : '📈 Инфляция отключена в настройках')}
                      {pickedEvent.effect.startsWith('rate:') && (gameSettings.volatile_rate
                        ? `🏦 Ключевая ставка: ${Math.round(parseFloat(pickedEvent.effect.split(':')[1])*100)}%`
                        : '🏦 Волатильная ставка отключена')}
                    </div>
                  </div>
                  <button onClick={handlePass} className="w-full rounded-[18px] border border-white/[0.08] bg-white/[0.05] py-3.5 text-center text-[14px] font-bold text-muted">Принять</button>
                </div>
              )}

              {/* БЛАГОТВОРИТЕЛЬНОСТЬ */}
              {currentCell.type==='charity' && (()=>{
                const cost = Math.round((myPlayer.profession?.salary ?? 0) * 0.10)
                const canAfford = myPlayer.cash >= cost
                const currentDoubles = (myPlayer as any).double_dice_rounds ?? 0
                return (
                  <div>
                    <div className="mb-3 rounded-[16px] p-4" style={{background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.25)'}}>
                      <div className="text-[14px] font-bold mb-2">🤝 Благотворительный взнос</div>
                      <div className="text-[12px] text-faint mb-3">Пожертвуй 10% зарплаты и получи право бросать 2 кубика следующие 3 круга — двигайся быстрее!</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-[12px] p-3 text-center" style={{background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.2)'}}>
                          <div className="text-[10px] text-faint">Взнос</div>
                          <div className="text-[14px] font-extrabold text-neg">−₽{cost.toLocaleString()}</div>
                          <div className="text-[9px] text-faint mt-0.5">10% от зарплаты</div>
                        </div>
                        <div className="rounded-[12px] p-3 text-center" style={{background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)'}}>
                          <div className="text-[10px] text-faint">Бонус</div>
                          <div className="text-[14px] font-extrabold text-pos">🎲🎲 × 3</div>
                          <div className="text-[9px] text-faint mt-0.5">3 круга / 2 кубика</div>
                        </div>
                      </div>
                      {currentDoubles > 0 && <div className="mt-2 text-[11px] text-pos">✓ Уже активно: осталось {currentDoubles} кругов</div>}
                    </div>
                    {canAfford ? (
                      <button onClick={async()=>{
                        if(!myPlayer||!gameState) return
                        const updatedPlayer = { ...myPlayer, cash: myPlayer.cash - cost, double_dice_rounds: currentDoubles + 3 }
                        const ev = {id:crypto.randomUUID(),round:gameState.round??1,player_id:myPlayerId,player_name:myPlayer.name,type:'event',description:`${myPlayer.name} сделал благотворительный взнос ₽${cost.toLocaleString()} — 2 кубика на 3 круга`,amount:cost,created_at:new Date().toISOString()}
                        const newPlayers = gameState.players.map((p:any)=>p.id===myPlayerId?updatedPlayer:p)
                        const newState = {...(latestStateRef.current??gameState),players:newPlayers,events:[ev,...((latestStateRef.current??gameState).events||[])].slice(0,50)}
                        latestStateRef.current = newState
                        await db.from('rooms').update({game_state:newState}).eq('id',roomId)
                        showCashNotif('Благотворительность 🤝', cost, false)
                        setShowTurnCard(false)
                        advanceTurn(newState)
                      }} className="green-grad w-full rounded-[18px] py-4 mb-2 text-[15px] font-extrabold text-[#081208]"
                        style={{boxShadow:'0 12px 28px -10px rgba(52,211,153,.4)'}}>
                        Пожертвовать ₽{cost.toLocaleString()} 🤝
                      </button>
                    ) : (
                      <div className="mb-2 rounded-[14px] p-3 text-center text-[12px] text-neg" style={{background:'rgba(248,113,113,0.07)',border:'1px solid rgba(248,113,113,0.2)'}}>
                        Недостаточно наличных (нужно ₽{cost.toLocaleString()})
                      </div>
                    )}
                    <button onClick={handlePass} className="w-full rounded-[18px] border border-white/[0.08] bg-white/[0.05] py-3 text-center text-[13px] font-bold text-muted">Пропустить</button>
                  </div>
                )
              })()}

              {/* АУКЦИОН */}
              {currentCell.type==='auction' && auctionAsset && (
                <div>
                  {!showAuctionCredit ? (
                    <>
                      <div className="mb-3 rounded-[16px] border border-violet/25 bg-violet/[0.08] p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-[11px] font-bold tracking-[1.5px] text-violet/80 mb-0.5">ЛОТ АУКЦИОНА</div>
                            <div className="text-[16px] font-extrabold">{auctionAsset.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-faint">Рыночная цена</div>
                            <div className="text-[15px] font-extrabold text-gold">₽{auctionAsset.price.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-1">
                          {[
                            { label: 'Взнос', value: `₽${auctionAsset.down_payment.toLocaleString()}`, cls: 'text-gold' },
                            { label: 'Доход/мес', value: `+₽${auctionAsset.passive_income.toLocaleString()}`, cls: 'text-pos' },
                            { label: 'Платёж/мес', value: `−₽${Math.round(auctionAsset.debt * keyRate / 12).toLocaleString()}`, cls: 'text-neg' },
                          ].map(({ label, value, cls }) => (
                            <div key={label} className="rounded-[12px] border border-white/[0.08] bg-white/[0.04] p-2 text-center">
                              <div className="text-[9px] text-faint">{label}</div>
                              <div className={`text-[11px] font-extrabold ${cls}`}>{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button onClick={()=>handleAuctionBuy(auctionAsset.down_payment)}
                        disabled={myPlayer.cash < auctionAsset.down_payment}
                        className="w-full rounded-[18px] py-4 mb-2 text-[15px] font-extrabold text-[#0A020F] disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg,#A78BFA,#7C3AED)' }}>
                        Выкупить за ₽{auctionAsset.down_payment.toLocaleString()}
                      </button>
                      {myPlayer.cash < auctionAsset.down_payment && (
                        <button onClick={()=>setShowAuctionCredit(true)}
                          className="gold-grad w-full rounded-[18px] py-3.5 mb-2 text-[14px] font-extrabold text-[#1A1206]">
                          💳 Взять кредит на взнос
                        </button>
                      )}
                      <button onClick={async()=>{
                        if(!gameState||!myPlayer) return
                        const offer = { asset: auctionAsset, from: myPlayer.name, from_id: myPlayerId, price: auctionAsset.down_payment }
                        const newEvent = { id: crypto.randomUUID(), round:gameState.round??1, player_id:myPlayerId, player_name:myPlayer.name, type:'auction_lose', description:`${myPlayer.name} выставил ${auctionAsset.name} на торги`, created_at:new Date().toISOString() }
                        const newState = { ...gameState, open_auction: offer, events:[newEvent,...(gameState.events||[])].slice(0,50) }
                        await db.from('rooms').update({game_state:newState}).eq('id',roomId)
                        setShowTurnCard(false)
                        advanceTurn(newState)
                      }} className="w-full rounded-[18px] border border-violet/30 bg-violet/[0.08] py-3.5 mb-2 text-center text-[14px] font-bold text-violet">
                        Открыть торги — предложить другим
                      </button>
                      <button onClick={handlePass} className="w-full rounded-[18px] border border-white/[0.08] bg-white/[0.05] py-3 text-center text-[13px] font-bold text-muted">Пропустить</button>
                    </>
                  ) : (()=>{
                    // Тот же механизм кредита что и в сделках
                    const cashFlow = Math.max(0, (myPlayer.profession?.salary??0) + myPlayer.passive_income - myPlayer.total_expenses)
                    const maxByFlow = cashFlow > 0 ? Math.floor(cashFlow / keyRate / 50000) * 50000 : 0
                    const needed = auctionAsset.down_payment - myPlayer.cash
                    const options: number[] = []
                    for (let a = 50000; a <= Math.min(maxByFlow, 2000000); a += 50000) options.push(a)
                    const minIdx = Math.max(0, options.findIndex(a => a >= needed) - 1)
                    const shown = options.slice(minIdx, minIdx + 6)
                    return (
                      <div>
                        <button onClick={()=>setShowAuctionCredit(false)} className="mb-3 text-[12px] text-faint">← Назад</button>
                        <div className="mb-3 rounded-[14px] p-3 text-[11px]" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                          <div className="flex justify-between"><span className="text-faint">Нужно на взнос</span><span className="font-bold text-neg">₽{Math.max(0,needed).toLocaleString()}</span></div>
                          <div className="flex justify-between mt-1"><span className="text-faint">Ставка ЦБ</span><span className="font-bold" style={{color:'#60A5FA'}}>{Math.round(keyRate*100)}%</span></div>
                          <div className="flex justify-between mt-1"><span className="text-faint">Твой денежный поток</span><span className={`font-bold ${cashFlow>0?'text-pos':'text-neg'}`}>₽{cashFlow.toLocaleString()}/мес</span></div>
                        </div>
                        {shown.length === 0 && <div className="text-center py-4 text-[13px] text-faint">Нет доступных вариантов</div>}
                        <div className="flex flex-col gap-2 mb-3">
                          {shown.map(amount=>{
                            const monthly = Math.round(amount * keyRate)
                            const canBuy = myPlayer.cash + amount >= auctionAsset.down_payment
                            return (
                              <button key={amount} onClick={async()=>{
                                if(!myPlayer||!gameState) return
                                const updPlayer = { ...myPlayer, cash:myPlayer.cash+amount, total_expenses:myPlayer.total_expenses+monthly, debts:[...myPlayer.debts,{name:`Кредит ₽${(amount/1000).toFixed(0)}К`,amount,monthly}] }
                                const ev = {id:crypto.randomUUID(),round:gameState.round??1,player_id:myPlayerId,player_name:myPlayer.name,type:'credit',description:`${myPlayer.name} взял кредит ₽${amount.toLocaleString()} на аукцион`,amount,created_at:new Date().toISOString()}
                                const newPlayers = gameState.players.map((p:any)=>p.id===myPlayerId?updPlayer:p)
                                const newState = {...(latestStateRef.current??gameState),players:newPlayers,events:[ev,...((latestStateRef.current??gameState).events||[])].slice(0,50)}
                                latestStateRef.current = newState
                                await db.from('rooms').update({game_state:newState}).eq('id',roomId)
                                showCashNotif(`Кредит ₽${(amount/1000).toFixed(0)}К`, amount, true)
                                setShowAuctionCredit(false)
                              }} className="rounded-[14px] border p-3 text-left"
                                style={{border:canBuy?'1px solid rgba(167,139,250,0.3)':'1px solid rgba(255,255,255,0.08)',background:canBuy?'rgba(167,139,250,0.07)':'rgba(255,255,255,0.03)'}}>
                                <div className="flex justify-between items-center">
                                  <span className="text-[15px] font-extrabold">₽{(amount/1000).toFixed(0)}К</span>
                                  {canBuy && <span className="text-[10px] font-bold text-violet">✓ хватит на взнос</span>}
                                </div>
                                <div className="mt-1 text-[11px] text-faint">Платёж <span className="font-bold text-neg">₽{monthly.toLocaleString()}/мес</span> · ({(amount/1000).toFixed(0)}К × {Math.round(keyRate*100)}%)</div>
                              </button>
                            )
                          })}
                        </div>
                        <button onClick={()=>setShowAuctionCredit(false)} className="w-full rounded-[18px] border border-white/[0.08] bg-white/[0.05] py-3 text-center text-[13px] font-bold text-muted">Отмена</button>
                      </div>
                    )
                  })()}
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs = [
    { id: 'feed',    label: 'Поле',    Icon: IconLayers  },
    { id: 'balance', label: 'Баланс',  Icon: IconWallet  },
    { id: 'players', label: 'Игроки',  Icon: IconPeople  },
    { id: 'journal', label: 'Журнал',  Icon: IconList    },
  ] as const

  return (
    <div className="flex shrink-0 items-end border-t border-white/[0.08] bg-[#0B0B13] pb-6 pt-2 px-2">
      {tabs.map(({ id, label, Icon }) => {
        const active = tab === id
        return (
          <button key={id} onClick={() => setTab(id)} className="flex flex-1 flex-col items-center gap-1.5 pt-1">
            <div className={`relative flex h-8 w-8 items-center justify-center rounded-[11px] transition-all duration-200 ${active ? 'bg-gold/[0.15]' : ''}`}>
              {active && <div className="absolute inset-0 rounded-[11px] blur-[6px] bg-gold/20" />}
              <Icon size={18} sw={active ? 2.4 : 1.8} className={`relative transition-colors duration-200 ${active ? 'text-gold' : 'text-white/30'}`} />
            </div>
            <span className={`text-[10px] font-bold transition-colors duration-200 ${active ? 'text-gold' : 'text-white/25'}`}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}