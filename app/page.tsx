'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Точка входа PWA — восстанавливает последнюю игровую сессию
export default function Home() {
  const router = useRouter()

  useEffect(() => {
    async function restore() {
      const lastRoom = localStorage.getItem('svoboda_last_room')

      if (lastRoom) {
        // Проверяем что комната ещё активна
        const { data } = await (supabase as any)
          .from('rooms')
          .select('id, status')
          .eq('id', lastRoom)
          .single()

        if (data && (data.status === 'playing' || data.status === 'lobby')) {
          // Проверяем что у нас есть игрок в этой комнате
          const playerId = localStorage.getItem(`svoboda_player_${lastRoom}`)
          if (playerId) {
            router.replace(`/game/${lastRoom}`)
            return
          }
        }

        // Комната закрыта или мы не участник — очищаем
        localStorage.removeItem('svoboda_last_room')
      }

      router.replace('/lobby')
    }

    restore()
  }, [router])

  // Пока проверяем — показываем сплэш
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07070D]">
      <div className="flex flex-col items-center gap-3">
        <div className="text-[48px]">🎲</div>
        <div className="text-[22px] font-extrabold tracking-tight">Свобода</div>
        <div className="mt-2 h-1 w-24 overflow-hidden rounded-full bg-white/10">
          <div className="h-full animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-gold"
            style={{ animation: 'loadingBar 1.5s ease-in-out infinite' }} />
        </div>
      </div>
      <style>{`
        @keyframes loadingBar {
          0% { width: 0%; margin-left: 0% }
          50% { width: 60%; margin-left: 20% }
          100% { width: 0%; margin-left: 100% }
        }
      `}</style>
    </div>
  )
}
