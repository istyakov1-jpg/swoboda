import * as React from "react";
import { PhoneFrame, HomeIndicator } from "../chrome";
import {
  IconArrowUp,
  IconShare,
  IconBot,
  IconHome,
  IconGlobe,
  IconFork,
  IconCheck,
  IconArrowRight,
} from "../icons";
import { players } from "../data";

export function LobbyScreen() {
  return (
    <PhoneFrame glow="radial-gradient(420px 300px at 80% -5%,rgba(245,184,67,.14),transparent 60%),radial-gradient(380px 320px at 0% 30%,rgba(167,139,250,.10),transparent 60%)">
      {/* content */}
      <div className="relative z-[3] flex flex-1 flex-col overflow-hidden px-[22px] pt-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[26px] font-extrabold tracking-[-.5px]">
              Новая игра
            </div>
            <div className="mt-1.5 flex items-center gap-[7px] text-[13px] font-semibold text-faint">
              <span className="inline-block h-[7px] w-[7px] rounded-full bg-pos shadow-[0_0_8px_#34D399]" />
              Комната ·{" "}
              <span className="tracking-[2px] text-gold">RX7K2</span>
            </div>
          </div>
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.06] text-body">
            <IconShare size={20} sw={2} />
          </div>
        </div>

        {/* segmented */}
        <div className="mt-[18px] flex gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.05] p-1">
          <div className="gold-grad flex-1 rounded-xl py-[11px] text-center text-[14px] font-bold text-[#1A1206] shadow-[0_8px_20px_-8px_rgba(245,184,67,.6)]">
            Создать
          </div>
          <div className="flex-1 rounded-xl py-[11px] text-center text-[14px] font-bold text-muted">
            Присоединиться
          </div>
        </div>

        {/* players */}
        <div className="mb-3 ml-0.5 mr-0.5 mt-5 flex items-center justify-between">
          <div className="text-[14px] font-bold text-body">За столом</div>
          <div className="text-[12px] font-semibold text-faint">4 / 6</div>
        </div>
        <div className="flex flex-col gap-[9px]">
          {players.map((p) => (
            <div
              key={p.n}
              className="flex items-center gap-[13px] rounded-[18px] border border-white/[0.08] bg-white/[0.045] p-[11px_13px] backdrop-blur-lg"
            >
              <div
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] text-[17px] font-extrabold text-panel"
                style={{ background: p.cl }}
              >
                {p.i}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold">{p.n}</div>
                <div className="mt-0.5 text-[12px] font-semibold text-faint">
                  {p.s}
                </div>
              </div>
              <div className="h-[9px] w-[9px] rounded-full bg-pos shadow-[0_0_8px_rgba(52,211,153,.8)]" />
            </div>
          ))}
          <div className="flex items-center gap-[13px] rounded-[18px] border-[1.5px] border-dashed border-white/[0.14] p-[11px_13px]">
            <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] border border-violet/30 bg-violet/[0.14] text-violet">
              <IconBot size={20} sw={2} />
            </div>
            <div className="flex-1 text-[14px] font-bold text-violet">
              + Добавить бота
            </div>
            <div className="text-[12px] font-semibold text-faint">⌄</div>
          </div>
        </div>

        {/* dream */}
        <div className="ml-0.5 mr-0.5 mb-[11px] mt-5 text-[14px] font-bold text-body">
          Твоя мечта
        </div>
        <div className="-mx-[22px] flex gap-[11px] overflow-hidden px-[22px]">
          <div className="relative w-[140px] shrink-0 rounded-[20px] border-[1.5px] border-gold/55 p-[15px] shadow-[0_14px_30px_-14px_rgba(245,184,67,.5)] [background:linear-gradient(160deg,rgba(245,184,67,.20),rgba(245,184,67,.05))]">
            <div className="absolute right-[11px] top-[11px] flex h-5 w-5 items-center justify-center rounded-full bg-gold text-panel">
              <IconCheck size={12} sw={3.5} />
            </div>
            <IconHome size={30} className="text-gold" />
            <div className="mt-3.5 text-[15px] font-extrabold leading-tight">
              Дом на берегу Байкала
            </div>
            <div className="mt-[5px] text-[12px] font-semibold text-gold-soft">
              пассив ₽220К/мес
            </div>
          </div>
          <div className="w-[140px] shrink-0 rounded-[20px] border border-white/[0.08] bg-white/[0.045] p-[15px]">
            <IconGlobe size={30} className="text-info" />
            <div className="mt-3.5 text-[15px] font-extrabold leading-tight text-body">
              Кругосветка всей семьёй
            </div>
            <div className="mt-[5px] text-[12px] font-semibold text-faint">
              пассив ₽180К/мес
            </div>
          </div>
          <div className="w-[120px] shrink-0 rounded-[20px] border border-white/[0.08] bg-white/[0.045] p-[15px]">
            <IconFork size={30} className="text-pos" />
            <div className="mt-3.5 text-[15px] font-extrabold leading-tight text-body">
              Свой ресторан
            </div>
          </div>
        </div>
      </div>

      {/* start CTA */}
      <div className="relative z-[4] px-[22px] pb-[26px] pt-3.5 [background:linear-gradient(to_top,#0B0B13_60%,transparent)]">
        <div className="gold-grad flex items-center justify-center gap-2.5 rounded-[20px] p-[17px] text-[17px] font-extrabold text-[#1A1206] shadow-[0_18px_40px_-12px_rgba(245,184,67,.65)]">
          Начать игру
          <IconArrowRight size={20} sw={2.6} />
        </div>
        <div className="mt-[11px] text-center text-[12px] font-semibold text-faint">
          Все 4 игрока готовы · бот возьмёт ход за 5 сек
        </div>
      </div>
      <HomeIndicator />
    </PhoneFrame>
  );
}
