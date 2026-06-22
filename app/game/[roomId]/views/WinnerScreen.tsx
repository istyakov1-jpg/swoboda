'use client'
import { memo, useMemo } from 'react'
import { useRenderCount } from '@/lib/profiling'
import { useRouter } from 'next/navigation'
import { useGameContext } from '../GameContext'
import { freedomProgress } from '@/lib/gameEngine'

const WinnerScreen = memo(function WinnerScreen() {
  const { winner, gameState, myPlayerId } = useGameContext()
  const router = useRouter()
  useRenderCount('WinnerScreen', { winner: winner?.id })

  if (!winner) return null

  return (
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

      <button onClick={()=>{ localStorage.removeItem('svoboda_last_room'); router.push('/lobby') }}
        className="gold-grad w-full rounded-[20px] py-4 text-[16px] font-extrabold text-[#1A1206]"
        style={{boxShadow:'0 16px 36px -12px rgba(245,184,67,.6)'}}>
        Новая игра →
      </button>
    </div>
  )
})
export default WinnerScreen
