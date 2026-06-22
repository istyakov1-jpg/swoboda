'use client'
import { memo } from 'react'

import { useGameContext } from '../GameContext'

const BankruptScreen = memo(function BankruptScreen() {
  const {
    showBankrupt, myPlayer, setShowBankrupt, advanceTurn, latestStateRef, gameState,
  } = useGameContext()


  if (!showBankrupt && !(myPlayer as any)?.is_eliminated) return null

  return (
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
          const base = latestStateRef.current ?? gameState
          if (base) await advanceTurn(base)
        }}
        className="w-full rounded-[20px] py-4 text-[15px] font-extrabold text-center"
        style={{background:'rgba(248,113,113,0.15)',border:'1px solid rgba(248,113,113,0.35)',color:'#F87171',cursor:'pointer'}}>
        Продолжить наблюдать →
      </button>
    </div>
  )
})
export default BankruptScreen
