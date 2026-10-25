import assert from 'node:assert/strict';
import { TouchState, objectTarget } from '../dist/mobile.js';
import { paginateLines, StoryPlayer, CHAPTERS } from '../dist/story.js';
import { createSave, readSave, restoreSave } from '../dist/save.js';
import { Game } from '../dist/engine.js';

// Multi-touch: a second finger may attack while the first keeps moving;
// it cannot steal/release another contact, including after cancellation/reset.
const input=new TouchState();
assert(input.claim('move',4));input.value.x=.75;
assert(input.claim('punch',7));assert(input.claim('jump',9));
assert(!input.claim('move',11));assert(!input.release('punch',11));
assert.equal(input.value.x,.75);assert(input.value.punch&&input.value.jump);
input.release('jump',9);assert(input.value.punch&&!input.value.jump);
input.reset();input.claim('kick',30);input.release('kick',30);assert(input.consume().kick,'a fast tap survives until the next simulation frame');assert(!input.consume().kick);
input.reset();assert.deepEqual(input.value,{x:0,y:0,punch:false,kick:false,jump:false,special:false});
assert(input.claim('move',12));assert(!input.release('move',4));assert(input.owns('move',12));

// All dialogue survives pagination, without skipping the reveal step.
for(const chapter of CHAPTERS){
 const pages=paginateLines(chapter.lines,90);
 for(const [i,line] of chapter.lines.entries())assert.equal(pages.filter(p=>p.sourceIndex===i).map(p=>p.text).join(' '),line.text);
 assert(pages.every(p=>p.text.length<=90));
 const story=new StoryPlayer();let finished=0;story.start(chapter,()=>finished++,90);
 assert.equal(story.chapter,chapter);assert.equal(story.lineCount,pages.length);
 for(let i=0;i<pages.length;i++){assert.equal(story.index,i);story.next();assert.equal(story.text,pages[i].text);story.next();}
 assert(!story.active);assert.equal(finished,1);
}

const game=new Game();game.start();
assert.equal(objectTarget(game.state),null);
const object=game.state.objects[0];game.state.player.x=object.x-50;game.state.player.y=object.y;game.state.player.dir=1;
assert.equal(objectTarget(game.state),object);object.destroyed=true;assert.notEqual(objectTarget(game.state),object);
object.destroyed=false;game.state.player.y=object.y-56;assert.notEqual(objectTarget(game.state),object);
// The mobile target matches the final opponent's punch reach, only after the
// machine is destroyed; police and an untouchable seated boss stay unselected.
{
 const final=new Game();final.start();final.loadLevel(6);
 const s=final.state,p=s.player,boss=s.boss;
 Object.assign(p,{x:boss.x-80,y:boss.y,dir:1});
 assert.notEqual(objectTarget(s),boss);
 s.machine.vulnerable=true;final.damageObject(s.machine,s.machine.hp,p);
 Object.assign(p,{x:boss.x-80,y:boss.y,dir:1});assert.equal(objectTarget(s),boss);
 for(const [dx,dy,dir] of [[125,0,1],[80,58,1],[80,0,-1]]){
  Object.assign(p,{x:boss.x-dx,y:boss.y-dy,dir});assert.notEqual(objectTarget(s),boss);
 }
}

// Schema 7 retains identity, motivation, a timed guard, a temporary helper and the RNG.
// Identical inputs after restore must produce the same simulation on each mode.
for(const difficulty of ['facile','normale','difficile'])for(const level of [0,1]){
 const original=new Game();original.reset(difficulty);original.start();original.loadLevel(level);
 const nora=original.state.civilians.find(c=>c.role==='breaker');
 original.state.player.x=nora.x;original.state.player.y=nora.y;original.updateCivilian(0);
 assert.equal(original.state.allies.length,1);assert(Number.isFinite(original.state.allies[0].life));
 original.update(1/60,{kick:true,x:1});assert(original.state.player.blocking);
 original.jumpHeld=true;original.specialHint=original.state.time;
 const encoded=createSave(original,123456),clone=new Game();restoreSave(clone,encoded);
 assert.equal(readSave(encoded).version,7);assert.equal(clone.jumpHeld,original.jumpHeld);
 assert.equal(clone.guardHeld,true);assert.equal(clone.specialHint,original.specialHint);
 assert.deepEqual(clone.state,original.state);assert.equal(clone.seed,original.seed);
 for(let i=0;i<120;i++)for(const g of [original,clone])g.update(1/60,{x:.3,kick:i<80});
 assert.deepEqual(clone.state,original.state);
 original.loadLevel(6);original.state.mode='playing';restoreSave(clone,createSave(original));
 assert.equal(clone.state.boss,clone.state.enemies.find(e=>e.type==='boss'));
 assert.equal(clone.state.machine,clone.state.objects.find(e=>e.type==='machine'));
 assert.equal(clone.state.civilian,clone.state.civilians[0]);
}
const raw=createSave(game),before=game.snapshot();
for(const bad of ['{}','not json',raw.replace('"version":7','"version":99')])assert.throws(()=>restoreSave(game,bad));
assert.deepEqual(game.snapshot(),before,'invalid saves must leave the current game intact');
assert.equal(readSave(raw).state.level,game.state.level);

// A detained civilian is restored in the civilian list, not turned into a follower.
const arrestGame=new Game();arrestGame.start();
const captive=arrestGame.state.civilians.find(c=>c.role==='captive'),captor=arrestGame.state.enemies[0];
captor.active=true;captor.captiveId=captive.id;captor.arrestTimer=8;captor.arrestDuration=8;captor.arrestWindup=.4;
captive.captorId=captor.id;captive.x=captor.x-40;captive.y=captor.y;
arrestGame.state.arrest={allyId:captive.id,captorId:captor.id,remaining:8,duration:8};
const restoredArrest=new Game();restoreSave(restoredArrest,createSave(arrestGame));
assert.deepEqual(restoredArrest.state.arrest,arrestGame.state.arrest);
restoredArrest.state.player.x=captor.x-50;restoredArrest.state.player.y=captor.y;restoredArrest.state.motivation=100;restoredArrest.special();
assert.equal(restoredArrest.state.arrest,null);assert.equal(restoredArrest.state.civilians.find(c=>c.id===captive.id).captorId,null);
assert.equal(restoredArrest.state.freed,1);assert.equal(restoredArrest.state.allies.length,0);

// A player held by police resumes the same escape window, without requiring
// repeated taps. Saving also keeps the police link to the protagonist.
{
 const original=new Game();original.start();const p=original.state.player,e=original.state.enemies[0];
 p.x=e.x-30;p.y=e.y;p.invuln=0;p.arrestImmunity=0;original.state.motivation=100;p.blocking=false;
 e.active=true;original.grabPlayer(e);assert(original.state.playerArrest);
 const clone=new Game();restoreSave(clone,createSave(original));
 assert.deepEqual(clone.state.playerArrest,original.state.playerArrest);
 for(let i=0;i<90;i++)for(const g of [original,clone])g.update(1/60,{x:-1});
 assert.deepEqual(clone.state,original.state);assert.equal(clone.state.playerArrest,null);
 assert.equal(clone.state.mode,'playing');assert(clone.state.motivation<100);
}
// Save while the megaphone diversion is under way. Chasing and returning guards
// retain their civilian link and timers after reloading.
{
 const original=new Game();original.start();const s=original.state,p=s.player,c=s.civilians.find(c=>c.role==='megaphone');
 p.x=c.x;p.y=c.y;s.gateX=null;
 for(const e of s.enemies){e.x=p.x+80;e.y=p.y;e.active=true;e.zone=s.zone;}
 original.updateCivilian(0);
 assert(s.enemies.some(e=>e.distractionId===c.id));
 const clone=new Game();restoreSave(clone,createSave(original));assert.deepEqual(clone.state,original.state);
 for(let i=0;i<540;i++)for(const g of [original,clone])g.update(1/60,{x:-.2});
 assert.deepEqual(clone.state,original.state);
}
// Destruction of the machine exposes the final opponent; preserve this combat
// phase rather than rebuilding a machine or awarding an early victory.
{
 const original=new Game();original.start();original.loadLevel(6);
 const s=original.state;s.boss.active=true;s.machine.vulnerable=true;
 original.damageObject(s.machine,s.machine.hp,s.player);
 assert(s.machine.destroyed);assert(s.boss.groundPhase);assert.equal(s.mode,'playing');
 const clone=new Game();restoreSave(clone,createSave(original));
 assert.equal(clone.state.machine,clone.state.objects.find(o=>o.type==='machine'));
 assert.equal(clone.state.boss,clone.state.enemies.find(e=>e.type==='boss'));
 for(let i=0;i<120;i++)for(const g of [original,clone])g.update(1/60,{kick:i<50});
 assert.deepEqual(clone.state,original.state);
}

// Persuasion preserves the player's appeal and the officer's later reply.
// Each phase resumes exactly, including when the speaker has left the zone.
{
 const original=new Game();original.start();const s=original.state,p=s.player,e=s.enemies[0];
 p.x=e.x-35;p.y=e.y;e.active=true;s.motivation=100;original.special();
 assert.equal(s.persuasion.phase,'appeal');assert.equal(s.persuasion.speakerId,p.id);
 assert(s.motivation<100);assert(e.stoodDown>0);
 const clone=new Game();restoreSave(clone,createSave(original));
 for(let i=0;i<175;i++)for(const g of [original,clone])g.update(1/60,{x:-1});
 assert.deepEqual(clone.state,original.state);assert.equal(s.persuasion.phase,'reply');
 assert.equal(s.persuasion.speakerId,s.persuasion.replyId);
 const replyClone=new Game();restoreSave(replyClone,createSave(original));
 for(let i=0;i<190;i++)for(const g of [original,replyClone])g.update(1/60,{x:-1});
 assert.deepEqual(replyClone.state,original.state);assert.equal(s.persuasion,null);
 const absent=JSON.parse(createSave(clone));
 absent.state.enemies=absent.state.enemies.filter(actor=>actor.id!==absent.state.persuasion.replyId);
 const movedOn=new Game();restoreSave(movedOn,JSON.stringify(absent));
 assert.equal(movedOn.state.persuasion.speakerName,absent.state.persuasion.speakerName);
}
// A call outside hearing distance stores no phantom reply or spent motivation.
{
 const original=new Game();original.start();original.state.enemies.forEach(e=>e.x=2900);original.special();
 assert.equal(original.state.persuasion,null);assert.equal(original.state.motivation,100);
 const clone=new Game();restoreSave(clone,createSave(original));
 for(let i=0;i<180;i++)for(const g of [original,clone])g.update(1/60);
 assert.deepEqual(clone.state,original.state);assert.equal(clone.state.persuasion,null);
}
// Bypassing the machine reaches the same ground fight without destroying it.
{
 const original=new Game();original.start();original.loadLevel(6);const s=original.state;
 s.player.x=2825;s.player.y=440;s.zone=3;s.gateX=2965;s.boss.active=true;
 original.updateEncounters(0);
 assert(s.machine.disabled);assert(!s.machine.destroyed);assert(s.boss.groundPhase);
 assert.equal(s.objectsDestroyed,0);assert.notEqual(objectTarget(s),s.machine);
 const clone=new Game();restoreSave(clone,createSave(original));
 assert(clone.state.machine.disabled);assert(!clone.state.machine.destroyed);
 for(let i=0;i<120;i++)for(const g of [original,clone])g.update(1/60,{x:-1,jump:i%60===0});
 assert.deepEqual(clone.state,original.state);
}

// Both armored bosses can be saved before the encounter, during their visible
// unharmed flight and (for Trump) after the level-clear transition.
for(const level of [5,6]){
 const original=new Game();original.start();original.loadLevel(level);const s=original.state,b=s.boss;
 assert.equal(b.kind,level===5?'trump':'president');assert.equal(s.player.character,level===5?'woman':'man');
 const waiting=new Game();restoreSave(waiting,createSave(original));assert.deepEqual(waiting.state,s);
 assert.equal(waiting.state.machine===null,level===5);
 original.beginBossGroundPhase();b.vulnerable=true;original.damageBoss(b.hp);
 assert.equal(s.mode,'bossescape');assert(b.fleeing);assert(!b.dead);assert.notEqual(b.action,'down');
 original.update(.05,{});const clone=new Game();restoreSave(clone,createSave(original));
 assert.deepEqual(clone.state,s);assert.equal(clone.state.boss,clone.state.enemies.find(e=>e.id===b.id));
 for(let i=0;i<220;i++)for(const g of [original,clone])g.update(1/60,{punch:true,special:true,kick:true});
 assert.deepEqual(clone.state,s);assert(b.fled);assert(!b.fleeing);assert.equal(s.bossFled,b.kind);
 assert.equal(s.mode,level===5?'levelclear':'victory');
 if(level===5){const cleared=new Game();restoreSave(cleared,createSave(original));assert.deepEqual(cleared.state,s);cleared.nextLevel();assert.equal(cleared.state.player.character,'man');assert.equal(cleared.state.boss.kind,'president');}
 else assert.throws(()=>createSave(original),'completed epilogues do not overwrite a playable save');
}

// All older schemas rebuild the same act without restoring obsolete mechanics.
for(const version of [1,2,3,4,5]){
 const legacy=JSON.parse(createSave(game));legacy.version=version;legacy.state.level=3;legacy.state.score=4321;legacy.state.player.hp=83;legacy.state.kills=99;
 if(version<5){legacy.state.solidarity=45;delete legacy.state.motivation;legacy.state.player.stamina=62;}else{legacy.state.motivation=45;delete legacy.state.player.character;delete legacy.state.player.name;}
 legacy.state.objectsDestroyed=12;legacy.state.zoneCleared=[true,true,false,false];legacy.state.enemies[0].hp=0;legacy.state.enemies[0].dead=true;
 if(version<4)delete legacy.runtime.guardHeld;
 if(version===1){for(const key of ['cohesion','rallying','groupSize','civilians'])delete legacy.state[key];delete legacy.runtime;delete legacy.machineId;delete legacy.civilianId;}
 else if(version===2){legacy.state.cohesion=72;legacy.state.rallying=true;legacy.state.groupSize=5;}
 else if(version===3){legacy.runtime.dodgeHeld=false;Object.assign(legacy.state.player,{dodgeCooldown:0,dodgeTime:0,dodgeX:1,dodgeY:0});}
 const migrated=new Game(),migration=restoreSave(migrated,JSON.stringify(legacy));
 assert(migration.migrated);assert.equal(migrated.state.level,3);assert.equal(migrated.state.mode,'playing');
 assert.equal(migrated.state.score,4321);assert.equal(migrated.state.player.hp,83);assert.equal(migrated.state.objectsDestroyed,12);
 assert.equal(migrated.state.motivation,version===4?62:45);assert(!('stamina' in migrated.state.player));assert(!('solidarity' in migrated.state));
 assert.equal(migrated.state.player.character,'woman');assert.equal(migrated.state.player.name,'NORA');assert.equal(migrated.state.civilian.character,'man');
 assert.equal(migrated.state.kills,0);assert(migrated.state.enemies.every(e=>!e.dead&&e.hp===e.maxHp));
 assert(migrated.state.zoneCleared.every(v=>!v));assert.equal(migrated.state.allies.length,0);assert.equal(readSave(createSave(migrated)).version,7);
 if(version===2){legacy.state.cohesion='bad';assert.throws(()=>restoreSave(migrated,JSON.stringify(legacy)),'legacy schemas are validated before migration');}
}
// Old act six had no boss. Its save must still migrate after adding Trump;
// the old final boss also has none of the new identity or escape fields.
for(const level of [5,6]){
 const original=new Game();original.start();if(level===6)original.loadLevel(6);
 const legacy=JSON.parse(createSave(original));legacy.version=5;legacy.state.level=level;
 delete legacy.state.player.character;delete legacy.state.player.name;delete legacy.state.bossFled;
 for(const enemy of legacy.state.enemies)for(const key of ['kind','fleeing','fled','escapeTimer'])delete enemy[key];
 const migrated=new Game();assert(restoreSave(migrated,JSON.stringify(legacy)).migrated);
 assert.equal(migrated.state.boss.kind,level===5?'trump':'president');
 assert.equal(migrated.state.player.character,level===5?'woman':'man');
 assert.equal(migrated.state.boss.fleeing,false);assert.equal(migrated.state.mode,'playing');
}
// Invalid schema 7 state must not replace a valid current run.
for(const breakSave of [s=>s.machineId=987654,s=>delete s.runtime.guardHeld,s=>delete s.state.motivation,s=>s.state.player.character='unknown',s=>s.state.player.character='woman',s=>s.state.player.name='NORA',s=>s.state.civilians[0].character='man',s=>delete s.state.bossFled,s=>s.state.motivation=-1,s=>s.state.motivation=101,s=>s.state.player.blocking='yes',s=>s.state.playerArrest={captorId:987,remaining:1,duration:2,escapeProgress:0},s=>s.state.civilians[1].distractionPhase='bad',s=>s.state.allies=[s.state.player,s.state.player],s=>delete s.state.persuasion,s=>s.state.persuasion={speakerId:0,replyId:null,phase:'appeal',text:'',remaining:1,appeal:'',reply:'',speakerName:'MARANZA'}]){
 const invalid=JSON.parse(createSave(game)),unchanged=game.state;breakSave(invalid);
 assert.throws(()=>restoreSave(game,JSON.stringify(invalid)));assert.equal(game.state,unchanged);
}
{
 const original=new Game();original.start();const s=original.state,e=s.enemies[0];
 s.player.x=e.x-35;s.player.y=e.y;e.active=true;original.special();
 for(const breakSave of [q=>q.remaining=3.1,q=>q.phase='bad',q=>q.speakerId=-1,q=>q.replyId='cop',q=>q.text=8,q=>q.speakerName=null,q=>{q.phase='reply';q.replyId=null;},q=>q.speakerId=999]){
  const bad=JSON.parse(createSave(original)),unchanged=original.state;breakSave(bad.state.persuasion);
  assert.throws(()=>restoreSave(original,JSON.stringify(bad)));assert.equal(original.state,unchanged);
 }
 original.loadLevel(6);s.machine.disabled=true;s.boss.groundPhase=true;
 const bad=JSON.parse(createSave(original));bad.state.objects.find(o=>o.id===bad.machineId).disabled='yes';
 assert.throws(()=>restoreSave(original,JSON.stringify(bad)));
}
// New boss/escape fields cannot forge a different boss or bypass its finish.
for(const level of [5,6]){
 const original=new Game();original.start();original.loadLevel(level);
 for(const corrupt of [s=>s.state.bossFled='trump',s=>s.state.mode='bossescape',s=>s.state.enemies.find(e=>e.id===s.bossId).kind='other',s=>s.state.enemies.find(e=>e.id===s.bossId).escapeTimer=4,s=>s.state.enemies.find(e=>e.id===s.bossId).dead=true,s=>s.state.enemies.find(e=>e.id===s.bossId).fleeing=true]){
  const bad=JSON.parse(createSave(original)),unchanged=original.state;corrupt(bad);assert.throws(()=>restoreSave(original,JSON.stringify(bad)));assert.equal(original.state,unchanged);
 }
 if(level===6){const bad=JSON.parse(createSave(original));bad.machineId=null;assert.throws(()=>readSave(JSON.stringify(bad)));}
}
console.log('Mobile input ownership, dialogue pagination, alternating identities, both boss escapes and exact save/resume: passed.');

// Mobile captions give urgent gameplay feedback priority over ambient chatter.
{
 const {gameplaySpeech,speechPages}=await import('../dist/mobile.js');
 const game=new Game();game.start();const s=game.state;
 game.say(s.player,'Di qui si passa.',3);game.toast('La pattuglia torna da sinistra. Tieniti pronto.',2);
 assert.equal(gameplaySpeech(s).speaker,'TORNA LA PATTUGLIA');
 const e=s.enemies[0];e.active=true;s.player.x=e.x-30;s.player.y=e.y;game.special();
 assert.equal(gameplaySpeech(s).tone,'appeal');
 game.updatePersuasion(2.81);assert.equal(gameplaySpeech(s).speaker,'AGENTE');
 s.playerArrest={remaining:2};assert.equal(gameplaySpeech(s).tone,'urgent');
 // Variable-width lettering: every word survives and every page fits two lines.
 const text='Servono 40 punti motivazione. Puoi recuperarli rompendo oggetti o incontrando chi ti aiuta.';
 const measure=t=>[...t].reduce((w,ch)=>w+('il .'.includes(ch)?3:8),0);
 for(const width of [220,280,360,520]){
  const pages=speechPages(text,width,measure);
  assert.equal(pages.join(' ').replace(/\n/g,' '),text);
  assert(pages.every(page=>page.split('\n').length<=2&&page.split('\n').every(line=>measure(line)<=width)));
 }
}
console.log('Caption priority and two-line phone pagination: passed.');

// Previous normal runs migrate to easy at their saved act, with resources intact.
{
 const old=new Game();old.start();old.loadLevel(3);old.state.player.hp=83;old.state.score=4321;old.state.motivation=45;
 const data=JSON.parse(createSave(old));data.version=6;
 delete data.state.player.jumpCooldown;delete data.state.player.moveX;delete data.state.player.moveY;
 const next=new Game(),result=restoreSave(next,JSON.stringify(data));
 assert(result.migrated);assert.equal(next.difficulty,'facile');assert.equal(next.state.level,3);
 assert.equal(next.state.player.hp,83);assert.equal(next.state.score,4321);assert.equal(next.state.motivation,45);
 assert.equal(next.state.player.name,'NORA');assert.equal(readSave(createSave(next)).version,7);
}
