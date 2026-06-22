'use client'
import { useEffect, useRef } from 'react'

// Pull-to-refresh для PWA на iPhone — свайп вниз от верха перезагружает страницу
export default function PullToRefresh() {
  const startYRef = useRef<number | null>(null)
  const indicatorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const THRESHOLD = 90 // сколько px тянуть чтобы сработало

    function onTouchStart(e: TouchEvent) {
      // Срабатывает только если страница прокручена в самый верх
      if (window.scrollY === 0) {
        startYRef.current = e.touches[0].clientY
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (startYRef.current === null) return
      const dy = e.touches[0].clientY - startYRef.current
      if (dy <= 0) { startYRef.current = null; return }

      // Показываем индикатор
      const indicator = indicatorRef.current
      if (!indicator) return
      const progress = Math.min(dy / THRESHOLD, 1)
      indicator.style.opacity = String(progress)
      indicator.style.transform = `translateY(${Math.min(dy * 0.4, 36)}px)`
    }

    function onTouchEnd(e: TouchEvent) {
      if (startYRef.current === null) return
      const dy = e.changedTouches[0].clientY - startYRef.current
      startYRef.current = null

      const indicator = indicatorRef.current
      if (indicator) {
        indicator.style.opacity = '0'
        indicator.style.transform = 'translateY(0)'
      }

      if (dy >= THRESHOLD) {
        window.location.reload()
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return (
    <div
      ref={indicatorRef}
      className="pointer-events-none fixed left-1/2 top-4 z-[9999] -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[12px] font-bold text-white/60 opacity-0 backdrop-blur-sm transition-opacity"
      style={{ transition: 'opacity 0.15s' }}
    >
      <span>↓</span> Потяни чтобы обновить
    </div>
  )
}
