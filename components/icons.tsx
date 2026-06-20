import * as React from "react";

/**
 * Custom line-icon set for the Свобода concept.
 * All icons inherit `currentColor` — set color via Tailwind text-* utilities
 * (e.g. <IconBolt className="text-neg" />). Tune weight with the `sw` prop.
 */

type IconProps = {
  size?: number;
  sw?: number;
  className?: string;
};

function Svg({
  size = 24,
  sw = 1.8,
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconArrowUp = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20V8" />
    <path d="M6 12l6-6 6 6" />
  </Svg>
);

export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);

export const IconShare = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="18" cy="5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="19" r="2.5" />
    <path d="M8.2 10.8 15.8 6.2M8.2 13.2l7.6 4.6" />
  </Svg>
);

export const IconBot = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="8" width="16" height="11" rx="3" />
    <path d="M12 8V5M9 13h.01M15 13h.01M8 5h8" />
  </Svg>
);

export const IconHome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 11 12 4l9 7" />
    <path d="M5 10v9h14v-9" />
    <path d="M3 19h18" />
  </Svg>
);

export const IconGlobe = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
  </Svg>
);

export const IconFork = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 11h14l-1 9H6z" />
    <path d="M9 11V7a3 3 0 0 1 6 0v4" />
  </Svg>
);

export const IconCoins = (p: IconProps) => (
  <Svg {...p}>
    <ellipse cx="12" cy="7" rx="7" ry="3" />
    <path d="M5 7v10c0 1.6 3.1 3 7 3s7-1.4 7-3V7" />
    <path d="M5 12c0 1.6 3.1 3 7 3s7-1.4 7-3" />
  </Svg>
);

export const IconBars = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-7" />
  </Svg>
);

export const IconTrendUp = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 18 9 12l4 3 7-8" />
    <path d="M14 7h6v6" />
  </Svg>
);

export const IconBolt = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
  </Svg>
);

export const IconOpportunity = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16V9M8.5 12.5 12 9l3.5 3.5" />
  </Svg>
);

export const IconEvent = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IconGavel = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 4l6 6-3 3-6-6z" />
    <path d="M11 7 4 14" />
    <path d="M3 21h10" />
  </Svg>
);

export const IconWallet = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="6" width="18" height="13" rx="3" />
    <path d="M3 10h18M7 15h4" />
  </Svg>
);

export const IconBuilding = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h16M6 20V9l6-4 6 4v11M10 20v-5h4v5" />
    <circle cx="12" cy="10" r="1.4" />
  </Svg>
);

export const IconBank = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-5h6v5" />
  </Svg>
);

export const IconDice = (p: IconProps) => (
  <Svg {...p} sw={p.sw ?? 2.2}>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <circle cx="9" cy="9" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15" cy="15" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="9" cy="15" r="1.3" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconTrophy = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 19h6M10 14v5M14 14v5" />
  </Svg>
);

export const IconBulb = (p: IconProps) => (
  <Svg {...p} sw={p.sw ?? 2}>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z" />
  </Svg>
);

export const IconLock = (p: IconProps) => (
  <Svg {...p} sw={p.sw ?? 2}>
    <rect x="4" y="10" width="16" height="11" rx="3" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Svg>
);

export const IconAiSpark = (p: IconProps) => (
  <Svg {...p} sw={p.sw ?? 2}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 8v8M8 12h8" />
  </Svg>
);

export const IconUpload = (p: IconProps) => (
  <Svg {...p} sw={p.sw ?? 2.2}>
    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
  </Svg>
);

export const IconDownload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v12M8 11l4 4 4-4M5 21h14" />
  </Svg>
);

/* Tab bar */
export const IconLayers = (p: IconProps) => (
  <Svg {...p} sw={p.sw ?? 2}>
    <rect x="3" y="5" width="5" height="14" rx="2" />
    <rect x="10" y="5" width="5" height="14" rx="2" />
    <rect x="17" y="5" width="4" height="14" rx="2" />
  </Svg>
);

export const IconPeople = (p: IconProps) => (
  <Svg {...p} sw={p.sw ?? 2}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" />
    <circle cx="17" cy="8" r="2.4" />
    <path d="M16 14c2.5.3 5 2 5 5" />
  </Svg>
);

export const IconList = (p: IconProps) => (
  <Svg {...p} sw={p.sw ?? 2}>
    <path d="M5 4h14v16H5z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Svg>
);

/* ── Новые иконки для игровых событий ─────────────────────────── */

// 💵 Зарплата / доход
export const IconSalary = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v2M12 19v2M5.6 5.6l1.4 1.4M16.9 16.9l1.4 1.4M3 12h2M19 12h2M5.6 18.4l1.4-1.4M16.9 7.1l1.4-1.4" />
    <circle cx="12" cy="12" r="4" />
    <path d="M10.5 10.5C11 10 11.5 9.8 12 9.8c1 0 1.8.7 1.8 1.6 0 1.4-1.8 2.1-1.8 3.2M12 15.5v.5" />
  </Svg>
);

// 💰 Продажа / прибыль
export const IconSell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20V8M6 14l6-6 6 6" />
    <circle cx="12" cy="22" r="1" fill="currentColor" stroke="none" />
    <path d="M4 6h16" />
  </Svg>
);

// 💥 Удар
export const IconHit = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
  </Svg>
);

// ✅ Погашение долга
export const IconRepay = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" />
    <path d="M4 21h16" />
  </Svg>
);

// 🏦 Кредит / банк
export const IconCredit = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 10h18M5 10V20h14V10M12 3l9 7H3z" />
    <path d="M9 14h6M9 17h4" />
  </Svg>
);

// 🚀 Финансовая свобода
export const IconFreedom = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21V17M12 3c0 0-6 4-6 9a6 6 0 0 0 12 0c0-5-6-9-6-9z" />
    <path d="M9 17h6" />
    <circle cx="12" cy="12" r="2" />
  </Svg>
);

// 👶 Ребёнок / жизнь
export const IconBaby = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="6" r="3" />
    <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
    <path d="M9 10.5c1 .7 2 1 3 1s2-.3 3-1" />
  </Svg>
);

// ✨ Благотворительность / сердце со звездой
export const IconCharity = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20.5S3 15 3 8.5a4.5 4.5 0 0 1 9 0 4.5 4.5 0 0 1 9 0C21 15 12 20.5 12 20.5z" />
    <path d="M12 7l1 2.5 2.5 1-2.5 1L12 14l-1-2.5L8.5 10.5l2.5-1z" />
  </Svg>
);

// ☠️ Банкротство / черепок
export const IconSkull = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4a7 7 0 0 0-7 7c0 2.5 1.3 4.7 3.3 6v2a.7.7 0 0 0 .7.7h6a.7.7 0 0 0 .7-.7v-2c2-1.3 3.3-3.5 3.3-6a7 7 0 0 0-7-7z" />
    <path d="M9 17h6M9.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM14.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
  </Svg>
);

// 🚨 Тревога / кризис
export const IconAlert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.3 3.3 2 19h20L13.7 3.3a2 2 0 0 0-3.4 0z" />
    <path d="M12 10v4M12 17v1" />
  </Svg>
);

// ⏰ Таймер / время
export const IconTimer = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l3 2" />
    <path d="M9 3h6M12 3v2" />
  </Svg>
);

// 📢 Торги / мегафон
export const IconMegaphone = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 9H5l-2 5h16z" />
    <path d="M5 9V5l14 4M5 14v4l4-1" />
  </Svg>
);

// 🎲 Кубик
export const IconDie = (p: IconProps) => (
  <Svg {...p} sw={p.sw ?? 2}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </Svg>
);

// ⚙️ Настройки
export const IconSettings = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </Svg>
);

// 📊 Аналитика / портфель
export const IconAnalytics = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20V12M9 20V7M14 20V14M19 20V4" />
    <path d="M2 20h20" />
  </Svg>
);

// 📋 ДДС / список
export const IconDDS = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M8 11h3M8 15h5M8 19h8" />
    <path d="M15 11l1.5 1.5L19 9" />
  </Svg>
);

// 💼 Сделка
export const IconDeal = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M8 8V6a4 4 0 0 1 8 0v2" />
    <path d="M3 13h18" />
  </Svg>
);

// 🤝 Предложение о покупке / рукопожатие
export const IconHandshake = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 12h4l3-8 4 16 3-8h6" />
  </Svg>
);

// 📰 Новость / событие
export const IconNews = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 4h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M8 8h8M8 12h8M8 16h5" />
    <path d="M4 4v2" />
  </Svg>
);

/** Вспомогательная функция — SVG-иконка для подстановки вместо эмодзи */
export function GameIcon({ type, size = 18, color }: { type: string; size?: number; color?: string }) {
  const p = { size, className: '', style: { color: color ?? 'currentColor' } } as any;
  switch (type) {
    case 'salary':      return <IconSalary {...p} />;
    case 'sell':        return <IconSell {...p} />;
    case 'buy':         return <IconDeal {...p} />;
    case 'hit':         return <IconHit {...p} />;
    case 'repay':       return <IconRepay {...p} />;
    case 'credit':      return <IconCredit {...p} />;
    case 'freedom':     return <IconFreedom {...p} />;
    case 'child':       return <IconBaby {...p} />;
    case 'charity':     return <IconCharity {...p} />;
    case 'bankrupt':    return <IconSkull {...p} />;
    case 'alert':       return <IconAlert {...p} />;
    case 'timer':       return <IconTimer {...p} />;
    case 'auction_win': return <IconGavel {...p} />;
    case 'auction_lose':return <IconMegaphone {...p} />;
    case 'roll':        return <IconDie {...p} />;
    case 'event':       return <IconNews {...p} />;
    case 'trophy':      return <IconTrophy {...p} />;
    case 'settings':    return <IconSettings {...p} />;
    case 'analytics':   return <IconAnalytics {...p} />;
    case 'dds':         return <IconDDS {...p} />;
    case 'handshake':   return <IconHandshake {...p} />;
    default:            return <IconBolt {...p} />;
  }
}
