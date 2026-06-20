import * as React from "react";
import { PhoneFrame, HomeIndicator } from "../chrome";
import { IconTrophy, IconArrowRight } from "../icons";

const CONFETTI_COLORS = ["#F5B843", "#34D399", "#5B9DF9", "#A78BFA", "#FB6B6B", "#FBD37B"];

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 46 }).map((_, i) => {
        const left = Math.round((i * 53 + (i % 7) * 11) % 100);
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const w = 6 + (i % 4) * 2;
        const round = i % 3 === 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "-8%",
              left: `${left}%`,
              width: `${w}px`,
              height: `${round ? w : w * 1.7}px`,
              background: color,
              borderRadius: round ? "50%" : "2px",
              opacity: 0.9,
              transform: `rotate(${i * 37}deg)`,
              animation: `confFall ${3.2 + (i % 5) * 0.5}s linear ${(i % 9) * 0.28}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

export function VictoryScreen() {
  return (
    <PhoneFrame
      statusBar={false}
      glow="radial-gradient(520px 520px at 50% 38%,rgba(245,184,67,.32),transparent 60%),radial-gradient(700px 600px at 50% 100%,rgba(224,137,31,.2),transparent 65%)"
    >
      <Confetti />
      <div className="relative z-[3] flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="gold-grad grid h-[120px] w-[120px] animate-floaty place-items-center rounded-[36px] text-[#1A1206] shadow-[0_0_70px_rgba(245,184,67,.7),0_24px_60px_-16px_rgba(245,184,67,.6)]">
          <IconTrophy size={64} sw={1.7} />
        </div>
        <div className="mt-[30px] text-[13px] font-extrabold tracking-[3px] text-gold">
          ФИНАНСОВАЯ СВОБОДА
        </div>
        <div className="gold-text mt-3.5 text-[38px] font-extrabold leading-[1.05] tracking-[-1px]">
          ТЫ ВЫРВАЛСЯ
          <br />
          ИЗ МЫШИНОЙ
          <br />
          СУЕТЫ
        </div>
        <p className="mt-5 max-w-[280px] text-[16px] font-medium leading-[1.55] text-[#D8C28E]">
          Пассивный доход теперь больше расходов. Крысиные бега закончились — ты
          в большой игре.
        </p>

        <div className="mt-[26px] flex w-full gap-[11px]">
          <div className="flex-1 rounded-[18px] border border-gold/25 bg-white/[0.06] p-3.5 backdrop-blur-md">
            <div className="text-[11px] font-semibold text-gold-soft">Пассив</div>
            <div className="mt-[3px] text-[19px] font-extrabold text-gold">
              ₽31 200
            </div>
          </div>
          <div className="flex-1 rounded-[18px] border border-gold/25 bg-white/[0.06] p-3.5 backdrop-blur-md">
            <div className="text-[11px] font-semibold text-gold-soft">Расходы</div>
            <div className="mt-[3px] text-[19px] font-extrabold">₽22 400</div>
          </div>
          <div className="flex-1 rounded-[18px] border border-pos/35 bg-pos/[0.12] p-3.5 backdrop-blur-md">
            <div className="text-[11px] font-semibold text-pos/80">Запас</div>
            <div className="mt-[3px] text-[19px] font-extrabold text-pos">
              +39%
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-[3] px-7 pb-[30px]">
        <div className="gold-grad flex items-center justify-center gap-2.5 rounded-[20px] p-[18px] text-[17px] font-extrabold text-[#1A1206] shadow-[0_18px_44px_-12px_rgba(245,184,67,.7)]">
          Получить ИИ-разбор
          <IconArrowRight size={20} sw={2.6} />
        </div>
        <div className="mt-3 text-center text-[12px] font-semibold text-gold-soft">
          Партия №3 · 1-е место из 4
        </div>
      </div>
      <HomeIndicator />
    </PhoneFrame>
  );
}
