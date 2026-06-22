'use client'
import { useGameContext } from '../GameContext'

export default function LobbyView() {
  const {
    gameState,
    myPlayerId,
    onlinePlayers,
    isHost,
    copied,
    startingGame,
    gameStarting,
    copyCode,
    startGame,
    roomCode,
  } = useGameContext()

  const humanPlayers = (gameState?.players ?? []).filter((p: any) => !p.is_bot)
  const botPlayers   = (gameState?.players ?? []).filter((p: any) => p.is_bot)

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#07070D' }}>
      <div className="relative w-[390px] overflow-hidden rounded-[52px] border border-white/[0.08]"
        style={{ height: '100vh', maxHeight: '844px', background: 'radial-gradient(420px 300px at 80% -5%,rgba(245,184,67,.14),transparent 60%),radial-gradient(380px 320px at 0% 30%,rgba(167,139,250,.10),transparent 60%), #0B0B13' }}>
        <div className="flex h-full flex-col px-6 pt-14 pb-10">

          {/* Header */}
          <div className="mb-8">
            <div className="text-[13px] font-bold uppercase tracking-[2px] text-faint mb-1">Свобода</div>
            <div className="text-[28px] font-extrabold tracking-[-.5px]">Ожидание игроков</div>
            <div className="mt-1 text-[14px] text-faint">Поделись кодом с друзьями</div>
          </div>

          {/* Room code */}
          <button onClick={copyCode}
            className="mb-6 flex items-center justify-between rounded-[24px] border border-gold/30 px-6 py-5"
            style={{ background: 'linear-gradient(160deg,rgba(245,184,67,.14),rgba(245,184,67,.04))' }}>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[2px] text-gold/60 mb-1">Код комнаты</div>
              <div className="text-[40px] font-black tracking-[8px] text-gold leading-none">{roomCode}</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-gold/30 bg-gold/[0.14]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5B843" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {copied
                    ? <><path d="M20 6L9 17l-5-5"/></>
                    : <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>
                  }
                </svg>
              </div>
              <div className="text-[10px] font-bold text-gold/70">{copied ? 'Скопировано' : 'Копировать'}</div>
            </div>
          </button>

          {/* Players */}
          <div className="flex-1 overflow-y-auto">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[13px] font-bold text-body">За столом</div>
              <div className="text-[12px] text-faint">{humanPlayers.length + botPlayers.length} / 6</div>
            </div>

            <div className="flex flex-col gap-2">
              {humanPlayers.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.045] px-4 py-3">
                  <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] text-[22px]"
                    style={{ background: `${p.color}33`, border: `1.5px solid ${p.color}60` }}>
                    {p.avatar ?? p.initial ?? '?'}
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-bold">{p.name}</div>
                    <div className="text-[11px] text-faint">{p.id === myPlayerId ? 'Ты' : onlinePlayers.has(p.id) ? 'Онлайн' : 'Ожидает...'} · {p.profession?.name ?? '...'}</div>
                  </div>
                  <div className={`h-2 w-2 rounded-full ${onlinePlayers.has(p.id) ? 'bg-pos shadow-[0_0_6px_#34D399]' : 'bg-white/20'}`} />
                </div>
              ))}

              {botPlayers.length > 0 && (
                <div className="flex items-center gap-3 rounded-[18px] border border-violet/20 bg-violet/[0.06] px-4 py-3">
                  <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] text-[20px] border border-violet/30 bg-violet/[0.14]">🤖</div>
                  <div className="flex-1">
                    <div className="text-[14px] font-bold">{botPlayers.length} {botPlayers.length === 1 ? 'бот' : 'бота'}</div>
                    <div className="text-[11px] text-faint">{botPlayers.map((b: any) => b.name).join(', ')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6">
            {isHost ? (
              <button onPointerDown={startGame} disabled={startingGame}
                className="gold-grad flex w-full items-center justify-center gap-2 rounded-[20px] p-[17px] text-[17px] font-extrabold text-[#1A1206] active:scale-95 transition-transform disabled:opacity-70"
                style={{ boxShadow: '0 18px 40px -12px rgba(245,184,67,.65)' }}>
                {startingGame ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1A1206]/30 border-t-[#1A1206]" />
                    Запускаем...
                  </>
                ) : (
                  <>
                    Начать игру
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-3 rounded-[20px] border border-white/[0.08] bg-white/[0.04] p-[17px]">
                <div className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                <span className="text-[15px] font-semibold" style={{ color: gameStarting ? '#34D399' : undefined }}>
                  {gameStarting ? '🟢 Запускается...' : 'Ждём хоста...'}
                </span>
              </div>
            )}
            <div className="mt-3 text-center text-[12px] text-faint">
              Игра начнётся для всех одновременно
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
