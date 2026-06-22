'use client'
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

interface UseGameRoomParams {
  roomId: string
  setMyPlayerId: (id: string) => void
  setShowIntro: (v: boolean) => void
  setGameState: (fn: any) => void
  setRoomStatus: (fn: any) => void
  setRoomCode: (v: string) => void
  setIsHost: (v: boolean) => void
  setDiceValue: (v: number) => void
  setAnyoneRolling: (v: boolean) => void
  setGameStarting: (v: boolean) => void
  anyoneRollingTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  broadcastAnimRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>
  bcChannelRef: React.MutableRefObject<any>
  channelRef: React.MutableRefObject<any>
  pollIntervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>
  roomStatusRef: React.MutableRefObject<string>
}

export function useGameRoom({
  roomId,
  setMyPlayerId,
  setShowIntro,
  setGameState,
  setRoomStatus,
  setRoomCode,
  setIsHost,
  setDiceValue,
  setAnyoneRolling,
  setGameStarting,
  anyoneRollingTimerRef,
  broadcastAnimRef,
  bcChannelRef,
  channelRef,
  pollIntervalRef,
  roomStatusRef,
}: UseGameRoomParams) {
  const router = useRouter()

  useEffect(() => {
    const pid = localStorage.getItem(`svoboda_player_${roomId}`)
    if (!pid) { router.push('/lobby'); return }
    setMyPlayerId(pid)
    if (!localStorage.getItem(`svoboda_intro_${roomId}`)) setShowIntro(true)

    // Fetch и subscribe параллельно — анти-перезапись защищает от race condition
    db.from('rooms').select('game_state, status, code, host_id').eq('id', roomId).single()
      .then(({ data }: {data: any}) => {
        if (data) {
          setGameState((gs: any) => gs ?? data.game_state)
          setRoomStatus((prev: string) => prev === 'playing' ? 'playing' : data.status)
          setRoomCode(data.code)
          setIsHost(data.host_id === pid)
        }
      })

    const channel = supabase.channel(`room-${roomId}`)
    channel
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload: any) => {
          setGameState(payload.new.game_state)
          setRoomStatus(payload.new.status)
          if (payload.new.host_id) setIsHost(payload.new.host_id === pid)
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          db.from('rooms').select('game_state, status, host_id').eq('id', roomId).single()
            .then(({ data }: {data: any}) => {
              if (data) {
                setRoomStatus((prev: string) => prev === 'playing' ? 'playing' : data.status)
                if (data.host_id) setIsHost(data.host_id === pid)
                if (data.status !== 'playing') setGameState(data.game_state)
              }
            })
        }
      })
    channelRef.current = channel

    const bcChannel = supabase.channel(`bc-${roomId}`)
    bcChannelRef.current = bcChannel
    bcChannel
      .on('broadcast', { event: 'rolling' }, ({ payload }: any) => {
        if (payload?.player_id === pid) return
        setAnyoneRolling(true)
        if (broadcastAnimRef.current) clearInterval(broadcastAnimRef.current)
        let count = 0
        broadcastAnimRef.current = setInterval(() => {
          setDiceValue(Math.floor(Math.random() * 6) + 1)
          if (++count > 8) { clearInterval(broadcastAnimRef.current!); broadcastAnimRef.current = null }
        }, 80)
        if (anyoneRollingTimerRef.current) clearTimeout(anyoneRollingTimerRef.current)
        anyoneRollingTimerRef.current = setTimeout(() => setAnyoneRolling(false), 2000)
      })
      .on('broadcast', { event: 'rolled' }, ({ payload }: any) => {
        if (payload?.player_id === pid) return
        if (payload?.roll) setDiceValue(payload.roll)
        setAnyoneRolling(false)
        if (anyoneRollingTimerRef.current) clearTimeout(anyoneRollingTimerRef.current)
      })
      .on('broadcast', { event: 'game_starting' }, () => {
        setGameStarting(true)
        db.from('rooms').select('game_state, status, host_id').eq('id', roomId).single()
          .then(({ data }: {data: any}) => {
            if (data) { setGameState(data.game_state); setRoomStatus(data.status) }
          })
      })
      .subscribe()

    // Polling: ТОЛЬКО пока в лобби
    pollIntervalRef.current = setInterval(async () => {
      if (roomStatusRef.current !== 'lobby') {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        return
      }
      const { data } = await db.from('rooms').select('game_state, status').eq('id', roomId).single() as {data: any}
      if (data?.status === 'playing') {
        roomStatusRef.current = 'playing'
        setGameState(data.game_state)
        setRoomStatus('playing')
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      }
    }, 3000)

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(bcChannel)
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [roomId])
}
