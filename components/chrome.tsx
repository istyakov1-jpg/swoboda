import * as React from "react";
import { IconLayers, IconWallet, IconPeople, IconList } from "./icons";

/* ------------------------------------------------------------------ */
/* Status bar (notch row): time + signal + battery                    */
/* ------------------------------------------------------------------ */
export function StatusBar() {
  return (
    <div className="relative z-[4] flex items-center justify-between px-[26px] pb-1.5 pt-[18px] text-[15px] font-bold text-hi">
      <span>9:41</span>
      <div className="flex h-[13px] items-end gap-1">
        <span className="h-[5px] w-[3px] rounded-[1px] bg-hi" />
        <span className="h-[8px] w-[3px] rounded-[1px] bg-hi" />
        <span className="h-[11px] w-[3px] rounded-[1px] bg-hi" />
        <span className="h-[13px] w-[3px] rounded-[1px] bg-hi" />
        <span className="ml-[5px] inline-block h-3 w-6 rounded-[3px] border-[1.5px] border-hi p-[1.5px]">
          <span className="block h-full w-[72%] rounded-[1px] bg-hi" />
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Notch + home indicator                                             */
/* ------------------------------------------------------------------ */
function Notch() {
  return (
    <div className="absolute left-1/2 top-[13px] z-[6] h-[30px] w-[118px] -translate-x-1/2 rounded-[18px] bg-black" />
  );
}

export function HomeIndicator({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative z-[6] mx-auto mb-[9px] h-[5px] w-[130px] rounded-full bg-white/25 ${className}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/* PhoneFrame: bezel + optional ambient glow + status bar             */
/* ------------------------------------------------------------------ */
export function PhoneFrame({
  children,
  glow,
  statusBar = true,
}: {
  children: React.ReactNode;
  /** CSS background string for the ambient glow layer behind content */
  glow?: string;
  statusBar?: boolean;
}) {
  return (
    <div className="relative flex h-[844px] w-[390px] flex-col overflow-hidden rounded-[48px] bg-panel shadow-[0_50px_100px_-40px_rgba(0,0,0,.85),0_0_0_1px_rgba(255,255,255,.06),inset_0_1px_0_rgba(255,255,255,.05)]">
      {glow && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: glow }}
        />
      )}
      <Notch />
      {statusBar && <StatusBar />}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bottom tab bar                                                     */
/* ------------------------------------------------------------------ */
type Tab = "feed" | "balance" | "players" | "log";

const TABS: { id: Tab; label: string; Icon: React.ComponentType<any> }[] = [
  { id: "feed", label: "Лента", Icon: IconLayers },
  { id: "balance", label: "Баланс", Icon: IconWallet },
  { id: "players", label: "Игроки", Icon: IconPeople },
  { id: "log", label: "Журнал", Icon: IconList },
];

export function TabBar({ active }: { active: Tab }) {
  return (
    <>
      <div className="relative z-[5] flex items-center justify-around border-t border-white/[0.07] bg-[#0A0A12]/70 px-3 pb-6 pt-[13px] backdrop-blur-xl">
        {TABS.map(({ id, label, Icon }) => {
          const on = id === active;
          return (
            <div
              key={id}
              className={`flex flex-col items-center gap-[5px] ${
                on ? "text-gold" : "text-dim"
              }`}
            >
              <Icon size={23} sw={2} />
              <span
                className={`text-[10px] ${on ? "font-bold" : "font-semibold"}`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <HomeIndicator className="-mt-3" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Frame wrapper for the gallery: label above a phone                 */
/* ------------------------------------------------------------------ */
export function Frame({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-[14px] font-bold text-muted">{label}</div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section header for the gallery                                     */
/* ------------------------------------------------------------------ */
export function Section({
  eyebrow,
  eyebrowColor = "text-gold",
  title,
  desc,
}: {
  eyebrow: string;
  eyebrowColor?: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="mx-auto mt-28 max-w-[1240px]">
      <div
        className={`text-[13px] font-extrabold uppercase tracking-[3px] ${eyebrowColor}`}
      >
        {eyebrow}
      </div>
      <h2 className="mb-1.5 mt-2.5 text-[34px] font-extrabold tracking-[-.5px]">
        {title}
      </h2>
      <p className="m-0 max-w-[600px] text-[16px] font-medium text-faint">
        {desc}
      </p>
    </div>
  );
}
