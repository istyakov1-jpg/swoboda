'use client'
import { memo, useEffect } from 'react'

interface Props {
  timeLeft: number
  timeLimit: number
  isMyTurn: boolean
  onTick: () => void
  showBankrupt: boolean
  showEmergency: boolean
}

// Вынесен в отдельный компонент чтобы тик каждую секунду
// не перерисовывал весь page.tsx
const GameTimer = memo(function GameTimer({
  timeLeft, timeLimit, isMyTurn, onTick, showBankrupt, showEmergency
}: Props) {
  useEffect(() => {
    if (showBankrupt || showEmergency) return
    if (timeLeft <= 0) return
    const t = setTimeout(onTick, 1000)
    return () => clearTimeout(t)
  }, [timeLeft, onTick, showBankrupt, showEmergency])

  return null // только логика, UI в кнопке броска
})

export default GameTimer
