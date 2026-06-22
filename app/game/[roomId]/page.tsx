'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { rollDice, movePlayer, collectSalary, buyAsset, freedomProgress, netPassiveIncome, baseExpenses, getCreditLimit, getTotalDebtPayments, calcDividends } from '@/lib/gameEngine'
import { SMALL_DEALS, LARGE_DEALS, STOCKS, CRYPTO, KEY_RATE_DEFAULT, DIFFICULTY_CONFIG, DEFAULT_SETTINGS, getBoardCells, getRandomDeal, getRandomDeals, getRandomHit, getRandomEvent, getRandomAuctionAsset, getNewPrice, getPriceChangeEmoji, getStockByTicker, getCryptoByTicker, getRandomSellOffer, type GameDifficulty } from '@/lib/gameData'
import type { Player } from '@/types/database'
import { sounds, TIME_LIMIT } from '@/lib/gameConstants'
import { GameProvider } from './GameContext'
import LobbyView from './views/LobbyView'
import GameView from './views/GameView'
import { useGameRoom } from './hooks/useGameRoom'
import { useBotRunner } from './hooks/useBotRunner'
import { useGameActions } from './hooks/useGameActions'
import { useGameEffects } from './hooks/useGameEffects'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

type Tab = 'feed' | 'balance' | 'players' | 'journal'


export default function GamePage() {
  const { roomId } = useParams<{ roomId: string }>()
  const router = useRouter()
  const [gameState, setGameState] = useState<any>(null)
  const [myPlayerId, setMyPlayerId] = useState('')
  const [tab, setTab] = useState<Tab>('feed')
  const [showTurnCard, setShowTurnCard] = useState(false)
  const [queueMode, setQueueMode] = useState(false) // показываем карточку из очереди
  const [currentCell, setCurrentCell] = useState<any>(null)
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
  const [marketData, setMarketData] = useState<any>(null)
  const [marketQty, setMarketQty] = useState(1)
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [babyEvent, setBabyEvent] = useState<any>(null)
  const [othersQueue, setOthersQueue] = useState<any[]>([]) // очередь уведомлений от других игроков
  const [giftAmount, setGiftAmount] = useState(1000)
  const [boardView, setBoardView] = useState<'tape' | 'square'>('square')
  const channelRef = useRef<any>(null)
  const bcChannelRef = useRef<any>(null)
  const latestStateRef = useRef<any>(null) // последний сохранённый стейт после броска
  const gameStateRef = useRef<any>(null) // всегда актуальный gameState без добавления в deps
  const isRollingRef = useRef(false) // защита во время 400мс анимации
  const hasRolledRef = useRef(false) // синхронная копия hasRolled — сбрасывается только при смене хода
  const isAdvancingRef = useRef(false) // защита от двойного advanceTurn
  const bankruptProcessedRef = useRef(false) // флаг чтобы не запускать банкротство дважды
  const roomStatusRef = useRef<string>('lobby') // синхронная копия roomStatus для polling
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pickedHitRef = useRef<any>(null) // синхронная копия pickedHit — React state недоступен внутри setTimeout
  const broadcastAnimRef = useRef<ReturnType<typeof setInterval> | null>(null) // защита от утечки интервалов broadcast
  const [roomStatus, setRoomStatus] = useState<string>('lobby')
  const [startingGame, setStartingGame] = useState(false)
  const [gameStarting, setGameStarting] = useState(false) // "Запускается..." для не-хоста
  const [roomCode, setRoomCode] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [hasRolled, setHasRolled] = useState(false)
  const [onlinePlayers, setOnlinePlayers] = useState<Set<string>>(new Set())
  const [reconnected, setReconnected] = useState(false)
  const [gameTimeLeft, setGameTimeLeft] = useState<number|null>(null)
  const [showTimeUp, setShowTimeUp] = useState(false)

  const myPlayer: Player | undefined = gameState?.players?.find((p: Player) => p.id === myPlayerId)
  const currentPlayer: Player | undefined = gameState?.players?.[0]
  const isMyTurn = currentPlayer?.id === myPlayerId

  // Активный управляющий ботами: хост если онлайн, иначе первый онлайн-игрок
  const humanPlayerIds = (gameState?.players ?? []).filter((p: any) => !p.is_bot).map((p: any) => p.id)
  const onlineHumans = humanPlayerIds.filter((id: string) => onlinePlayers.has(id) || id === myPlayerId)
  const effectiveHost = isHost || (onlineHumans.length > 0 && onlineHumans[0] === myPlayerId)

  // Показываем анимацию броска: мой бросок ИЛИ ход бота (не нужен state — вычисляем сразу)
  const showDiceRolling = rolling || anyoneRolling || (!isMyTurn && !!currentPlayer?.is_bot)

  const { wgs, showNotif, showCashNotif, handleRoll, handleBuy, handlePass, handleAuctionBuy, advanceTurn } = useGameActions({
    roomId, myPlayerId, gameState, myPlayer, isMyTurn, hasRolled, currentCell,
    pickedHit, pickedEvent, auctionAsset, selectedDeal,
    hasRolledRef, isRollingRef, isAdvancingRef, pickedHitRef, notifPrefsRef, bcChannelRef, latestStateRef,
    setRolling, setHasRolled, setDiceValue, setDiceValue2, setTimeLeft, setCurrentCell,
    setSelectedDeal, setDealPool, setShowCredit, setMarketData, setAuctionSubmitted, setMyBid,
    setPickedHit, setPickedEvent, setAuctionAsset, setShowTurnCard, setShowEmergency, setShowBankrupt,
    setSellOffer, setShowAuctionCredit, setCashNotif, setCashColor, setNotification, cashNotifTimerRef, snd,
  })

  useGameRoom({
    roomId, setMyPlayerId, setShowIntro, setGameState, setRoomStatus, setRoomCode, setIsHost,
    setDiceValue, setAnyoneRolling, setGameStarting,
    anyoneRollingTimerRef, broadcastAnimRef, bcChannelRef, channelRef, pollIntervalRef, roomStatusRef,
  })

  // Синхронизируем refs
  useEffect(() => { roomStatusRef.current = roomStatus }, [roomStatus])
  gameStateRef.current = gameState // обновляется при каждом рендере, без useEffect
  // ref чтобы бот-эффект всегда видел актуальное значение без добавления в deps
  const effectiveHostRef = useRef(false)
  effectiveHostRef.current = effectiveHost

  useBotRunner({
    gameState, currentPlayer, effectiveHostRef, gameStateRef,
    setDiceValue, setAnyoneRolling, wgs, advanceTurn,
  })



  useGameEffects({
    roomId, myPlayerId, gameState, myPlayer, isMyTurn, isHost, rolling, hasRolled,
    roomStatus, winner, showBankrupt, showEmergency, timeLeft,
    notifPrefsRef, anyoneRollingTimerRef, latestStateRef, gameStateRef,
    hasRolledRef, isRollingRef, bankruptProcessedRef,
    othersQueue, showTurnCard, marketData,
    setMarketQty, setOthersQueue, setMarketData, setCurrentCell, setQueueMode,
    setShowTurnCard, setBabyEvent, setAnyoneRolling, setWinner,
    setTimeLeft, setHasRolled, setShowEmergency, setShowBankrupt,
    setGameTimeLeft, setShowTimeUp, setOnlinePlayers, setReconnected,
    wgs, advanceTurn, handleRoll, showCashNotif,
  })


  async function startGame() {
    if (startingGame) return
    setStartingGame(true)
    // Мгновенно сообщаем всем через broadcast
    bcChannelRef.current?.send({ type: 'broadcast', event: 'game_starting', payload: {} })
    const initState = gameState ? { ...gameState, key_rate: KEY_RATE_DEFAULT, game_started_at: new Date().toISOString() } : { key_rate: KEY_RATE_DEFAULT, game_started_at: new Date().toISOString() }
    await db.from('rooms').update({ status: 'playing', game_state: initState }).eq('id', roomId)
    setRoomStatus('playing')
    setStartingGame(false)
  }

  function copyCode() {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Shared context builder (boardCells/diffConfig/keyRate are placeholders for lobby)
  function buildCtx(extras: {
    boardCells: any[]; diffConfig: any; keyRate: number;
    progress?: number; visibleCells?: any[]; creditLimit?: number; usedDebtMonthly?: number;
    maxMarketQty?: number; marketCost?: number; notifAccent?: string;
    skipTurnsLeft?: number; isSkippingTurn?: boolean; doubleDiceActive?: boolean; doubleDiceLeft?: number;
    showDiceRolling?: boolean; groupedAssets?: any[];
    marketHoldings?: any[]; marketHeldQty?: number; marketHeldValue?: number;
    marketCurrentHeldValue?: number; marketPnl?: number;
    selectedDealMonthly?: number; selectedDealNet?: number; selectedDealCanAfford?: boolean;
    gameSettings?: any;
  }) {
    return {
      roomId,
      gameState, myPlayerId, myPlayer, roomStatus, roomCode, isHost,
      currentPlayer, isMyTurn, timeLeft, rolling, hasRolled,
      diceValue, diceValue2, anyoneRolling, showTurnCard, currentCell,
      queueMode, pickedHit, pickedEvent, auctionAsset, selectedDeal, dealPool,
      showBankrupt, showEmergency, winner, onlinePlayers, cashNotif, cashColor,
      notification, showCredit, marketData, marketQty,
      showOpenAuctionModal, startingGame, gameStarting, copied,
      auctionSubmitted, myBid,
      notifPrefsRef, latestStateRef,
      // UI state
      tab, setTab, balanceTab, setBalanceTab, journalFilter, setJournalFilter,
      selectedPlayer, setSelectedPlayer, babyEvent, setBabyEvent,
      othersQueue, setOthersQueue, giftAmount, setGiftAmount,
      boardView, setBoardView, showNotifSettings, setShowNotifSettings,
      notifPrefs, setNotifPrefs, reconnected, gameTimeLeft, showTimeUp,
      showIntro, setShowIntro,
      sellOffer, setSellOffer, showAuctionCredit, setShowAuctionCredit,
      snd, router,
      setShowCredit, setMarketQty, setShowOpenAuctionModal, setCopied,
      setMyBid, setShowTurnCard, setShowBankrupt, setShowEmergency,
      setCurrentCell, setQueueMode, setPickedHit, setPickedEvent,
      setAuctionAsset, setSelectedDeal, setDealPool, setMarketData,
      setAuctionSubmitted,
      handleRoll, handlePass, handleBuy, handleAuctionBuy, advanceTurn, wgs,
      showNotif, showCashNotif, startGame, copyCode,
      // defaults for derived values (overridden by extras)
      progress: 0, visibleCells: [], creditLimit: 0, usedDebtMonthly: 0,
      maxMarketQty: 0, marketCost: 0, notifAccent: '#34D399',
      skipTurnsLeft: 0, isSkippingTurn: false, doubleDiceActive: false, doubleDiceLeft: 0,
      showDiceRolling: false, groupedAssets: [],
      marketHoldings: [], marketHeldQty: 0, marketHeldValue: 0,
      marketCurrentHeldValue: 0, marketPnl: 0,
      selectedDealMonthly: 0, selectedDealNet: 0, selectedDealCanAfford: false,
      gameSettings: {},
      ...extras,
    }
  }

  if (roomStatus === 'lobby') {
    return (
      <GameProvider value={buildCtx({ boardCells: [], diffConfig: {}, keyRate: 0 })}>
        <LobbyView />
      </GameProvider>
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

  const ctxValue = buildCtx({
    boardCells, diffConfig, keyRate,
    progress, visibleCells, creditLimit, usedDebtMonthly,
    maxMarketQty, marketCost, notifAccent,
    skipTurnsLeft, isSkippingTurn, doubleDiceActive, doubleDiceLeft,
    showDiceRolling, groupedAssets,
    marketHoldings, marketHeldQty, marketHeldValue,
    marketCurrentHeldValue, marketPnl,
    selectedDealMonthly, selectedDealNet, selectedDealCanAfford,
    gameSettings,
  })

  return (
  <GameProvider value={ctxValue}>
    <GameView />
  </GameProvider>
  )
}

