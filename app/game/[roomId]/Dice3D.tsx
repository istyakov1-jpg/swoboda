'use client'
import { useEffect, useRef, useState } from 'react'

export function Dice3D({ size = 52, diceValue, rolling }: { size?: number; diceValue: number | null; rolling: boolean }) {
  const v = diceValue || 1
  const half = size / 2
  const finals: Record<number, string> = {
    1: 'rotateX(0deg) rotateY(0deg)',
    2: 'rotateX(-90deg) rotateY(0deg)',
    3: 'rotateY(-90deg)',
    4: 'rotateY(90deg)',
    5: 'rotateX(90deg)',
    6: 'rotateY(180deg)',
  }
  const faceValues = [1, 6, 2, 5, 3, 4]
  const faceTransforms = [
    `translateZ(${half}px)`,
    `rotateY(180deg) translateZ(${half}px)`,
    `rotateX(90deg) translateZ(${half}px)`,
    `rotateX(-90deg) translateZ(${half}px)`,
    `rotateY(-90deg) translateZ(${half}px)`,
    `rotateY(90deg) translateZ(${half}px)`,
  ]
  const P: Record<string, [number, number]> = { TL: [7, 7], TR: [17, 7], ML: [7, 12], MR: [17, 12], BL: [7, 17], BR: [17, 17], C: [12, 12] }
  const MAP: Record<number, string[]> = { 1: ['C'], 2: ['TL', 'BR'], 3: ['TL', 'C', 'BR'], 4: ['TL', 'TR', 'BL', 'BR'], 5: ['TL', 'TR', 'C', 'BL', 'BR'], 6: ['TL', 'TR', 'ML', 'MR', 'BL', 'BR'] }

  const angleRef = useRef({ x: 0, y: 0 })
  const [displayTransform, setDisplayTransform] = useState(finals[v])
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!rolling) {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      setDisplayTransform(finals[v])
      return
    }
    let speed = 4
    const animate = () => {
      angleRef.current.x += speed * 1.1
      angleRef.current.y += speed * 1.7
      setDisplayTransform(`rotateX(${angleRef.current.x}deg) rotateY(${angleRef.current.y}deg)`)
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null } }
  }, [rolling])

  useEffect(() => {
    if (!rolling) setDisplayTransform(finals[v])
  }, [v, rolling])

  return (
    <div style={{ width: size, height: size, perspective: size * 5, filter: 'drop-shadow(0 8px 18px rgba(0,0,0,.5))' }}>
      <div style={{
        width: size, height: size, position: 'relative', transformStyle: 'preserve-3d',
        transition: rolling ? 'none' : 'transform .7s cubic-bezier(.18,.7,.22,1)',
        transform: displayTransform,
      }}>
        {faceValues.map((fv, i) => (
          <div key={i} style={{
            position: 'absolute', width: size, height: size,
            borderRadius: Math.round(size * .16),
            background: 'linear-gradient(145deg,#ffffff,#ece6d8)',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.07),inset 0 4px 8px rgba(255,255,255,.7),inset 0 -4px 8px rgba(0,0,0,.08)',
            display: 'grid', placeItems: 'center',
            backfaceVisibility: 'hidden',
            transform: faceTransforms[i],
          }}>
            <svg width={size * .85} height={size * .85} viewBox="0 0 24 24">
              {(MAP[fv] || ['C']).map((k, j) => <circle key={j} cx={P[k][0]} cy={P[k][1]} r="2.2" fill="#1A1206" />)}
            </svg>
          </div>
        ))}
      </div>
    </div>
  )
}
