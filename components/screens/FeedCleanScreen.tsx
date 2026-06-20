import * as React from "react";
import { PhoneFrame, TabBar } from "../chrome";
import {
  IconTrendUp,
  IconCoins,
  IconBars,
  IconBolt,
  IconOpportunity,
  IconEvent,
  IconGavel,
  IconDice,
} from "../icons";

/** Variant A — clean horizontal ribbon with current cell elevated. */
export function FeedCleanScreen() {
  return (
    <PhoneFrame glow="radial-gradient(440px 300px at 50% 38%,rgba(245,184,67,.10),transparent 60%)">
      <div className="relative z-[3] flex flex-1 flex-col overflow-hidden">
        {/* HUD */}
        <div className="flex items-center justify-between px-5 pt-2.5">
          <div className="flex items-center gap-[11px]">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px] bg-gold text-[17px] font-extrabold text-panel shadow-[0_0_0_2px_rgba(245,184,67,.3)]">
              А
            </div>
            <div>
              <div className="text-[14px] font-bold">Артём</div>
              <div className="text-[17px] font-extrabold tracking-[-.3px] text-gold">
                ₽47 300
              </div>
            </div>
          </div>
          <div className="flex items-center gap-[7px] rounded-[13px] border border-pos/30 bg-pos/[0.12] px-3 py-[9px]">
            <IconTrendUp size={16} sw={2.4} className="text-pos" />
            <div className="text-[14px] font-extrabold text-pos">
              +₽3 200
              <span className="text-[11px] font-semibold text-pos/70">/мес</span>
            </div>
          </div>
        </div>

        {/* progress */}
        <div className="mx-5 mt-[18px]">
          <div className="mb-[7px] flex justify-between text-[12px] font-semibold text-faint">
            <span>До финансовой свободы</span>
            <span className="font-extrabold text-gold">64%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
            <div className="h-full w-[64%] rounded-full [background:linear-gradient(90deg,#F5B843,#FBD888)] shadow-[0_0_14px_rgba(245,184,67,.6)]" />
          </div>
        </div>

        {/* ribbon */}
        <div className="relative mt-[30px] flex-1">
          <div className="absolute left-0 right-0 top-[96px] h-[2px] [background:linear-gradient(90deg,transparent,rgba(255,255,255,.10)_20%,rgba(255,255,255,.10)_80%,transparent)]" />
          <div className="relative flex h-[230px] items-center gap-[11px] overflow-hidden px-5">
            <Cell icon={<IconCoins size={22} />} label="Зарплата" tone="text-body" bg="bg-[#C7CBD6]/10 border-[#C7CBD6]/20" opacity="opacity-40" />
            <Cell icon={<IconBars size={22} />} label="Биржа" tone="text-info" bg="bg-info/[0.12] border-info/[0.28]" opacity="opacity-[0.55]" />
            <Cell icon={<IconBolt size={22} />} label="Удар" tone="text-neg" bg="bg-neg/[0.12] border-neg/30" opacity="opacity-70" />

            {/* CURRENT */}
            <div className="relative z-[3] w-[90px] shrink-0 text-center">
              <div className="mb-[9px] flex h-[26px] justify-center">
                <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-panel bg-gold text-[11px] font-extrabold text-panel">
                  А
                </div>
                <div className="-ml-2 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-panel bg-pos text-[11px] font-extrabold text-panel">
                  М
                </div>
              </div>
              <div className="flex h-[102px] animate-ring flex-col items-center justify-center gap-1.5 rounded-[24px] border-2 border-pos text-pos shadow-[0_16px_36px_-10px_rgba(52,211,153,.6)] [background:linear-gradient(160deg,rgba(52,211,153,.30),rgba(52,211,153,.10))]">
                <IconOpportunity size={30} sw={2} />
                <div className="text-[11px] font-extrabold">+ХОД</div>
              </div>
              <div className="mt-2 text-[11px] font-bold text-pos">
                Возможность
              </div>
            </div>

            <Cell icon={<IconEvent size={22} />} label="Событие" tone="text-warn" bg="bg-warn/[0.12] border-warn/30" />
            <Cell icon={<IconGavel size={22} />} label="Аукцион" tone="text-violet" bg="bg-violet/[0.14] border-violet/[0.32]" />
            <div className="w-[50px] shrink-0 opacity-50 text-center">
              <div className="h-[76px] rounded-[18px] border border-[#C7CBD6]/[0.16] bg-[#C7CBD6]/[0.08]" />
            </div>
          </div>

          {/* dice / action */}
          <div className="absolute bottom-1.5 left-5 right-5 flex items-center gap-3">
            <div className="flex flex-1 items-center gap-[11px] rounded-[18px] border border-white/[0.08] bg-white/[0.045] px-[15px] py-[13px]">
              <div className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-white text-[16px] font-extrabold text-panel">
                ⚂
              </div>
              <div className="text-[13px] font-semibold text-faint">
                Твой ход — брось кубик
              </div>
            </div>
            <div className="gold-grad grid h-[54px] w-[54px] place-items-center rounded-[18px] text-[#1A1206] shadow-[0_14px_30px_-10px_rgba(245,184,67,.6)]">
              <IconDice size={24} />
            </div>
          </div>
        </div>
      </div>
      <TabBar active="feed" />
    </PhoneFrame>
  );
}

function Cell({
  icon,
  label,
  tone,
  bg,
  opacity = "",
}: {
  icon: React.ReactNode;
  label?: string;
  tone: string;
  bg: string;
  opacity?: string;
}) {
  return (
    <div className={`w-[62px] shrink-0 text-center ${opacity}`}>
      <div
        className={`flex h-[76px] items-center justify-center rounded-[18px] border ${bg} ${tone}`}
      >
        {icon}
      </div>
      {label && (
        <div className="mt-[7px] text-[10px] font-semibold text-faint">
          {label}
        </div>
      )}
    </div>
  );
}
