import { LEVELS } from './campaign.js';

export const MUSIC = [
 {src:'./assets/audio/arcade-gilded-glitch.mp3',name:'Arcade Gilded Glitch'},
 {src:'./assets/audio/glitch-crown-loop.mp3',name:'Glitch Crown Loop'}
];
const limit=(v,a,b)=>Math.max(a,Math.min(b,v));
export function materialFamily(material){
 if(['window','watch','bag'].includes(material))return 'glass';
 if(['car','coupe','tesla','cybertruck','supercar','limo'].includes(material))return 'vehicle';
 if(['bin','vending','safe','clock','statue','armor','shield','machine','metal'].includes(material))return 'metal';
 return 'body';
}

// Original layered Foley, spatialized in the street. Music is supplied by the user.
export class ArcadeAudio {
 constructor({effects=true,music=true,onNotice=()=>{}}={}){
  this.effects=effects;this.music=music;this.onNotice=onNotice;this.unlocked=false;this.suspended=false;this.last={};this.cameraX=0;this.trackIndex=-1;this.targetTrack=0;this.story=false;this.lastAmbience=-30;this.tracks=[];this.activeVoices=0;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  const c=this.ctx=new AC();this.fx=c.createGain();this.fx.gain.value=effects?.82:0;
  const compressor=c.createDynamicsCompressor();compressor.threshold.value=-11;compressor.knee.value=18;compressor.ratio.value=5;compressor.attack.value=.004;compressor.release.value=.18;
  this.fx.connect(compressor);compressor.connect(c.destination);
  this.musicBus=c.createGain();this.musicBus.gain.value=.19;this.musicBus.connect(c.destination);
  const impulse=c.createBuffer(2,Math.floor(c.sampleRate*.28),c.sampleRate);
  for(let ch=0;ch<2;ch++){const data=impulse.getChannelData(ch);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,3)*.15;}
  this.room=c.createConvolver();this.room.buffer=impulse;const wet=c.createGain();wet.gain.value=.12;this.room.connect(wet);wet.connect(this.fx);
  this.noiseBuffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const d=this.noiseBuffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 }
 wake(){
  this.unlocked=true;if(this.ctx?.state==='suspended')this.ctx.resume().catch(()=>{});
  this.applyMusic();
 }
 setPreferences({effects=this.effects,music=this.music}){
  const retryMusic=music&&!this.music;
  this.effects=effects;this.music=music;
  if(retryMusic)for(const track of this.tracks)if(track?.failed){
   // Reload the same media element so its Web Audio source stays connected.
   track.failed=false;track.pending=false;track.attempt++;track.pauseAt=0;
   track.media.load();
  }
  this.fx?.gain.setTargetAtTime(effects&&!this.suspended?.82:0,this.ctx.currentTime,.025);
  this.applyMusic();
 }
 suspend(value){
  if(this.suspended===value)return;this.suspended=value;
  if(this.ctx)this.fx.gain.setTargetAtTime(value||!this.effects?0:.82,this.ctx.currentTime,.025);
  this.applyMusic();
 }
 makeTrack(index){
  if(this.tracks[index])return this.tracks[index];
  const media=new Audio(MUSIC[index].src);media.loop=true;media.preload='none';
  const node=this.ctx.createMediaElementSource(media),gain=this.ctx.createGain();gain.gain.value=0;node.connect(gain);gain.connect(this.musicBus);
  const track={media,gain,pending:false,pauseAt:0,failed:false,attempt:0};this.tracks[index]=track;
  media.addEventListener('error',()=>{track.failed=true;this.onNotice('La musica non si è caricata. Premi MUSICA per riprovare.');});return track;
 }
 applyMusic(){
  if(!this.ctx||!this.unlocked)return;
  const canPlay=this.music&&!this.suspended;
  if(!canPlay){for(const t of this.tracks)if(t){t.media.pause();t.pauseAt=0;t.gain.gain.setTargetAtTime(0,this.ctx.currentTime,.03);}return;}
  const chosen=this.makeTrack(this.targetTrack);this.trackIndex=this.targetTrack;
  for(let i=0;i<this.tracks.length;i++){const t=this.tracks[i];if(!t)continue;const selected=i===this.targetTrack;
   t.gain.gain.setTargetAtTime(selected?1:0,this.ctx.currentTime,.3);
   if(selected){t.pauseAt=0;if(t.media.paused&&!t.pending&&!t.failed){
    t.pending=true;const attempt=++t.attempt;
    t.media.play().then(()=>{
     if(attempt!==t.attempt)return;t.pending=false;
     if(!this.music||this.suspended)t.media.pause();
     else if(i===this.targetTrack&&!t.media.paused){t.failed=false;this.onNotice('');}
    }).catch(err=>{if(attempt!==t.attempt)return;t.pending=false;if(err.name!=='AbortError')this.onNotice('Premi MUSICA per avviare la colonna sonora.');});
   }}
   else if(!t.media.paused)t.pauseAt=performance.now()+1200;
  }
 }
 update(state,{paused=false,story=false,hidden=false}={}){
  if(!this.ctx)return;
  this.cameraX=state.cameraX;const index=LEVELS[state.level].music;
  if(index!==this.targetTrack){this.targetTrack=index;this.applyMusic();}
  this.suspend(paused||hidden);
  if(this.story!==story){this.story=story;this.musicBus.gain.setTargetAtTime(story?.08:.19,this.ctx.currentTime,.4);}
  const now=performance.now();for(const t of this.tracks)if(t?.pauseAt&&now>=t.pauseAt){t.media.pause();t.pauseAt=0;}
  if(!paused&&!hidden&&!story&&state.mode==='playing'&&state.time-this.lastAmbience>17){this.lastAmbience=state.time;this.play({type:'distant',x:state.player.x+480});}
 }
 voice(x){
  if(!this.ctx||!this.effects||this.suspended||!this.unlocked||this.activeVoices>32)return null;
  const c=this.ctx,pan=c.createStereoPanner(),gain=c.createGain();pan.pan.value=limit(((x??this.cameraX+480)-this.cameraX-480)/520,-.85,.85);gain.gain.value=.85;
  gain.connect(pan);pan.connect(this.fx);pan.connect(this.room);this.activeVoices++;
  setTimeout(()=>{gain.disconnect();pan.disconnect();this.activeVoices--;},2200);return gain;
 }
 tone(bus,freq,dur,vol=.25,end=0,delay=0,type='sine'){
  const c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(end)o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.002);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(bus);o.start(t);o.stop(t+dur+.01);o.onended=()=>{o.disconnect();g.disconnect();};
 }
 noise(bus,dur,vol,frequency,filter='lowpass',delay=0,end=0,q=.7){
  const c=this.ctx,t=c.currentTime+delay,src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();src.buffer=this.noiseBuffer;f.type=filter;f.frequency.setValueAtTime(frequency,t);if(end)f.frequency.exponentialRampToValueAtTime(end,t+dur);f.Q.value=q;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.002);g.gain.exponentialRampToValueAtTime(.0001,t+dur);src.connect(f);f.connect(g);g.connect(bus);src.start(t,Math.random()*.5);src.stop(t+dur+.01);src.onended=()=>{src.disconnect();f.disconnect();g.disconnect();};
 }
 metal(bus,heavy=false,delay=0){
  const seed=.94+Math.random()*.12;
  [143,317,581,941,1667].forEach((f,i)=>this.tone(bus,f*seed*(heavy?.62:1),.16+(4-i)*.035,.105/(i+1),f*seed*.96,delay));
  this.noise(bus,.075,.23,2600,'bandpass',delay,500,1.2);
 }
 glass(bus,large=false){
  this.noise(bus,large?.38:.085,large?.38:.17,6200,'highpass',0,2300);
  for(let i=0;i<(large?13:3);i++){const f=1500+Math.random()*5700;this.tone(bus,f,.035+Math.random()*.14,.025+Math.random()*.045,f*.75,i*.025+Math.random()*.025);}
  if(large)this.noise(bus,.45,.13,3500,'bandpass',.13,900,1.6);
 }
 play(e){
  if(!this.ctx)return;const t=this.ctx.currentTime,key=e.type+':'+(e.material||'');
  const interval=e.type==='step'?.13:e.type==='hit'?.045:e.type==='distant'?10:.07;
  if(t-(this.last[key]??-20)<interval)return;const bus=this.voice(e.x);if(!bus)return;this.last[key]=t;
  const v=.9+Math.random()*.2,family=materialFamily(e.material);
  switch(e.type){
   case 'swing':this.noise(bus,e.kind==='kick'?.17:.1,.14,1000,'bandpass',0,400,1);break;
   case 'hit':
    if(family==='glass'){this.glass(bus);this.tone(bus,130,.09,.15,65);}
    else if(family==='metal'||family==='vehicle'){this.metal(bus,family==='vehicle');this.tone(bus,78,.14,.23,37);}
    else{this.tone(bus,155*v,e.kind==='kick'?.17:.11,.45,48);this.noise(bus,.055,.35,1350,'lowpass');this.noise(bus,.11,.12,700,'bandpass',.02,280);}
    break;
   case 'break':
    if(family==='glass')this.glass(bus,true);
    else{this.metal(bus,true);this.metal(bus,true,.12);this.noise(bus,.55,.27,2100,'lowpass',.02,400);}
    this.tone(bus,96,.32,.4,28);
    if(family==='vehicle'){this.glass(bus,true);[0,.28,.56].forEach(d=>this.tone(bus,760,.14,.09,920,d,'triangle'));}
    break;
   case 'block':this.noise(bus,.13,.25,700,'lowpass');this.tone(bus,160,.12,.22,80);break;
   case 'perfect':this.metal(bus);this.tone(bus,880,.2,.16,1320);break;
   case 'guardbreak':this.noise(bus,.25,.3,1100,'lowpass',0,280);this.tone(bus,180,.25,.2,60);break;
   case 'hurt':this.tone(bus,113*v,.18,.43,35);this.noise(bus,.09,.29,870);break;
   case 'step':this.noise(bus,.055,.12,e.material==='stone'?2100:1250,'highpass');this.tone(bus,95*v,.055,.06,55);break;
   case 'land':this.tone(bus,85,.12,.27,38);this.noise(bus,.17,.16,1500,'lowpass');break;
   case 'jump':this.noise(bus,.12,.12,1300,'bandpass',0,400);break;
   case 'pickup':[440,660,880].forEach((f,i)=>this.tone(bus,f,.18,.13,0,i*.06,'triangle'));break;
   case 'special':[165,220,330,440,660].forEach((f,i)=>this.tone(bus,f,.55,.12,0,i*.07,'triangle'));this.noise(bus,.7,.12,700,'bandpass',0,3200);break;
   case 'bomb':this.tone(bus,78,.7,.66,22);this.noise(bus,.14,.65,3200,'lowpass');this.noise(bus,1.15,.55,700,'lowpass',.015,80);this.metal(bus,true,.3);break;
   case 'arrest':this.noise(bus,.075,.18,1500,'bandpass');this.tone(bus,1700,.085,.12,1550,.08);this.metal(bus,false,.2);break;
   case 'cuffs':this.metal(bus,false);this.metal(bus,false,.11);break;
   case 'rescue':[330,495,660].forEach((f,i)=>this.tone(bus,f,.28,.14,0,i*.07,'triangle'));break;
   case 'radio':this.noise(bus,.25,.1,1600,'bandpass',0,1000,5);this.tone(bus,1350,.08,.075,0,.22);break;
   case 'distant':this.noise(bus,1.7,.035,520,'bandpass',0,700,1);[0,.52,1.04].forEach(d=>this.tone(bus,620,.5,.025,850,d));break;
   case 'win':[330,440,550,660,880].forEach((f,i)=>this.tone(bus,f,.3,.13,0,i*.12,'triangle'));break;
   case 'lose':[220,185,146,110].forEach((f,i)=>this.tone(bus,f,.35,.14,0,i*.2,'triangle'));break;
  }
 }
 status(){return {effects:this.effects,music:this.music,track:this.trackIndex<0?null:MUSIC[this.trackIndex].name,playing:this.tracks.some(t=>t&&!t.media.paused),context:this.ctx?.state||'unavailable'};}
}
