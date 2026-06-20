import * as React from "react";
import { IconArrowUp } from "../icons";

/** Share card — 9:16 story format for social. Not a phone frame. */
export function ShareCard() {
  return (
    <div className="flex h-[640px] w-[360px] flex-col overflow-hidden rounded-[32px] p-[34px_30px] shadow-[0_50px_100px_-40px_rgba(0,0,0,.85),0_0_0_1px_rgba(255,255,255,.06)] [background:radial-gradient(420px_360px_at_50%_16%,rgba(245,184,67,.3),transparent_60%),radial-gradient(420px_400px_at_50%_100%,rgba(167,139,250,.24),transparent_62%),#0B0B13]">
      <div className="flex items-center gap-[9px]">
        <div className="gold-grad grid h-[30px] w-[30px] place-items-center rounded-[9px] text-[#1A1206]">
          <IconArrowUp size={16} sw={2.6} />
        </div>
        <div className="text-[14px] font-extrabold tracking-[1.5px]">
          СВОБОДА<span className="text-gold">.</span>
        </div>
      </div>

      <div className="mt-[34px] text-[12px] font-extrabold tracking-[3px] text-gold">
        МОЙ ФИН-ПРОФИЛЬ
      </div>
      <div className="gold-text mt-3 text-[40px] font-extrabold leading-[1.02] tracking-[-1.2px]">
        Стратег-
        <br />
        накопитель
      </div>

      <div className="mt-[18px] flex flex-wrap gap-[9px]">
        {[
          ["Терпеливый", "text-pos", "border-pos/30 bg-pos/[0.14]"],
          ["Дисциплина", "text-gold", "border-gold/30 bg-gold/[0.14]"],
          ["Расчёт", "text-violet", "border-violet/30 bg-violet/[0.14]"],
        ].map(([label, color, bg]) => (
          <span
            key={label}
            className={`rounded-full border px-[13px] py-2 text-[12px] font-bold ${color} ${bg}`}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="mt-auto flex gap-[11px]">
        <div className="flex-1 rounded-[18px] border border-white/[0.12] bg-white/[0.06] p-[15px] backdrop-blur-md">
          <div className="text-[28px] font-extrabold text-gold">74</div>
          <div className="mt-0.5 text-[11px] font-semibold text-gold-soft">
            фин-IQ
          </div>
        </div>
        <div className="flex-1 rounded-[18px] border border-white/[0.12] bg-white/[0.06] p-[15px] backdrop-blur-md">
          <div className="text-[28px] font-extrabold">
            1<span className="text-[16px] text-faint">место</span>
          </div>
          <div className="mt-0.5 text-[11px] font-semibold text-faint">
            из 4 игроков
          </div>
        </div>
      </div>

      <div className="mt-4 text-[13px] font-semibold leading-[1.5] text-[#D8C28E]">
        «Вырвался из мышиной суеты за 3 партии. А ты сможешь?»
      </div>
      <div className="gold-grad mt-[18px] flex items-center justify-center gap-2 rounded-[16px] p-3.5 text-[14px] font-extrabold text-[#1A1206]">
        Сыграть · svoboda.game
      </div>
    </div>
  );
}
