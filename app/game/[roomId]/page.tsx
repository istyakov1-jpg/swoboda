'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { rollDice, movePlayer, collectSalary, buyAsset, freedomProgress, netPassiveIncome, baseExpenses, getCreditLimit, getTotalDebtPayments, calcDividends } from '@/lib/gameEngine'
import { SMALL_DEALS, LARGE_DEALS, STOCKS, CRYPTO, KEY_RATE_DEFAULT, DIFFICULTY_CONFIG, DEFAULT_SETTINGS, getBoardCells, getRandomDeal, getRandomDeals, getRandomHit, getRandomEvent, getRandomAuctionAsset, getNewPrice, getPriceChangeEmoji, getStockByTicker, getCryptoByTicker, getRandomSellOffer, type GameDifficulty } from '@/lib/gameData'
import type { Player } from '@/types/database'
import { sounds, TIME_LIMIT } from '@/lib/gameConstants'
import { GameProvider } from './GameContext'
import { GameTimerProvider } from './GameTimerContext'
import { GameDiceProvider } from './GameDiceContext'
import LobbyView from './views/LobbyView'
import GameView from './views/GameView'
import { useGameRoom } from './hooks/useGameRoom'
import { useBotRunner } from './hooks/useBotRunner'
import { useGameActions } from './hooks/useGameActions'
import { useGameEffects } from './hooks/useGameEffects'
import { gameLog } from '@/lib/gameLogger'

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

  // Обёртки звука — стабильный объект, читает notifPrefsRef.current при вызове
  const snd = useMemo(() => ({
    dice:     () => { if(notifPrefsRef.current.sound) sounds.dice() },
    buy:      () => { if(notifPrefsRef.current.sound) sounds.buy() },
    salary:   () => { if(notifPrefsRef.current.sound) sounds.salary() },
    hit:      () => { if(notifPrefsRef.current.sound) sounds.hit() },
    victory:  () => { if(notifPrefsRef.current.sound) sounds.victory() },
    bankrupt: () => { if(notifPrefsRef.current.sound) sounds.bankrupt() },
    timeup:   () => { if(notifPrefsRef.current.sound) sounds.timeup() },
    drumroll: () => { if(notifPrefsRef.current.sound) sounds.drumroll() },
  }), []) // stable: читает ref при вызове, не нужны deps
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
  const timeLeftRef = useRef(60) // синхронное зеркало timeLeft — для diagnostic transition snapshot без stale closure
  const isRollingRef = useRef(false) // защита во время 400мс анимации
  const hasRolledRef = useRef(false) // синхронная копия hasRolled — сбрасывается только при смене хода
  const isAdvancingRef = useRef(false) // защита от двойного advanceTurn
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
  // ID текущего хода — меняется при каждой смене игрока, привязывает все события к ходу
  const turnIdRef = useRef(crypto.randomUUID())

  const myPlayer: Player | undefined = useMemo(
    () => gameState?.players?.find((p: Player) => p.id === myPlayerId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameState?.players, myPlayerId]
  )
  const currentPlayer: Player | undefined = useMemo(
    () => gameState?.players?.[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameState?.players]
  )
  const isMyTurn = currentPlayer?.id === myPlayerId

  const effectiveHost = useMemo(() => {
    const humanIds = (gameState?.players ?? []).filter((p: any) => !p.is_bot).map((p: any) => p.id)
    const onlineH = humanIds.filter((id: string) => onlinePlayers.has(id))
    return isHost || (onlineH.length > 0 && onlineH[0] === myPlayerId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.players, onlinePlayers, myPlayerId, isHost])

  const showDiceRolling = rolling || anyoneRolling || (!isMyTurn && !!currentPlayer?.is_bot)

  // Логирование смены хода
  useEffect(() => {
    if (!currentPlayer || roomStatus !== 'playing') return
    turnIdRef.current = crypto.randomUUID()
    gameLog({
      roomId, turnId: turnIdRef.current,
      eventType: 'TURN_START',
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      payload: {
        skip_turns: (currentPlayer as any).skip_turns ?? 0,
        is_bot: currentPlayer.is_bot,
        position: currentPlayer.position,
        cash: currentPlayer.cash,
        passive_income: currentPlayer.passive_income,
      },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer?.id, roomStatus])

  const { wgs, showNotif, showCashNotif, handleRoll, handleBuy, handlePass, handleAuctionBuy, advanceTurn } = useGameActions({
    roomId, myPlayerId, gameState, myPlayer, isMyTurn, hasRolled, currentCell,
    pickedHit, pickedEvent, auctionAsset, selectedDeal,
    hasRolledRef, isRollingRef, isAdvancingRef, pickedHitRef, notifPrefsRef, bcChannelRef, latestStateRef,
    setRolling, setHasRolled, setDiceValue, setDiceValue2, setTimeLeft, setCurrentCell,
    setSelectedDeal, setDealPool, setShowCredit, setMarketData, setAuctionSubmitted, setMyBid,
    setPickedHit, setPickedEvent, setAuctionAsset, setShowTurnCard, setShowEmergency, setShowBankrupt,
    setSellOffer, setShowAuctionCredit, setCashNotif, setCashColor, setNotification, cashNotifTimerRef, snd,
    turnIdRef, isHost, effectiveHost,
  })

  useGameRoom({
    roomId, setMyPlayerId, setShowIntro, setGameState, setRoomStatus, setRoomCode, setIsHost,
    setDiceValue, setAnyoneRolling, setGameStarting,
    anyoneRollingTimerRef, broadcastAnimRef, bcChannelRef, channelRef, pollIntervalRef, roomStatusRef,
    gameStateRef, hasRolledRef, timeLeftRef, turnIdRef,
  })

  // Синхронизируем refs
  useEffect(() => { roomStatusRef.current = roomStatus }, [roomStatus])
  gameStateRef.current = gameState // обновляется при каждом рендере, без useEffect
  timeLeftRef.current = timeLeft // то же самое для timeLeft — нужно diagnostic-логгеру
  // ref чтобы бот-эффект всегда видел актуальное значение без добавления в deps
  const effectiveHostRef = useRef(false)
  effectiveHostRef.current = effectiveHost

  useBotRunner({
    gameState, currentPlayer, effectiveHostRef, gameStateRef,
    setDiceValue, setAnyoneRolling, wgs, advanceTurn,
    roomId, turnIdRef,
  })



  useGameEffects({
    roomId, myPlayerId, gameState, myPlayer, isMyTurn, isHost, rolling, hasRolled,
    roomStatus, winner, showBankrupt, showEmergency, timeLeft,
    notifPrefsRef, anyoneRollingTimerRef, latestStateRef, gameStateRef,
    hasRolledRef, isRollingRef, isAdvancingRef,
    othersQueue, showTurnCard, marketData,
    setMarketQty, setOthersQueue, setMarketData, setCurrentCell, setQueueMode,
    setShowTurnCard, setBabyEvent, setAnyoneRolling, setWinner,
    setTimeLeft, setHasRolled, setShowEmergency, setShowBankrupt,
    setGameTimeLeft, setShowTimeUp, setOnlinePlayers, setReconnected,
    wgs, advanceTurn, handleRoll, showCashNotif,
    turnIdRef,
  })


  const startGame = useCallback(async () => {
    if (startingGame) return
    setStartingGame(true)
    bcChannelRef.current?.send({ type: 'broadcast', event: 'game_starting', payload: {} })
    const initState = gameState ? { ...gameState, key_rate: KEY_RATE_DEFAULT, game_started_at: new Date().toISOString() } : { key_rate: KEY_RATE_DEFAULT, game_started_at: new Date().toISOString() }
    await db.from('rooms').update({ status: 'playing', game_state: initState }).eq('id', roomId)
    setRoomStatus('playing')
    setStartingGame(false)
  }, [startingGame, gameState, roomId])

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [roomCode])

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
      currentPlayer, isMyTurn, hasRolled,
      // timeLeft, diceValue, diceValue2, rolling, anyoneRolling, showDiceRolling
      // вынесены в GameTimerContext / GameDiceContext — не вызывают ре-рендер всего дерева
      showTurnCard, currentCell,
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
      groupedAssets: [],
      marketHoldings: [], marketHeldQty: 0, marketHeldValue: 0,
      marketCurrentHeldValue: 0, marketPnl: 0,
      selectedDealMonthly: 0, selectedDealNet: 0, selectedDealCanAfford: false,
      gameSettings: {},
      ...extras,
    }
  }

  // ── Все useMemo ПЕРЕД условными return (Rules of Hooks) ──────────────
  const keyRate: number = gameState?.key_rate ?? KEY_RATE_DEFAULT
  const gameSettings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...(gameState?.settings ?? {}) }), [gameState?.settings])
  const diffConfig = useMemo(() => DIFFICULTY_CONFIG[(gameSettings.difficulty ?? 'normal') as GameDifficulty], [gameSettings.difficulty])
  const boardCells = useMemo(() => getBoardCells((gameSettings.difficulty ?? 'normal') as GameDifficulty), [gameSettings.difficulty])
  const progress = useMemo(() => myPlayer ? freedomProgress(myPlayer) : 0, [myPlayer])
  const visibleCells = useMemo(() => {
    if (!myPlayer) return []
    const total = boardCells.length
    const pos = myPlayer.position
    return [-3,-2,-1,0,1,2,3].map(d => ({ cell: boardCells[(pos+d+total)%total], isCurrent: d===0, dist: Math.abs(d) }))
  }, [boardCells, myPlayer])
  const creditLimit = useMemo(() => myPlayer ? getCreditLimit(myPlayer) : 0, [myPlayer])
  const usedDebtMonthly = useMemo(() => myPlayer ? getTotalDebtPayments(myPlayer) : 0, [myPlayer])
  const maxMarketQty = useMemo(() => (marketData && myPlayer) ? Math.max(0, Math.floor(myPlayer.cash / marketData.newPrice)) : 0, [marketData, myPlayer])
  const marketCost = useMemo(() => marketData ? marketData.newPrice * marketQty : 0, [marketData, marketQty])
  const notifAccent = cashNotif ? (cashNotif.positive ? '#34D399' : '#FB6B6B') : '#34D399'
  const skipTurnsLeft = (myPlayer as any)?.skip_turns ?? 0
  const isSkippingTurn = skipTurnsLeft > 0
  const doubleDiceActive = ((myPlayer as any)?.double_dice_rounds ?? 0) > 0
  const doubleDiceLeft = (myPlayer as any)?.double_dice_rounds ?? 0

  const groupedAssets = useMemo(() => {
    if (!myPlayer) return []
    const result: any[] = []
    const map: Record<string, any> = {}
    myPlayer.assets.forEach((a:any) => {
      if (a.type === 'stocks' || a.type === 'crypto') {
        const base = a.name.replace(/ x\d+$/, '')
        const qty = parseInt(a.name.match(/x(\d+)$/)?.[1] ?? '1')
        if (map[base]) { map[base].qty += qty; map[base].price += a.price }
        else { map[base] = { ...a, base, qty, price: a.price }; result.push({ _grouped: true, _base: base }) }
      } else { result.push({ ...a, _grouped: false }) }
    })
    return result.map((g:any) => g._grouped ? { ...map[g._base], name: `${g._base} ×${map[g._base].qty}` } : g)
  }, [myPlayer])

  const marketHoldings = useMemo(() => (marketData && myPlayer) ? myPlayer.assets.filter((a:any)=>a.name?.includes(marketData.name)||a.id?.startsWith(marketData.id)) : [], [marketData, myPlayer])
  const marketHeldQty = useMemo(() => marketHoldings.reduce((s:number,a:any)=>{const m=a.name?.match(/x(\d+)/);return s+(m?parseInt(m[1]):1)},0), [marketHoldings])
  const marketHeldValue = useMemo(() => marketHoldings.reduce((s:number,a:any)=>s+(a.price||0),0), [marketHoldings])
  const marketCurrentHeldValue = useMemo(() => marketData ? marketHeldQty * marketData.newPrice : 0, [marketData, marketHeldQty])
  const marketPnl = marketCurrentHeldValue - marketHeldValue

  const selectedDealMonthly = selectedDeal?.debt > 0 ? Math.round(selectedDeal.debt * keyRate / 12) : 0
  const selectedDealNet = selectedDeal ? selectedDeal.passive_income - selectedDealMonthly : 0
  const selectedDealCanAfford = !!(selectedDeal && myPlayer && myPlayer.cash >= selectedDeal.down_payment)

  // useMemo ДО условных return — Rules of Hooks
  const timerCtxValue = useMemo(() => ({ timeLeft }), [timeLeft])
  const diceCtxValue = useMemo(() => ({
    diceValue, diceValue2, rolling, anyoneRolling, showDiceRolling
  }), [diceValue, diceValue2, rolling, anyoneRolling, showDiceRolling])

  // ── Условные return ПОСЛЕ всех хуков ──────────────────────────────────
  if (roomStatus === 'lobby') {
    return (
      <GameProvider value={buildCtx({ boardCells: [], diffConfig: {}, keyRate: 0 })}>
        <LobbyView />
      </GameProvider>
    )
  }

  if (!myPlayer) return null

  const ctxValue = buildCtx({
    boardCells, diffConfig, keyRate,
    progress, visibleCells, creditLimit, usedDebtMonthly,
    maxMarketQty, marketCost, notifAccent,
    skipTurnsLeft, isSkippingTurn, doubleDiceActive, doubleDiceLeft,
    groupedAssets,
    marketHoldings, marketHeldQty, marketHeldValue,
    marketCurrentHeldValue, marketPnl,
    selectedDealMonthly, selectedDealNet, selectedDealCanAfford,
    gameSettings,
  })

  return (
  <GameProvider value={ctxValue}>
    <GameTimerProvider value={timerCtxValue}>
      <GameDiceProvider value={diceCtxValue}>
        <GameView />
      </GameDiceProvider>
    </GameTimerProvider>
  </GameProvider>
  )
}

