'use client'
import { createContext, useContext } from 'react'

// Отдельный контекст для анимации кубика — меняется 8×/80мс при броске бота
// Отделение от основного контекста исключает каскадные ре-рендеры всего UI
export interface DiceCtx {
  diceValue: number | null
  diceValue2: number | null
  rolling: boolean
  anyoneRolling: boolean
  showDiceRolling: boolean
}

const GameDiceContext = createContext<DiceCtx>({
  diceValue: null, diceValue2: null,
  rolling: false, anyoneRolling: false, showDiceRolling: false,
})
export const GameDiceProvider = GameDiceContext.Provider

export function useGameDice(): DiceCtx {
  return useContext(GameDiceContext)
}
