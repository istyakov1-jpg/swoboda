'use client'

import { useState, useEffect, useRef } from 'react'
import { BOARD_CELLS, type Cell } from '@/lib/gameData'
import type { Player } from '@/types/database'

interface Props {
  myPlayer: Player
  gameState: { players: Player[]; [k: string]: any }
  boardView: 'tape' | 'square'
  setBoardView: (v: 'tape' | 'square') => void
  isMyTurn: boolean
  rolling: boolean
  onRoll: () => void
  diceValue: number | null
  boardCells?: Cell[]
}

const CELL_META: Record<string, { label: string; color: string; desc: string; hint: string }> = {
  salary:      { label: 'Зарплата',  color: '#C7CBD6', desc: 'Выплата за месяц + весь пассивный доход', hint: 'Деньги зачисляются автоматически' },
  opportunity: { label: 'Сделка',    color: '#34D399', desc: 'Инвестиционная сделка — малая или крупная', hint: 'Выбери актив и внеси первый взнос' },
  hit:         { label: 'Удар',      color: '#FB6B6B', desc: 'Неожиданный расход — штраф, поломка или болезнь', hint: 'Придётся заплатить из наличных' },
  market:      { label: 'Биржа',     color: '#5B9DF9', desc: 'Купить или продать акции и криптовалюту', hint: 'Цена меняется каждый раз' },
  event:       { label: 'Событие',   color: '#FBBF24', desc: 'Случайное событие, которое влияет на всех', hint: 'Может быть как плюсом, так и минусом' },
  auction:     { label: 'Аукцион',   color: '#A78BFA', desc: 'Уникальный актив выставлен на торги', hint: 'Успей забрать раньше других' },
  child:       { label: 'Жизнь',     color: '#F5B843', desc: 'Родился ребёнок — ежемесячные расходы растут', hint: 'Расходы +10% от зарплаты навсегда' },
  charity:     { label: 'Благотворительность', color: '#E8A2C8', desc: 'Пожертвуй 10% зарплаты — получи 2 кубика на 3 круга', hint: 'Двигайся вдвое быстрее' },
}

const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16)
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const f = amt < 0 ? 0 : 255, p = Math.abs(amt)
  r = Math.round(r+(f-r)*p); g = Math.round(g+(f-g)*p); b = Math.round(b+(f-b)*p)
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)
}

export default function BoardView({ myPlayer, gameState, boardView, setBoardView, isMyTurn, rolling, onRoll, diceValue, boardCells: propBoardCells }: Props) {
  const cells = propBoardCells ?? BOARD_CELLS
  const N = cells.length
  const containerRef = useRef<HTMLDivElement>(null)
  const [boardSize, setBoardSize] = useState(320)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      // SZ=36, gap=3px → S = 8*36+5*3+4 = 307 оптимально
      // Оставляем ~20px с каждой стороны для чипов
      const available = el.offsetWidth - 44 // вычитаем padding 22px*2
      const s = Math.max(260, available - 10) // ~5px chip space каждая сторона
      setBoardSize(s)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Анимированные позиции для ВСЕХ игроков
  const [allPos, setAllPos] = useState<Record<string,number>>(()=>{
    const init: Record<string,number> = {}
    ;(gameState.players||[]).forEach((p:any)=>{ init[p.id]=((p.position||0)%N+N)%N })
    return init
  })
  const [hop, setHop] = useState(false)

  useEffect(()=>{
    const timers: ReturnType<typeof setTimeout>[] = []
    ;(gameState.players||[]).forEach((p:any)=>{
      const target = ((p.position||0)%N+N)%N
      const current = allPos[p.id] ?? target
      if(current===target) return
      const t = setTimeout(()=>{
        setAllPos(prev=>{
          const cur = prev[p.id] ?? target
          const next = (cur+1)%N
          return {...prev,[p.id]:next}
        })
        if(p.id===myPlayer.id){
          setHop(true)
          setTimeout(()=>setHop(false),120)
        }
      }, 280)
      timers.push(t)
    })
    return ()=>timers.forEach(clearTimeout)
  },[allPos, gameState.players, N, myPlayer.id])

  const pos = allPos[myPlayer.id] ?? ((myPlayer.position||0)%N+N)%N
  const m = (type: string) => CELL_META[type]??{label:'',color:'#8B91A6'}
  const playersAt = (idx: number) => (gameState.players||[]).filter((p:any)=>(((p.position||0)%N+N)%N)===idx)
  const av = (p:any) => p.avatar??p.initial??'?'

  const cellBg = (color:string) => `linear-gradient(155deg,${shade(color,.4)},${color} 46%,${shade(color,-.34)})`
  const tileShadow = (color:string, cur:boolean) => cur
    ? `0 0 24px ${color},0 10px 22px -4px ${color}cc,inset 0 1.5px 0 rgba(255,255,255,.55),inset 0 -5px 9px rgba(0,0,0,.34)`
    : `0 5px 13px -3px ${color}77,inset 0 1.5px 0 rgba(255,255,255,.42),inset 0 -3px 7px rgba(0,0,0,.32)`

  function CellIcon({ type, size=22 }:{type:string;size?:number}) {
    const c:any={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'#fff',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round',style:{filter:'drop-shadow(0 1px 1.5px rgba(0,0,0,.4))'}}
    switch(type){
      case 'salary':      return <svg {...c}><rect x="2.5" y="6.5" width="19" height="11" rx="2.2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.4v5.2M18 9.4v5.2"/></svg>
      case 'opportunity': return <svg {...c}><rect x="3" y="7.5" width="18" height="12.5" rx="2.2"/><path d="M8.5 7.5V5.9A1.9 1.9 0 0 1 10.4 4h3.2a1.9 1.9 0 0 1 1.9 1.9v1.6"/><path d="M3 13h18"/></svg>
      case 'hit':         return <svg {...c}><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>
      case 'market':      return <svg {...c}><path d="M3 17l5.5-5.5 3.5 3.5 7-8"/><path d="M16 7h5v5"/></svg>
      case 'event':       return <svg {...c}><path d="M12 2.4l1.9 5.7 5.7 1.9-5.7 1.9L12 17.6l-1.9-5.7L4.4 10l5.7-1.9z"/></svg>
      case 'auction':     return <svg {...c}><path d="M13.5 4.5l6 6-3 3-6-6z"/><path d="M10.6 7.4 4 14"/><path d="M3 21h10.5"/></svg>
      case 'child':       return <svg {...c}><path d="M12 20.4S3.6 14.6 3.6 8.9A3.8 3.8 0 0 1 12 6.1a3.8 3.8 0 0 1 8.4 2.8C20.4 14.6 12 20.4 12 20.4z"/></svg>
      case 'charity':     return <svg {...c}><path d="M12 21.6C12 21.6 3 16 3 9.5a4.5 4.5 0 0 1 9-0.5 4.5 4.5 0 0 1 9 0.5C21 16 12 21.6 12 21.6z"/><path d="M12 7 L14 10 L17.5 10.5 L15 13 L15.5 16.5 L12 14.8 L8.5 16.5 L9 13 L6.5 10.5 L10 10 Z" strokeWidth="1.2"/></svg>
      default:            return <svg {...c}><circle cx="12" cy="12" r="3"/></svg>
    }
  }

  function Chip({player,size=20,ml=0,mt=0,hopping=false}:any) {
    return <div style={{width:size,height:size,marginLeft:ml,marginTop:mt,flexShrink:0,borderRadius:'50%',background:`radial-gradient(circle at 34% 26%,rgba(255,255,255,.7),${player.color} 58%,${shade(player.color,-.3)})`,border:'1.5px solid rgba(255,255,255,.85)',boxShadow:`0 0 0 2px ${player.color},0 3px 10px ${player.color}cc`,display:'grid',placeItems:'center',fontSize:Math.round(size*.5),lineHeight:1,animation:hopping?'svHop .3s ease':'none'}}>{av(player)}</div>
  }

  // 3D кубик — настоящий CSS 3D
  function Dice3D({size=52, diceValue: dv}:{size?:number; diceValue?: number|null}) {
    const v = dv ?? diceValue ?? 1
    const half = size/2
    const finals:Record<number,string> = {
      1:'rotateX(0deg) rotateY(0deg)',
      2:'rotateX(-90deg) rotateY(0deg)',
      3:'rotateY(-90deg)',
      4:'rotateY(90deg)',
      5:'rotateX(90deg)',
      6:'rotateY(180deg)',
    }
    const faceValues = [1,6,2,5,3,4]
    const faceTransforms = [
      `translateZ(${half}px)`,
      `rotateY(180deg) translateZ(${half}px)`,
      `rotateX(90deg) translateZ(${half}px)`,
      `rotateX(-90deg) translateZ(${half}px)`,
      `rotateY(-90deg) translateZ(${half}px)`,
      `rotateY(90deg) translateZ(${half}px)`,
    ]
    const P:Record<string,[number,number]>={TL:[7,7],TR:[17,7],ML:[7,12],MR:[17,12],BL:[7,17],BR:[17,17],C:[12,12]}
    const MAP:Record<number,string[]>={1:['C'],2:['TL','BR'],3:['TL','C','BR'],4:['TL','TR','BL','BR'],5:['TL','TR','C','BL','BR'],6:['TL','TR','ML','MR','BL','BR']}
    return (
      <div style={{width:size,height:size,perspective:size*5,filter:'drop-shadow(0 8px 18px rgba(0,0,0,.5))'}}>
        <div style={{
          width:size,height:size,position:'relative',transformStyle:'preserve-3d',
          transition: rolling ? 'none' : 'transform .5s cubic-bezier(.18,.7,.22,1)',
          transform: rolling ? undefined : finals[v],
          animation: rolling ? 'svDice3D .5s linear infinite' : 'none',
          willChange: 'transform',
        }}>
          {faceValues.map((fv,i)=>(
            <div key={i} style={{
              position:'absolute',width:size,height:size,
              borderRadius:Math.round(size*.16),
              background:'linear-gradient(145deg,#ffffff,#ece6d8)',
              boxShadow:'inset 0 0 0 1px rgba(0,0,0,.07),inset 0 4px 8px rgba(255,255,255,.7),inset 0 -4px 8px rgba(0,0,0,.08)',
              display:'grid',placeItems:'center',
              backfaceVisibility:'hidden',
              transform:faceTransforms[i],
            }}>
              <svg width={size*.85} height={size*.85} viewBox="0 0 24 24">
                {(MAP[fv]||['C']).map((k,j)=><circle key={j} cx={P[k][0]} cy={P[k][1]} r="2.2" fill="#1A1206"/>)}
              </svg>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const currentPlayerName = gameState.players?.[0]?.name ?? '...'
  const diceStatus = rolling
    ? `${currentPlayerName} бросает...`
    : isMyTurn ? 'Твой ход' : `Ход: ${currentPlayerName}`

  // Кубик + статус — общий блок, одинаковый для всех режимов кроме квадрата
  function DiceBar() {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:'12px 0 4px'}}>
        <Dice3D size={52}/>
      </div>
    )
  }

  const visibleCells = [-3,-2,-1,0,1,2,3].map(d=>({
    cell:cells[(pos+d+N)%N], idx:(pos+d+N)%N, dist:Math.abs(d), isCurrent:d===0
  }))

  return (
    <div ref={containerRef} style={{display:'flex',flexDirection:'column',height:'100%',fontFamily:'Manrope,sans-serif',color:'#F4F5FA'}}>
      <style>{`
        @keyframes svRing{0%{transform:scale(.8);opacity:.75}100%{transform:scale(1.5);opacity:0}}
        @keyframes svHop{0%{transform:translateY(0) scale(1)}40%{transform:translateY(-12px) scale(1.1)}100%{transform:translateY(0) scale(1)}}
        @keyframes svTwinkle{0%,100%{opacity:.15}50%{opacity:.95}}
        @keyframes svDice3D{0%{transform:rotateX(0) rotateY(0)}100%{transform:rotateX(720deg) rotateY(1080deg)}}
      `}</style>

      {/* Переключатель — всегда вверху */}
      <div style={{flexShrink:0,display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:5,padding:'4px 14px 0'}}>
        {(['square','tape'] as const).map((v,i)=>{
          const labels=['Поле','Лента']
          const on=boardView===v
          return <button key={v} onClick={()=>setBoardView(v)} style={{padding:'9px 0',borderRadius:12,border:'none',cursor:'pointer',fontSize:13,fontWeight:800,fontFamily:'Manrope,sans-serif',color:on?'#1A1206':'#9AA0B4',background:on?'linear-gradient(135deg,#FBD888,#F5B843 55%,#E0891F)':'#131320',boxShadow:on?'0 8px 18px -6px rgba(245,184,67,.6)':'0 0 0 1px rgba(255,255,255,.07)',transition:'all .2s'}}>{labels[i]}</button>
        })}
      </div>

      {/* Контент — центрируется в оставшемся пространстве */}
      <div style={{flex:'1 1 0',minHeight:0,display:'flex',flexDirection:'column',justifyContent:'center'}}>

      {/* ══ ЛЕНТА ══ */}
      {boardView==='tape' && (()=>{
        const curCell = cells[pos]
        const curMeta = m(curCell.type)
        // В ленте: мой аватар всегда на центральной карточке (статично, прыгает на месте)
        // Остальные игроки — на своих позициях в ленте
        return (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:0}}>
            {/* Ряд карточек */}
            <div style={{height:180,display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'0 10px',position:'relative',overflow:'visible',flexShrink:0}}>
              {visibleCells.map(({cell,idx,dist,isCurrent})=>{
                const c=m(cell.type)
                const op=isCurrent?1:dist===1?0.88:dist===2?0.55:0.28
                const w=isCurrent?104:dist===1?68:dist===2?54:44
                const h=isCurrent?114:dist===1?80:dist===2?62:50
                const icon=isCurrent?38:dist===1?26:dist===2?20:16
                // Мой аватар — только на центральной карточке
                // Остальные — на карточках по их позиции
                const othersHere = (gameState.players||[]).filter((p:any)=>p.id!==myPlayer.id && (((allPos[p.id]??p.position)%N+N)%N)===idx)
                const showMe = isCurrent
                const ppl = [...(showMe?[myPlayer]:[]), ...othersHere]
                return (
                  <div key={idx} style={{flexShrink:0,width:w,opacity:op,display:'flex',flexDirection:'column',alignItems:'center',transition:'all .35s cubic-bezier(.34,1.56,.64,1)',transform:isCurrent?'translateY(-14px)':'none',willChange:'transform'}}>
                    <div style={{height:30,display:'flex',alignItems:'flex-end',justifyContent:'center',marginBottom:6}}>
                      {ppl.map((p:any,i:number)=><Chip key={p.id} player={p} size={isCurrent?26:20} ml={i?-8:0} hopping={isCurrent&&hop&&p.id===myPlayer.id}/>)}
                    </div>
                    <div style={{position:'relative',width:'100%',height:h,borderRadius:isCurrent?24:16}}>
                      {isCurrent&&<span style={{position:'absolute',inset:-5,borderRadius:28,border:`2px solid ${shade(c.color,.35)}`,animation:'svRing 1.8s ease-out infinite',willChange:'transform,opacity'}}/>}
                      <div style={{width:'100%',height:'100%',borderRadius:isCurrent?24:16,background:cellBg(c.color),border:`1px solid ${shade(c.color,-.45)}`,boxShadow:tileShadow(c.color,isCurrent),display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5}}>
                        <CellIcon type={cell.type} size={icon}/>
                        {isCurrent&&<div style={{fontSize:8,fontWeight:900,letterSpacing:1.5,color:'rgba(255,255,255,.9)',textShadow:'0 1px 2px rgba(0,0,0,.4)'}}>ВАШ ХОД</div>}
                      </div>
                    </div>
                    {!isCurrent && <div style={{fontSize:10,fontWeight:700,color:'#8B91A6',marginTop:7}}>{c.label}</div>}
                  </div>
                )
              })}
            </div>

            {/* Описание текущей клетки */}
            <div style={{width:'100%',padding:'32px 16px 0'}}>
              <div style={{borderRadius:20,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderLeft:`3px solid ${curMeta.color}`,padding:'14px 16px'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <div style={{width:34,height:34,borderRadius:11,background:`${curMeta.color}18`,border:`1px solid ${curMeta.color}35`,display:'grid',placeItems:'center',flexShrink:0}}>
                    <CellIcon type={curCell.type} size={18}/>
                  </div>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:1.6,textTransform:'uppercase',color:curMeta.color,opacity:.8,marginBottom:2}}>{curMeta.label}</div>
                    <div style={{fontSize:15,fontWeight:700,lineHeight:1.25,color:'#F4F5FA'}}>{curMeta.desc}</div>
                  </div>
                </div>
                <div style={{fontSize:12,fontWeight:500,color:'rgba(255,255,255,0.38)',lineHeight:1.5,paddingLeft:44}}>{curMeta.hint}</div>
              </div>
            </div>

          </div>
        )
      })()}

      {/* ══ (ДУГА удалена) ══ */}
      {false&&(()=>{
        const cx=179,cy=214,R=150
        const slots=[-4,-3,-2,-1,0,1,2,3,4]
        const sparkles=[[40,70],[110,30],[200,24],[300,56],[330,120],[60,150],[250,150],[150,18]]
        const curMeta=m(cells[pos].type)
        return (
          <div style={{padding:'20px 0 0',display:'flex',flexDirection:'column',alignItems:'center'}}>
            <div style={{position:'relative',width:358,height:260,margin:'0 auto'}}>
              <div style={{position:'absolute',top:4,left:0,right:0,textAlign:'center',fontSize:11,fontWeight:800,letterSpacing:2,textTransform:'uppercase',color:curMeta.color}}>{curMeta.label}</div>
              <svg width="358" height="300" style={{position:'absolute',inset:0,pointerEvents:'none'}}>
                <defs><linearGradient id="svArcTrack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a2d18"/><stop offset="1" stopColor="#17120a"/></linearGradient></defs>
                <path d={`M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${cx+R} ${cy}`} fill="none" stroke="rgba(245,184,67,.08)" strokeWidth="68" strokeLinecap="round"/>
                <path d={`M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${cx+R} ${cy}`} fill="none" stroke="url(#svArcTrack)" strokeWidth="54" strokeLinecap="round"/>
                <path d={`M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${cx+R} ${cy}`} fill="none" stroke="rgba(245,184,67,.35)" strokeWidth="1.5"/>
                <path d={`M ${cx-(R-27)} ${cy} A ${R-27} ${R-27} 0 0 1 ${cx+(R-27)} ${cy}`} fill="none" stroke="rgba(245,184,67,.4)" strokeWidth="1.5" strokeDasharray="2 8"/>
                {sparkles.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="1.7" fill="#F5B843" style={{animation:`svTwinkle ${2+(i%3)*.6}s ease-in-out ${i*.3}s infinite`}}/>)}
              </svg>
              {slots.map(d=>{
                const idx=(pos+d+N)%N
                const cell=cells[idx]
                const c=m(cell.type)
                const dist=Math.abs(d)
                const isCurrent=d===0
                const ang=(180+((d+4)/8)*180)*Math.PI/180
                const x=cx+R*Math.cos(ang)
                const y=cy+R*Math.sin(ang)
                const size=isCurrent?56:dist===1?44:dist===2?34:26
                const op=isCurrent?1:dist===1?0.9:dist===2?0.62:0.4
                const icon=isCurrent?28:dist===1?22:dist===2?17:13
                const ppl=playersAt(idx).filter((p:any)=>p.id!==myPlayer.id)
                return (
                  <div key={d} style={{position:'absolute',left:x,top:y,width:size,height:size,transform:'translate(-50%,-50%)',opacity:op}}>
                    {isCurrent&&<span style={{position:'absolute',inset:-5,borderRadius:'50%',border:`2px solid ${shade(c.color,.35)}`,animation:'svRing 1.8s ease-out infinite'}}/>}
                    <div style={{width:'100%',height:'100%',borderRadius:'50%',background:cellBg(c.color),border:`1px solid ${shade(c.color,-.45)}`,boxShadow:tileShadow(c.color,isCurrent),display:'grid',placeItems:'center'}}>
                      <CellIcon type={cell.type} size={icon}/>
                    </div>
                    {ppl.length>0&&(
                      <div style={{position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',display:'flex'}}>
                        {ppl.map((p:any,i:number)=><Chip key={p.id} player={p} size={16} ml={i?-6:0}/>)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div style={{display:'flex',justifyContent:'center',padding:'14px 0 4px'}}>
              <Dice3D size={56}/>
            </div>
          </div>
        )
      })()}
      {/* ══ ПОЛЕ ══ */}
      {boardView==='square'&&(()=>{
        const S=boardSize, SZ=36
        // 7 ячеек на сторону: шаг k = (S-SZ)/7
        // i=0 — угол, i=1..6 — рёберные, следующий угол на позиции 7k=S-SZ
        const k = (S - SZ) / 7

        const getPos=(idx:number):{x:number,y:number}=>{
          const side=Math.floor(idx/7)
          const i=idx%7
          const p=Math.round(i*k)
          if(side===0) return {x:p,       y:0}
          if(side===1) return {x:S-SZ,    y:p}
          if(side===2) return {x:S-SZ-p,  y:S-SZ}
          return           {x:0,       y:S-SZ-p}
        }

        const innerL = SZ
        const innerSize = S - 2*SZ

        return (
          <div style={{padding:'8px 22px 0'}}>
            <div style={{position:'relative',width:S,height:S,margin:'0 auto'}}>

              {/* Подложка стола */}
              <div style={{
                position:'absolute',
                inset: -8,
                zIndex:0,
                pointerEvents:'none',
                borderRadius: 18,
                background: '#0e0b06',
                boxShadow: '0 0 0 1px rgba(245,184,67,0.08), 0 8px 40px rgba(0,0,0,0.6)',
              }}/>
              {/* Прожектор сверху */}
              <div style={{
                position:'absolute',
                left: '-20%',
                top: '-60%',
                width: '140%',
                height: '120%',
                zIndex:0,
                pointerEvents:'none',
                background: 'radial-gradient(ellipse 55% 50% at 50% 30%, rgba(255,225,120,0.22) 0%, rgba(245,184,67,0.08) 40%, transparent 70%)',
              }}/>
              {/* Виньетка по краям */}
              <div style={{
                position:'absolute',
                inset: -8,
                zIndex:0,
                pointerEvents:'none',
                borderRadius: 18,
                background: 'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 45%, rgba(0,0,0,0.7) 100%)',
              }}/>
              {/* Центральная зона */}
              <div style={{
                position:'absolute',
                left: innerL,
                top: innerL,
                width: innerSize,
                height: innerSize,
                zIndex:0,
                pointerEvents:'none',
                borderRadius: 4,
                background: 'radial-gradient(ellipse 80% 70% at 50% 40%, rgba(22,16,6,0.9) 0%, rgba(10,8,3,0.97) 100%)',
              }}/>

              {/* Tiles */}
              {cells.map((cell,idx)=>{
                const c=m(cell.type)
                const {x,y}=getPos(idx)
                const isCurrent=idx===pos
                return (
                  <div key={idx} style={{position:'absolute',left:x,top:y,width:SZ,height:SZ,zIndex:2}}>
                    {isCurrent&&<span style={{position:'absolute',inset:-3,borderRadius:13,border:`2px solid ${shade(c.color,.3)}`,boxShadow:`0 0 14px ${c.color}88`,animation:'svRing 1.8s ease-out infinite',zIndex:0,pointerEvents:'none',willChange:'transform,opacity'}}/>}
                    <div style={{width:'100%',height:'100%',borderRadius:11,background:cellBg(c.color),border:`1px solid ${shade(c.color,-.45)}`,boxShadow:tileShadow(c.color,isCurrent),display:'grid',placeItems:'center',position:'relative',zIndex:1}}>
                      <CellIcon type={cell.type} size={20}/>
                    </div>
                  </div>
                )
              })}

              {/* Chips overlay — каждый игрок отдельно с CSS-переходом */}
              {(()=>{
                // Группируем по позиции
                const byPos: Record<number,string[]> = {}
                ;(gameState.players||[]).forEach((p:any)=>{
                  const idx = allPos[p.id] ?? (((p.position||0)%N+N)%N)
                  if(!byPos[idx]) byPos[idx]=[]
                  byPos[idx].push(p.id)
                })

                // Сторона ячейки для определения куда выходить
                const getCellSide = (idx:number) => {
                  if(idx===0||idx===7)  return 'top'    // верхние углы → сверху
                  if(idx<7)             return 'top'
                  if(idx<14)            return 'right'
                  if(idx===14||idx===21) return 'bottom' // нижние углы → снизу
                  if(idx<21)            return 'bottom'
                  return 'left'
                }

                // Рендерим ГРУППАМИ — один div на ячейку с flex-рядом чипов как в ленте
                return Object.entries(byPos).map(([idxStr, ids])=>{
                  const idx = parseInt(idxStr)
                  const {x,y} = getPos(idx)
                  const side = getCellSide(idx)
                  const s = 16 // размер чипа как в ленте
                  const overlap = 8
                  const mg = 4

                  // Позиция блока относительно ячейки
                  const isHorizontal = side==='top'||side==='bottom'
                  const totalW = s + (ids.length-1)*(s-overlap)
                  const totalH = s + (ids.length-1)*(s-overlap)

                  const blockStyle: React.CSSProperties = isHorizontal ? {
                    position:'absolute',
                    left: x + Math.round((SZ-totalW)/2),
                    top: side==='top' ? y-(s+mg) : y+SZ+mg,
                    display:'flex',
                    flexDirection:'row',
                    transition:'left 0.22s cubic-bezier(.4,0,.2,1),top 0.22s cubic-bezier(.4,0,.2,1)',
                    willChange:'left,top',
                    pointerEvents:'none',
                    zIndex:11,
                  } : {
                    position:'absolute',
                    left: side==='right' ? x+SZ+mg : x-(s+mg),
                    top: y + Math.round((SZ-totalH)/2),
                    display:'flex',
                    flexDirection:'column',
                    transition:'left 0.22s cubic-bezier(.4,0,.2,1),top 0.22s cubic-bezier(.4,0,.2,1)',
                    willChange:'left,top',
                    pointerEvents:'none',
                    zIndex:11,
                  }

                  return (
                    <div key={idxStr} style={blockStyle}>
                      {ids.map((pid:string, i:number)=>{
                        const p = (gameState.players||[]).find((pl:any)=>pl.id===pid)
                        if(!p) return null
                        const isMe = pid===myPlayer.id
                        const isHopping = hop && isMe
                        // Ровно как в Ленте: ml для горизонталь, mt для вертикаль
                        const ml = isHorizontal && i>0 ? -(overlap) : 0
                        const mt = !isHorizontal && i>0 ? -(overlap) : 0
                        return (
                          <Chip key={pid} player={p} size={s} ml={ml} mt={mt} hopping={isHopping}/>
                        )
                      })}
                    </div>
                  )
                })
              })()}

              {/* Центр — текущая клетка */}
              {(()=>{
                const curCell=cells[pos]
                const curMeta=m(curCell.type)
                return (
                  <div style={{position:'absolute',left:innerL,top:innerL,width:innerSize,height:innerSize,overflow:'hidden',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:3,gap:0,padding:'0 18px'}}>
                    {/* Фоновое свечение клетки */}
                    <div style={{position:'absolute',top:'20%',left:'50%',transform:'translateX(-50%)',width:120,height:120,borderRadius:'50%',background:`radial-gradient(circle,${curMeta.color}1a 0%,transparent 70%)`,pointerEvents:'none'}}/>
                    {/* Иконка */}
                    <div style={{position:'relative',marginBottom:10,flexShrink:0}}>
                      <div style={{position:'absolute',inset:-5,borderRadius:24,border:`1px solid ${curMeta.color}35`,animation:'svRing 2.6s ease-out infinite',pointerEvents:'none',willChange:'transform,opacity'}}/>
                      <div style={{width:52,height:52,borderRadius:18,background:cellBg(curMeta.color),border:`1.5px solid ${curMeta.color}60`,boxShadow:`0 0 22px ${curMeta.color}44,0 6px 16px -4px rgba(0,0,0,.55),inset 0 1.5px 0 rgba(255,255,255,.4)`,display:'grid',placeItems:'center'}}>
                        <CellIcon type={curCell.type} size={26}/>
                      </div>
                    </div>
                    {/* Тег */}
                    <div style={{display:'inline-flex',alignItems:'center',gap:4,background:`${curMeta.color}18`,border:`1px solid ${curMeta.color}38`,borderRadius:20,padding:'2px 9px 2px 6px',marginBottom:8,flexShrink:0}}>
                      <div style={{width:4,height:4,borderRadius:'50%',background:curMeta.color}}/>
                      <span style={{fontSize:9,fontWeight:800,letterSpacing:1.6,textTransform:'uppercase',color:curMeta.color}}>{curMeta.label}</span>
                    </div>
                    {/* Описание */}
                    <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.78)',textAlign:'center',lineHeight:1.38,letterSpacing:'-.1px',marginBottom:7}}>{curMeta.desc}</div>
                    {/* Разделитель */}
                    <div style={{width:28,height:1,borderRadius:1,background:`linear-gradient(90deg,transparent,${curMeta.color}55,transparent)`,marginBottom:7,flexShrink:0}}/>
                    {/* Подсказка */}
                    <div style={{fontSize:9,fontWeight:500,color:'rgba(255,255,255,.32)',textAlign:'center',lineHeight:1.38}}>{curMeta.hint}</div>
                  </div>
                )
              })()}
            </div>
          </div>
        )
      })()}

      </div>{/* /контент */}
    </div>
  )
}