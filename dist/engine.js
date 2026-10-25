// Je suis Maranza — browser-independent arcade simulation.
// Coordinates are world-space footpoints. The renderer owns all presentation.
import { LEVELS, WORLD_WIDTH as W, CENTERS, GATES } from './campaign.js';
const FLOOR_MIN = 350, FLOOR_MAX = 485;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const distance = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 1.6);
const OBJ = {
  machine:{w:220,h:150,hp:420,value:20000,label:'MACCHINA BELLICA'},
  bin:{w:92,h:82,hp:48,value:100,label:'CASSONETTO'},
  car:{w:220,h:100,hp:100,value:500,label:'UTILITARIA'},
  coupe:{w:244,h:100,hp:125,value:1800,label:'COUPÉ DI PRESTIGIO'},
  supercar:{w:270,h:110,hp:155,value:7000,label:'SUPERCAR D’ORO'},
  limo:{w:344,h:120,hp:195,value:12000,label:'LIMOUSINE PRESIDENZIALE'},
  window:{w:192,h:172,hp:90,value:900,label:'VETRINA'},
  bag:{w:108,h:150,hp:105,value:6000,label:'BORSA DA COLLEZIONE'},
  safe:{w:142,h:168,hp:175,value:8500,label:'CASSAFORTE PRIVATA'},
  tesla:{w:260,h:105,hp:140,value:2800,label:'TESLA MODEL S'},
  cybertruck:{w:284,h:120,hp:180,value:5200,label:'TESLA CYBERTRUCK'},
  vending:{w:96,h:142,hp:70,value:250,label:'DISTRIBUTORE'},
  watch:{w:110,h:150,hp:110,value:6500,label:'OROLOGIO DA COLLEZIONE'},
  clock:{w:106,h:190,hp:145,value:11000,label:'PENDOLO IMPERIALE'},
  statue:{w:156,h:170,hp:190,value:18000,label:'LEONE D’ORO'}
};
const ENEMY = {
  cop:{hp:74,speed:75,damage:13,reach:54,windup:.55},shield:{hp:112,speed:57,damage:16,reach:58,windup:.68},
  soldier:{hp:102,speed:81,damage:18,reach:59,windup:.58},elite:{hp:140,speed:72,damage:21,reach:65,windup:.64},
  boss:{hp:240,speed:65,damage:24,reach:95,windup:.88}
};

// Easy preserves the previous normal balance. Threat areas lock when announced.
export const DIFFICULTIES = {
 facile:{health:120,damage:1,speed:1,windup:.72,recovery:1.3,guardCount:level=>level<2?2:3,predict:0,grabWindup:1,grabAfter:2,grabPressure:2,proactive:0,hold:2.2,grace:5,hitGrace:.85,jumpRecovery:0,stageHeal:50,checkpointHeal:20,bossHp:240,bossOpen:3.25,bossSpeed:65,bossWindup:.95,bombRate:1},
 normale:{health:120,damage:1.2,speed:1.55,windup:.6,recovery:.95,guardCount:()=>3,predict:.68,grabWindup:.85,grabAfter:1.5,grabPressure:1,proactive:4,hold:1.9,grace:3.5,hitGrace:.7,jumpRecovery:.24,stageHeal:25,checkpointHeal:8,bossHp:280,bossOpen:2.95,bossSpeed:82,bossWindup:.85,bombRate:.85},
 difficile:{health:100,damage:1.45,speed:1.85,windup:.52,recovery:.72,guardCount:()=>3,predict:.8,grabWindup:.75,grabAfter:1,grabPressure:1,proactive:3,hold:1.7,grace:3,hitGrace:.6,jumpRecovery:.38,stageHeal:12,checkpointHeal:0,bossHp:320,bossOpen:2.65,bossSpeed:100,bossWindup:.75,bombRate:.7}
};

export class Game {
  constructor({onEvent}={}) { this.onEvent = onEvent || (()=>{}); this.seed = 2749; this.uid = 0; this.reset(); }
  rnd() { this.seed = (Math.imul(this.seed,1664525)+1013904223)>>>0; return this.seed/4294967296; }
  emit(type,data={}) { this.onEvent({type,...data}); }
  reset(difficulty='normale') {
    this.seed=2749; this.uid=0; this.difficulty=difficulty; this.easy=/facile|easy|rilassata/i.test(difficulty);this.hard=/difficile|hard/i.test(difficulty);this.tuning=DIFFICULTIES[this.easy?'facile':this.hard?'difficile':'normale'];this.damageScale=this.tuning.damage;this.jumpHeld=false;this.guardHeld=false;this.specialHint=null;
    this.state={mode:'title',level:0,levelName:LEVELS[0].name,worldWidth:W,time:0,score:0,combo:0,comboTime:0,motivation:100,alarm:0,kills:0,objectsDestroyed:0,player:null,enemies:[],objects:[],allies:[],pickups:[],particles:[],bombs:[],cameraX:0,toast:{text:'',ttl:0},shake:0,boss:null,bossFled:null,zone:0,gateX:650,objective:'',levelProgress:0,stageDestroyed:0,recruited:0,rescued:0,arrested:0,freed:0,nextChatter:7,arrest:null,playerArrest:null,persuasion:null,defeatReason:null,difficulty};
    const playerHealth=this.tuning.health;
    this.state.player=this.entity('player',150,420,{hp:playerHealth,maxHp:playerHealth,character:'man',name:'MARANZA',dir:1,action:'idle',comboStep:0,swingId:0,blocking:false,blockAge:0,blockHeld:0,guardBroken:0,perfectCooldown:0,hitPressure:0,blockFlash:0,perfectBlock:false});
    this.loadLevel(0); return this.state;
  }
  entity(type,x,y,extra={}) {
    return {id:++this.uid,type,x,y,dir:-1,hp:80,maxHp:80,z:0,vz:0,action:'idle',anim:0,actionTime:0,cooldown:0,invuln:0,dead:false,knock:0,...extra};
  }
  enemyStats(type) {const base=ENEMY[type],t=this.tuning;return {...base,speed:base.speed*t.speed,windup:Math.max(t.windup,base.windup*(this.easy?1:.85)),hp:type==='boss'?t.bossHp:base.hp,damage:base.damage*this.damageScale};}
  loadLevel(index) {
    const s=this.state,l=LEVELS[index];
    s.level=index;s.levelName=l.name;s.enemies=[];s.objects=[];s.allies=[];s.pickups=[];s.particles=[];s.bombs=[];s.cameraX=0;s.zone=0;s.gateX=GATES[0];s.alarm=0;s.stageDestroyed=0;s.levelProgress=0;s.boss=null;s.bossFled=null;s.machine=null;s.levelKills=0;s.zoneCleared=CENTERS.map(()=>false);s.waveSpawned=CENTERS.map(()=>false);s.zoneTime=0;s.arrest=null;s.playerArrest=null;s.persuasion=null;s.defeatReason=null;s.arrestAttempts=0;s.nextArrestAt=s.time+12;s.nextChatter=s.time+7;s.reinforcedZone=[];
    s.player.character=index%2?'woman':'man';s.player.name=index%2?'NORA':'MARANZA';
    s.player.x=150;s.player.y=420;s.player.z=0;s.player.vz=0;s.player.action='idle';s.player.anim=0;s.player.invuln=1;s.player.cooldown=0;Object.assign(s.player,{blocking:false,blockAge:0,blockHeld:0,guardBroken:0,perfectCooldown:0,hitPressure:0,blockFlash:0,perfectBlock:false,arrestImmunity:2,jumpCooldown:0,moveX:0,moveY:0});this.guardHeld=false;s.player.bubble=null;s.player.hp=Math.min(s.player.maxHp,s.player.hp+this.tuning.stageHeal);
    CENTERS.forEach((cx,zone)=>{
      if(l.bossKind && zone===3) return;
      this.addObject(l.types[zone],cx,zone);
      this.addObject(l.extras[zone],cx+235,zone,true);
      (zone===0?l.guards[zone]:[]).slice(0,this.tuning.guardCount(index)).forEach((kind,i)=>this.spawnGuard(kind,cx+100+(i%3)*70,375+(i%4)*32,zone,false,i));
    });
    const supportCharacter=index%2?'man':'woman',supportName=index%2?'MARANZA':'NORA';
    s.civilians=CENTERS.map((cx,zone)=>this.entity(zone===0?supportCharacter:'protester',cx-160,zone===2?460:420,{hp:90,maxHp:90,waiting:true,rescued:false,zone,character:zone===0?supportCharacter:null,role:['breaker','megaphone','resident','captive'][zone],name:[supportName,'MEGAFONO','DAL PORTONE','FERMATO'][zone]}));
    s.civilian=s.civilians[0];
    if(l.bossKind){
      const e=this.enemyStats('boss');
      const boss=this.entity('boss',2870,385,{...e,maxHp:e.hp,zone:3,active:false,kind:l.bossKind,name:l.bossKind==='trump'?'TRUMP':'IL PRESIDENTE',groundPhase:false,defeated:false,fleeing:false,fled:false,escapeTimer:0,vulnerable:false,phase:0,phaseTime:0,bombCooldown:2.5,w:170,h:170});
      s.enemies.push(boss);s.boss=boss;
      if(l.bossKind==='president'){this.addObject('machine',2690,3);s.machine=s.objects.at(-1);s.machine.vulnerable=false;s.machine.disabled=false;}
    }
    s.objective='Raggiungi la fine dello scenario.';
    this.toast(l.subtitle,4.5);
  }
  addObject(type,x,zone,extra=false){
    if(!type)return;const s=this.state,def=OBJ[type],wealth=LEVELS[s.level].wealth;
    const display=['window','bag','safe','watch','statue','clock','vending'].includes(type);
    const multiplier=type==='window'?1+wealth*.38:type==='safe'||type==='statue'||type==='clock'||type==='supercar'?1+Math.max(0,wealth-3)*.25:1;
    s.objects.push({id:++this.uid,type,x,y:display?378:extra?473:446,...def,value:Math.round(def.value*multiplier),tier:wealth,maxHp:def.hp,zone,destroyed:false,hitFlash:0});
  }
  spawnGuard(kind,x,y,zone,active=false,i=0){
    const def=this.enemyStats(kind),e=this.entity(kind,x,y,{...def,maxHp:def.hp,zone,active,patrolX:x,cooldown:.7+i*.22,reinforcement:active});this.state.enemies.push(e);return e;
  }
  start() { if(this.state.mode==='title') this.state.mode='playing'; return this.state; }
  nextLevel() {
    if(this.state.mode!=='levelclear') return;
    if(this.state.level>=LEVELS.length-1){this.state.mode='victory';return;}
    this.loadLevel(this.state.level+1);this.state.mode='playing';
  }
  toast(text,ttl=3) { if(!this.state.persuasion)this.state.toast={text,ttl:Math.max(ttl,Math.min(6,text.length/22))}; }
  text(text,x,y,color='#ffe06b') { this.particle('text',x,y,{text,color,life:1.05,maxLife:1.05,vy:-27}); }
  particle(type,x,y,extra={}) { this.state.particles.push({type,x,y,z:0,vx:0,vy:0,vz:0,life:.45,maxLife:.45,color:'#ffd36b',...extra}); }
  burst(x,y,color='#ffd36b',count=8) {
    for(let i=0;i<count;i++)this.particle('spark',x,y,{vx:(this.rnd()-.5)*200,vy:-this.rnd()*150,life:.25+this.rnd()*.3,maxLife:.55,color});
  }
  act(e,action,time) {e.action=action;e.anim=0;e.actionTime=time;}
  addMotivation(n) {this.state.motivation=clamp(this.state.motivation+n,0,100);}
  addScore(n,x,y) {
    const s=this.state;const amount=Math.round(n*(1+Math.min(15,s.combo)*.05));s.score+=amount;this.text('+'+amount,x,y);
  }
  hurt(target,amount,source,knock=16) {
    const s=this.state;
    // Police remain immune. Boss hits affect their protective armour only.
    if(target===s.boss&&source===s.player)return this.damageBoss(amount);
    if(s.mode!=='playing'||s.player.dead||s.enemies.includes(target)||ENEMY[target.type]||(!s.enemies.includes(source)&&source?.type!=='bomb'))return false;
    if(target.dead||target.invuln>0||target.captorId||target===s.player&&s.playerArrest)return false;
    if(target===s.player&&target.z>(source?.type==='bomb'?38:24))return false;
    if(target===s.player&&target.blocking&&s.motivation>0){
      const perfect=target.blockAge<=.18&&target.perfectCooldown<=0;
      target.perfectBlock=perfect;target.blockFlash=.28;s.motivation=Math.max(0,s.motivation-(perfect?3:8));
      if(perfect){target.perfectCooldown=.65;target.invuln=.22;this.text('PARATA!',target.x,target.y-95,'#b0efff');this.emit('perfect',{x:target.x});if(s.motivation<=0)this.breakGuard();return true;}
      this.emit('block',{x:target.x});amount*=.25;knock*=.15;if(s.motivation<=0)this.breakGuard();
    }
    target.hp=Math.max(0,target.hp-amount);target.invuln=target===s.player?this.tuning.hitGrace:.8;
    target.knock=(source?Math.sign(target.x-source.x)||1:1)*knock;this.act(target,'hurt',.18);
    this.burst(target.x,target.y-43,'#ffbd91',4);
    if(target===s.player){target.hitPressure=Math.min(4,target.hitPressure+1);s.shake=Math.max(s.shake,3);s.combo=0;this.emit('hurt',{x:target.x,material:'body'});}
    if(target.hp<=0){
      if(target===s.player){target.dead=true;target.deadTimer=1;this.act(target,'down',1);s.mode='gameover';s.defeatReason='health';this.emit('lose');}
      else {target.life=0;target.rescued=true;this.toast((target.name==='MARANZA'?'Maranza':'Nora')+': Devo fermarmi un momento. Ci ritroviamo più avanti.',3);}
    }
    return true;
  }
  damageObject(o,damage,source){
    const s=this.state;if(s.mode!=='playing'||o.destroyed||o.disabled)return false;
    if(o.type==='machine'&&!o.vulnerable){this.burst(o.x,o.y-o.h*.5,'#829cad',3);return false;}
    o.hp=Math.max(0,o.hp-damage);o.hitFlash=.12;this.burst(o.x,o.y-o.h*.5,'#b9efff',6);this.emit('hit',{material:o.type,x:o.x});
    this.addMotivation(source===s.player?3.5:1);
    if(this.witnessVandalism(o))s.alarm=clamp(s.alarm+5,0,100);
    if(o.hp<=0){
      o.destroyed=true;s.objectsDestroyed++;s.stageDestroyed++;this.addScore(o.value,o.x,o.y-o.h);this.addMotivation(18);s.shake=5;this.emit('break',{material:o.type,x:o.x});
      for(let i=0;i<12;i++)this.particle('debris',o.x,o.y-o.h*.4,{vx:(this.rnd()-.5)*180,vy:-this.rnd()*170,life:.6+this.rnd()*.3,maxLife:.9,color:o.type==='window'?'#b5f0f4':'#dfa86b'});
      if(o.type==='bin'||o.type==='vending')s.pickups.push({id:++this.uid,type:'food',x:o.x+15,y:o.y,z:0,life:25,amount:18});
      if(o.type==='machine'){
        this.beginBossGroundPhase();
      }else if(s.time>=s.nextChatter){this.say(s.player,['Era in leasing?','Per quel prezzo pensavo durasse di più.','Questa la chiamano roba di qualità?'][Math.floor(this.rnd()*3)]);s.nextChatter=s.time+8;}
    }
    return true;
  }
  aggro(zone) {
    const s=this.state;
    for(const e of s.enemies)if(!e.dead && !e.retired && e.zone===zone){e.active=true;if(e.action==='idle')this.act(e,'walk',.2);}
  }
  witnessVandalism(object) {
    let witnesses=0;
    for(const e of this.state.enemies){
      if(e.dead||e.retired||e.zone!==this.state.zone||e.type==='boss'||Math.abs(e.x-object.x)>480)continue;
      e.active=true;witnesses++;
      if(e.action==='idle')this.act(e,'walk',.2);
    }
    return witnesses;
  }
  attack(kind='punch') {
    const s=this.state,p=s.player;
    if(s.mode!=='playing'||p.cooldown>0||p.dead||p.action==='special'||p.blocking||s.playerArrest)return;
    const targets=s.objects.filter(o=>!o.destroyed&&!o.disabled&&(o.x-p.x)*p.dir>=-o.w*.4&&Math.abs(o.x-p.x)<=95+o.w*.4&&Math.abs(o.y-p.y)<=55);
    // Strikes need property or exposed boss armour; officers are never targets.
    const boss=s.boss,bossTarget=boss?.groundPhase&&!boss.defeated&&Math.abs(boss.x-p.x)<125&&Math.abs(boss.y-p.y)<58&&(boss.x-p.x)*p.dir>=-35;
    if(!targets.length&&!bossTarget)return;
    p.comboStep=(p.comboStep+1)%3;this.act(p,'punch',.23);p.cooldown=.29;p.swingId++;
    this.emit('swing',{kind:'punch',x:p.x});let hit=false;
    for(const o of targets)hit=this.damageObject(o,p.comboStep===0?30:23,p)||hit;
    if(bossTarget)hit=this.damageBoss(p.comboStep===0?30:23)||hit;
    if(hit){s.combo++;s.comboTime=2.5;if(s.combo%5===0)this.text(s.combo+' COLPI!',p.x,p.y-100,'#ffdb68');}
  }
  special() {
    const s=this.state,p=s.player;
    if(s.mode!=='playing'||p.dead||s.persuasion||p.cooldown>0&&!s.playerArrest)return;
    const listeners=s.enemies.filter(e=>!e.dead&&!e.hidden&&!(e.distractionTime>0)&&e.active&&e.type!=='boss'&&distance(e,p)<=310);
    if(!listeners.length){if(!this.specialHint||s.time-this.specialHint>2){this.toast('Avvicinati a un agente per farti sentire.',2.5);this.specialHint=s.time;}return;}
    if(s.motivation<40){if(!this.specialHint||s.time-this.specialHint>2){this.toast('Servono 40 punti motivazione. Puoi recuperarli rompendo oggetti o incontrando chi ti aiuta.',2.5);this.specialHint=s.time;}return;}
    s.motivation-=40;if(s.playerArrest)this.releasePlayerArrest('persuaded');p.blocking=false;p.cooldown=.85;p.invuln=1.4;this.act(p,'special',.85);
    this.emit('special',{x:p.x});this.particle('wave',p.x,p.y-35,{life:.9,maxLife:.9,color:'#71e9d0'});
    let replyId=null;
    for(const e of [...s.enemies].sort((a,b)=>Number(!!b.captiveId)-Number(!!a.captiveId))){
      if(e.dead||e.hidden||e.distractionTime>0||!e.active||distance(e,p)>310||e.type==='boss')continue;
      if(e.captiveId)this.releaseArrest(e,'persuaded');
      replyId??=e.id;e.attackTimer=0;e.cooldown=1.1;e.stoodDown=8;this.act(e,'idle',0);
      if(!e.persuaded){e.persuaded=true;s.recruited++;}
    }
    if(s.boss?.active&&s.machine&&!s.machine.destroyed&&!s.machine.disabled&&distance(s.machine,p)<500){s.boss.openTime=5;s.boss.vulnerable=true;s.machine.vulnerable=true;}
    const appeal='L’affitto lo paghi anche tu. Ti sembra che questi facciano i tuoi interessi?';
    const reply='Già… quando servono a noi, i soldi non ci sono mai.';
    s.persuasion={speakerId:p.id,replyId,phase:'appeal',text:appeal,remaining:2.8,appeal,reply,speakerName:p.name};
    for(const a of [p,...s.enemies,...s.allies,...s.civilians])a.bubble=null;
    s.toast.ttl=0;s.nextChatter=s.time+10;s.alarm=Math.max(0,s.alarm-25);
  }
  updatePersuasion(dt){
    const s=this.state,q=s.persuasion;if(!q)return;
    q.remaining-=dt;if(q.remaining>0)return;
    if(q.phase==='appeal'&&q.replyId!==null){q.phase='reply';q.speakerId=q.replyId;q.speakerName='AGENTE';q.text=q.reply;q.remaining=3;}
    else s.persuasion=null;
  }
  beginBossGroundPhase(){
    const s=this.state,boss=s.boss;if(!boss||boss.groundPhase)return;
    if(s.machine){s.machine.disabled=true;s.machine.vulnerable=false;}
    s.bombs=[];boss.active=true;boss.groundPhase=true;boss.vulnerable=false;boss.phaseTime=0;boss.x=2820;boss.y=448;boss.cooldown=0;this.act(boss,'walk',0);
    this.toast(boss.kind==='trump'?'Trump ha blindato il passaggio. La sua corazza si apre fra un attacco e l’altro.':s.machine?.destroyed?'La macchina si ferma. Il Presidente scende a difendere l’ingresso.':'Il Presidente interrompe il bombardamento e blocca l’ingresso con la sua corazza.',4);
  }
  damageBoss(amount){
    const s=this.state,e=s.boss;if(s.mode!=='playing'||!e?.groundPhase||(s.machine&&!(s.machine.destroyed||s.machine.disabled))||!e.vulnerable||e.invuln>0||e.defeated)return false;
    e.hp=Math.max(0,e.hp-amount);e.invuln=.18;this.burst(e.x,e.y-65,'#ffd88b',7);this.emit('hit',{x:e.x,material:'metal'});this.addMotivation(2);
    if(e.hp<=0)this.beginBossEscape();return true;
  }
  beginBossEscape(){
    const s=this.state,e=s.boss;if(!e||e.defeated)return;
    e.defeated=true;e.vulnerable=false;e.fleeing=true;e.fled=false;e.escapeTimer=0;e.dir=1;e.z=0;e.vz=0;e.knock=0;e.dead=false;e.invuln=0;e.attackTimer=0;e.active=false;this.act(e,'flee',0);
    s.mode='bossescape';s.bombs=[];s.persuasion=null;s.cameraX=clamp(e.x-690,0,W-960);s.player.blocking=false;s.player.knock=0;s.player.z=0;s.player.vz=0;this.guardHeld=false;
    if(s.playerArrest)this.releasePlayerArrest('escape');
    for(const actor of [s.player,...s.enemies,...s.allies,...s.civilians])actor.bubble=null;
    for(const guard of s.enemies)if(guard!==e){guard.active=false;guard.attackTimer=0;guard.knock=0;guard.grabbingPlayer=false;this.act(guard,'idle',0);}
    this.act(s.player,'idle',0);for(const ally of s.allies)this.act(ally,'idle',0);this.say(e,e.kind==='trump'?'La limousine! E qualcuno recuperi lo scontrino!':'Dov’è l’uscita di servizio? Chiedo per ragioni di Stato.',3.2,true);
    this.toast(e.kind==='trump'?'Trump abbandona la corazza e scappa. Il passaggio è libero.':'Il Presidente abbandona la corazza e corre verso l’auto.',3.2);
    s.objective='La corazza è fuori uso. Il passaggio è libero.';
  }
  updateBossEscape(dt){
    const s=this.state,e=s.boss;if(!e)return;
    s.time+=dt;s.toast.ttl=Math.max(0,s.toast.ttl-dt);s.shake=Math.max(0,s.shake-dt*14);
    const previous=e.escapeTimer;e.escapeTimer=Math.min(3.2,e.escapeTimer+dt);e.anim+=dt;e.dir=1;e.action='flee';
    // Hold the reveal before the clear, upright run toward the right-hand exit.
    const runDt=Math.max(0,e.escapeTimer-1.1)-Math.max(0,previous-1.1);
    if(runDt>0)e.x+=Math.max(220,(s.cameraX+1060-e.x)/Math.max(.001,3.2-Math.max(1.1,previous)))*runDt;
    if(e.bubble)e.bubble.ttl=Math.max(0,e.bubble.ttl-dt);
    for(const actor of [s.player,...s.allies,...s.civilians])actor.anim+=dt;
    for(const part of s.particles){part.life-=dt;part.x+=part.vx*dt;part.y+=part.vy*dt;}
    s.particles=s.particles.filter(part=>part.life>0);
    if(e.escapeTimer>=3.2){
      e.fleeing=false;e.fled=true;e.hidden=true;e.bubble=null;s.bossFled=e.kind;s.zoneCleared[3]=true;s.levelProgress=1;
      s.mode=LEVELS[s.level].final?'victory':'levelclear';s.score+=LEVELS[s.level].final?10000+s.recruited*300+s.freed*200:3000;
      s.objective=LEVELS[s.level].final?'Un primo passo è fatto. C’è ancora molto da fare.':'Trump è scappato. Il corteo riparte.';
      this.toast(s.objective,8);this.emit('win');
    }
  }
  breakGuard(){const p=this.state.player;p.blocking=false;p.guardBroken=1.1;this.emit('guardbreak',{x:p.x});this.toast('Motivazione esaurita. Cerca un aiuto o rompi un oggetto per recuperarla.',2.5);}
  updateGuard(dt,held){
    const s=this.state,p=s.player;p.guardBroken=Math.max(0,p.guardBroken-dt);p.perfectCooldown=Math.max(0,p.perfectCooldown-dt);p.blockFlash=Math.max(0,p.blockFlash-dt);p.hitPressure=Math.max(0,p.hitPressure-dt*.12);
    const fresh=held&&!this.guardHeld;this.guardHeld=held;
    p.blockHeld=held?p.blockHeld+dt:0;p.blocking=!!held&&s.motivation>0&&p.guardBroken<=0&&p.z===0&&p.action!=='special'&&!s.playerArrest;
    if(p.blocking){p.blockAge=fresh?0:p.blockAge+dt;if(fresh)s.motivation=Math.max(0,s.motivation-1);s.motivation=Math.max(0,s.motivation-4*dt);if(s.motivation<=0)this.breakGuard();else if(p.action!=='hurt')this.actIf(p,'block');}
    else {p.blockAge=1;if(p.action==='block')this.act(p,'idle',0);}
  }
  grabPlayer(e){
    const s=this.state,p=s.player;if(s.playerArrest||p.arrestImmunity>0||p.z>16||p.dead||e.stoodDown>0)return false;
    e.active=true;s.playerArrest={captorId:e.id,remaining:this.tuning.hold,duration:this.tuning.hold,escapeProgress:0};e.grabbingPlayer=true;p.blocking=false;p.knock=0;p.cooldown=0;p.action='held';p.actionTime=0;
    this.toast('Tieni una direzione per liberarti oppure usa Convinci.',3);this.emit('arrest',{x:p.x});return true;
  }
  releasePlayerArrest(reason='escape'){
    const s=this.state,p=s.player;if(!s.playerArrest)return;const e=s.enemies.find(e=>e.id===s.playerArrest.captorId);
    if(e){e.grabbingPlayer=false;e.cooldown=2.5;this.act(e,'idle',0);}
    s.playerArrest=null;p.arrestImmunity=this.tuning.grace;p.invuln=1.2;p.hitPressure=0;p.blockHeld=0;this.act(p,'idle',0);this.toast(reason==='persuaded'?'L’agente allenta la presa. Puoi passare.':'Sei libero. Allontanati dalla pattuglia.',2.4);
  }
  updatePlayerArrest(dt,input){
    const s=this.state,a=s.playerArrest,p=s.player;if(!a)return;
    const e=s.enemies.find(e=>e.id===a.captorId);if(!e){this.releasePlayerArrest();return;}
    a.remaining-=dt;p.action='held';p.z=0;p.vz=0;
    if(Math.hypot(input.x||0,input.y||0)>.25&&s.motivation>0){const effort=Math.min(s.motivation,20*dt);s.motivation-=effort;a.escapeProgress=Math.min(1,a.escapeProgress+effort/20);if(a.escapeProgress>=.999){this.releasePlayerArrest();return;}}
    if(a.remaining<=0){s.mode='gameover';s.defeatReason='arrest';p.dead=true;p.deadTimer=1;p.action='held';this.emit('cuffs',{x:p.x});this.emit('lose');}
  }
  updateDistraction(e,dt){
    const s=this.state,c=s.civilians.find(c=>c.id===e.distractionId);e.distractionTime=Math.max(0,e.distractionTime-dt);
    if(e.distractionTime<=1.5&&!e.returnWarning){e.returnWarning=true;this.toast('La pattuglia torna da sinistra. Tieniti pronto.',2);this.emit('radio',{x:s.cameraX});}
    if(e.distractionTime<=0){e.hidden=false;e.distractionId=null;e.returnWarning=false;e.x=Math.max(25,s.cameraX-60);e.y=e.returnY;e.active=true;e.cooldown=2;this.act(e,'walk',0);return;}
    if(e.hidden)return;e.dir=-1;this.actIf(e,'walk');const targetX=c?.x??s.cameraX-180;e.x-=Math.min(250*dt,Math.max(0,e.x-targetX-45));e.y+=(s.player.y-e.y)*Math.min(dt*2,1);
    if(e.x<s.cameraX-110)e.hidden=true;
  }
  update(dt,input={}) {
    const s=this.state;dt=clamp(Number(dt)||0,0,.05);
    if(s.mode==='bossescape'){this.updateBossEscape(dt);return;}
    if(s.mode!=='playing')return;
    s.time+=dt;s.shake=Math.max(0,s.shake-dt*14);s.toast.ttl=Math.max(0,s.toast.ttl-dt);
    s.comboTime-=dt;if(s.comboTime<=0)s.combo=0;
    s.alarm=Math.max(0,s.alarm-dt*1.3);
    const p=s.player;
    this.tickEntity(p,dt);this.updatePersuasion(dt);this.updateChatter(dt);this.updateGuard(dt,!!(input.kick||input.protect));
    if(input.special)this.special();this.updatePlayerArrest(dt,input);
    if(input.jump && !this.jumpHeld && p.z===0 && !(p.jumpCooldown>0) && p.action!=='special'&&!p.blocking&&!s.playerArrest){p.vz=390;this.act(p,'jump',.7);this.emit('jump',{x:p.x});}
    this.jumpHeld=!!input.jump;
    if(input.punch)this.attack('punch');
    if(s.mode!=='playing')return;
    const ix=clamp(input.x||0,-1,1),iy=clamp(input.y||0,-1,1),len=Math.max(1,Math.hypot(ix,iy));
    p.moveX=0;p.moveY=0;
    const locked=p.action==='special'||p.action==='hurt'||!!s.playerArrest;
    if(!locked){
      const speed=p.blocking?85:p.action==='punch'?75:185;
      p.moveX=ix/len*speed;p.moveY=iy/len*speed*.72;
      p.x+=p.moveX*dt;p.y+=p.moveY*dt;
      if(ix)p.dir=ix>0?1:-1;
      if(p.actionTime<=0&&!p.blocking){if(ix||iy){if(p.action!=='walk')this.act(p,'walk',0);}else if(p.z===0&&p.action!=='idle')this.act(p,'idle',0);}
    }
    p.x=clamp(p.x,30,s.gateX??W-35);p.y=clamp(p.y,FLOOR_MIN,FLOOR_MAX);
    if(p.action==='walk'&&p.z===0){p.stepClock=(p.stepClock||0)+dt;if(p.stepClock>.29){p.stepClock=0;this.emit('step',{x:p.x,material:LEVELS[s.level].wealth>1?'stone':'asphalt'});}}
    this.updateEncounters(dt);
    for(const e of [...s.enemies]){if(s.mode!=='playing')break;this.updateEnemy(e,dt);}
    if(s.mode!=='playing')return;
    for(const a of [...s.allies]){if(s.mode!=='playing')break;this.updateAlly(a,dt);}
    if(s.mode!=='playing')return;
    this.updateCivilian(dt);
    this.updateBombs(dt);
    for(const o of s.objects)o.hitFlash=Math.max(0,o.hitFlash-dt);
    for(const pickup of s.pickups){
      pickup.life-=dt;
      if(distance(p,pickup)<45){pickup.life=0;if(pickup.type==='food')p.hp=Math.min(p.maxHp,p.hp+pickup.amount);else this.addMotivation(pickup.amount);this.emit('pickup');this.text(pickup.type==='food'?'+'+pickup.amount+' VITA':'MOTIVAZIONE',pickup.x,pickup.y-40,'#90f3b0');}
    }
    s.pickups=s.pickups.filter(v=>v.life>0);
    for(const part of s.particles){part.life-=dt;part.x+=part.vx*dt;part.y+=part.vy*dt;if(part.type==='spark'||part.type==='debris')part.vy+=330*dt;}
    s.particles=s.particles.filter(v=>v.life>0);
    s.enemies=s.enemies.filter(e=>!e.dead||e.deadTimer>0);s.allies=s.allies.filter(e=>(!e.dead||e.deadTimer>0)&&e.life>0&&!e.arrested);
    const camTarget=clamp(p.x-365,0,W-960);s.cameraX+=(camTarget-s.cameraX)*Math.min(1,dt*7);
    s.levelProgress=clamp(p.x/(W-120),0,1);
    if(s.mode==='playing'&&!LEVELS[s.level].bossKind&&p.x>W-145&&s.zoneCleared.every(Boolean)){s.mode='levelclear';s.score+=750+s.level*250;this.emit('win');}
  }
  tickEntity(e,dt){
    if(e===this.state.player)e.jumpCooldown=Math.max(0,(e.jumpCooldown||0)-dt);
    if(e.bubble){e.bubble.ttl-=dt;if(e.bubble.ttl<=0)e.bubble=null;}e.arrestImmunity=Math.max(0,(e.arrestImmunity||0)-dt);
    e.scattered=Math.max(0,(e.scattered||0)-dt);e.anim+=dt;e.cooldown=Math.max(0,e.cooldown-dt);e.invuln=Math.max(0,e.invuln-dt);e.actionTime=Math.max(0,e.actionTime-dt);
    if(e.dead){e.deadTimer-=dt;return;}
    if(e.knock){e.x+=e.knock*dt*10;e.knock*=Math.max(0,1-dt*10);if(Math.abs(e.knock)<.2)e.knock=0;}
    if(e.z>0||e.vz>0){e.z+=e.vz*dt;e.vz-=920*dt;if(e.z<=0){e.z=0;e.vz=0;if(e.action==='jump')this.act(e,'idle',0);if(e===this.state.player){e.jumpCooldown=this.tuning.jumpRecovery;this.emit('land',{x:e.x});}}}
    if(e.actionTime<=0&&e.action!=='idle'&&e.action!=='walk'&&e.action!=='windup')this.act(e,'idle',0);
  }
  updateEncounters(dt){
    const s=this.state,p=s.player,l=LEVELS[s.level];s.zoneTime+=dt;
    for(let zone=0;zone<CENTERS.length;zone++){
      if(s.zoneCleared[zone])continue;
      if(zone===3&&l.bossKind){
        s.zone=3;s.gateX=null;s.objective=l.bossKind==='trump'?'Aspetta che la corazza si apra e mettila fuori uso.':'Il bombardamento continua. Raggiungi il palazzo.';
        if(l.bossKind==='trump')this.beginBossGroundPhase();
        if(p.x>CENTERS[3]-240){s.boss.active=true;if(p.x>=2820)this.beginBossGroundPhase();s.objective=s.boss.groundPhase?(l.bossKind==='trump'?'Aspetta che la corazza si apra e mettila fuori uso.':'Schiva gli attacchi e colpisci i pannelli quando si aprono.'):'Il bombardamento continua. Raggiungi il palazzo.';}
        break;
      }
      if(p.x>GATES[zone]-45){
        s.zoneCleared[zone]=true;s.zone=zone+1;s.zoneTime=0;s.gateX=GATES[zone+1]??null;
        for(const e of s.enemies)if(e.zone<=zone&&e.captiveId){const c=s.civilians.find(c=>c.id===e.captiveId);if(c){c.rescued=true;c.captorId=null;}s.arrest=null;}
        s.enemies=s.enemies.filter(e=>e.type==='boss'||e.zone>zone);
        if(s.zone<CENTERS.length&&!(l.bossKind&&s.zone===3))l.guards[s.zone].slice(0,this.tuning.guardCount(s.level)).forEach((kind,i)=>this.spawnGuard(kind,CENTERS[s.zone]+100+i*70,375+i*32,s.zone,false,i));
        this.toast(zone<3?'Da qui si passa. Continua verso destra.':'L’uscita è più avanti →',2.5);
        s.alarm=Math.max(0,s.alarm-20);
        if(this.tuning.checkpointHeal>0)s.pickups.push({id:++this.uid,type:'food',x:GATES[zone]+38,y:p.y,z:0,life:90,amount:this.tuning.checkpointHeal});
      }else{
        s.zone=zone;s.gateX=GATES[zone];s.objective='Raggiungi la fine dello scenario.';
        break;
      }
    }
  }

  updateEnemy(e,dt){
    const s=this.state,p=s.player;this.tickEntity(e,dt);if(e.dead)return;
    if(!(e.distractionTime>0))e.x=clamp(e.x,20,W-20);e.y=clamp(e.y,FLOOR_MIN,FLOOR_MAX);
    if(e.distractionTime>0){this.updateDistraction(e,dt);return;}
    if(e.grabbingPlayer){this.actIf(e,'idle');return;}
    if(e.captiveId){this.updateArrest(e,dt);return;}
    if(e.stoodDown>0){e.stoodDown=Math.max(0,e.stoodDown-dt);this.actIf(e,'idle');if(e.stoodDown===0){e.cooldown=.8;this.say(e,'Tutte le unità, riprendere l’avanzata.',2.8,true);}return;}
    if(e.retired||e.zone<s.zone){e.active=false;this.act(e,'idle',0);return;}
    // Patrols attack on proximity, independent of property damage.
    if(!e.active && e.type!=='boss' && Math.abs(e.x-p.x)<480 && e.zone===s.zone){e.active=true;this.act(e,'walk',0);}
    if(!e.active){e.action='idle';e.dir=p.x<e.x?-1:1;return;}
    if(e.type==='boss'){this.updateBoss(e,dt);return;}
    if(e.action==='hurt'&&e.actionTime>0||s.playerArrest)return;
    const target=p;
    if(e.action==='windup'){
      e.attackTimer-=dt;
      if(e.attackTimer<=0){
        this.act(e,'punch',.3);e.cooldown=this.tuning.recovery+this.rnd()*.4;
        if(((target.x-e.attackX)/42)**2+((target.y-e.attackY)/22)**2<1){if(e.attackKind==='grab')this.grabPlayer(e);else this.hurt(target,e.damage,e,22);}
      }
      return;
    }
    if(e.actionTime>0&&e.action==='punch')return;
    const dx=target.x-e.x,dy=target.y-e.y;e.dir=dx<0?-1:1;
    if(Math.abs(dx)<e.reach&&Math.abs(dy)<26&&e.cooldown<=0){
      const t=this.tuning,attempt=t.proactive&&(e.id+Math.floor(s.time/4))%t.proactive===0;
      e.attackKind=p.arrestImmunity<=0&&(p.blockHeld>t.grabAfter||p.hitPressure>=t.grabPressure||attempt)?'grab':'baton';
      e.attackDuration=e.attackKind==='grab'?t.grabWindup:e.windup;
      const lead=e.attackDuration*t.predict;
      e.attackX=clamp(p.x+(p.moveX||0)*lead,30,W-35);e.attackY=clamp(p.y+(p.moveY||0)*lead,FLOOR_MIN,FLOOR_MAX);
      e.attackTimer=e.attackDuration;this.act(e,'windup',e.attackTimer);return;
    }
    if(Math.abs(dx)>e.reach*.8 || Math.abs(dy)>20){
      e.x+=Math.sign(dx)*e.speed*dt*(Math.abs(dx)>e.reach*.75?1:.15);e.y+=Math.sign(dy)*e.speed*.65*dt*(Math.abs(dy)>8?1:0);if(e.action!=='walk')this.act(e,'walk',0);
    } else if(e.action!=='idle')this.act(e,'idle',0);
    // Subtle separation keeps enemies readable and prevents a single sprite pile.
    for(const other of s.enemies)if(other!==e&&!other.dead&&other.active&&Math.abs(e.x-other.x)<23&&Math.abs(e.y-other.y)<16)e.y+=(e.id>other.id?1:-1)*19*dt;
  }
  updateAlly(a,dt){
    const s=this.state,p=s.player;this.tickEntity(a,dt);if(a.captorId||a.arrested||a.dead)return;
    a.life-=dt;if(a.action==='hurt'&&a.actionTime>0)return;
    if(a.life<=1){a.x-=210*dt;this.actIf(a,'walk');return;}
    const dx=p.x-65-a.x,dy=p.y+25-a.y;a.dir=p.dir;
    if(Math.abs(dx)>12||Math.abs(dy)>10){a.x+=Math.sign(dx)*Math.min(Math.abs(dx),215*dt);a.y+=Math.sign(dy)*Math.min(Math.abs(dy),125*dt);this.actIf(a,'walk');}else this.actIf(a,'idle');
    a.y=clamp(a.y,FLOOR_MIN,FLOOR_MAX);
    if(a.cooldown<=0&&p.action==='punch'){
      const target=s.objects.find(o=>!o.destroyed&&!o.disabled&&Math.abs(o.x-p.x)<120+o.w*.4&&Math.abs(o.y-p.y)<55&&Math.abs(o.x-a.x)<120+o.w*.4&&Math.abs(o.y-a.y)<65);
      if(target){a.dir=target.x>a.x?1:-1;this.act(a,'punch',.25);a.cooldown=.9;this.damageObject(target,13,a);}
    }
  }
  actIf(e,action){if(e.actionTime<=0&&e.action!==action)this.act(e,action,0);}
  updateCivilian(dt){
    const s=this.state,p=s.player;
    for(const c of s.civilians){
      if(c.rescued)continue;c.anim+=dt;
      if(c.distractionTime>0){c.distractionTime=Math.max(0,c.distractionTime-dt);c.action='walk';c.dir=-1;c.x=Math.max(c.exitX,c.x-235*dt);if(c.x<=c.exitX)c.distractionPhase='away';if(c.distractionTime<=0){c.distractionPhase='done';c.rescued=true;}continue;}if(c.bubble){c.bubble.ttl-=dt;if(c.bubble.ttl<=0)c.bubble=null;}
      if(c.leaving){c.life-=dt;c.x-=190*dt;c.action='walk';if(c.life<=0)c.rescued=true;continue;}
      if(c.role==='captive'){
        if(!c.captorId&&!c.encountered&&c.zone===s.zone&&Math.abs(c.x-p.x)<350){
          const e=s.enemies.find(e=>e.zone===s.zone&&e.type!=='boss'&&!e.captiveId&&!e.grabbingPlayer&&!(e.distractionTime>0));
          if(e){c.encountered=true;c.x=e.x-48;c.y=e.y;this.tryArrest(e,c);}
        }continue;
      }
      if(distance(c,p)>=90)continue;
      c.rescued=true;s.rescued++;this.addMotivation(20);this.emit('pickup');
      if(c.role==='breaker'){
        if(!s.allies.length){const a=this.entity(c.character,c.x,c.y,{hp:100,maxHp:100,life:12,loyal:true,cooldown:.6,role:'breaker',character:c.character,name:c.name});s.allies.push(a);this.say(a,'Ti aiuto con questa, poi raggiungo gli altri.',3.5,true);this.toast((c.name==='MARANZA'?'Maranza':'Nora')+' ti dà una mano per qualche secondo.',3);}
      }else if(c.role==='megaphone'){
        c.rescued=false;c.encountered=true;c.waiting=false;c.distractionPhase='running';c.distractionTime=7;c.exitX=s.cameraX-200;c.dir=-1;c.action='walk';
        const guards=s.enemies.filter(e=>e.type!=='boss'&&!e.captiveId&&!e.grabbingPlayer&&Math.abs(e.x-p.x)<520).slice(0,2);
        for(const e of guards){e.distractionId=c.id;e.distractionTime=7;e.returnWarning=false;e.returnX=e.x;e.returnY=e.y;e.stoodDown=0;e.attackTimer=0;e.hidden=false;this.act(e,'walk',0);}
        this.say(c,'Ehi! Il megafono è qui! Da questa parte!',2.5,true);this.toast('La pattuglia lo insegue. Approfittane per passare.',3);this.particle('wave',c.x,c.y-35,{life:.9,maxLife:.9,color:'#71e9d0'});
      }else {s.pickups.push({id:++this.uid,type:'food',x:c.x,y:c.y,z:0,life:30,amount:25});this.say(p,'Grazie. Ci voleva proprio.',2.8,true);this.toast('Qualcuno ti passa dell’acqua. Recuperi 25 punti salute.',3);}
    }
  }

  say(entity,text,ttl=3.4,priority=false){
    if(!entity||entity.dead||this.state.persuasion)return;
    const actors=[this.state.player,...this.state.allies,...this.state.enemies,...this.state.civilians].filter(Boolean);
    if(priority)for(const actor of actors)actor.bubble=null;
    else if(actors.filter(a=>a.bubble).length>=2)return;
    entity.bubble={text,ttl};
  }
  updateChatter(){
    const s=this.state;if(s.time<s.nextChatter||s.arrest||s.playerArrest||s.persuasion)return;
    s.nextChatter=s.time+8+this.rnd()*5;
    const allies=s.allies.filter(a=>!a.dead&&!a.captorId&&Math.abs(a.x-s.player.x)<360);
    const enemies=s.enemies.filter(e=>!e.dead&&!e.hidden&&e.active&&!(e.stoodDown>0)&&Math.abs(e.x-s.player.x)<390);
    const pool=[s.player,...allies,...enemies];const who=pool[Math.floor(this.rnd()*pool.length)];
    const phrases=who.type==='boss'?(who.kind==='trump'?['È oro vero. Attenti a dove mettete le mani.','Questi danni ve li fatturo!','Dov’è finito il mio consulente?']:['Questa corazza è una spesa per la sicurezza.','Era tutto previsto.','Il comunicato dirà che ho vinto io.']):who===s.player?['Di qui si passa.','Occhio, stanno avanzando.','Aspettate chi è rimasto dietro.','Ci ritroviamo più avanti.']:allies.includes(who)?['A questa ti do una mano.','Vai, ti raggiungo.','Occhio, ne arrivano altri.','Restiamo a portata di voce.']:['Liberate il passaggio!','Aspettate il segnale.','Richiedo rinforzi.','Avanzare in formazione!'];
    this.say(who,phrases[Math.floor(this.rnd()*phrases.length)]);
  }
  tryArrest(e,captive){
    const s=this.state,a=captive||s.civilians.find(c=>c.role==='captive'&&!c.rescued&&!c.captorId&&!c.leaving&&distance(c,e)<83);
    if(!a||s.arrest||e.type==='boss'||e.captiveId||e.grabbingPlayer||e.distractionTime>0)return false;
    e.active=true;e.captiveId=a.id;e.arrestTimer=this.easy?12:this.hard?9:10;e.arrestDuration=e.arrestTimer;e.arrestWindup=.85;e.knock=0;
    a.captorId=e.id;a.knock=0;a.actionTime=0;
    s.arrest={allyId:a.id,captorId:e.id,remaining:e.arrestTimer,duration:e.arrestDuration};
    this.act(e,'windup',.85);this.act(a,'hurt',.85);this.say(a,'Mi hanno preso! Prova a parlarci!',4,true);
    this.toast('Puoi aiutarlo: avvicinati e usa Convinci.',4);this.emit('arrest',{x:e.x});return true;
  }
  updateArrest(e,dt){
    const s=this.state,a=s.civilians.find(a=>a.id===e.captiveId);
    if(!a||a.dead||a.arrested||e.dead||!s.enemies.includes(e)){this.releaseArrest(e,'lost');return;}
    if(e.arrestWindup>0){e.arrestWindup-=dt;return;}
    e.arrestTimer-=dt;s.arrest.remaining=e.arrestTimer;
    // The escort stays on screen for the rescue window, then takes the ally away.
    e.dir=1;this.actIf(e,'walk');e.x=Math.min(e.x+22*dt,s.cameraX+865,W-70);e.y+=Math.sign(470-e.y)*Math.min(12*dt,Math.abs(470-e.y));
    a.x=e.x-53;a.y=e.y+10;a.dir=1;a.action='hurt';a.actionTime=.1;a.z=0;
    if(e.arrestTimer<=0){
      a.arrested=true;a.rescued=true;a.life=0;a.bubble=null;a.captorId=null;e.captiveId=null;e.cooldown=1;s.arrest=null;s.arrested++;
      this.say(e,'Vieni con noi.',3,true);this.toast('Il manifestante viene portato via. Puoi proseguire.',3.8);this.emit('cuffs',{x:e.x});
    }
  }
  releaseArrest(e,reason){
    const s=this.state,a=s.civilians.find(a=>a.id===e.captiveId);if(!e.captiveId)return;
    e.captiveId=null;e.cooldown=Math.max(1,e.cooldown);e.arrestTimer=0;s.arrest=null;
    if(a){a.captorId=null;a.leaving=true;a.life=2;a.arrestImmunity=18;a.invuln=1.3;a.actionTime=0;this.act(a,'idle',0);
      if(reason!=='lost'){s.freed++;a.hp=Math.min(a.maxHp,a.hp+16);this.addMotivation(12);this.addScore(500,a.x,a.y-90);this.say(a,'Grazie! Gli altri sono di là, vi raggiungo.',2,true);this.toast('Manifestante liberato. Bonus soccorso.',2.5);this.emit('rescue',{x:a.x});}
    }
  }
  updateBoss(e,dt){
    const s=this.state,p=s.player;e.phaseTime+=dt;e.dir=p.x<e.x?-1:1;
    if(e.groundPhase){
      if(e.defeated)return;const phase=e.phaseTime%5;e.vulnerable=phase>1.1&&phase<this.tuning.bossOpen&&e.action!=='windup';
      if(e.action==='windup'){e.attackTimer-=dt;if(e.attackTimer<=0){this.act(e,'punch',.35);e.cooldown=this.easy?1.5:this.hard?.9:1.15;if(((p.x-e.attackX)/65)**2+((p.y-e.attackY)/32)**2<1)this.hurt(p,e.damage,e,30);}return;}
      if(e.action==='punch'&&e.actionTime>0)return;
      const dx=p.x-e.x,dy=p.y-e.y;
      if(Math.abs(dx)<100&&Math.abs(dy)<32&&e.cooldown<=0&&phase<1.1){e.attackKind='slam';e.attackX=p.x;e.attackY=p.y;e.attackDuration=this.tuning.bossWindup;e.attackTimer=e.attackDuration;this.act(e,'windup',e.attackDuration);e.vulnerable=false;return;}
      if(Math.abs(dx)>82||Math.abs(dy)>20){e.x+=Math.sign(dx)*this.tuning.bossSpeed*dt;e.y+=Math.sign(dy)*this.tuning.bossSpeed*(42/65)*dt;this.actIf(e,'walk');}else this.actIf(e,'idle');return;
    }
    if(e.openTime>0){e.openTime-=dt;e.vulnerable=true;}else e.vulnerable=e.phaseTime%10>5.8;
    e.phase=e.vulnerable?1:0;s.machine.vulnerable=e.vulnerable;this.actIf(e,'idle');
    e.bombCooldown-=dt;
    if(!e.vulnerable&&e.bombCooldown<=0){
      e.bombCooldown=(s.machine.hp<s.machine.maxHp*.4?1.7:2.4)*this.tuning.bombRate;
      const amount=s.machine.hp<s.machine.maxHp*.5?3:2;
      for(let i=0;i<amount;i++){
        const x=i===0?p.x:clamp(p.x+(this.rnd()-.5)*360,CENTERS[3]-280,W-50),y=i===0?p.y:370+this.rnd()*100;
        s.bombs.push({id:++this.uid,x,y,r:49,timer:1.5+i*.15,duration:1.5+i*.15,exploded:false,life:.35});
      }
    }
    if(e.vulnerable&&e.phaseTime%10>5.8&&e.phaseTime%10<5.8+dt+.01)this.toast('La macchina sta ricaricando. Ora è esposta.',2);
    if(!e.escortSpawned){
      e.escortSpawned=true;for(let i=0;i<3;i++)this.spawnGuard(i===0?'cop':'elite',2440+i*145,370+(i%3)*45,3,true,i);
      this.toast('Le zone rosse indicano dove cadranno le bombe. Allontanati prima dell’impatto.',4);
    }
  }
  updateBombs(dt){
    const s=this.state;
    for(const b of s.bombs){
      if(!b.exploded){b.timer-=dt;if(b.timer<=0){
        b.exploded=true;b.life=.35;this.emit('bomb',{x:b.x});s.shake=7;this.burst(b.x,b.y-10,'#ff9b55',18);
        const source={x:b.x,y:b.y,type:'bomb'};
        if(distance(s.player,b)<b.r+18)this.hurt(s.player,Math.round(17*this.damageScale),source,28);
        for(const a of s.allies)if(!a.dead&&!a.captorId&&distance(a,b)<b.r+12)this.hurt(a,15,source,20);
      }}else b.life-=dt;
    }
    s.bombs=s.bombs.filter(b=>!b.exploded||b.life>0);
  }
  snapshot(){
    const s=this.state;return {mode:s.mode,level:s.level,levelName:s.levelName,score:s.score,hp:s.player.hp,motivation:s.motivation,persuasion:s.persuasion,blocking:s.player.blocking,playerArrest:s.playerArrest,defeatReason:s.defeatReason,alarm:s.alarm,zone:s.zone,gateX:s.gateX,objective:s.objective,player:{x:s.player.x,y:s.player.y,z:s.player.z,action:s.player.action,character:s.player.character,name:s.player.name},enemies:s.enemies.filter(e=>!e.dead).map(e=>({type:e.type,x:e.x,y:e.y,hp:e.hp,active:e.active,zone:e.zone})),objects:s.objects.map(o=>({type:o.type,x:o.x,y:o.y,hp:o.hp,destroyed:o.destroyed,zone:o.zone})),allies:s.allies.length,allyTypes:s.allies.map(a=>a.type),bossFled:s.bossFled,boss:s.boss?{hp:s.boss.hp,maxHp:s.boss.maxHp,active:s.boss.active,vulnerable:s.boss.vulnerable,kind:s.boss.kind,defeated:s.boss.defeated,fleeing:s.boss.fleeing,fled:s.boss.fled,escapeTimer:s.boss.escapeTimer}:null,machine:s.machine?{hp:s.machine.hp,maxHp:s.machine.maxHp,vulnerable:s.machine.vulnerable,destroyed:s.machine.destroyed,disabled:s.machine.disabled}:null,objectsDestroyed:s.objectsDestroyed,kills:s.kills,recruited:s.recruited,rescued:s.rescued,arrested:s.arrested,freed:s.freed,arrest:s.arrest?{...s.arrest}:null,time:s.time};
  }
}

export { LEVELS };
