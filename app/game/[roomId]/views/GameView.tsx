'use client'
import { useState, memo, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { repayDebt, freedomProgress, netPassiveIncome, baseExpenses, getCreditLimit, getTotalDebtPayments } from '@/lib/gameEngine'
import { STOCKS, CRYPTO, SMALL_DEALS, LARGE_DEALS, getRandomDeal, getRandomDeals, getRandomSellOffer, getRandomEvent, getRandomAuctionAsset, getNewPrice, getPriceChangeEmoji, getStockByTicker, getCryptoByTicker } from '@/lib/gameData'
import { IconCoins, IconBars, IconBolt, IconOpportunity, IconEvent, IconGavel, IconTrendUp, IconLayers, IconWallet, IconPeople, IconList, GameIcon, IconSettings, IconAnalytics, IconDDS } from '@/components/icons'
import BoardView from '../BoardView'
import { Dice3D } from '../Dice3D'
import { CELL_CONFIG, EV_CFG, sounds } from '@/lib/gameConstants'
import { supabase } from '@/lib/supabase'
import { useGameContext } from '../GameContext'
import { useGameTimer } from '../GameTimerContext'
import { useGameDice } from '../GameDiceContext'
import EmergencyModal from './EmergencyModal'
import WinnerScreen from './WinnerScreen'
import BankruptScreen from './BankruptScreen'
import type { Player } from '@/types/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

type Tab = 'feed' | 'balance' | 'players' | 'journal'

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

const TIME_LIMIT = 60

// Вынесен за компонент — не пересоздаётся при каждом рендере
const TABS = [
  { id: 'feed'    as const, label: 'Поле',   Icon: IconLayers },
  { id: 'balance' as const, label: 'Баланс', Icon: IconWallet },
  { id: 'players' as const, label: 'Игроки', Icon: IconPeople },
  { id: 'journal' as const, label: 'Журнал', Icon: IconList   },
] as const

const TabBar = memo(function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div className="flex shrink-0 items-end border-t border-white/[0.08] bg-[#0B0B13] pb-6 pt-2 px-2">
      {TABS.map(({ id, label, Icon }) => {
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
})

export default function GameView() {
  const ctx = useGameContext()
  const {
    gameState, myPlayerId, myPlayer, isMyTurn, hasRolled,
    currentCell, showTurnCard, queueMode, pickedHit, pickedEvent, auctionAsset,
    selectedDeal, showCredit, marketData, marketQty,
    showOpenAuctionModal, onlinePlayers, cashNotif, cashColor, notification,
    winner, showBankrupt, showEmergency, reconnected,
    boardCells, diffConfig, keyRate, gameSettings, gameTimeLeft, showTimeUp,
    progress, visibleCells, creditLimit, usedDebtMonthly,
    maxMarketQty, marketCost, notifAccent,
    skipTurnsLeft, isSkippingTurn, doubleDiceActive, doubleDiceLeft,
    groupedAssets, marketHoldings, marketHeldQty, marketHeldValue,
    marketCurrentHeldValue, marketPnl,
    selectedDealMonthly, selectedDealNet, selectedDealCanAfford,
    sellOffer, setSellOffer, showAuctionCredit, setShowAuctionCredit,
    tab, setTab, balanceTab, setBalanceTab, journalFilter, setJournalFilter,
    selectedPlayer, setSelectedPlayer, babyEvent, setBabyEvent,
    othersQueue, setOthersQueue, giftAmount, setGiftAmount,
    boardView, setBoardView, showNotifSettings, setShowNotifSettings,
    notifPrefs, setNotifPrefs,
    setShowCredit, setMarketQty, setShowOpenAuctionModal,
    setMyBid, setShowTurnCard, setQueueMode,
    setSelectedDeal, setAuctionAsset, setPickedHit, setPickedEvent, setCurrentCell,
    setDealPool, setMarketData, setAuctionSubmitted, setCopied,
    setShowBankrupt, setShowEmergency,
    handleRoll, handlePass, handleBuy, handleAuctionBuy, advanceTurn, wgs,
    showNotif, showCashNotif, roomId, snd, currentPlayer, latestStateRef,
    showIntro, setShowIntro, myBid, auctionSubmitted, copied,
  } = ctx

  // Отдельные контексты: не ре-рендерят GameView при их изменении
  const { timeLeft } = useGameTimer()
  const { diceValue, diceValue2, rolling, anyoneRolling, showDiceRolling } = useGameDice()

  const router = useRouter()
  const [showDDS, setShowDDS] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  // Мемоизированные derived values — не пересчитываются при несвязанных ре-рендерах
  const sortedPlayers = useMemo(
    () => [...(gameState?.players ?? [])].sort((a: Player, b: Player) => freedomProgress(b) - freedomProgress(a)),
    [gameState?.players]
  )
  const playerById = useMemo(
    () => Object.fromEntries((gameState?.players ?? []).map((p: Player) => [p.id, p])),
    [gameState?.players]
  )
  const incomeAssets = useMemo(() => myPlayer.assets.filter((a: any) => a.passive_income > 0), [myPlayer.assets])
  const activeDebts = useMemo(() => myPlayer.debts.filter((d: any) => d.amount > 0), [myPlayer.debts])
  const zeroDebts   = useMemo(() => myPlayer.debts.filter((d: any) => d.amount === 0), [myPlayer.debts])
  const allJournalEvents = useMemo(() => [...(gameState?.events ?? [])].reverse(), [gameState?.events])
  const filteredJournal = useMemo(() => {
    if (journalFilter === 'all')    return allJournalEvents.filter((e: any) => e.type !== 'roll')
    if (journalFilter === 'mine')   return allJournalEvents.filter((e: any) => e.player_id === myPlayerId && e.type !== 'roll')
    if (journalFilter === 'money')  return allJournalEvents.filter((e: any) => e.amount)
    return allJournalEvents.filter((e: any) => EV_CFG[e.type]?.global)
  }, [allJournalEvents, journalFilter, myPlayerId])
  const netFlow = useMemo(
    () => (myPlayer.profession?.salary ?? 0) + myPlayer.passive_income - myPlayer.total_expenses,
    [myPlayer]
  )
  const sellOfferProfit = useMemo(() => {
    if (!sellOffer) return ''
    const base = sellOffer.asset.down_payment ?? sellOffer.asset.price
    return `+₽${(sellOffer.price - base).toLocaleString()} прибыль (${Math.round((sellOffer.price / base - 1) * 100)}%)`
  }, [sellOffer])
  const rollBtnStyle = useMemo(() => ({
    opacity: rolling ? 0.5 : 1 as number,
    background: isSkippingTurn
      ? 'linear-gradient(135deg,rgba(248,113,113,0.25),rgba(220,38,38,0.15))'
      : 'linear-gradient(135deg,#FBD888,#F5B843 55%,#E0891F)',
    border: isSkippingTurn ? '1.5px solid rgba(248,113,113,0.5)' : 'none',
    boxShadow: isSkippingTurn ? '0 0 20px -8px rgba(248,113,113,0.5)' : rolling ? 'none' : '0 12px 28px -10px rgba(245,184,67,.55)',
  }), [rolling, isSkippingTurn])

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
                  await handleAuctionBuy(offer.price, true) // передаём флаг что нужно закрыть open_auction
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
                <button onPointerDown={() => {
                  handleRoll()
                }}
                  className="flex w-full h-full items-center justify-between rounded-[18px] px-4"
                  style={rollBtnStyle}>
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

