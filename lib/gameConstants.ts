// Game constants extracted from page.tsx

export const CELL_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  salary:      { color: 'text-body',   bg: 'bg-[#C7CBD6]/10',  border: 'border-[#C7CBD6]/20', label: 'Зарплата' },
  opportunity: { color: 'text-pos',    bg: 'bg-pos/[0.12]',    border: 'border-pos/[0.32]',   label: 'Сделка' },
  hit:         { color: 'text-neg',    bg: 'bg-neg/[0.12]',    border: 'border-neg/30',        label: 'Удар' },
  market:      { color: 'text-info',   bg: 'bg-info/[0.12]',   border: 'border-info/[0.28]',  label: 'Биржа' },
  event:       { color: 'text-warn',   bg: 'bg-warn/[0.12]',   border: 'border-warn/30',       label: 'Событие' },
  auction:     { color: 'text-violet', bg: 'bg-violet/[0.14]', border: 'border-violet/[0.32]', label: 'Аукцион' },
  child:       { color: 'text-gold',   bg: 'bg-gold/[0.12]',   border: 'border-gold/30',       label: 'Жизнь' },
  charity:     { color: 'text-[#E8A2C8]', bg: 'bg-[#E8A2C8]/[0.12]', border: 'border-[#E8A2C8]/30', label: 'Благотворительность' },
}

// Note: CELL_ICONS uses JSX so it stays in page.tsx (needs React)
// It is re-exported here as a reference for consumers that import from gameConstants

export const EV_CFG: Record<string,{icon:string,label:string,color:string,global?:boolean}> = {
  roll:        { icon:'die',       label:'Ход',        color:'rgba(255,255,255,0.5)' },
  buy:         { icon:'buy',       label:'Покупка',    color:'#34D399' },
  sell:        { icon:'sell',      label:'Продажа',    color:'#F5B843' },
  salary:      { icon:'salary',    label:'Зарплата',   color:'#34D399' },
  hit:         { icon:'hit',       label:'Удар',       color:'#F87171' },
  event:       { icon:'event',     label:'Событие',    color:'#A78BFA', global:true },
  credit:      { icon:'credit',    label:'Кредит',     color:'#60A5FA' },
  repay:       { icon:'repay',     label:'Погашение',  color:'#34D399' },
  freedom:     { icon:'freedom',   label:'Свобода!',   color:'#FBD888', global:true },
  auction_win: { icon:'trophy',    label:'Аукцион',    color:'#F59E0B', global:true },
  child:       { icon:'child',     label:'Ребёнок',    color:'#F5B843', global:true },
}

export const sounds = {
  dice:    () => { try { const a = new AudioContext(); const o = a.createOscillator(); const g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.setValueAtTime(300,a.currentTime); o.frequency.exponentialRampToValueAtTime(150,a.currentTime+0.1); g.gain.setValueAtTime(0.3,a.currentTime); g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.15); o.start(); o.stop(a.currentTime+0.15); } catch(e) {} },
  buy:     () => { try { const a = new AudioContext(); const o = a.createOscillator(); const g = a.createGain(); o.type='sine'; o.connect(g); g.connect(a.destination); [523,659,784].forEach((f,i)=>o.frequency.setValueAtTime(f,a.currentTime+i*0.1)); g.gain.setValueAtTime(0.2,a.currentTime); g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.4); o.start(); o.stop(a.currentTime+0.4); } catch(e) {} },
  salary:  () => { try { const a = new AudioContext(); const o = a.createOscillator(); const g = a.createGain(); o.type='sine'; o.connect(g); g.connect(a.destination); o.frequency.setValueAtTime(440,a.currentTime); o.frequency.setValueAtTime(550,a.currentTime+0.08); g.gain.setValueAtTime(0.15,a.currentTime); g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.25); o.start(); o.stop(a.currentTime+0.25); } catch(e) {} },
  hit:     () => { try { const a = new AudioContext(); const o = a.createOscillator(); const g = a.createGain(); o.type='sawtooth'; o.connect(g); g.connect(a.destination); o.frequency.setValueAtTime(200,a.currentTime); o.frequency.exponentialRampToValueAtTime(80,a.currentTime+0.2); g.gain.setValueAtTime(0.2,a.currentTime); g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.2); o.start(); o.stop(a.currentTime+0.2); } catch(e) {} },
  victory: () => { try {
    const a = new AudioContext()
    const play = (freq: number, t: number, dur: number, vol = 0.25) => {
      const o = a.createOscillator(); const g = a.createGain()
      o.type='sine'; o.connect(g); g.connect(a.destination)
      o.frequency.setValueAtTime(freq,a.currentTime+t)
      g.gain.setValueAtTime(0,a.currentTime+t)
      g.gain.linearRampToValueAtTime(vol,a.currentTime+t+0.02)
      g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+t+dur)
      o.start(a.currentTime+t); o.stop(a.currentTime+t+dur)
    }
    play(392,0,0.15,0.3); play(523,0,0.15,0.2)
    play(523,0.18,0.15,0.3); play(659,0.18,0.15,0.2)
    play(659,0.36,0.15,0.3); play(784,0.36,0.15,0.2)
    play(784,0.55,0.5,0.35); play(1047,0.55,0.5,0.25); play(659,0.55,0.5,0.2)
  } catch(e) {} },
  bankrupt: () => { try {
    const a = new AudioContext()
    const play = (freq: number, t: number, dur: number) => {
      const o = a.createOscillator(); const g = a.createGain()
      o.type='sawtooth'; o.connect(g); g.connect(a.destination)
      o.frequency.setValueAtTime(freq,a.currentTime+t)
      o.frequency.exponentialRampToValueAtTime(freq*0.7,a.currentTime+t+dur)
      g.gain.setValueAtTime(0.25,a.currentTime+t)
      g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+t+dur)
      o.start(a.currentTime+t); o.stop(a.currentTime+t+dur+0.05)
    }
    play(220,0,0.2); play(196,0.25,0.2); play(175,0.5,0.2); play(147,0.75,0.6)
  } catch(e) {} },
  timeup: () => { try {
    const a = new AudioContext()
    const play = (freq: number, t: number, dur: number, type: OscillatorType = 'sine') => {
      const o = a.createOscillator(); const g = a.createGain()
      o.type=type; o.connect(g); g.connect(a.destination)
      o.frequency.setValueAtTime(freq,a.currentTime+t)
      g.gain.setValueAtTime(0.2,a.currentTime+t)
      g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+t+dur)
      o.start(a.currentTime+t); o.stop(a.currentTime+t+dur)
    }
    play(880,0,0.1,'square'); play(880,0.15,0.1,'square'); play(880,0.3,0.1,'square')
    play(440,0.5,0.8,'sawtooth')
  } catch(e) {} },
  drumroll: () => { try {
    const a = new AudioContext()
    for(let i=0;i<12;i++){
      const o = a.createOscillator(); const g = a.createGain()
      o.type='square'; o.connect(g); g.connect(a.destination)
      const t = i*0.06
      o.frequency.setValueAtTime(150+i*5,a.currentTime+t)
      g.gain.setValueAtTime(0.08+i*0.01,a.currentTime+t)
      g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+t+0.05)
      o.start(a.currentTime+t); o.stop(a.currentTime+t+0.05)
    }
  } catch(e) {} },
}

export const TIME_LIMIT = 60
