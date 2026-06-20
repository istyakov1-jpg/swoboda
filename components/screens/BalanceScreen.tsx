import * as React from "react";
import { PhoneFrame, TabBar } from "../chrome";
import { IconTrendUp } from "../icons";
import { income, expense, assets, liabilities } from "../data";

function Row({
  l,
  v,
  valueClass = "text-hi",
}: {
  l: string;
  v: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between text-[12px] font-semibold">
      <span className="text-muted">{l}</span>
      <span className={`font-bold ${valueClass}`}>{v}</span>
    </div>
  );
}

export function BalanceScreen() {
  return (
    <PhoneFrame glow="radial-gradient(420px 280px at 50% -5%,rgba(245,184,67,.16),transparent 60%)">
      <div className="relative z-[3] flex flex-1 flex-col overflow-hidden px-[22px] pt-2">
        <div className="ml-0.5 mt-1.5 text-[24px] font-extrabold tracking-[-.5px]">
          Мой баланс
        </div>

        {/* hero cash */}
        <div className="mt-4 rounded-[24px] border border-gold/30 p-5 backdrop-blur-lg shadow-[0_18px_40px_-18px_rgba(245,184,67,.4)] [background:linear-gradient(160deg,rgba(245,184,67,.18),rgba(245,184,67,.04))]">
          <div className="text-[12px] font-semibold text-gold-soft">Наличные</div>
          <div className="gold-text mt-1 text-[38px] font-extrabold tracking-[-1px]">
            ₽47 300
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-[11px] border border-pos/30 bg-pos/[0.14] px-[11px] py-[7px] text-[14px] font-extrabold text-pos">
              <IconTrendUp size={15} sw={2.6} />
              +₽3 200/мес
            </div>
            <div className="text-[12px] font-semibold text-faint">
              денежный поток
            </div>
          </div>
        </div>

        {/* progress */}
        <div className="mt-4 rounded-[20px] border border-white/[0.08] bg-white/[0.045] px-[17px] py-4">
          <div className="mb-2.5 flex items-baseline justify-between">
            <span className="text-[14px] font-bold">До финансовой свободы</span>
            <span className="text-[20px] font-extrabold text-gold">64%</span>
          </div>
          <div className="h-[11px] overflow-hidden rounded-full bg-white/[0.07]">
            <div className="h-full w-[64%] rounded-full [background:linear-gradient(90deg,#E0891F,#F5B843,#FBD888)] shadow-[0_0_16px_rgba(245,184,67,.7)]" />
          </div>
          <div className="mt-[9px] text-[12px] font-semibold text-faint">
            Пассив ₽18 800 из нужных ₽29 400 расходов
          </div>
        </div>

        {/* income / expense */}
        <div className="mt-3.5 flex gap-[11px]">
          <div className="flex-1 rounded-[18px] border border-pos/20 bg-pos/[0.07] p-3.5">
            <div className="text-[12px] font-bold text-pos">Доходы</div>
            <div className="mt-[3px] text-[18px] font-extrabold text-pos">
              ₽30 800
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {income.map((r) => (
                <Row key={r.l} {...r} />
              ))}
            </div>
          </div>
          <div className="flex-1 rounded-[18px] border border-neg/20 bg-neg/[0.06] p-3.5">
            <div className="text-[12px] font-bold text-neg">Расходы</div>
            <div className="mt-[3px] text-[18px] font-extrabold text-neg">
              ₽22 400
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {expense.map((r) => (
                <Row key={r.l} {...r} />
              ))}
            </div>
          </div>
        </div>

        {/* assets / liabilities */}
        <div className="mt-[11px] flex gap-[11px]">
          <div className="flex-1 rounded-[18px] border border-white/[0.08] bg-white/[0.045] p-3.5">
            <div className="text-[12px] font-bold text-body">Активы</div>
            <div className="mt-[11px] flex flex-col gap-2">
              {assets.map((r) => (
                <Row key={r.l} {...r} valueClass="text-gold" />
              ))}
            </div>
          </div>
          <div className="flex-1 rounded-[18px] border border-white/[0.08] bg-white/[0.045] p-3.5">
            <div className="text-[12px] font-bold text-body">Пассивы</div>
            <div className="mt-[11px] flex flex-col gap-2">
              {liabilities.map((r) => (
                <Row key={r.l} {...r} valueClass="text-neg" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <TabBar active="balance" />
    </PhoneFrame>
  );
}
