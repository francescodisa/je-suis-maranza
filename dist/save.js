// Keep the storage key so older runs can be moved to the new rules safely.
import { LEVELS } from './campaign.js';
export const SAVE_KEY='maranza-run-v1';
const allowedModes=['playing','levelclear','bossescape'];
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const entity=e=>e&&finite(e.id)&&finite(e.x)&&finite(e.y)&&finite(e.hp)&&finite(e.maxHp)&&typeof e.type==='string';
const incomplete=()=>{throw new Error('Salvataggio incompleto.');};
export function createSave(game,now=Date.now()){
 if(!allowedModes.includes(game.state.mode))throw new Error('Nessuna partita in corso.');
 const {boss,civilian,machine,...state}=game.state;
 return JSON.stringify({version:7,savedAt:now,difficulty:game.difficulty,seed:game.seed,uid:game.uid,bossId:boss?.id??null,civilianId:civilian?.id??null,machineId:machine?.id??null,runtime:{jumpHeld:!!game.jumpHeld,guardHeld:!!game.guardHeld,specialHint:game.specialHint??null},state},(_,v)=>v===Infinity?'@infinity':v);
}
export function readSave(raw){
 if(typeof raw!=='string'||raw.length>2000000)throw new Error('Salvataggio non disponibile.');
 const data=JSON.parse(raw,(_,v)=>v==='@infinity'?Infinity:v),s=data?.state;
 if(![1,2,3,4,5,6,7].includes(data?.version)||!finite(data.savedAt)||!['facile','normale','difficile'].includes(data.difficulty)||!Number.isInteger(data.seed)||!Number.isInteger(data.uid)||!s||!allowedModes.includes(s.mode)||!Number.isInteger(s.level)||s.level<0||s.level>=LEVELS.length||!entity(s.player)||s.player.hp<=0||!finite(s.time)||!finite(s.score)||!finite(s.cameraX)||!finite(data.version>=5?s.motivation:s.solidarity))throw new Error('Salvataggio non compatibile.');
 if(data.version<6&&s.mode==='bossescape')incomplete();
 for(const key of ['enemies','objects','allies','pickups','particles','bombs','zoneCleared','waveSpawned','reinforcedZone'])if(!Array.isArray(s[key])||s[key].length>2000)incomplete();
 if(![...s.enemies,...s.allies,...s.objects].every(entity)||data.bossId!==null&&!s.enemies.some(e=>e.id===data.bossId&&e.type==='boss'))incomplete();
 if(data.version>=2){
  if(!Array.isArray(s.civilians)||s.civilians.length>200||!s.civilians.every(entity)||!data.runtime||typeof data.runtime.jumpHeld!=='boolean'||!(data.runtime.specialHint===null||finite(data.runtime.specialHint)))incomplete();
  if(data.civilianId!==null&&!s.civilians.some(e=>e.id===data.civilianId)||data.machineId!==null&&!s.objects.some(e=>e.id===data.machineId&&e.type==='machine'))incomplete();
  if(LEVELS[s.level].final&&(data.machineId===null||data.bossId===null))incomplete();
  const captives=data.version===2?s.allies:s.civilians;
  if(s.arrest&&(!captives.some(a=>a.id===s.arrest.allyId)||!s.enemies.some(e=>e.id===s.arrest.captorId)))incomplete();
 }
 if(data.version===2){
  // Validate the old crowd schema before discarding its incompatible simulation.
  if(!finite(s.cohesion)||s.cohesion<0||s.cohesion>100||typeof s.rallying!=='boolean'||!Number.isInteger(s.groupSize)||s.groupSize<0)incomplete();
 }
 if(data.version===3){
  if(typeof data.runtime.dodgeHeld!=='boolean'||!['dodgeCooldown','dodgeTime','dodgeX','dodgeY'].every(k=>finite(s.player[k]))||s.player.dodgeCooldown<0||s.player.dodgeTime<0||s.allies.length>1)incomplete();
  if(!s.allies.every(a=>finite(a.life))||!s.civilians.every(c=>typeof c.rescued==='boolean'))incomplete();
 }
 if(data.version>=4){
  const p=s.player,guardFields=['blockAge','blockHeld','guardBroken','perfectCooldown','hitPressure','blockFlash'];
  if(data.version===4)guardFields.push('stamina');
  if(typeof data.runtime.guardHeld!=='boolean'||typeof p.blocking!=='boolean'||typeof p.perfectBlock!=='boolean'||!guardFields.every(k=>finite(p[k])&&p[k]>=0)||data.version===4&&p.stamina>100||s.allies.length>1)incomplete();
  if(!s.allies.every(a=>finite(a.life))||!s.civilians.every(c=>typeof c.rescued==='boolean'))incomplete();
  if(![null,'arrest','health'].includes(s.defeatReason))incomplete();
  if(s.playerArrest){
   const a=s.playerArrest,captor=s.enemies.find(e=>e.id===a.captorId);
   if(!captor||!captor.grabbingPlayer||!['remaining','duration','escapeProgress'].every(k=>finite(a[k])&&a[k]>=0)||a.duration<=0||a.remaining>a.duration||a.escapeProgress>1)incomplete();
  }
  for(const c of s.civilians){
   if(c.distractionPhase!==undefined&&!['running','away','done'].includes(c.distractionPhase))incomplete();
   for(const k of ['distractionTime','exitX'])if(c[k]!==undefined&&!finite(c[k]))incomplete();
  }
  for(const e of s.enemies){
   if(e.distractionId!=null&&!s.civilians.some(c=>c.id===e.distractionId))incomplete();
   for(const k of ['distractionTime','returnX','returnY'])if(e[k]!==undefined&&!finite(e[k]))incomplete();
   if(e.hidden!==undefined&&typeof e.hidden!=='boolean'||e.returnWarning!==undefined&&typeof e.returnWarning!=='boolean')incomplete();
  }
  const boss=s.enemies.find(e=>e.id===data.bossId);
  if(data.version<6&&boss?.groundPhase&&!s.objects.some(o=>o.id===data.machineId&&(o.destroyed||data.version>=5&&o.disabled)))incomplete();
 }
 if(data.version>=5){
  if(s.motivation<0||s.motivation>100)incomplete();
  const machine=s.objects.find(o=>o.id===data.machineId);
  const boss=s.enemies.find(e=>e.id===data.bossId);
  if(machine&&(typeof machine.disabled!=='boolean'||typeof boss?.groundPhase!=='boolean'||machine.disabled&&!boss.groundPhase))incomplete();
  if(s.persuasion!==null){
   const q=s.persuasion,id=v=>Number.isInteger(v)&&v>0,short=v=>typeof v==='string'&&v.length<=300;
   if(!q||!id(q.speakerId)||!(q.replyId===null||id(q.replyId))||!['appeal','reply'].includes(q.phase)||!['text','appeal','reply','speakerName'].every(k=>short(q[k]))||!finite(q.remaining)||q.remaining<0||q.remaining>(q.phase==='appeal'?2.8:3))incomplete();
   if(q.phase==='appeal'&&q.speakerId!==s.player.id||q.phase==='reply'&&(q.replyId===null||q.speakerId!==q.replyId))incomplete();
   // Speakers may have left the current zone; their stored name keeps the line
   // readable until it ends without resurrecting an old officer.
  }
 }
 if(data.version>=6){
  const p=s.player,character=s.level%2?'woman':'man',support=character==='man'?'woman':'man';
  const name=who=>who==='woman'?'NORA':'MARANZA';
  if(p.type!=='player'||p.character!==character||p.name!==name(character))incomplete();
  for(const a of [...s.allies,...s.civilians].filter(a=>a.role==='breaker')){
   if(a.type!==support||a.character!==support||a.name!==name(support))incomplete();
  }
  const kind=LEVELS[s.level].bossKind||null,boss=s.enemies.find(e=>e.id===data.bossId),machine=s.objects.find(o=>o.id===data.machineId);
  if(![null,'trump','president'].includes(s.bossFled))incomplete();
  if(kind){
   if(!boss||boss.kind!==kind||!['groundPhase','defeated','fleeing','fled'].every(k=>typeof boss[k]==='boolean')||!finite(boss.escapeTimer)||boss.escapeTimer<0||boss.escapeTimer>3.2||boss.dead||boss.action==='down')incomplete();
   if(kind==='trump'&&data.machineId!==null||kind==='president'&&!machine)incomplete();
   if(kind==='president'&&boss.groundPhase&&!(machine.destroyed||machine.disabled))incomplete();
   if(boss.fleeing&&(!boss.defeated||boss.fled)||boss.fled&&!boss.defeated||boss.defeated!==(boss.hp===0)||boss.defeated!==!!(boss.fleeing||boss.fled))incomplete();
   if(s.mode==='levelclear'&&!boss.fled||boss.fled&&s.mode!=='levelclear')incomplete();
   if(s.mode==='bossescape'&&(!boss.fleeing||!boss.defeated||boss.fled)||boss.fleeing&&s.mode!=='bossescape')incomplete();
   if(s.bossFled!==null&&(s.bossFled!==kind||!boss.fled)||boss.fled&&s.bossFled!==kind)incomplete();
  }else if(data.bossId!==null||data.machineId!==null||s.bossFled!==null||s.mode==='bossescape')incomplete();
 }
 if(data.version>=7&&!['jumpCooldown','moveX','moveY'].every(k=>finite(s.player[k])))incomplete();
 return data;
}
export function restoreSave(game,raw){
 const data=readSave(raw); // Validation always precedes changes to the live game.
 game.reset(data.version<7?(data.difficulty==='difficile'?'normale':'facile'):data.difficulty);
 if(data.version<7){
  // Rebuild older runs at the saved act with the correct alternating protagonist.
  game.loadLevel(data.state.level);game.state.mode='playing';
  for(const key of ['score','objectsDestroyed','recruited','rescued','arrested','freed']){
   if(finite(data.state[key])&&data.state[key]>=0)game.state[key]=data.state[key];
  }
  game.state.player.hp=Math.min(game.state.player.maxHp,data.state.player.hp);
  game.state.motivation=Math.max(0,Math.min(100,data.version>=5?data.state.motivation:Math.max(data.state.solidarity,data.version===4?data.state.player.stamina:0)));
  game.toast('Il salvataggio è stato aggiornato. Riparti dall’inizio dell’atto, conservando i punti e le risorse.',6);
  return {...data,migrated:true,state:game.state};
 }
 game.seed=data.seed;game.uid=data.uid;game.state=data.state;
 game.state.boss=game.state.enemies.find(e=>e.id===data.bossId)||null;
 game.state.civilian=game.state.civilians.find(e=>e.id===data.civilianId)||null;
 game.state.machine=game.state.objects.find(e=>e.id===data.machineId)||null;
 game.jumpHeld=data.runtime.jumpHeld;game.guardHeld=data.runtime.guardHeld;game.specialHint=data.runtime.specialHint;
 return {...data,migrated:false};
}
