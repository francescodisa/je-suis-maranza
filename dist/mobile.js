// Phone layout, pointer ownership and the contextual object target.
export class TouchState {
  constructor(){this.owners=new Map();this.pending=new Set();this.value={x:0,y:0,punch:false,kick:false,jump:false,special:false};}
  claim(action,id){if(this.owners.has(action))return false;this.owners.set(action,id);if(action!=='move'){this.value[action]=true;this.pending.add(action);}return true;}
  owns(action,id){return this.owners.get(action)===id;}
  release(action,id){if(!this.owns(action,id))return false;this.owners.delete(action);if(action==='move')this.value.x=this.value.y=0;else this.value[action]=false;return true;}
  consume(){const value={...this.value};for(const action of this.pending)value[action]=true;this.pending.clear();return value;}
  reset(){this.pending.clear();this.owners.clear();Object.assign(this.value,{x:0,y:0,punch:false,kick:false,jump:false,special:false});}
}
export function objectTarget(state){
 const p=state.player;
 const boss=state.boss;
 if(boss?.groundPhase&&!boss.defeated&&Math.abs(boss.x-p.x)<125&&Math.abs(boss.y-p.y)<58&&(boss.x-p.x)*p.dir>=-35)return boss;
 return state.objects.filter(o=>!o.destroyed&&!o.disabled&&Math.abs(o.y-p.y)<=55&&(o.x-p.x)*p.dir>=-o.w*.4&&Math.abs(o.x-p.x)<=95+o.w*.4)
 .sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0]||null;
}
export function setupPhoneLayout(onChange){
 const root=document.documentElement,coarse=matchMedia('(pointer:coarse)');let lastWidth=0,lastPhone=false;
 const update=()=>{
   const width=document.documentElement.clientWidth,height=window.innerHeight;
   const phone=width<=600||(width<=1100&&(coarse.matches||navigator.maxTouchPoints>0||height<=560));
   root.classList.toggle('phone-ui',phone);
   // svh stays fixed while browser chrome expands/collapses. Older browsers get
   // an orientation/width-based baseline, never the zoomed visual viewport.
   if(!CSS.supports('height','100svh')&&(Math.abs(width-lastWidth)>40||!lastWidth))root.style.setProperty('--phone-height',height+'px');
   if(lastWidth&&Math.abs(width-lastWidth)>40||lastPhone!==phone)onChange?.();
   lastWidth=width;lastPhone=phone;
 };
 window.addEventListener('resize',update);coarse.addEventListener?.('change',update);update();
 return()=>root.classList.contains('phone-ui');
}
export function protectPlaySurface(surface,isPlaying){
 const prevent=e=>{if(isPlaying()&&e.cancelable)e.preventDefault();};
 // touch-action handles pointer browsers; gesture events cover older WebKit.
 for(const type of ['gesturestart','gesturechange','gestureend','dblclick','contextmenu'])surface.addEventListener(type,prevent,{passive:false});
 surface.addEventListener('touchmove',prevent,{passive:false});
}

// One caption source at a time. Critical feedback cannot be hidden by chatter.
export function gameplaySpeech(s){
 if(s.playerArrest)return{key:'grab',speaker:'TI HANNO AFFERRATO',text:'Tieni una direzione per liberarti oppure usa Convinci.',tone:'urgent',remaining:s.playerArrest.remaining};
 if(s.persuasion){const q=s.persuasion;return{key:'persuasion:'+q.phase,speaker:q.speakerName||(q.phase==='reply'?'AGENTE':s.player.name),text:q.text,tone:q.phase,remaining:q.remaining};}
 if(s.mode==='bossescape')return{key:'escape',speaker:s.boss.name,text:s.boss.bubble?.text||(s.boss.kind==='trump'?'Trump abbandona la corazza e scappa. Il passaggio è libero.':'Il Presidente abbandona la corazza e corre verso l’auto.'),tone:'status',remaining:3.2-(s.boss.escapeTimer||0)};
 const notice=s.toast?.ttl>0?s.toast:null;
 const urgent=notice&&/motivazione|pattuglia torna|salvataggio|avvicinati|zone rosse|macchina sta ricaricando/i.test(notice.text);
 if(urgent)return{key:'notice:'+notice.text,speaker:/pattuglia torna/i.test(notice.text)?'TORNA LA PATTUGLIA':'IN STRADA',text:notice.text,tone:'status',remaining:notice.ttl};
 const actors=[s.player,...s.allies,...s.enemies,...(s.civilians||[])];
 const actor=actors.filter(e=>e.bubble?.ttl>0&&!e.dead&&!e.arrested&&!e.hidden&&(!e.rescued||e===s.player)&&e.x-s.cameraX>-40&&e.x-s.cameraX<1000)
  .sort((a,b)=>Math.abs(a.x-s.player.x)-Math.abs(b.x-s.player.x))[0];
 if(actor)return{key:'actor:'+actor.id+':'+actor.bubble.text,speaker:actor.bubble.text==='Tutte le unità, riprendere l’avanzata.'?'RADIO DELLA PATTUGLIA':actor===s.player?s.player.name:actor.name||(['cop','shield','soldier','elite'].includes(actor.type)?'AGENTE':'MANIFESTANTE'),text:actor.bubble.text,tone:'ambient',remaining:actor.bubble.ttl};
 return notice?{key:'notice:'+notice.text,speaker:'IN STRADA',text:notice.text,tone:'status',remaining:notice.ttl}:null;
}

// Measure words in the actual UI font: never shrink, ellipsize or discard text.
export function speechPages(text,width,measure,maxLines=2){
 const lines=[];let line='';
 for(const word of text.trim().split(/\s+/)){
  const next=line?line+' '+word:word;
  if(line&&measure(next)>width){lines.push(line);line=word;}else line=next;
 }
 if(line)lines.push(line);
 const pages=[];for(let i=0;i<lines.length;i+=maxLines)pages.push(lines.slice(i,i+maxLines).join('\n'));
 return pages;
}
