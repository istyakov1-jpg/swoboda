import * as React from "react";
import { PhoneFrame, HomeIndicator } from "../chrome";
import { IconBuilding, IconLock, IconCheck, IconTrophy } from "../icons";
import { bids } from "../data";

/* Phase 1 — asset announcement (flies in) */
export function AuctionAnnounceScreen() {
  return (
    <PhoneFrame glow="radial-gradient(500px 420px at 50% 42%,rgba(167,139,250,.20),transparent 62%)">
      <div className="relative z-[3] flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="text-[12px] font-extrabold tracking-[3px] text-violet">
          ЛОТ ВЫХОДИТ НА ТОРГИ
        </div>
        <div className="mt-7 w-[250px] animate-floaty">
          <div className="rounded-[30px] border-2 border-violet/50 p-[26px] text-center shadow-[0_34px_80px_-22px_rgba(167,139,250,.7),inset_0_1px_0_rgba(255,255,255,.18)] [background:linear-gradient(165deg,rgba(167,139,250,.30),rgba(167,139,250,.08))]">
            <div className="mx-auto grid h-[84px] w-[84px] place-items-center rounded-[24px] border border-violet/40 bg-violet/[0.18] text-[#C9B6FF]">
              <IconBuilding size={44} sw={1.7} />
            </div>
            <div className="mt-[18px] text-[22px] font-extrabold leading-tight tracking-[-.5px]">
              Сеть кофеен
              <br />
              «Зерно»
            </div>
            <div className="mt-2 text-[13px] font-semibold text-[#C9B6FF]">
              3 точки · поток +₽11 500/мес
            </div>
          </div>
        </div>
        <div className="mt-[30px]">
          <div className="text-[13px] font-semibold text-faint">
            Стартовая цена
          </div>
          <div className="mt-1 text-[32px] font-extrabold tracking-[-.5px] text-gold">
            ₽35 000
          </div>
        </div>
        <div className="mt-[26px] flex animate-glow items-center gap-[9px] rounded-[14px] border border-violet/40 bg-violet/[0.14] px-[18px] py-[13px]">
          <span className="h-[9px] w-[9px] rounded-full bg-violet shadow-[0_0_10px_#A78BFA]" />
          <span className="text-[14px] font-bold text-[#C9B6FF]">
            Ставки открываются через 3…
          </span>
        </div>
      </div>
      <HomeIndicator className="mb-[18px]" />
    </PhoneFrame>
  );
}

/* Phase 2 — sealed bid (slider + timer ring + participants) */
export function AuctionBidScreen() {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <PhoneFrame glow="radial-gradient(440px 320px at 50% 20%,rgba(167,139,250,.14),transparent 60%)">
      <div className="relative z-[3] flex flex-1 flex-col px-6 pt-[18px]">
        {/* timer */}
        <div className="mt-2 flex flex-col items-center">
          <div className="relative h-[120px] w-[120px]">
            <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
              <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="9" />
              <circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke="#A78BFA"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * 0.32}
                style={{ filter: "drop-shadow(0 0 8px rgba(167,139,250,.8))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[34px] font-extrabold">12</div>
              <div className="text-[11px] font-semibold text-faint">секунд</div>
            </div>
          </div>
          <div className="mt-3.5 text-[14px] font-bold text-body">
            Сеть кофеен «Зерно»
          </div>
        </div>

        {/* participants */}
        <div className="mt-[18px] flex items-center justify-center gap-2">
          <div className="flex">
            {[
              { i: "М", c: "#34D399" },
              { i: "Д", c: "#5B9DF9" },
              { i: "Р", c: "#A78BFA" },
            ].map((p, idx) => (
              <div
                key={p.i}
                className={`grid h-[30px] w-[30px] place-items-center rounded-full border-2 border-panel text-[12px] font-extrabold text-panel ${idx ? "-ml-2" : ""}`}
                style={{ background: p.c }}
              >
                {p.i}
              </div>
            ))}
            <div className="-ml-2 grid h-[30px] w-[30px] place-items-center rounded-full border-2 border-panel bg-white/10 text-[11px] font-bold text-body">
              +1
            </div>
          </div>
          <div className="text-[13px] font-semibold text-faint">
            5 игроков делают ставку
          </div>
        </div>

        {/* your bid */}
        <div className="mt-[26px] rounded-[24px] border border-white/[0.08] bg-white/[0.045] p-5 backdrop-blur-lg">
          <div className="flex items-center gap-[7px] text-[12px] font-semibold text-faint">
            <IconLock size={14} sw={2} />
            Твоя ставка скрыта от всех
          </div>
          <div className="mt-2.5 text-center text-[40px] font-extrabold tracking-[-1px] text-gold">
            ₽47 000
          </div>
          {/* slider */}
          <div className="relative mt-[18px] flex h-[30px] items-center">
            <div className="absolute left-0 right-0 h-2 rounded-full bg-white/[0.08]" />
            <div className="absolute left-0 h-2 w-[62%] rounded-full [background:linear-gradient(90deg,#E0891F,#F5B843)] shadow-[0_0_12px_rgba(245,184,67,.6)]" />
            <div className="absolute left-[62%] h-[26px] w-[26px] -translate-x-1/2 rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,.5),0_0_0_4px_rgba(245,184,67,.25)]" />
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-semibold text-dim">
            <span>₽35 000</span>
            <span>лимит ₽47 300</span>
          </div>
        </div>

        <div className="violet-grad mb-5 mt-auto flex items-center justify-center gap-[9px] rounded-[18px] p-[17px] text-[17px] font-extrabold text-panel shadow-[0_16px_36px_-12px_rgba(167,139,250,.6)]">
          Запечатать ставку
          <IconCheck size={20} sw={2.6} />
        </div>
      </div>
      <HomeIndicator className="mb-[18px]" />
    </PhoneFrame>
  );
}

/* Phase 3 — reveal */
export function AuctionRevealScreen() {
  return (
    <PhoneFrame glow="radial-gradient(440px 320px at 50% 14%,rgba(52,211,153,.14),transparent 60%)">
      <div className="relative z-[3] flex flex-1 flex-col px-6 pt-3.5">
        <div className="text-center text-[12px] font-extrabold tracking-[3px] text-pos">
          ВСКРЫТИЕ СТАВОК
        </div>
        <div className="mt-[7px] text-center text-[15px] font-bold text-body">
          Сеть кофеен «Зерно»
        </div>
        <div className="mt-6 flex flex-col gap-[11px]">
          {bids.map((b) => (
            <div
              key={b.n}
              className="flex items-center gap-[13px] rounded-[20px] border border-white/[0.08] bg-white/[0.045] px-4 py-[15px]"
            >
              <div
                className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-[14px] text-[17px] font-extrabold text-panel"
                style={{ background: b.cl }}
              >
                {b.i}
              </div>
              <div className="flex-1 text-[16px] font-bold">{b.n}</div>
              <div className="text-[18px] font-extrabold">{b.a}</div>
            </div>
          ))}
        </div>

        {/* winner */}
        <div className="mt-[18px] flex items-center gap-[13px] rounded-[22px] border-[1.5px] border-pos/50 p-[18px] shadow-[0_18px_40px_-16px_rgba(52,211,153,.5)] [background:linear-gradient(160deg,rgba(52,211,153,.25),rgba(52,211,153,.06))]">
          <div className="grid h-[48px] w-[48px] place-items-center rounded-[16px] border border-pos/50 bg-pos/20 text-pos">
            <IconTrophy size={26} sw={1.9} />
          </div>
          <div>
            <div className="text-[12px] font-extrabold tracking-[1px] text-pos">
              ПОБЕДИТЕЛЬ
            </div>
            <div className="mt-0.5 text-[19px] font-extrabold">
              Марина · ₽58 000
            </div>
          </div>
        </div>
        <div className="mt-3.5 text-center text-[13px] font-medium leading-[1.5] text-faint">
          Марина переплатила, но забрала пассив. А ты сохранил кэш — иногда это
          и есть победа.
        </div>
      </div>
      <HomeIndicator className="mb-[18px]" />
    </PhoneFrame>
  );
}
