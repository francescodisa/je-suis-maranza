import assert from 'node:assert/strict';
import {LEVELS,CENTERS,GATES} from '../dist/campaign.js';
import {Game} from '../dist/engine.js';
const step=(g,n,input={})=>{for(let i=0;i<n;i++)g.update(1/60,input);};
const fresh=(difficulty='facile')=>{const g=new Game();g.reset(difficulty);g.start();return g;};
const g=fresh();assert.equal(g.state.allies.length,0);assert(!('cohesion' in g.state));
step(g,1);assert.equal(g.state.objectsDestroyed,0);assert(g.state.enemies.some(e=>e.active),'patrol approaches without vandalism');
const before=g.state.enemies[0].x;step(g,60);assert(g.state.enemies[0].x<before);
const values=[];
for(let level=0;level<LEVELS.length;level++){
 g.loadLevel(level);values.push(Math.max(...g.state.objects.filter(o=>['car','coupe','tesla','cybertruck','supercar','limo'].includes(o.type)).map(o=>o.value)));
 assert.equal(g.state.zoneCleared.length,CENTERS.length);assert.equal(g.state.civilians.length,4);assert.equal(g.state.civilian,g.state.civilians[0]);
 assert(g.state.enemies.filter(e=>e.type!=='boss').length<=3);assert.equal(g.state.allies.length,0);
 assert.equal(g.state.player.type,'player');assert.equal(g.state.player.character,level%2?'woman':'man');assert.equal(g.state.player.name,level%2?'NORA':'MARANZA');
 assert.equal(g.state.civilians[0].character,level%2?'man':'woman');assert.equal(g.state.civilians[0].name,level%2?'MARANZA':'NORA');
 if(level>=2)assert(!g.state.objects.some(o=>o.type==='car'||o.type==='bin'));
}
assert.equal(LEVELS.length,7);assert.deepEqual(LEVELS.map(l=>l.bossKind).filter(Boolean),['trump','president']);assert(values.every((n,i)=>!i||n>=values[i-1]));
assert.equal(g.state.boss.name,'IL PRESIDENTE');assert.equal(g.state.machine,g.state.objects.find(o=>o.type==='machine'));
// Both protagonists have identical movement, property damage and protection.
{
 const results=[];
 for(const level of [0,1]){
  const a=fresh();a.loadLevel(level);const s=a.state,p=s.player;s.civilians.forEach(c=>c.rescued=true);s.enemies.forEach(e=>e.x=2900);
  const start=p.x;step(a,30,{x:1});const walk=p.x-start;
  const o=s.objects[0];p.x=o.x-50;p.y=o.y;p.cooldown=0;const hp=o.hp;a.attack();const damage=hp-o.hp;
  p.cooldown=0;p.action='idle';p.actionTime=0;p.invuln=0;const before=p.hp;a.updateGuard(.3,true);a.hurt(p,13,s.enemies[0]);
  results.push({walk,damage,health:p.maxHp,guardDamage:before-p.hp,motivation:s.motivation});
 }
 assert.deepEqual(results[0],results[1]);assert.equal(results[0].damage,23);
}
// Officers remain immune to friendly attacks. Strikes require property or armour.
{
 const a=fresh(),p=a.state.player,cop=a.state.enemies[0];cop.x=p.x+40;cop.y=p.y;
 const hp=cop.hp;a.attack();assert.equal(p.action,'idle');assert.equal(cop.hp,hp);assert.equal(a.hurt(cop,500,p),false);
 p.x=a.state.objects[0].x-50;p.y=a.state.objects[0].y;cop.x=p.x+30;cop.y=p.y;
 const objectHp=a.state.objects[0].hp;a.attack();assert(a.state.objects[0].hp<objectHp);assert.equal(cop.hp,hp);
 a.loadLevel(6);assert.equal(a.hurt(a.state.boss,999,a.state.player),false);
}
// Held protection trades speed and motivation for damage absorption. Perfect timing
// negates one hit, but rapid release/repress cannot bypass its cooldown.
{
 const events=[],a=new Game({onEvent:e=>events.push(e)});a.start();const p=a.state.player,cop=a.state.enemies[0];cop.x=2900;p.invuln=0;
 const hp=p.hp;a.updateGuard(.01,true);assert(p.blocking);assert.equal(a.hurt(p,cop.damage,cop),true);assert.equal(p.hp,hp);assert(p.perfectCooldown>0);assert(events.some(e=>e.type==='perfect'));
 p.invuln=0;a.updateGuard(.01,false);a.updateGuard(.01,true);a.hurt(p,cop.damage,cop);assert.equal(p.hp,hp-cop.damage*.25);assert(events.some(e=>e.type==='block'));
 const object=a.state.objects[0];p.x=object.x-50;p.y=object.y;p.cooldown=0;const objectHp=object.hp;a.attack();assert.equal(object.hp,objectHp,'guard disallows attacks');
 const motivation=a.state.motivation;a.updateGuard(.5,true);assert(a.state.motivation<motivation);const x=p.x;a.update(1/60,{kick:true,x:1});assert(p.x-x<2,'protection slows movement');
 a.state.motivation=.1;a.updateGuard(.05,true);assert.equal(a.state.motivation,0);assert(p.guardBroken>0);assert(!p.blocking);assert(events.some(e=>e.type==='guardbreak'));
 a.updateGuard(.5,true);assert.equal(a.state.motivation,0,'holding cannot regenerate resistance');
 a.updateGuard(.5,false);assert.equal(a.state.motivation,0,'releasing does not refill motivation');a.updateGuard(.2,false);assert.equal(p.guardBroken,0);
 assert(a.state.enemies.every(e=>e.hp===e.maxHp));
}
// Protection shares motivation with persuasion; repeated taps spend motivation.
{
 const a=fresh(),p=a.state.player;for(let i=0;i<20;i++){a.updateGuard(1/60,true);a.updateGuard(1/60,false);}
 assert(a.state.motivation<80);assert.equal(a.guardHeld,false);assert(!('stamina' in p));
}
// The player can escape a telegraphed arrest by moving out of its fixed area.
for(const evade of [true,false]){
 const a=fresh(),p=a.state.player,e=a.state.enemies[0];p.arrestImmunity=0;p.blockHeld=2.1;e.x=p.x+35;e.y=p.y;e.cooldown=0;e.active=true;
 a.updateEnemy(e,.01);assert.equal(e.attackKind,'grab');assert.equal(e.attackDuration,1);const x=e.attackX,y=e.attackY;
 if(evade)p.y+=45;for(let i=0;i<62;i++)a.updateEnemy(e,1/60);
 assert.equal(e.attackX,x);assert.equal(e.attackY,y);assert.equal(!!a.state.playerArrest,!evade);
}
// Hold a direction steadily to break a grab; exhaustion is a distinct defeat.
function playerCaught(motivation=100){const a=fresh(),p=a.state.player,e=a.state.enemies[0];a.state.motivation=motivation;p.arrestImmunity=0;e.active=true;e.x=p.x+35;e.y=p.y;assert(a.grabPlayer(e));return {a,p,e};}
{
 const {a,p,e}=playerCaught(),hp=p.hp;
 for(let i=0;i<60;i++)a.updatePlayerArrest(1/60,{x:1});assert.equal(a.state.playerArrest,null);assert(Math.abs(a.state.motivation-80)<.01);assert.equal(p.hp,hp);assert(!e.grabbingPlayer);assert(p.arrestImmunity>=5);assert.equal(a.grabPlayer(e),false,'escape grace prevents immediate re-arrest');
}
{
 const {a,p}=playerCaught(19);for(let i=0;i<140&&a.state.mode==='playing';i++)a.updatePlayerArrest(1/60,{x:1});assert.equal(a.state.motivation,0);assert.equal(a.state.mode,'gameover');assert.equal(a.state.defeatReason,'arrest');assert(p.hp>0);
}
{
 const {a,p,e}=playerCaught(40);p.cooldown=5;a.state.motivation=40;a.special();assert.equal(a.state.playerArrest,null);assert.equal(a.state.motivation,0);assert(e.stoodDown>0);assert(!e.grabbingPlayer);
}
{
 const a=fresh(),p=a.state.player;p.invuln=0;a.hurt(p,999,a.state.enemies[0]);assert.equal(a.state.defeatReason,'health');
 assert.deepEqual(['cop','shield','soldier','elite'].map(kind=>fresh().enemyStats(kind).damage),[13,16,18,21]);
}
// Windup records one area; moving out of it avoids the strike. Standing still
// takes damage, demonstrating the police remain a threat without vandalism.
for(const evade of [true,false]){
 const a=fresh(),p=a.state.player,e=a.state.enemies[0];p.invuln=0;e.x=p.x+35;e.y=p.y;e.cooldown=0;e.active=true;
 a.updateEnemy(e,.01);assert.equal(e.action,'windup');assert(e.attackTimer>=.7);const hp=p.hp;
 if(evade)p.y+=45;for(let i=0;i<50;i++)a.updateEnemy(e,1/60);
 assert.equal(p.hp===hp,evade);
}
// Sparse temporary encounters provide distinct benefits and no permanent army.
{
 const a=fresh(),p=a.state.player,nora=a.state.civilians[0];p.x=nora.x;p.y=nora.y;a.updateCivilian(0);
 assert(nora.rescued);assert.equal(a.state.allies.length,1);const helper=a.state.allies[0];assert.equal(helper.name,'NORA');assert.equal(helper.life,12);
 const o=a.state.objects[0];p.x=o.x-55;p.y=o.y;p.action='punch';helper.x=p.x-20;helper.y=p.y;helper.cooldown=0;const hp=o.hp;a.updateAlly(helper,.01);assert(o.hp<hp);
 helper.life=.001;a.update(1/60);assert.equal(a.state.allies.length,0);
 const meg=a.state.civilians[1],cop=a.state.enemies[0];p.x=meg.x;p.y=meg.y;cop.x=p.x+100;cop.active=true;a.updateCivilian(0);assert.equal(cop.distractionTime,7);assert.equal(meg.distractionPhase,'running');assert.equal(a.state.allies.length,0);
 const resident=a.state.civilians[2];p.x=resident.x;p.y=resident.y;p.hp=50;a.state.gateX=null;a.updateCivilian(0);a.update(1/60);assert.equal(p.hp,75);
}
// The supporting partner switches too, with exactly the same temporary ability.
{
 const results=[];
 for(const level of [0,1]){
  const a=fresh();a.loadLevel(level);const s=a.state,p=s.player,c=s.civilians[0];p.x=c.x;p.y=c.y;a.updateCivilian(0);
  const helper=s.allies[0];assert(helper);assert.notEqual(helper.character,p.character);assert.equal(helper.type,helper.character);assert.equal(helper.name,level?'MARANZA':'NORA');
  const o=s.objects[0];p.x=o.x-55;p.y=o.y;p.action='punch';helper.x=p.x-20;helper.y=p.y;helper.cooldown=0;const hp=o.hp;a.updateAlly(helper,.01);
  results.push({health:helper.maxHp,life:helper.life,damage:hp-o.hp,cooldown:helper.cooldown});
  s.motivation=100;p.cooldown=0;const cop=s.enemies[0];cop.x=p.x+40;cop.y=p.y;cop.active=true;a.special();assert.equal(s.persuasion.speakerName,p.name);
 }
 assert.deepEqual(results[0],results[1]);assert.equal(results[0].damage,13);
}
// The megaphone actually runs away; at most two guards chase offscreen and
// return with warning after seven seconds, instead of becoming followers.
{
 const events=[],a=new Game({onEvent:e=>events.push(e)});a.start();const s=a.state,p=s.player,meg=s.civilians[1];p.x=meg.x;p.y=meg.y;s.cameraX=600;
 for(const [i,e] of s.enemies.entries()){e.x=p.x+70+i*50;e.y=p.y;}
 const extra=a.spawnGuard('cop',p.x+200,p.y,0,true),hp=extra.hp;a.updateCivilian(0);
 const chasers=s.enemies.filter(e=>e.distractionTime>0);assert.equal(chasers.length,2);assert.equal(extra.distractionTime,undefined);const start=meg.x;
 let hidden=false;for(let i=0;i<430;i++){for(const e of chasers)a.updateEnemy(e,1/60);a.updateCivilian(1/60);hidden ||= chasers.some(e=>e.hidden);}
 assert(meg.x<start);assert.equal(meg.distractionPhase,'done');assert(hidden,'chase leaves camera');assert(chasers.every(e=>!e.hidden&&!e.distractionId&&e.distractionTime===0));assert(events.some(e=>e.type==='radio'));assert.equal(extra.hp,hp);assert.equal(s.allies.length,0);
}
// Every passage opens through arrival alone. Objects and NPCs remain optional.
{
 const a=fresh(),p=a.state.player;p.x=GATES[0]-50;a.updateEncounters(0);assert(!a.state.zoneCleared[0]);
 p.x=GATES[0]-20;a.state.civilians.forEach(c=>c.rescued=true);a.updateEncounters(0);assert.equal(a.state.objectsDestroyed,0);assert(a.state.objects.every(o=>!o.destroyed));
 assert(a.state.zoneCleared[0]);assert.equal(a.state.allies.length,0);assert(a.state.enemies.every(e=>e.zone===1));
}
// Rescue is optional and uses persuasion, never strikes or recruitment.
function arrestedPair(){const a=fresh(),c=a.state.civilians[3],guard=a.state.enemies[0];c.x=guard.x-40;c.y=guard.y;assert(a.tryArrest(guard,c));return {a,c,guard};}
{
 const {a,c,guard}=arrestedPair();assert(a.state.motivation>=40);a.hurt(guard,100,a.state.player);assert(a.state.arrest);
 a.state.player.x=guard.x-50;a.state.player.y=guard.y;a.special();assert.equal(a.state.arrest,null);assert.equal(c.captorId,null);assert(c.leaving);assert.equal(a.state.freed,1);assert(a.state.score>=500);assert.equal(a.state.allies.length,0);
 const recruited=a.state.recruited;a.state.motivation=100;a.state.player.cooldown=0;a.state.persuasion=null;a.special();assert.equal(a.state.recruited,recruited,'persuaded officers counted once');
}
{
 const {a,c,guard}=arrestedPair();for(let i=0;i<900&&a.state.arrest;i++)a.updateArrest(guard,1/60);assert(c.arrested);assert.equal(a.state.arrest,null);assert.equal(a.state.mode,'playing');
}
// The machine is a first phase. Only exposed ground armour can be damaged;
// victory waits for the unhurt President to visibly escape after phase two.
{
 const a=fresh();a.loadLevel(6);const s=a.state,p=s.player,b=s.boss,m=s.machine;b.active=true;
 assert.equal(a.damageBoss(999),false);m.vulnerable=true;a.damageObject(m,m.hp,p);assert(m.destroyed);assert(b.groundPhase);assert.equal(s.mode,'playing');assert.equal(b.hp,b.maxHp);
 p.x=b.x-70;p.y=b.y;p.dir=1;p.cooldown=0;a.attack();assert.equal(b.hp,b.maxHp,'closed armour blocks attacks');
 a.updateBoss(b,.01);assert.equal(b.action,'windup');assert.equal(b.attackKind,'slam');assert(b.attackTimer>=.9,'ground boss gets a first attack before exposure');
 for(let i=0;i<60;i++)a.updateEnemy(b,1/60);
 b.phaseTime=1.2;a.updateBoss(b,.01);p.cooldown=0;a.attack();assert(b.hp<b.maxHp,'exposed boss takes a punch');
 b.invuln=0;a.damageBoss(999);assert.equal(s.mode,'bossescape');assert.equal(b.hp,0);assert(b.defeated);assert(!b.dead);assert.equal(b.action,'flee');assert.equal(s.kills,0);
 step(a,200);assert.equal(s.mode,'victory');assert(b.fled);assert.equal(s.bossFled,'president');
}
// Trump and the President have the same explicit, harmless exit lifecycle.
for(const [level,kind,endMode] of [[5,'trump','levelclear'],[6,'president','victory']]){
 const events=[],a=new Game({onEvent:e=>events.push(e)});a.start();a.loadLevel(level);const s=a.state,p=s.player,b=s.boss;
 assert.equal(b.kind,kind);assert.equal(b.fleeing,false);assert.equal(b.fled,false);assert.equal(b.escapeTimer,0);assert.equal(s.bossFled,null);
 if(kind==='trump')assert.equal(s.machine,null);
 for(let zone=0;zone<3;zone++){p.x=GATES[zone];a.updateEncounters(0);}
 if(kind==='president'){p.x=2820;a.updateEncounters(0);}assert(b.groundPhase);assert.equal(s.objectsDestroyed,0);
 b.vulnerable=true;b.invuln=0;const guard=a.spawnGuard('cop',p.x+30,p.y,3,true);guard.attackX=p.x;guard.attackY=p.y;guard.attackTimer=.01;guard.action='windup';
 s.bombs.push({x:p.x,y:p.y,r:49,timer:.01,duration:1,life:.35});p.invuln=0;
 assert(a.damageBoss(999));const health=p.hp,motivation=s.motivation,x=b.x,score=s.score;
 assert.equal(s.mode,'bossescape');assert.equal(b.action,'flee');assert(b.fleeing);assert(!b.dead);assert.equal(s.bossFled,null);assert.equal(s.bombs.length,0);
 assert(events.some(e=>e.type==='hit'&&e.material==='metal'));assert(!events.some(e=>e.type==='hit'&&e.material==='body'));
 assert.equal(a.hurt(p,999,guard),false);assert.equal(a.damageBoss(999),false);a.special();a.attack();assert.equal(s.motivation,motivation);
 step(a,60,{x:1,punch:true,special:true,protect:true});assert.equal(b.x,x,'pause makes the escape readable');assert.equal(s.mode,'bossescape');
 step(a,60,{punch:true});assert(b.x>x);assert.equal(p.hp,health);assert.equal(s.score,score);assert.equal(s.mode,'bossescape');assert.equal(s.bossFled,null);
 step(a,80);assert.equal(s.mode,endMode);assert.equal(s.bossFled,kind);assert(b.fled);assert(!b.fleeing);assert(!b.dead);assert.notEqual(b.action,'down');assert(b.x>3000);assert.equal(b.escapeTimer,3.2);assert.equal(p.hp,health);assert.equal(s.kills,0);
 assert.equal(events.filter(e=>e.type==='win').length,1);const finalScore=s.score;step(a,60);assert.equal(s.score,finalScore);
 if(kind==='trump'){a.nextLevel();assert.equal(s.boss.kind,'president');assert.equal(s.bossFled,null);}
}
// Retreating across the level cannot move the escape outside its camera frame.
{
 const a=fresh();a.loadLevel(5);a.beginBossGroundPhase();const s=a.state,b=s.boss;b.x=100;s.player.x=60;b.vulnerable=true;
 a.damageBoss(999);assert(b.x>=s.cameraX&&b.x<s.cameraX+960);step(a,60);assert.equal(b.x,100);step(a,140);assert(b.x>s.cameraX+960);assert.equal(s.mode,'levelclear');assert(!b.dead);
}
// One unified pool feeds both powers and recharges through property damage.
{
 const a=fresh(),s=a.state,p=s.player;assert(!('stamina' in p));assert(!('solidarity' in s));s.motivation=20;
 a.updateGuard(.5,true);assert.equal(s.motivation,17);a.updateGuard(1,false);assert.equal(s.motivation,17);
 const o=s.objects[0];a.damageObject(o,1,p);assert.equal(s.motivation,20.5);a.damageObject(o,o.hp,p);assert.equal(s.motivation,42);
}
// Empty space cannot consume the resource, and waiting never refills it.
{
 const a=fresh(),s=a.state;for(const e of s.enemies)e.x=2900;s.motivation=39;a.special();assert.equal(s.motivation,39);assert.equal(s.persuasion,null);
 s.player.x=600;s.player.y=350;step(a,30);assert.equal(s.motivation,39);a.addMotivation(90);assert.equal(s.motivation,100);
}
// Persuasion is a readable sequential exchange, followed by visible hesitation.
{
 const a=fresh(),s=a.state,p=s.player,e=s.enemies[0];e.x=p.x+45;e.y=p.y;e.active=true;
 a.special();assert.equal(s.motivation,60);assert.equal(s.persuasion.phase,'appeal');assert.equal(s.persuasion.speakerId,p.id);assert(s.persuasion.text.includes('tuoi interessi'));assert.equal(e.stoodDown,8);assert.equal(p.bubble,null);assert.equal(e.bubble,null);a.special();assert.equal(s.motivation,60,'held input cannot pay twice during the exchange');
 a.say(e,'Overlapping chatter',9,true);a.toast('Overlapping toast');assert.equal(e.bubble,null);assert.equal(s.toast.ttl,0);
 a.updatePersuasion(2.81);assert.equal(s.persuasion.phase,'reply');assert.equal(s.persuasion.speakerId,e.id);assert(s.persuasion.text.includes('i soldi non ci sono mai'));
 a.updatePersuasion(3.01);assert.equal(s.persuasion,null);
 for(let i=0;i<481;i++)a.updateEnemy(e,1/60);assert.equal(e.stoodDown,0);assert(e.bubble.text.includes('riprendere l’avanzata'));
 let resumed=false;for(let i=0;i<120;i++){a.updateEnemy(e,1/60);resumed ||= e.action==='windup'||e.action==='punch';}assert(resumed,'agent resumes attacking');
}
// Walking past the machine starts the boss without any property destruction.
{
 const a=fresh();a.loadLevel(6);const s=a.state,p=s.player;
 for(let i=0;i<3;i++){p.x=GATES[i];a.updateEncounters(0);}p.x=2820;a.updateEncounters(0);
 assert(s.boss.groundPhase);assert(s.machine.disabled);assert(!s.machine.destroyed);assert.equal(s.machine.hp,s.machine.maxHp);assert.equal(s.objectsDestroyed,0);assert.equal(s.bombs.length,0);
 assert.equal(a.damageObject(s.machine,999,p),false);s.boss.vulnerable=true;assert(a.damageBoss(1));
}
// Normal-input campaign route also checks crowd bounds throughout the game.
function campaign(smash){
 const run=fresh();let frames=0,transitions=0;const escapes=new Set(),actors=[];
 while(frames<60*700&&!['victory','gameover'].includes(run.state.mode)){
  const s=run.state,p=s.player;frames++;
  if(s.mode==='levelclear'){transitions++;run.nextLevel();continue;}
  if(s.mode==='bossescape'){escapes.add(s.boss.kind);run.update(1/60,{punch:true});continue;}
  actors[s.level]=p.character;
  const obj=s.objects.find(o=>o.zone===s.zone&&!o.destroyed&&!o.disabled),already=s.objects.some(o=>o.zone===s.zone&&o.destroyed);
  let target=smash&&!already&&obj?obj:{x:(GATES[s.zone]??2950)+30,y:440};
  if(s.zone===3&&s.boss)target=s.boss.groundPhase?s.boss:smash?s.machine:{x:2870,y:440};
  const dx=target.x-p.x,dy=target.y-p.y,isBoss=target===s.boss,isObj=target===obj||target===s.machine,reach=isBoss?75:isObj?65+target.w*.35:0;
  let x=Math.abs(dx)>reach?Math.sign(dx):p.dir!==Math.sign(dx)?Math.sign(dx)*.15:0,y=Math.abs(dy)>7?Math.sign(dy):0;
  const punch=(isObj&&smash&&Math.abs(dx)<=95+target.w*.4||isBoss&&Math.abs(dx)<125)&&Math.abs(dy)<48;
  const danger=s.enemies.some(e=>e.active&&!e.stoodDown&&Math.abs(e.x-p.x)<150&&Math.abs(e.y-p.y)<80);
  const special=s.motivation>=40&&s.enemies.some(e=>e.active&&!e.stoodDown&&e.type!=='boss'&&Math.abs(e.x-p.x)<270);
  const bomb=s.bombs.some(b=>!b.exploded&&b.timer<.6&&Math.abs(b.x-p.x)<75);
  const jump=p.z===0&&(danger||bomb);
  const imminent=s.enemies.some(e=>e.action==='windup'&&e.attackTimer<.25&&Math.abs(e.attackX-p.x)<45&&Math.abs(e.attackY-p.y)<25);
  const kick=imminent&&p.z===0&&s.motivation>15&&!jump;if(s.playerArrest){x=1;y=0;}
  run.update(1/60,{x,y,punch,kick,special,jump});
  assert.equal(s.kills,0);assert(s.enemies.filter(e=>e.type!=='boss').every(e=>e.hp===e.maxHp));assert(s.enemies.filter(e=>e.type!=='boss').length<=3);assert(s.allies.length<=1);assert(s.motivation>=0&&s.motivation<=100);
 }
 assert.equal(run.state.mode,'victory');assert.deepEqual([...escapes],['trump','president']);assert.deepEqual(actors,LEVELS.map((_,i)=>i%2?'woman':'man'));assert(run.state.boss.fled);assert.equal(run.state.bossFled,'president');assert.equal(transitions,LEVELS.length-1);assert(run.state.machine.disabled);assert.equal(run.state.boss.hp,0);assert(run.state.boss.defeated);
 if(smash)assert(run.state.objectsDestroyed>0);else {assert.equal(run.state.objectsDestroyed,0);assert(!run.state.machine.destroyed);}
 return {smash,mode:run.state.mode,transitions,seconds:Math.round(run.state.time),hp:Math.round(run.state.player.hp),objects:run.state.objectsDestroyed,persuaded:run.state.recruited,help:run.state.rescued,freed:run.state.freed,kills:run.state.kills};
}
console.log(JSON.stringify({tests:'unified motivation, optional destruction, sequential persuasion, temporary hesitation, guard and arrest, megaphone chase, alternating equal protagonists, both harmless boss escapes, two final entry paths, full campaigns',campaigns:[campaign(true),campaign(false)]}));
