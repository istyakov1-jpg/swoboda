'use client'
import { supabase } from '@/lib/supabase'
import { rollDice, movePlayer, collectSalary, buyAsset, calcDividends } from '@/lib/gameEngine'
import { STOCKS, CRYPTO, SMALL_DEALS, LARGE_DEALS, KEY_RATE_DEFAULT, DIFFICULTY_CONFIG, DEFAULT_SETTINGS, getBoardCells, getRandomDeals, getRandomHit, getRandomSellOffer, getRandomEvent, getRandomAuctionAsset, getNewPrice, getPriceChangeEmoji, getStockByTicker, getCryptoByTicker, type GameDifficulty } from '@/lib/gameData'
import { sounds, TIME_LIMIT } from '@/lib/gameConstants'
import type { Player } from '@/types/database'
import { gameLog } from '@/lib/gameLogger'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

interface Params {
  roomId: string
  myPlayerId: string
  gameState: any
  myPlayer: any
  isMyTurn: boolean
  hasRolled: boolean
  currentCell: any
  pickedHit: any
  pickedEvent: any
  auctionAsset: any
  selectedDeal: any
  // boardCells, diffConfig, keyRate, gameSettings computed internally from gameState
  // refs
  hasRolledRef: React.MutableRefObject<boolean>
  isRollingRef: React.MutableRefObject<boolean>
  isAdvancingRef: React.MutableRefObject<boolean>
  pickedHitRef: React.MutableRefObject<any>
  notifPrefsRef: React.MutableRefObject<any>
  bcChannelRef: React.MutableRefObject<any>
  latestStateRef: React.MutableRefObject<any>
  // setters
  setRolling: (v: boolean) => void
  setHasRolled: (v: boolean) => void
  setDiceValue: (v: number) => void
  setDiceValue2: (v: number | null) => void
  setTimeLeft: (v: number) => void
  setCurrentCell: (v: any) => void
  setSelectedDeal: (v: any) => void
  setDealPool: (v: any[]) => void
  setShowCredit: (v: boolean) => void
  setMarketData: (v: any) => void
  setAuctionSubmitted: (v: boolean) => void
  setMyBid: (v: string) => void
  setPickedHit: (v: any) => void
  setPickedEvent: (v: any) => void
  setAuctionAsset: (v: any) => void
  setShowTurnCard: (v: boolean) => void
  setShowEmergency: (v: boolean) => void
  setShowBankrupt: (v: boolean) => void
  setSellOffer: (v: any) => void
  setShowAuctionCredit: (v: boolean) => void
  setCashNotif: (v: any) => void
  setCashColor: (v: 'pos' | 'neg' | null) => void
  setNotification: (v: any) => void
  cashNotifTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  snd: any
  turnIdRef: React.MutableRefObject<string>
}

export function useGameActions(p: Params) {
  // Computed from gameState (available when functions run, even if null at call site)
  const getGameSettings = () => ({ ...DEFAULT_SETTINGS, ...(p.gameState?.settings ?? {}) })
  const getDiffConfig = () => DIFFICULTY_CONFIG[(getGameSettings().difficulty ?? 'normal') as GameDifficulty]
  const getBoardCellsFn = () => getBoardCells((getGameSettings().difficulty ?? 'normal') as GameDifficulty)
  const getKeyRate = () => p.gameState?.key_rate ?? KEY_RATE_DEFAULT

  function showNotif(msg: string, color = '#34D399') {
    p.setNotification({msg, color})
    setTimeout(() => p.setNotification(null), 2500)
  }

  async function wgs(state: any, playerId?: string) {
    const { error } = await db.rpc('write_game_state', {
      p_room_id: p.roomId,
      p_player_id: playerId ?? p.myPlayerId,
      p_new_state: state,
    })
    if (error) {
      if (error.code === 'PGRST202' || error.message?.includes('Could not find')) {
        await db.from('rooms').update({ game_state: state }).eq('id', p.roomId)
      }
    }
  }

  function showCashNotif(label: string, amount: number, positive: boolean, color?: string, _type?: string) {
    p.setCashNotif({ label, amount, positive, color })
    p.setCashColor(positive ? 'pos' : 'neg')
    if (p.cashNotifTimerRef.current) clearTimeout(p.cashNotifTimerRef.current)
    p.cashNotifTimerRef.current = setTimeout(() => { p.setCashNotif(null); p.setCashColor(null) }, 2500)
  }

  }

  async function advanceTurn(state: any) {
    if (!state?.players?.[0]) return
    if (p.isAdvancingRef.current) return
    p.isAdvancingRef.current = true
    gameLog({ roomId: p.roomId, turnId: p.turnIdRef.current, eventType: 'ADVANCE_TURN',
      playerId: state.players[0].id, playerName: state.players[0].name,
      payload: { from: state.players[0].name, to: state.players[1]?.name, caller: new Error().stack?.split('\n')[2]?.trim()?.slice(0,60) } })
    const expectedPlayerId = state.players[0].id
    try {
      const { error } = await db.rpc('advance_turn_safe', {
        p_room_id: p.roomId,
        p_expected_player_id: expectedPlayerId,
      })
      if (error) {
        const [current, ...rest] = state.players
        await db.from('rooms').update({
          game_state: { ...state, players: [...rest, current], rolling_player_id: null }
        }).eq('id', p.roomId)
      }
    } finally {
      p.isAdvancingRef.current = false
    }
  }

  async function handleRoll() {

    if (!p.isMyTurn || !p.myPlayer || !p.gameState) {
      return
    }
    if (p.hasRolledRef.current || p.isRollingRef.current) {
      return
    }
    p.isRollingRef.current = true
    p.hasRolledRef.current = true
    if ((p.myPlayer as any).is_eliminated) { p.isRollingRef.current = false; p.hasRolledRef.current = false; advanceTurn(p.gameState); return }
    const doubleDiceRounds = (p.myPlayer as any).double_dice_rounds ?? 0
    if ((p.myPlayer as any).skip_turns > 0) { p.hasRolledRef.current = false; p.isRollingRef.current = false; return }
    gameLog({ roomId: p.roomId, turnId: p.turnIdRef.current, eventType: 'ROLL',
      playerId: p.myPlayerId, playerName: p.myPlayer.name,
      payload: { position: p.myPlayer.position, cash: p.myPlayer.cash } })
    p.setRolling(true)
    p.setHasRolled(true)
    const bc = p.bcChannelRef.current
    bc?.send({ type: 'broadcast', event: 'rolling', payload: { player_id: p.myPlayerId } })
    db.from('rooms').update({ game_state: { ...p.gameState, rolling_player_id: p.myPlayerId } }).eq('id', p.roomId)
    p.snd.dice()
    p.setDiceValue2(null)
    setTimeout(async () => {
      const roll1 = rollDice()
      const roll2 = doubleDiceRounds > 0 ? rollDice() : null
      const roll = roll2 !== null ? roll1 + roll2 : roll1
      p.setDiceValue(roll1)
      if (roll2 !== null) p.setDiceValue2(roll2)
      p.setRolling(false)
      p.isRollingRef.current = false
      bc?.send({ type: 'broadcast', event: 'rolled', payload: { player_id: p.myPlayerId, roll } })
      const { player: movedPlayer, cell, passed_salary, salary_count } = movePlayer(p.myPlayer, roll, getBoardCellsFn())
      let updatedPlayer = movedPlayer
      let salaryEvent: any = null
      const dividendEnabled = p.gameState?.settings?.dividend_enabled !== false
      const divAmount = dividendEnabled ? calcDividends(updatedPlayer, p.gameState?.market_prices ?? {}, STOCKS) : 0
      if (passed_salary) {
        let totalAmount = 0
        for (let s = 0; s < salary_count; s++) {
          const div = s === 0 ? divAmount : 0
          const { player: w, amount } = collectSalary(updatedPlayer, div)
          updatedPlayer = w; totalAmount += amount + div
        }
        p.snd.salary(); showCashNotif('Денежный поток', totalAmount, true, undefined, 'salary')
        const divNote = divAmount > 0 ? ` + дивиденды ₽${divAmount.toLocaleString()}` : ''
        salaryEvent = { id: crypto.randomUUID(), round: p.gameState.round??1, player_id: p.myPlayerId, player_name: p.myPlayer.name, type: 'salary', description: `${p.myPlayer.name} получил денежный поток: +₽${totalAmount.toLocaleString()}${divNote}`, amount: totalAmount, created_at: new Date().toISOString() }
      }
      if (cell.type === 'salary') {
        const { player: w, amount, dividends } = collectSalary(updatedPlayer, divAmount)
        updatedPlayer = w
        const totalSalary = amount + dividends
        p.snd.salary(); showCashNotif('Зарплата', totalSalary, true, undefined, 'salary')
        const divNote = dividends > 0 ? ` + дивиденды ₽${dividends.toLocaleString()}` : ''
        salaryEvent = { id: crypto.randomUUID(), round: p.gameState.round??1, player_id: p.myPlayerId, player_name: p.myPlayer.name, type: 'salary', description: `${p.myPlayer.name} получил зарплату: +₽${totalSalary.toLocaleString()}${divNote}`, amount: totalSalary, created_at: new Date().toISOString() }
      }
      p.setCurrentCell(cell)
      p.setSelectedDeal(null)
      p.setSellOffer(null)
      p.setShowAuctionCredit(false)
      p.setDealPool([...getRandomDeals(3, SMALL_DEALS), ...getRandomDeals(3, LARGE_DEALS)])
      p.setShowCredit(false)
      p.setMarketData(null)
      p.setAuctionSubmitted(false)
      p.setMyBid('')
      if (cell.type === 'hit') {
        const freshHit = getRandomHit()
        p.pickedHitRef.current = freshHit
        p.setPickedHit(freshHit)
      } else if (cell.type === 'event') {
        const sellableAssets = updatedPlayer.assets.filter((a:any) => a.type === 'real_estate' || a.type === 'business')
        if (sellableAssets.length > 0 && Math.random() < 0.35) {
          const asset = sellableAssets[Math.floor(Math.random() * sellableAssets.length)]
          const offer = getRandomSellOffer(asset.type as 'real_estate'|'business')
          if (offer) {
            const mult = offer.multiplierMin + Math.random() * (offer.multiplierMax - offer.multiplierMin)
            const base = asset.down_payment ?? asset.price
            const offerPrice = Math.round(base * mult / 50000) * 50000
            p.setSellOffer({ offer, asset, price: offerPrice })
          } else { p.setPickedEvent(getRandomEvent()) }
        } else { p.setPickedEvent(getRandomEvent()) }
      } else if (cell.type === 'auction') {
        const aAsset = getRandomAuctionAsset()
        p.setAuctionAsset(aAsset)
      }
      if (doubleDiceRounds > 0) {
        updatedPlayer = { ...updatedPlayer, double_dice_rounds: doubleDiceRounds - 1 } as any
      }
      const newPlayers = p.gameState.players.map((pl: Player) => pl.id === p.myPlayerId ? updatedPlayer : pl)
      const round = p.gameState.round ?? 1
      const diceDesc = doubleDiceRounds > 0 ? `🎲🎲 ${roll}` : `${roll}`
      const rollEvent = { id: crypto.randomUUID(), round, player_id: p.myPlayerId, player_name: p.myPlayer.name, type: 'roll', description: `${p.myPlayer.name} бросает кубик: ${diceDesc} → ${cell.label}`, created_at: new Date().toISOString() }
      const eventsToAdd = salaryEvent ? [salaryEvent, rollEvent] : [rollEvent]
      let newState: any = { ...p.gameState, players: newPlayers, events: [...eventsToAdd, ...(p.gameState.events||[])].slice(0,50), rolling_player_id: p.myPlayerId }
      if (cell.type === 'child') newState.baby_event = { player_id: p.myPlayerId, player_name: p.myPlayer.name, timestamp: Date.now() }
      if (cell.type === 'market') {
        const isStock = cell.data?.market_type === 'stock'
        const lastTicker = p.gameState.market_event?.ticker
        let ticker = cell.data.ticker
        if (ticker === lastTicker) {
          const pool = isStock
            ? STOCKS.map((s:any) => s.ticker).filter((t:string) => t !== ticker)
            : CRYPTO.map((c:any) => c.ticker).filter((t:string) => t !== ticker)
          if (pool.length > 0) ticker = pool[Math.floor(Math.random() * pool.length)]
        }
        const item = isStock ? getStockByTicker(ticker) : getCryptoByTicker(ticker)
        if (item) {
          const currentPrice = p.gameState.market_prices?.[ticker] ?? item.price
          const newPrice = getNewPrice(currentPrice, item.min, item.max, item.volatility, p.gameState?.volatility_profile?.[ticker] ?? 1)
          const pct = Math.round(((newPrice - currentPrice) / currentPrice) * 100)
          const md = { ...item, newPrice, oldPrice: currentPrice, emoji: getPriceChangeEmoji(currentPrice, newPrice), pct, isStock }
          if (!p.notifPrefsRef.current.mutedTickers.includes(ticker)) p.setMarketData(md)
          newState.market_prices = { ...p.gameState.market_prices, [ticker]: newPrice }
          newState.market_event = { ...md, player_name: p.myPlayer.name, timestamp: Date.now() }
        }
      }
      p.latestStateRef.current = newState
      await wgs(newState)
      const prefs = p.notifPrefsRef.current
      const currentHit = p.pickedHitRef.current
      if (cell.type === 'hit' && !prefs.hit && currentHit) {
        const amount = Math.round(currentHit.amount * getDiffConfig().hit_multiplier)
        const updatedAfterHit = { ...updatedPlayer, cash: updatedPlayer.cash - amount }
        const hitPlayers = p.gameState.players.map((pl: Player) => pl.id === p.myPlayerId ? updatedAfterHit : pl)
        const hitEv = { id: crypto.randomUUID(), round: p.gameState.round??1, player_id: p.myPlayerId, player_name: p.myPlayer.name, type: 'hit', description: `${p.myPlayer.name} — ${currentHit.desc}: −₽${amount.toLocaleString()}`, amount, created_at: new Date().toISOString() }
        const autoState = { ...newState, players: hitPlayers, events: [hitEv, ...(newState.events||[])].slice(0,50) }
        p.latestStateRef.current = autoState
        showCashNotif(currentHit.desc, amount, false)
        p.snd.hit()
        await wgs(autoState)
        setTimeout(() => advanceTurn(autoState), 800)
        return
      }
      if (cell.type === 'event' && !prefs.event && p.pickedEvent) {
        setTimeout(async () => { await handlePass() }, 800)
        return
      }
      if (cell.type === 'market' && (!prefs.market || (cell.data?.ticker && prefs.mutedTickers.includes(cell.data.ticker)))) {
        setTimeout(() => advanceTurn(newState), 800); return
      }
      if (cell.type === 'auction' && !prefs.auction) { setTimeout(() => advanceTurn(newState), 800); return }
      if (cell.type === 'opportunity' && !prefs.opportunity) { setTimeout(() => advanceTurn(newState), 800); return }
      if (['opportunity','hit','event','auction','market','child','charity'].includes(cell.type)) {
        setTimeout(() => p.setShowTurnCard(true), 300)
      } else {
        setTimeout(() => advanceTurn(newState), 500)
      }
    }, 400)
  }

  async function handleBuy(asset: any) {
    if (!p.myPlayer || !asset || !p.gameState || !p.isMyTurn || !p.hasRolled) return
    const { player: updatedPlayer, success, reason } = buyAsset(p.myPlayer, asset, getKeyRate())
    if (!success) { showNotif(reason || 'Недостаточно средств', '#F87171'); return }
    const newPlayers = p.gameState.players.map((pl: Player) => pl.id === p.myPlayerId ? updatedPlayer : pl)
    const newEvent = { id: crypto.randomUUID(), round: p.gameState?.round??1, player_id: p.myPlayerId, player_name: p.myPlayer.name, type: 'buy', description: `${p.myPlayer.name} купил ${p.selectedDeal.name}`, amount: p.selectedDeal.down_payment, created_at: new Date().toISOString() }
    const newState = { ...p.gameState, players: newPlayers, events: [newEvent, ...(p.gameState.events||[])].slice(0,50) }
    p.snd.buy()
    showCashNotif(asset.name, p.selectedDeal.down_payment, false)
    p.setShowTurnCard(false)
    if (updatedPlayer.is_free) { await wgs(newState); return }
    await wgs(newState)
    advanceTurn(newState)
  }

  async function handlePass() {
    p.setShowTurnCard(false)
    if (!p.isMyTurn || !p.hasRolled) return
    const baseState = p.latestStateRef.current ?? p.gameState
    if (p.currentCell?.type === 'hit' && p.pickedHit && p.myPlayer && baseState) {
      if ((p.pickedHit as any).skip_turns) {
        const skipCount = (p.pickedHit as any).skip_turns as number
        const salaryLoss = (p.pickedHit as any).lose_salary ? (p.myPlayer.profession?.salary ?? 0) : 0
        const updatedPlayer = { ...p.myPlayer, cash: p.myPlayer.cash - salaryLoss, skip_turns: skipCount }
        const newPlayers = baseState.players.map((pl: Player) => pl.id === p.myPlayerId ? updatedPlayer : pl)
        const newEvent = { id: crypto.randomUUID(), round: baseState?.round??1, player_id: p.myPlayerId, player_name: p.myPlayer.name, type: 'hit', description: `${p.myPlayer.name} — ${p.pickedHit.desc}. Пропускает ${skipCount} хода`, amount: salaryLoss, created_at: new Date().toISOString() }
        const newState = { ...baseState, players: newPlayers, events: [newEvent, ...(baseState.events||[])].slice(0,50) }
        p.latestStateRef.current = newState
        if (salaryLoss > 0) showCashNotif(`Потеря зарплаты: ${p.pickedHit.desc}`, salaryLoss, false)
        await wgs(newState)
        advanceTurn(newState); return
      }
      const amount = Math.round(p.pickedHit.amount * getDiffConfig().hit_multiplier)
      p.snd.hit()
      showCashNotif(p.pickedHit.desc, amount, false, undefined, 'hit')
      const newCash = p.myPlayer.cash - amount
      const netFlow = (p.myPlayer.profession?.salary ?? 0) + p.myPlayer.passive_income - p.myPlayer.total_expenses
      const updatedPlayer = { ...p.myPlayer, cash: newCash }
      const newPlayers = baseState.players.map((pl: Player) => pl.id === p.myPlayerId ? updatedPlayer : pl)
      const newEvent = { id: crypto.randomUUID(), round: baseState?.round??1, player_id: p.myPlayerId, player_name: p.myPlayer.name, type: 'hit', description: `${p.myPlayer.name} — ${p.pickedHit.desc}: −₽${amount.toLocaleString()}`, amount, created_at: new Date().toISOString() }
      const newState = { ...baseState, players: newPlayers, events: [newEvent, ...(baseState.events||[])].slice(0,50) }
      await wgs(newState)
      if (newCash < -10000) { p.latestStateRef.current = newState; p.setShowEmergency(true); return }
      if (netFlow < 0) {
        const elimEvent = { id: crypto.randomUUID(), round: baseState?.round??1, player_id: p.myPlayerId, player_name: p.myPlayer.name, type: 'hit', description: `${p.myPlayer.name} выбывает — отрицательный денежный поток!`, created_at: new Date().toISOString() }
        const elimState = { ...newState, players: newState.players.map((pl:any)=>pl.id===p.myPlayerId?{...pl,is_eliminated:true}:pl), events: [elimEvent,...newState.events].slice(0,50) }
        p.latestStateRef.current = elimState
        await wgs(elimState)
        setTimeout(()=>sounds.drumroll(),200); setTimeout(()=>sounds.bankrupt(),1000); p.setShowBankrupt(true); return
      }
      advanceTurn(newState); return
    }
    if (p.currentCell?.type === 'event' && p.pickedEvent && p.myPlayer && baseState) {
      const effect: string = p.pickedEvent.effect
      if (effect === 'cash+salary') {
        const bonus = Math.round((p.myPlayer.profession?.salary ?? 0) * getDiffConfig().salary_bonus)
        const updatedPlayer = { ...p.myPlayer, cash: p.myPlayer.cash + bonus }
        const newPlayers = baseState.players.map((pl: Player) => pl.id === p.myPlayerId ? updatedPlayer : pl)
        const newEvent = { id: crypto.randomUUID(), round: baseState?.round??1, player_id: p.myPlayerId, player_name: p.myPlayer.name, type: 'event', description: `${p.myPlayer.name}: ${p.pickedEvent.desc} +₽${bonus.toLocaleString()}`, amount: bonus, created_at: new Date().toISOString() }
        const newState = { ...baseState, players: newPlayers, events: [newEvent, ...(baseState.events||[])].slice(0,50) }
        showCashNotif(p.pickedEvent.desc, bonus, true, undefined, 'event'); p.snd.salary()
        await wgs(newState); advanceTurn(newState); return
      }
      if (effect === 'expenses+5%') {
        if (!getGameSettings().inflation) { advanceTurn(baseState); return }
        const increase = Math.round(p.myPlayer.total_expenses * 0.05)
        const updatedPlayer = { ...p.myPlayer, total_expenses: p.myPlayer.total_expenses + increase }
        const newPlayers = baseState.players.map((pl: Player) => pl.id === p.myPlayerId ? updatedPlayer : pl)
        const newEvent = { id: crypto.randomUUID(), round: baseState?.round??1, player_id: p.myPlayerId, player_name: p.myPlayer.name, type: 'event', description: `${p.myPlayer.name}: ${p.pickedEvent.desc} −₽${increase.toLocaleString()}/мес`, amount: -increase, created_at: new Date().toISOString() }
        const newState = { ...baseState, players: newPlayers, events: [newEvent, ...(baseState.events||[])].slice(0,50) }
        showCashNotif(p.pickedEvent.desc, increase, false, undefined, 'event')
        await wgs(newState); advanceTurn(newState); return
      }
      if (effect.startsWith('rate:')) {
        if (!getGameSettings().volatile_rate) { advanceTurn(baseState); return }
        const newRate = parseFloat(effect.split(':')[1])
        const newEvent = { id: crypto.randomUUID(), round: baseState?.round??1, player_id: p.myPlayerId, player_name: p.myPlayer.name, type: 'event', description: `${p.pickedEvent.desc}`, created_at: new Date().toISOString() }
        const newState = { ...baseState, key_rate: newRate, events: [newEvent, ...(baseState.events||[])].slice(0,50) }
        await wgs(newState); advanceTurn(newState); return
      }
    }
    advanceTurn(baseState)
  }

  async function handleAuctionBuy(bidAmount: number, clearOpenAuction = false) {
    if (!p.myPlayer || !p.auctionAsset || !p.gameState || !p.hasRolled) return
    if (p.myPlayer.cash < bidAmount) { showNotif('Недостаточно наличных', '#F87171'); return }
    const debt = Math.max(0, p.auctionAsset.price - bidAmount)
    const monthly = debt > 0 ? Math.round(debt * getKeyRate() / 12) : 0
    const updatedPlayer: Player = {
      ...p.myPlayer,
      cash: p.myPlayer.cash - bidAmount,
      passive_income: p.myPlayer.passive_income + p.auctionAsset.passive_income,
      assets: [...p.myPlayer.assets, { ...p.auctionAsset, down_payment: bidAmount, debt }],
      debts: debt > 0 ? [...p.myPlayer.debts, { name: p.auctionAsset.name, amount: debt, monthly }] : p.myPlayer.debts,
      total_expenses: p.myPlayer.total_expenses + monthly,
    }
    const newPlayers = p.gameState.players.map((pl: Player) => pl.id === p.myPlayerId ? updatedPlayer : pl)
    const newEvent = { id: crypto.randomUUID(), round: p.gameState?.round??1, player_id: p.myPlayerId, player_name: p.myPlayer.name, type: 'auction_win', description: `${p.myPlayer.name} выиграл аукцион: ${p.auctionAsset.name} за ₽${bidAmount.toLocaleString()}`, created_at: new Date().toISOString() }
    const newState = { ...p.gameState, players: newPlayers, events: [newEvent, ...(p.gameState.events||[])].slice(0,50), ...(clearOpenAuction ? { open_auction: null } : {}) }
    p.snd.buy()
    showCashNotif(p.auctionAsset.name, bidAmount, false)
    p.setShowTurnCard(false)
    await wgs(newState)
    advanceTurn(newState)
  }

  return { wgs, showNotif, showCashNotif, handleRoll, handleBuy, handlePass, handleAuctionBuy, advanceTurn }
}
