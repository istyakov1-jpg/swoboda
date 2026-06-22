'use client'
import { createContext, useContext } from 'react'

export interface GameCtx {
  // Room id
  roomId: string
  // Core game state
  gameState: any
  myPlayerId: string
  myPlayer: any
  roomStatus: string
  roomCode: string
  isHost: boolean
  currentPlayer: any
  isMyTurn: boolean
  timeLeft: number
  rolling: boolean
  hasRolled: boolean
  diceValue: number | null
  diceValue2: number | null
  anyoneRolling: boolean
  showTurnCard: boolean
  currentCell: any
  queueMode: boolean
  pickedHit: any
  pickedEvent: any
  auctionAsset: any
  selectedDeal: any
  dealPool: any[]
  showBankrupt: boolean
  showEmergency: boolean
  winner: any
  onlinePlayers: Set<string>
  cashNotif: any
  cashColor: string | null
  notification: any
  showCredit: boolean
  marketData: any
  marketQty: number
  showOpenAuctionModal: boolean
  startingGame: boolean
  gameStarting: boolean
  copied: boolean
  showBotPhrase?: any
  auctionSubmitted: boolean
  myBid: string
  // Computed
  boardCells: any[]
  diffConfig: any
  keyRate: number
  // Refs (exposed as current values or callbacks)
  notifPrefsRef: React.MutableRefObject<any>
  latestStateRef: React.MutableRefObject<any>
  // UI state (managed in page, rendered in GameView)
  tab: string
  setTab: (t: any) => void
  balanceTab: string
  setBalanceTab: (t: any) => void
  journalFilter: string
  setJournalFilter: (f: any) => void
  selectedPlayer: any
  setSelectedPlayer: (p: any) => void
  babyEvent: any
  setBabyEvent: (e: any) => void
  othersQueue: any[]
  setOthersQueue: React.Dispatch<React.SetStateAction<any[]>>
  giftAmount: number
  setGiftAmount: (n: number) => void
  boardView: 'tape' | 'square'
  setBoardView: (v: 'tape' | 'square') => void
  showNotifSettings: boolean
  setShowNotifSettings: (v: boolean) => void
  showIntro: boolean
  setShowIntro: (v: boolean) => void
  notifPrefs: { hit: boolean; event: boolean; market: boolean; auction: boolean; opportunity: boolean; baby_others: boolean; sound: boolean; mutedTickers: string[] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setNotifPrefs: (fn: any) => void
  reconnected: boolean
  gameTimeLeft: number | null
  showTimeUp: boolean
  // Computed derived values for render
  progress: number
  visibleCells: any[]
  creditLimit: number
  usedDebtMonthly: number
  maxMarketQty: number
  marketCost: number
  notifAccent: string
  skipTurnsLeft: number
  isSkippingTurn: boolean
  doubleDiceActive: boolean
  doubleDiceLeft: number
  showDiceRolling: boolean
  groupedAssets: any[]
  marketHoldings: any[]
  marketHeldQty: number
  marketHeldValue: number
  marketCurrentHeldValue: number
  marketPnl: number
  selectedDealMonthly: number
  selectedDealNet: number
  selectedDealCanAfford: boolean
  gameSettings: any
  sellOffer: any
  setSellOffer: (v: any) => void
  showAuctionCredit: boolean
  setShowAuctionCredit: (v: boolean) => void
  router: any
  snd: any
  // Setters
  setShowCredit: (v: boolean) => void
  setMarketQty: (v: number) => void
  setShowOpenAuctionModal: (v: boolean) => void
  setCopied: (v: boolean) => void
  setMyBid: (v: string) => void
  setShowTurnCard: (v: boolean) => void
  setShowBankrupt: (v: boolean) => void
  setShowEmergency: (v: boolean) => void
  setCurrentCell: (v: any) => void
  setQueueMode: (v: boolean) => void
  setPickedHit: (v: any) => void
  setPickedEvent: (v: any) => void
  setAuctionAsset: (v: any) => void
  setSelectedDeal: (v: any) => void
  setDealPool: (v: any[]) => void
  setMarketData: (v: any) => void
  setAuctionSubmitted: (v: boolean) => void
  // Actions
  handleRoll: () => void
  handlePass: (choice?: string) => void
  handleBuy: (asset: any) => void
  handleAuctionBuy: (amount: number, clearOpenAuction?: boolean) => void
  advanceTurn: (state: any) => void
  wgs: (state: any, playerId?: string) => Promise<void>
  showNotif: (msg: string, color: string) => void
  showCashNotif: (label: string, amount: number, positive: boolean, color?: string, type?: string) => void
  startGame: () => void
  copyCode: () => void
}

const GameContext = createContext<GameCtx | null>(null)

export const GameProvider = GameContext.Provider

export function useGameContext(): GameCtx {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGameContext must be used within GameProvider')
  return ctx
}
