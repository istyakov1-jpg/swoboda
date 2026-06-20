'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Player } from '@/types/database'
import { IconTrophy, IconArrowRight } from '@/components/icons'

const CONFETTI_COLORS = ['#F5B843', '#34D399', '#5B9DF9', '#A78BFA', '#FB6B6B', '#FBD37B']

export default function VictoryPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const router = useRouter()
  const [player, setPlayer] = useState<Player | null>(null)

  useEffect(() => {
    const pid = localStorage.getItem(`svoboda_player_${roomId}`)
    if (!pid) return
    (supabase as any).from('rooms').select('game_state').eq('id', roomId).single().then(({ data }: {data: any}) => {
      if (data) {
        const p = data.game_state.players.find((p: Player) => p.id === pid)
        setPlayer(p)
      }
    })
  }, [roomId])

  if (!player) return <div className="flex min-h-screen items-center justify-center bg-[#07070D] text-hi">Загрузка...</div>

  const cashflow = (player.profession?.salary ?? 0) + player.passive_income
  const surplus = player.passive_income - player.total_expenses
  const surplusPercent = Math.round((surplus / player.total_expenses) * 100)

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#07070D' }}>
      <div
        className="relative flex w-[390px] flex-col overflow-hidden rounded-[52px] border border-gold/30"
        style={{
          background: 'radial-gradient(600px 500px at 50% 30%, rgba(245,184,67,.18), transparent 65%), #0B0B13',
          minHeight: '844px',
        }}
      >
        {/* Confetti */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 46 }).map((_, i) => {
            const left = Math.round((i * 53 + (i % 7) * 11) % 100)
            const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
            const w = 6 + (i % 4) * 2
            const round = i % 3 === 0
            return (
              <div key={i} style={{
                position: 'absolute', top: '-8%', left: `${left}%`,
                width: `${w}px`, height: `${round ? w : w * 1.7}px`,
                background: color, borderRadius: round ? '50%' : '2px', opacity: 0.9,
                transform: `rotate(${i * 37}deg)`,
                animation: `confFall ${3.2 + (i % 5) * 0.5}s linear ${(i % 9) * 0.28}s infinite`,
              }} />
            )
          })}
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="gold-grad flex h-[100px] w-[100px] items-center justify-center rounded-[32px] shadow-[0_30px_60px_-15px_rgba(245,184,67,.7)]">
            <IconTrophy size={52} className="text-[#1A1206]" />
          </div>

          <div className="mt-8 text-[13px] font-extrabold tracking-[3px] text-gold">ФИНАНСОВАЯ СВОБОДА</div>
          <h1 className="mt-3 text-[38px] font-extrabold leading-[1.05] tracking-[-1px]">
            ТЫ ВЫРВАЛСЯ<br />ИЗ МЫШИНОЙ<br />СУЕТЫ
          </h1>
          <p className="mt-4 text-[15px] font-medium leading-[1.6] text-body">
            Пассивный доход теперь больше расходов.<br />Крысиные бега закончились — ты в большой игре.
          </p>

          <div className="mt-8 flex gap-3">
            <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.045] p-4 text-center">
              <div className="text-[11px] font-semibold text-faint">Пассив</div>
              <div className="mt-1 text-[20px] font-extrabold text-pos">₽{player.passive_income.toLocaleString()}</div>
            </div>
            <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.045] p-4 text-center">
              <div className="text-[11px] font-semibold text-faint">Расходы</div>
              <div className="mt-1 text-[20px] font-extrabold text-neg">₽{player.total_expenses.toLocaleString()}</div>
            </div>
            <div className="rounded-[18px] border border-pos/30 bg-pos/[0.10] p-4 text-center">
              <div className="text-[11px] font-semibold text-pos/80">Запас</div>
              <div className="mt-1 text-[20px] font-extrabold text-pos">+{surplusPercent}%</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-6 pb-[40px] pt-4">
          <button
            onClick={() => router.push(`/game/${roomId}/result`)}
            className="gold-grad flex w-full items-center justify-center gap-2.5 rounded-[20px] p-[17px] text-[17px] font-extrabold text-[#1A1206] shadow-[0_18px_40px_-12px_rgba(245,184,67,.65)]"
          >
            Получить ИИ-разбор
            <IconArrowRight size={20} sw={2.6} />
          </button>
          <div className="mt-3 text-center text-[12px] font-semibold text-faint">
            {player.assets.length} активов · {player.profession?.icon} {player.profession?.name}
          </div>
        </div>
      </div>
    </div>
  )
}
