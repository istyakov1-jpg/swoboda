'use client'
import { useEffect } from 'react'
import type { Player } from '@/types/database'
import { rollDice, movePlayer, collectSalary, buyAsset, botDecide, calcDividends } from '@/lib/gameEngine'
import { STOCKS, CRYPTO, KEY_RATE_DEFAULT, DIFFICULTY_CONFIG, getBoardCells, getRandomDeal, getRandomHit, getRandomAuctionAsset, getNewPrice, getPriceChangeEmoji, getStockByTicker, getCryptoByTicker, type GameDifficulty } from '@/lib/gameData'
import { gameLog } from '@/lib/gameLogger'

interface UseBotRunnerParams {
  gameState: any
  currentPlayer: any
  effectiveHostRef: React.MutableRefObject<boolean>
  gameStateRef: React.MutableRefObject<any>
  setDiceValue: (v: number) => void
  setAnyoneRolling: (v: boolean) => void
  wgs: (state: any, playerId?: string) => Promise<void>
  advanceTurn: (state: any) => Promise<void>
  roomId: string
  turnIdRef: React.MutableRefObject<string>
}

export function useBotRunner({
  gameState,
  currentPlayer,
  effectiveHostRef,
  gameStateRef,
  setDiceValue,
  setAnyoneRolling,
  wgs,
  advanceTurn,
  roomId,
  turnIdRef,
}: UseBotRunnerParams) {
  useEffect(() => {
    if (!gameState || !currentPlayer?.is_bot) return
    let botAnimCount = 0
    const botAnim = setInterval(() => { setDiceValue(Math.floor(Math.random()*6)+1); if(++botAnimCount>10) clearInterval(botAnim) }, 80)

    const timer = setTimeout(async () => {
      if (!effectiveHostRef.current) return
      const gs = gameStateRef.current
      if (!gs) return
      if (gs.players[0]?.id !== currentPlayer.id) return
      const botPlayer = gs.players[0]

      setAnyoneRolling(false)

      try {
        if ((botPlayer as any).skip_turns > 0) {
          const remaining = (botPlayer as any).skip_turns - 1
          gameLog({ roomId, turnId: turnIdRef.current, eventType: 'SKIP_TURN',
            playerId: botPlayer.id, playerName: botPlayer.name,
            payload: { skip_before: (botPlayer as any).skip_turns, skip_after: remaining, is_bot: true } })
          const updatedBot = { ...botPlayer, skip_turns: remaining }
          const allPlayers = gs.players.map((p: any) => p.id === botPlayer.id ? updatedBot : p)
          const [skipCur, ...skipRest] = allPlayers
          const skipEv = { id: crypto.randomUUID(), round: gs?.round??1, player_id: botPlayer.id, player_name: botPlayer.name, type: 'hit', description: `${botPlayer.name} пропускает ход (осталось: ${remaining})`, created_at: new Date().toISOString() }
          const skipState = { ...gs, players: [...skipRest, skipCur], events: [skipEv, ...(gs.events||[])].slice(0,50) }
          await wgs(skipState, botPlayer.id)
          return
        }

        const roll = rollDice()
        setDiceValue(roll)
        gameLog({ roomId, turnId: turnIdRef.current, eventType: 'BOT_ACTION',
          playerId: botPlayer.id, playerName: botPlayer.name,
          payload: { roll, position_before: botPlayer.position, cash: botPlayer.cash } })
        const botDiff = (gs?.settings?.difficulty ?? 'normal') as GameDifficulty
        const botBoard = getBoardCells(botDiff)
        const { player: movedPlayer, cell, passed_salary, salary_count } = movePlayer(botPlayer, roll, botBoard)
        let updatedPlayer = movedPlayer
        const botR = gs?.round ?? 1
        let botSalaryAmount = 0
        const botDivEnabled = gs?.settings?.dividend_enabled !== false
        const botDivAmount = botDivEnabled ? calcDividends(updatedPlayer, gs?.market_prices ?? {}, STOCKS) : 0

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

        const botEvents: any[] = [{ id: crypto.randomUUID(), round: botR, player_id: botPlayer.id, player_name: botPlayer.name, type: 'roll', description: `${botPlayer.name} бросает кубик: ${roll} → ${cell.label}`, created_at: new Date().toISOString() }]

        if ((cell.type === 'salary' || passed_salary) && botSalaryAmount > 0) {
          botEvents.push({ id: crypto.randomUUID(), round: botR, player_id: botPlayer.id, player_name: botPlayer.name, type: 'salary', description: `${botPlayer.name} получает ${cell.type==='salary'?'зарплату':'денежный поток'}: +₽${botSalaryAmount.toLocaleString()}`, amount: botSalaryAmount, created_at: new Date().toISOString() })
        }

        if (cell.type === 'child') {
          const childExpense = Math.round((botPlayer.profession?.salary ?? 100000) * 0.10)
          updatedPlayer = { ...updatedPlayer, total_expenses: updatedPlayer.total_expenses + childExpense, debts: [...updatedPlayer.debts, { name: 'Расходы на ребёнка 👶', amount: 0, monthly: childExpense }], children: (updatedPlayer.children ?? 0) + 1 }
          botEvents.push({ id: crypto.randomUUID(), round: botR, player_id: botPlayer.id, player_name: botPlayer.name, type: 'child', description: `${botPlayer.name} — родился ребёнок! +₽${childExpense.toLocaleString()}/мес`, created_at: new Date().toISOString() })
        }

        if (cell.type === 'charity') {
          updatedPlayer = { ...updatedPlayer, double_dice_rounds: (updatedPlayer.double_dice_rounds ?? 0) + 2 }
          botEvents.push({ id: crypto.randomUUID(), round: botR, player_id: botPlayer.id, player_name: botPlayer.name, type: 'charity', description: `${botPlayer.name} — благотворительность! Двойной кубик 2 круга`, created_at: new Date().toISOString() })
        }

        if (cell.type === 'opportunity') {
          const size = Math.random() > 0.5 ? 'large' : 'small'
          const asset = getRandomDeal(size)
          if (asset && botDecide(updatedPlayer, asset) === 'buy') {
            const { player: w, success } = buyAsset(updatedPlayer, asset, gs?.key_rate ?? KEY_RATE_DEFAULT)
            if (success) {
              updatedPlayer = w
              botEvents.push({ id: crypto.randomUUID(), round: botR, player_id: botPlayer.id, player_name: botPlayer.name, type: 'buy', description: `${botPlayer.name} купил ${asset.name} за ₽${asset.down_payment.toLocaleString()}`, amount: asset.down_payment, created_at: new Date().toISOString() })
            }
          }
        }

        if (cell.type === 'hit') {
          const hitEvent = getRandomHit()
          const hitAmount = Math.round(hitEvent.amount * (DIFFICULTY_CONFIG[botDiff]?.hit_multiplier ?? 1))
          const hitSkip = (hitEvent as any).skip_turns ?? 0
          updatedPlayer = { ...updatedPlayer, cash: updatedPlayer.cash - hitAmount, ...(hitSkip > 0 ? { skip_turns: hitSkip } : {}) }
          botEvents.push({ id: crypto.randomUUID(), round: botR, player_id: botPlayer.id, player_name: botPlayer.name, type: 'hit', description: `${botPlayer.name} — ${hitEvent.desc}: −₽${hitAmount.toLocaleString()}${hitSkip > 0 ? ` (пропуск ${hitSkip})` : ''}`, amount: hitAmount, created_at: new Date().toISOString() })
        }

        if (cell.type === 'auction') {
          const aAsset = getRandomAuctionAsset()
          if (aAsset && updatedPlayer.cash >= aAsset.down_payment) {
            const { player: w, success } = buyAsset(updatedPlayer, aAsset, gs?.key_rate ?? KEY_RATE_DEFAULT)
            if (success) {
              updatedPlayer = w
              botEvents.push({ id: crypto.randomUUID(), round: botR, player_id: botPlayer.id, player_name: botPlayer.name, type: 'auction_win', description: `${botPlayer.name} выиграл аукцион: ${aAsset.name} за ₽${aAsset.down_payment.toLocaleString()}`, amount: aAsset.down_payment, created_at: new Date().toISOString() })
            }
          }
        }

        const netFlow = (botPlayer.profession?.salary ?? 0) + updatedPlayer.passive_income - updatedPlayer.total_expenses
        if (updatedPlayer.cash < 0 && netFlow < 0 && !(updatedPlayer as any).is_eliminated) {
          updatedPlayer = { ...updatedPlayer, ...({ is_eliminated: true } as any) }
          botEvents.push({ id: crypto.randomUUID(), round: botR, player_id: botPlayer.id, player_name: botPlayer.name, type: 'hit', description: `${botPlayer.name} выбывает — банкротство`, created_at: new Date().toISOString() })
        }

        const newPlayers = gs.players.map((p: Player) => p.id === botPlayer.id ? updatedPlayer : p)
        const [cur, ...rest] = newPlayers
        let botNewState: any = { ...gs, players: [...rest, cur], events: [...botEvents, ...(gs.events||[])].slice(0,50) }

        if (cell.type === 'child') {
          botNewState.baby_event = { player_id: botPlayer.id, player_name: botPlayer.name, timestamp: Date.now() }
        }

        if (cell.type === 'market') {
          const isStock = cell.data?.market_type === 'stock'
          const lastBotTicker = gs.market_event?.ticker
          let botTicker = cell.data.ticker
          if (botTicker === lastBotTicker) {
            const pool = isStock
              ? STOCKS.map((s:any) => s.ticker).filter((t:string) => t !== botTicker)
              : CRYPTO.map((c:any) => c.ticker).filter((t:string) => t !== botTicker)
            if (pool.length > 0) botTicker = pool[Math.floor(Math.random() * pool.length)]
          }
          const item = isStock ? getStockByTicker(botTicker) : getCryptoByTicker(botTicker)
          if (item) {
            const currentPrice = gs.market_prices?.[botTicker] ?? item.price
            const newPrice = getNewPrice(currentPrice, item.min, item.max, item.volatility, gs?.volatility_profile?.[botTicker] ?? 1)
            const pct = Math.round(((newPrice - currentPrice) / currentPrice) * 100)
            const md = { ...item, newPrice, oldPrice: currentPrice, emoji: getPriceChangeEmoji(currentPrice, newPrice), pct, isStock }
            botNewState.market_prices = { ...gs.market_prices, [botTicker]: newPrice }
            botNewState.market_event = { ...md, player_name: botPlayer.name, timestamp: Date.now() }
          }
        }

        await wgs(botNewState, botPlayer.id)
      } catch (err) {
        console.error('[BOT] ошибка в ходе бота, форсируем advance:', err)
        const gs2 = gameStateRef.current ?? gs
        if (gs2) await advanceTurn(gs2)
      }
    }, 1500)
    return () => { clearTimeout(timer); clearInterval(botAnim) }
  }, [gameState?.players?.[0]?.id])
}
