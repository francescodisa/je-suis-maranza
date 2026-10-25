import {Game} from '../dist/engine.js';
import {LEVELS,GATES} from '../dist/campaign.js';
import assert from 'node:assert/strict';
function campaign(smash,difficulty){
 const run=new Game();run.reset(difficulty);run.start();let frames=0,transitions=0;const escapes=new Set(),actors=[];
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
  const special=s.motivation>=(s.playerArrest?40:65)&&s.enemies.some(e=>e.active&&!e.stoodDown&&e.type!=='boss'&&Math.abs(e.x-p.x)<270);
  const bomb=s.bombs.some(b=>!b.exploded&&b.timer<.6&&Math.abs(b.x-p.x)<75);
  const threat=s.enemies.find(e=>e.action==='windup'&&Math.abs(e.attackX-p.x)<130&&Math.abs(e.attackY-p.y)<65);
  const jump=p.z===0&&!(p.jumpCooldown>0)&&(!!threat||bomb);
  if(threat){y=threat.attackY<417?1:-1;if(p.y>480&&y>0||p.y<355&&y<0)y=-y;}
  const imminent=s.enemies.some(e=>e.action==='windup'&&e.attackTimer<.25&&Math.abs(e.attackX-p.x)<45&&Math.abs(e.attackY-p.y)<25);
  const kick=imminent&&p.z===0&&s.motivation>15&&!jump;if(s.playerArrest){x=1;y=0;}
  run.update(1/60,{x,y,punch,kick,special,jump});
  assert.equal(s.kills,0);assert(s.enemies.filter(e=>e.type!=='boss').every(e=>e.hp===e.maxHp));assert(s.enemies.filter(e=>e.type!=='boss').length<=3);assert(s.allies.length<=1);assert(s.motivation>=0&&s.motivation<=100);
 }
 assert.equal(run.state.mode,'victory',difficulty+' should remain completable');
 assert.equal(run.state.objectsDestroyed===0,!smash);
 return {difficulty,smash,mode:run.state.mode,level:run.state.level,reason:run.state.defeatReason,time:Math.round(run.state.time),hp:Math.round(run.state.player.hp),objects:run.state.objectsDestroyed};
}
const outcomes=[];for(const d of ['facile','normale','difficile'])for(const smash of [true,false])outcomes.push(campaign(smash,d));
console.log(JSON.stringify({test:'Campaigns with deliberate evasion and a motivation reserve',outcomes}));

// Pursuit punishes a straight run, but a telegraphed strike never homes in.
const losses=[];
for(const difficulty of ['facile','normale','difficile']){
 const g=new Game();g.reset(difficulty);g.start();const s=g.state,p=s.player;
 s.enemies=s.enemies.slice(0,1);const e=s.enemies[0];e.x=210;e.y=p.y;e.active=true;e.cooldown=0;p.invuln=0;p.arrestImmunity=10;s.civilians=[];
 const hp=p.hp;for(let i=0;i<120;i++)g.update(1/60,{x:1});losses.push(hp-p.hp);
 // Lookahead follows the current heading only when the telegraph is created.
 Object.assign(p,{x:300,y:420,moveX:185,moveY:0,arrestImmunity:10});
 Object.assign(e,{x:330,y:420,action:'idle',actionTime:0,cooldown:0});g.updateEnemy(e,0);
 assert.equal(e.action,'windup');assert(e.attackDuration>=.5);
 const area=[e.attackX,e.attackY];assert(difficulty==='facile'?e.attackX===p.x:e.attackX>p.x);
 p.x-=100;p.y-=50;g.updateEnemy(e,.1);assert.deepEqual([e.attackX,e.attackY],area);
}
assert.equal(losses[0],0);assert(losses[1]>losses[0]);assert(losses[2]>losses[1]);
console.log(JSON.stringify({test:'Unchanging movement now incurs damage',losses}));
