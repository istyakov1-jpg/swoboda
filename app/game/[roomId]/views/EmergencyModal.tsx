'use client'
import { useGameContext } from '../GameContext'
import { getCreditLimit, getTotalDebtPayments, takeCredit } from '@/lib/gameEngine'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export default function EmergencyModal() {
  const {
    roomId, showEmergency, myPlayer, gameState, myPlayerId,
    setShowEmergency, advanceTurn, showNotif, showCashNotif, latestStateRef,
  } = useGameContext()

  if (!showEmergency || !myPlayer || !gameState) return null

  const usedDebtMonthly = getTotalDebtPayments(myPlayer)

  return (
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
                const deficit = Math.abs(myPlayer.cash)
                const covers = myPlayer.cash + salePrice >= 0
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
        {/* Банкротство */}
        {(()=>{
          const anyCovers = myPlayer.assets.some((a:any) => myPlayer.cash + Math.round((a.down_payment??a.price)*0.5) >= 0)
          const hasCredit = getCreditLimit(myPlayer) > 0
          return (!anyCovers && !hasCredit)
        })() && (
          <button onClick={async()=>{
            const ev = {id:crypto.randomUUID(),round:gameState?.round??1,player_id:myPlayerId,player_name:myPlayer.name,type:'hit',description:`${myPlayer.name} объявляет банкротство`,created_at:new Date().toISOString()}
            const newPlayers = gameState.players.map((p:any)=>p.id===myPlayerId?{...p,is_eliminated:true}:p)
            const base = latestStateRef.current ?? gameState
            const newState = {...base,players:newPlayers,events:[ev,...(base.events||[])].slice(0,50)}
            latestStateRef.current = newState
            await db.from('rooms').update({game_state:newState}).eq('id',roomId)
            setShowEmergency(false)
          }} className="w-full rounded-[18px] py-3.5 text-[13px] font-bold text-center" style={{background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.25)',color:'#F87171'}}>
            Объявить банкротство ☠️
          </button>
        )}
      </div>
    </div>
  )
}
