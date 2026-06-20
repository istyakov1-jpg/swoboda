'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { freedomProgress } from '@/lib/gameEngine'
import type { Player } from '@/types/database'
import { IconAiSpark, IconBulb } from '@/components/icons'

type AIReport = {
  archetype: string
  traits: string[]
  strengths: string[]
  weaknesses: string[]
  business_parallel: string
  main_recommendation: string
  fin_iq: number
}

export default function ResultPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [player, setPlayer] = useState<Player | null>(null)
  const [report, setReport] = useState<AIReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const pid = localStorage.getItem(`svoboda_player_${roomId}`)
    if (!pid) return
    (supabase as any).from('rooms').select('game_state').eq('id', roomId).single().then(async ({ data }: {data: any}) => {
      if (!data) return
      const p = data.game_state.players.find((p: Player) => p.id === pid)
      setPlayer(p)
      if (p) await generateReport(p, data.game_state.events.filter((e: any) => e.player_id === pid))
    })
  }, [roomId])

  async function generateReport(player: Player, events: any[]) {
    setLoading(true)
    try {
      const prompt = `Ты — финансовый коуч. Проанализируй поведение предпринимателя в финансовой симуляции.

ПРОФИЛЬ ИГРОКА:
- Имя: ${player.name}
- Профессия: ${player.profession?.name} (зарплата ₽${player.profession?.salary.toLocaleString()})
- Финальные наличные: ₽${player.cash.toLocaleString()}
- Пассивный доход: ₽${player.passive_income.toLocaleString()}/мес
- Расходы: ₽${player.total_expenses.toLocaleString()}/мес
- Активы (${player.assets.length}): ${player.assets.map(a => a.name).join(', ') || 'нет'}
- Долги: ${player.debts.map(d => `${d.name} ₽${d.amount.toLocaleString()}`).join(', ') || 'нет'}
- Достиг финансовой свободы: ${player.is_free ? 'ДА' : 'НЕТ'}
- Прогресс к свободе: ${freedomProgress(player)}%

ИСТОРИЯ РЕШЕНИЙ (последние 20):
${events.slice(0, 20).map(e => `- ${e.description}`).join('\n') || 'нет данных'}

Ответь ТОЛЬКО в JSON (без markdown):
{
  "archetype": "название архетипа (2-3 слова, например: Стратег-накопитель)",
  "traits": ["черта1", "черта2", "черта3"],
  "strengths": ["сильная сторона 1", "сильная сторона 2"],
  "weaknesses": ["зона роста 1", "зона роста 2"],
  "business_parallel": "параллель с реальным бизнесом (2-3 предложения)",
  "main_recommendation": "одна главная рекомендация (1-2 предложения)",
  "fin_iq": число от 40 до 95
}`

      const res = await fetch('/api/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      setReport(data.report)
    } catch (e: any) {
      setError('Не удалось получить разбор: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#07070D]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold/30 border-t-gold" />
      <div className="text-[15px] font-semibold text-faint">ИИ анализирует твои решения...</div>
    </div>
  )

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-[#07070D] px-6 text-center">
      <div className="text-neg">{error}</div>
    </div>
  )

  if (!report || !player) return null

  const TRAIT_STYLES = [
    'text-pos border-pos/30 bg-pos/[0.12]',
    'text-gold border-gold/30 bg-gold/[0.12]',
    'text-neg border-neg/30 bg-neg/[0.12]',
    'text-violet border-violet/30 bg-violet/[0.12]',
  ]

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#07070D' }}>
      <div
        className="relative flex w-[390px] flex-col overflow-hidden rounded-[52px] border border-white/[0.08]"
        style={{
          background: 'radial-gradient(420px 280px at 50% -5%,rgba(91,157,249,.14),transparent 60%), #0B0B13',
          minHeight: '844px',
        }}
      >
        <div className="relative z-10 flex flex-1 flex-col overflow-y-auto px-[22px] pt-14 pb-10">
          <div className="ml-0.5 mt-1 flex items-center gap-2 text-[12px] font-bold text-info">
            <IconAiSpark size={16} sw={2} /> РАЗБОР ОТ ИИ
          </div>
          <div className="ml-0.5 mt-[9px] text-[25px] font-extrabold tracking-[-.5px]">Твой финансовый профиль</div>

          {/* Archetype */}
          <div className="mt-4 flex items-center gap-3.5 rounded-[22px] border border-info/[0.34] p-[18px] [background:linear-gradient(150deg,rgba(91,157,249,.22),rgba(167,139,250,.12))]">
            <div className="grid h-[54px] w-[54px] place-items-center rounded-[18px] border border-info/[0.45] bg-info/20 text-[28px]">
              🧭
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#9CC2FF]">Архетип</div>
              <div className="text-[20px] font-extrabold tracking-[-.3px]">{report.archetype}</div>
            </div>
          </div>

          {/* FinIQ */}
          <div className="mt-3 flex items-center gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.045] p-4">
            <div className="text-[40px] font-extrabold text-gold">{report.fin_iq}</div>
            <div>
              <div className="text-[13px] font-bold">Фин-IQ</div>
              <div className="text-[12px] text-faint">обгоняет {Math.round(report.fin_iq * 0.7)}% игроков</div>
            </div>
          </div>

          {/* Traits */}
          <div className="mt-3.5 flex flex-wrap gap-2">
            {report.traits.map((t, i) => (
              <span key={t} className={`rounded-full border px-[13px] py-2 text-[12px] font-bold ${TRAIT_STYLES[i % TRAIT_STYLES.length]}`}>{t}</span>
            ))}
          </div>

          {/* Strengths */}
          <div className="mt-4 rounded-[18px] border border-pos/20 bg-pos/[0.06] p-[15px]">
            <div className="mb-[9px] text-[13px] font-bold text-pos">Сильные стороны</div>
            <div className="flex flex-col gap-2">
              {report.strengths.map(s => (
                <div key={s} className="flex gap-[9px] text-[13px] font-medium text-[#D6E8DD]">
                  <span className="text-pos">↗</span>{s}
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="mt-[11px] rounded-[18px] border border-neg/20 bg-neg/[0.06] p-[15px]">
            <div className="mb-[9px] text-[13px] font-bold text-neg">Зоны роста</div>
            <div className="flex flex-col gap-2">
              {report.weaknesses.map(w => (
                <div key={w} className="flex gap-[9px] text-[13px] font-medium text-[#EAD3D3]">
                  <span className="text-neg">↘</span>{w}
                </div>
              ))}
            </div>
          </div>

          {/* Business parallel */}
          <div className="mt-[11px] rounded-[18px] border border-white/[0.08] bg-white/[0.045] p-[15px]">
            <div className="mb-1.5 text-[13px] font-bold text-body">Параллель с реальным бизнесом</div>
            <div className="text-[13px] font-medium leading-[1.5] text-muted">{report.business_parallel}</div>
          </div>

          {/* Main recommendation */}
          <div className="mt-[11px] rounded-[20px] border-[1.5px] border-gold/[0.45] p-[17px] shadow-[0_14px_34px_-16px_rgba(245,184,67,.5)] [background:linear-gradient(150deg,rgba(245,184,67,.22),rgba(245,184,67,.06))]">
            <div className="flex items-center gap-2 text-[12px] font-bold text-gold mb-3">
              <IconBulb size={16} sw={2} /> ГЛАВНАЯ РЕКОМЕНДАЦИЯ
            </div>
            <div className="text-[14px] font-medium leading-[1.6] text-[#F0E2C8]">{report.main_recommendation}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
