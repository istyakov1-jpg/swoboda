import * as React from "react";
import { PhoneFrame, HomeIndicator } from "../chrome";
import { IconOpportunity } from "../icons";

/** Turn card — bottom sheet that pops over the feed on your turn. */
export function TurnCardScreen() {
  return (
    <PhoneFrame statusBar={false}>
      {/* dimmed feed behind */}
      <div className="pointer-events-none absolute inset-0 opacity-40 blur-[3px]">
        <div className="flex items-center gap-[11px] px-5 py-[120px]">
          <div className="h-[76px] w-[62px] rounded-[18px] border border-info/[0.28] bg-info/[0.12]" />
          <div className="h-[76px] w-[62px] rounded-[18px] border border-neg/30 bg-neg/[0.12]" />
          <div className="h-[76px] w-[62px] rounded-[18px] border border-pos/[0.32] bg-pos/[0.14]" />
          <div className="h-[76px] w-[62px] rounded-[18px] border border-warn/30 bg-warn/[0.12]" />
        </div>
      </div>
      <div className="absolute inset-0 bg-[#07070D]/55 backdrop-blur-[2px]" />

      {/* sheet */}
      <div className="relative z-[5] mt-auto rounded-t-[36px] border-t-2 border-pos/50 px-6 pb-[30px] pt-2.5 shadow-[0_-30px_80px_-20px_rgba(52,211,153,.4)] [background:linear-gradient(180deg,rgba(20,28,22,.96),rgba(11,11,19,.98))]">
        <div className="mx-auto mb-[22px] h-[5px] w-[44px] rounded-full bg-white/20" />
        <div className="flex items-center gap-[13px]">
          <div className="grid h-[60px] w-[60px] place-items-center rounded-[20px] border-[1.5px] border-pos/50 text-pos shadow-[0_0_24px_rgba(52,211,153,.4)] [background:linear-gradient(160deg,rgba(52,211,153,.35),rgba(52,211,153,.12))]">
            <IconOpportunity size={30} sw={2} />
          </div>
          <div>
            <div className="text-[12px] font-extrabold tracking-[2px] text-pos">
              ВОЗМОЖНОСТЬ
            </div>
            <div className="mt-[3px] text-[23px] font-extrabold tracking-[-.5px]">
              Квартира под аренду
            </div>
          </div>
        </div>

        <p className="mb-5 mt-[18px] text-[15px] font-medium leading-[1.55] text-body">
          «Двушка» у метро, жильцы уже стоят в очереди. Денег в кармане впритык,
          но такой пассив на дороге не валяется. Будешь брать или пройдёшь мимо
          своей мечты? 🐭
        </p>

        {/* financials */}
        <div className="mb-[22px] flex gap-[9px]">
          <div className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-[13px]">
            <div className="text-[11px] font-semibold text-faint">Цена</div>
            <div className="mt-1 text-[17px] font-extrabold">₽3.4М</div>
          </div>
          <div className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-[13px]">
            <div className="text-[11px] font-semibold text-faint">Взнос</div>
            <div className="mt-1 text-[17px] font-extrabold text-gold">
              ₽38 000
            </div>
          </div>
          <div className="flex-1 rounded-2xl border border-pos/[0.28] bg-pos/10 p-[13px]">
            <div className="text-[11px] font-semibold text-pos/80">Поток</div>
            <div className="mt-1 text-[17px] font-extrabold text-pos">
              +₽8 200
            </div>
          </div>
        </div>

        {/* buttons */}
        <div className="flex flex-col gap-2.5">
          <div className="green-grad flex items-center justify-center gap-[9px] rounded-[18px] p-[17px] text-[17px] font-extrabold text-[#0B130C] shadow-[0_16px_36px_-12px_rgba(52,211,153,.6)]">
            Купить
            <span className="text-[13px] font-bold opacity-70">· −₽38 000</span>
          </div>
          <div className="flex gap-2.5">
            <div className="flex-1 rounded-[18px] border border-gold/30 bg-gold/10 p-[15px] text-center text-[15px] font-bold text-gold">
              Торговаться
            </div>
            <div className="flex-1 rounded-[18px] border border-white/[0.08] bg-white/[0.05] p-[15px] text-center text-[15px] font-bold text-muted">
              Пас
            </div>
          </div>
        </div>
      </div>
      <HomeIndicator className="mt-3.5" />
    </PhoneFrame>
  );
}
