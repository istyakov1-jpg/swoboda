import * as React from "react";
import { PhoneFrame, HomeIndicator } from "../chrome";
import { IconAiSpark, IconBank, IconBulb, IconUpload, IconDownload, IconShare } from "../icons";

/* ----------------------------------------------------------------- */
/* Variant A — narrative report                                       */
/* ----------------------------------------------------------------- */
export function AiReportScreen() {
  return (
    <PhoneFrame glow="radial-gradient(420px 280px at 50% -5%,rgba(91,157,249,.14),transparent 60%)">
      <div className="relative z-[3] flex flex-1 flex-col overflow-hidden px-[22px] pt-2">
        <div className="ml-0.5 mt-1 flex items-center gap-2 text-[12px] font-bold text-info">
          <IconAiSpark size={16} sw={2} />
          РАЗБОР ОТ ИИ
        </div>
        <div className="ml-0.5 mt-[9px] text-[25px] font-extrabold tracking-[-.5px]">
          Твой финансовый профиль
        </div>

        {/* archetype */}
        <div className="mt-4 flex items-center gap-3.5 rounded-[22px] border border-info/[0.34] p-[18px] [background:linear-gradient(150deg,rgba(91,157,249,.22),rgba(167,139,250,.12))]">
          <div className="grid h-[54px] w-[54px] place-items-center rounded-[18px] border border-info/[0.45] bg-info/20 text-[#9CC2FF]">
            <IconBank size={28} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#9CC2FF]">Архетип</div>
            <div className="text-[20px] font-extrabold tracking-[-.3px]">
              Стратег-накопитель
            </div>
          </div>
        </div>

        {/* trait chips */}
        <div className="mt-3.5 flex flex-wrap gap-2">
          {[
            ["Терпеливый", "text-pos", "border-pos/30 bg-pos/[0.12]"],
            ["Расчётливый", "text-gold", "border-gold/30 bg-gold/[0.12]"],
            ["Осторожный", "text-neg", "border-neg/30 bg-neg/[0.12]"],
            ["Дисциплина", "text-violet", "border-violet/30 bg-violet/[0.12]"],
          ].map(([label, color, bg]) => (
            <span
              key={label}
              className={`rounded-full border px-[13px] py-2 text-[12px] font-bold ${color} ${bg}`}
            >
              {label}
            </span>
          ))}
        </div>

        {/* strengths */}
        <div className="mt-4 rounded-[18px] border border-pos/20 bg-pos/[0.06] p-[15px]">
          <div className="mb-[9px] text-[13px] font-bold text-pos">
            Сильные стороны
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-[9px] text-[13px] font-medium text-[#D6E8DD]">
              <span className="text-pos">↗</span>Не покупаешь на эмоциях — ждёшь
              выгодную цену
            </div>
            <div className="flex gap-[9px] text-[13px] font-medium text-[#D6E8DD]">
              <span className="text-pos">↗</span>Держишь подушку наличных под
              удар
            </div>
          </div>
        </div>

        {/* weaknesses */}
        <div className="mt-[11px] rounded-[18px] border border-neg/20 bg-neg/[0.06] p-[15px]">
          <div className="mb-[9px] text-[13px] font-bold text-neg">
            Зоны роста
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-[9px] text-[13px] font-medium text-[#EAD3D3]">
              <span className="text-neg">↘</span>Дважды упустил пассив из-за
              страха переплатить
            </div>
            <div className="flex gap-[9px] text-[13px] font-medium text-[#EAD3D3]">
              <span className="text-neg">↘</span>Редко идёшь в аукционы —
              теряешь рост
            </div>
          </div>
        </div>

        {/* parallel */}
        <div className="mt-[11px] rounded-[18px] border border-white/[0.08] bg-white/[0.045] p-[15px]">
          <div className="mb-1.5 text-[13px] font-bold text-body">
            Параллель с реальным бизнесом
          </div>
          <div className="text-[13px] font-medium leading-[1.5] text-muted">
            Ты — основатель, который растит компанию на свои. Стабильно, но
            конкуренты с привлечённым капиталом обгоняют на поворотах.
          </div>
        </div>

        {/* main reco */}
        <div className="mt-[11px] rounded-[20px] border-[1.5px] border-gold/[0.45] p-[17px] shadow-[0_14px_34px_-16px_rgba(245,184,67,.5)] [background:linear-gradient(150deg,rgba(245,184,67,.22),rgba(245,184,67,.06))]">
          <div className="flex items-center gap-2 text-[12px] font-bold text-gold">
            <IconBulb size={16} sw={2} />
            ГЛАВНАЯ РЕКОМЕНДАЦИЯ
          </div>
          <div className="mt-[9px] text-[16px] font-bold leading-[1.4]">
            Возьми один управляемый риск в квартал. Твоя дисциплина выдержит —
            не хватает только смелости масштаба.
          </div>
        </div>
      </div>

      {/* footer actions */}
      <div className="relative z-[4] px-[22px] pb-[22px] pt-3 [background:linear-gradient(to_top,#0B0B13_70%,transparent)]">
        <div className="flex gap-2.5">
          <div className="gold-grad flex flex-1 items-center justify-center gap-[9px] rounded-[18px] p-[15px] text-[15px] font-extrabold text-[#1A1206] shadow-[0_14px_32px_-12px_rgba(245,184,67,.6)]">
            <IconUpload size={18} sw={2.4} />В сторис
          </div>
          <div className="grid w-[54px] place-items-center rounded-[18px] border border-white/10 bg-white/[0.06] text-body">
            <IconDownload size={20} />
          </div>
        </div>
      </div>
      <HomeIndicator className="-mt-2.5" />
    </PhoneFrame>
  );
}

/* ----------------------------------------------------------------- */
/* Variant B — trait dashboard with score                             */
/* ----------------------------------------------------------------- */
function Meter({
  label,
  value,
  scoreClass,
  barClass,
  width,
}: {
  label: string;
  value: string;
  scoreClass: string;
  barClass: string;
  width: string;
}) {
  return (
    <div>
      <div className="mb-[7px] flex justify-between text-[13px] font-bold">
        <span>{label}</span>
        <span className={scoreClass}>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.07]">
        <div className={`h-full rounded-full ${barClass}`} style={{ width }} />
      </div>
    </div>
  );
}

export function AiReportDashboardScreen() {
  const r = 60;
  const c = 2 * Math.PI * r;
  return (
    <PhoneFrame glow="radial-gradient(420px 300px at 50% 18%,rgba(167,139,250,.16),transparent 60%)">
      <div className="relative z-[3] flex flex-1 flex-col overflow-hidden px-[22px] pt-2">
        {/* score ring */}
        <div className="mt-2.5 flex flex-col items-center">
          <div className="relative h-[140px] w-[140px]">
            <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
              <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="11" />
              <circle
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * 0.26}
                style={{ filter: "drop-shadow(0 0 8px rgba(245,184,67,.6))" }}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#A78BFA" />
                  <stop offset="1" stopColor="#F5B843" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[36px] font-extrabold tracking-[-1px]">74</div>
              <div className="text-[11px] font-semibold text-faint">фин-IQ</div>
            </div>
          </div>
          <div className="mt-3.5 text-[21px] font-extrabold tracking-[-.3px]">
            Стратег-накопитель
          </div>
          <div className="mt-1 text-[13px] font-semibold text-faint">
            обгоняет 68% игроков
          </div>
        </div>

        {/* meters */}
        <div className="mt-6 flex flex-col gap-[13px]">
          <Meter label="Дисциплина" value="9 / 10" scoreClass="text-pos" barClass="[background:linear-gradient(90deg,#34D399,#5CE7A8)]" width="90%" />
          <Meter label="Расчётливость" value="8 / 10" scoreClass="text-gold" barClass="[background:linear-gradient(90deg,#E0891F,#F5B843)]" width="80%" />
          <Meter label="Аппетит к риску" value="4 / 10" scoreClass="text-neg" barClass="[background:linear-gradient(90deg,#C2474C,#FB6B6B)]" width="40%" />
          <Meter label="Скорость решений" value="6 / 10" scoreClass="text-violet" barClass="[background:linear-gradient(90deg,#8B6FE8,#A78BFA)]" width="60%" />
        </div>

        {/* reco */}
        <div className="mt-5 rounded-[20px] border-[1.5px] border-gold/[0.45] p-4 [background:linear-gradient(150deg,rgba(245,184,67,.2),rgba(245,184,67,.05))]">
          <div className="text-[12px] font-bold text-gold">
            ЧТО ИЗМЕНИТЬ В ЖИЗНИ
          </div>
          <div className="mt-2 text-[15px] font-bold leading-[1.42]">
            Твоя сила — терпение. Слабость — низкий аппетит к риску. Начни
            выделять 10% капитала на «смелые» ставки.
          </div>
        </div>
      </div>

      <div className="relative z-[4] px-[22px] pb-[22px] pt-3">
        <div className="gold-grad flex items-center justify-center gap-[9px] rounded-[18px] p-4 text-[16px] font-extrabold text-[#1A1206] shadow-[0_14px_32px_-12px_rgba(245,184,67,.6)]">
          Поделиться профилем
          <IconShare size={18} sw={2.4} />
        </div>
      </div>
      <HomeIndicator className="-mt-2.5" />
    </PhoneFrame>
  );
}
