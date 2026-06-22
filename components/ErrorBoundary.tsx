'use client'
import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#07070D] px-8 text-center">
        <div className="text-5xl mb-6">⚠️</div>
        <div className="text-[20px] font-extrabold mb-2">Что-то пошло не так</div>
        <div className="text-[13px] text-white/40 mb-8 leading-relaxed">
          Произошла ошибка в приложении.<br />Нажми кнопку чтобы перезагрузить.
        </div>
        <button
          onClick={() => window.location.reload()}
          className="gold-grad rounded-[20px] px-8 py-4 text-[16px] font-extrabold text-[#1A1206]"
          style={{ boxShadow: '0 16px 40px -12px rgba(245,184,67,.65)' }}
        >
          Перезагрузить
        </button>
        <button
          onClick={() => { window.location.href = '/lobby' }}
          className="mt-4 text-[13px] text-white/30 underline"
        >
          Вернуться в лобби
        </button>
      </div>
    )
  }
}
