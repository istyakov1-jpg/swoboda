'use client'
import { createContext, useContext } from 'react'

// Отдельный контекст для таймера — меняется каждую секунду
// Потребители основного GameContext не ре-рендерятся от тика таймера
export interface TimerCtx {
  timeLeft: number
}

const GameTimerContext = createContext<TimerCtx>({ timeLeft: 60 })
export const GameTimerProvider = GameTimerContext.Provider

export function useGameTimer(): TimerCtx {
  return useContext(GameTimerContext)
}
