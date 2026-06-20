import * as React from "react";
import { PhoneFrame, TabBar } from "../chrome";
import { IconBars, IconOpportunity, IconGavel, IconEvent, IconCoins, IconArrowRight } from "../icons";

/** Variant B — focus + depth: center cell large, neighbors scaled and faded. */
export function FeedDepthScreen() {
  return (
    <PhoneFrame glow="radial-gradient(460px 360px at 50% 46%,rgba(167,139,250,.16),transparent 62%)">
      <div className="relative z-[3] flex flex-1 flex-col overflow-hidden">
        {/* HUD */}
        <div className="flex items-center justify-between px-5 pt-2.5">
          <div className="flex items-center gap-[9px]">
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-gold text-[15px] font-extrabold text-panel">
              А
            </div>
            <div className="text-[17px] font-extrabold text-gold">₽47 300</div>
          </div>
          <div className="flex gap-[7px]">
            <div className="flex items-center rounded-[11px] border border-pos/30 bg-pos/[0.12] px-2.5 py-[7px] text-[13px] font-extrabold text-pos">
              +₽3 200
            </div>
            <div className="flex animate-glow items-center rounded-[11px] border border-gold/40 bg-gold/[0.14] px-[11px] py-[7px] text-[12px] font-extrabold text-gold">
              Твой ход
            </div>
          </div>
        </div>

        {/* perspective ribbon */}
        <div className="relative flex flex-1 flex-col items-center justify-center [perspective:900px]">
          <div className="absolute h-[280px] w-[280px] rounded-full blur-[20px] [background:radial-gradient(circle,rgba(167,139,250,.22),transparent_70%)]" />
          <div className="flex items-center gap-3.5 [transform-style:preserve-3d]">
            <div className="shrink-0 opacity-40 [transform:perspective(700px)_rotateY(34deg)_scale(.62)]">
              <div className="grid h-[96px] w-[74px] place-items-center rounded-[20px] border border-info/30 bg-info/[0.12] text-info">
                <IconBars size={26} />
              </div>
            </div>
            <div className="shrink-0 opacity-70 [transform:perspective(700px)_rotateY(20deg)_scale(.8)]">
              <div className="grid h-[110px] w-[80px] place-items-center rounded-[22px] border border-pos/[0.32] bg-pos/[0.14] text-pos">
                <IconOpportunity size={28} />
              </div>
            </div>

            {/* center hero */}
            <div className="relative z-[4] shrink-0 text-center">
              <div className="mb-[11px] flex justify-center">
                <div className="grid h-[30px] w-[30px] place-items-center rounded-full border-2 border-panel bg-gold text-[12px] font-extrabold text-panel">
                  А
                </div>
              </div>
              <div className="flex h-[172px] w-[138px] flex-col items-center justify-center gap-[11px] rounded-[30px] border-2 border-violet shadow-[0_26px_60px_-18px_rgba(167,139,250,.7),inset_0_1px_0_rgba(255,255,255,.18)] [background:linear-gradient(165deg,rgba(167,139,250,.40),rgba(167,139,250,.12))]">
                <div className="text-[11px] font-extrabold tracking-[2px] text-[#C9B6FF]">
                  АУКЦИОН
                </div>
                <IconGavel size={46} className="text-[#C9B6FF]" />
                <div className="text-[15px] font-extrabold text-white">
                  Лот на торгах
                </div>
              </div>
              <div className="mt-3.5 inline-flex items-center gap-[7px] rounded-xl border border-violet/40 bg-violet/[0.16] px-[13px] py-2 text-[12px] font-bold text-[#C9B6FF]">
                Ты попал на клетку аукциона
              </div>
            </div>

            <div className="shrink-0 opacity-70 [transform:perspective(700px)_rotateY(-20deg)_scale(.8)]">
              <div className="grid h-[110px] w-[80px] place-items-center rounded-[22px] border border-warn/[0.32] bg-warn/[0.13] text-warn">
                <IconEvent size={28} />
              </div>
            </div>
            <div className="shrink-0 opacity-40 [transform:perspective(700px)_rotateY(-34deg)_scale(.62)]">
              <div className="grid h-[96px] w-[74px] place-items-center rounded-[20px] border border-[#C7CBD6]/20 bg-[#C7CBD6]/10 text-body">
                <IconCoins size={26} />
              </div>
            </div>
          </div>

          {/* mini map */}
          <div className="mt-[38px] flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-info opacity-50" />
            <span className="h-1.5 w-1.5 rounded-full bg-pos opacity-60" />
            <span className="h-1.5 w-[22px] rounded-full bg-violet shadow-[0_0_10px_#A78BFA]" />
            <span className="h-1.5 w-1.5 rounded-full bg-warn opacity-60" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#C7CBD6] opacity-40" />
            <span className="ml-1.5 text-[11px] font-semibold text-dim">
              12 / 24
            </span>
          </div>
        </div>

        <div className="px-5 pb-3.5">
          <div className="violet-grad flex items-center justify-center gap-2.5 rounded-[20px] p-4 text-[16px] font-extrabold text-panel shadow-[0_18px_40px_-12px_rgba(167,139,250,.6)]">
            Войти в аукцион
            <IconArrowRight size={20} sw={2.6} />
          </div>
        </div>
      </div>
      <TabBar active="feed" />
    </PhoneFrame>
  );
}
