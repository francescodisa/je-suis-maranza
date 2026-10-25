import assert from 'node:assert/strict';
import {ArcadeAudio,MUSIC,materialFamily} from '../dist/audio.js';
const param=()=>({value:0,setTargetAtTime(v){this.value=v;}});
const node=()=>({gain:param(),connect(){},disconnect(){}});
class Context{
 constructor(){this.currentTime=0;this.sampleRate=100;this.destination={};this.state='running';}
 createGain(){return node();}createMediaElementSource(){return node();}createConvolver(){return node();}
 createDynamicsCompressor(){return {...node(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()};}
 createBuffer(c,n){return {getChannelData:()=>new Float32Array(n)};}resume(){return Promise.resolve();}
}
class Media{
 constructor(src){this.src=src;this.paused=true;this.playCalls=0;this.loadCalls=0;this.listeners={};}
 addEventListener(name,fn){this.listeners[name]=fn;}play(){this.paused=false;this.playCalls++;return Promise.resolve();}pause(){this.paused=true;}load(){this.loadCalls++;this.paused=true;}
}
globalThis.window={AudioContext:Context};globalThis.Audio=Media;
const a=new ArcadeAudio();assert.equal(a.tracks.length,0,'no music request or autoplay before interaction');
a.wake();await Promise.resolve();assert(a.status().playing);assert.equal(a.status().track,MUSIC[0].name);assert(a.tracks[0].media.loop);
a.setPreferences({music:false});assert(!a.status().playing);assert(a.effects,'music toggle must preserve effects');assert(a.fx.gain.value>0);
a.setPreferences({music:true,effects:false});await Promise.resolve();assert(a.status().playing);assert.equal(a.fx.gain.value,0,'effects toggle must preserve music');
a.suspend(true);assert(!a.status().playing);a.suspend(false);await Promise.resolve();assert(a.status().playing);
a.update({level:4,cameraX:0,time:0,mode:'title'},{story:true});await Promise.resolve();assert.equal(a.status().track,MUSIC[1].name);assert.equal(a.musicBus.gain.value,.08);
a.setPreferences({music:false});assert(a.tracks.every(t=>!t||t.media.paused),'mute must stop both sides of a crossfade');
a.setPreferences({music:true});a.suspend(true);await Promise.resolve();assert(!a.status().playing,'pending media play must not undo a pause');
assert.equal(materialFamily('window'),'glass');assert.equal(materialFamily('tesla'),'vehicle');assert.equal(materialFamily('safe'),'metal');assert.equal(materialFamily('body'),'body');assert.equal(materialFamily('machine'),'metal');assert.equal(materialFamily('metal'),'metal');
// A failed file must remain quiescent until the user explicitly toggles music.
const notices=[],retry=new ArcadeAudio({onNotice:notice=>notices.push(notice)});
retry.wake();await Promise.resolve();const failed=retry.tracks[0],media=failed.media;
media.pause();media.listeners.error();assert(failed.failed);assert(notices.at(-1).includes('non si è caricata'));
const playsBefore=media.playCalls;retry.wake();assert.equal(media.playCalls,playsBefore,'failed media must not retry on every wake');
retry.suspend(true);retry.setPreferences({music:false});retry.setPreferences({music:true});
assert.equal(media.loadCalls,1);assert.equal(failed.failed,false);assert.equal(media.playCalls,playsBefore,'retry reload must respect menu pause');
retry.suspend(false);await Promise.resolve();assert.equal(media.playCalls,playsBefore+1);assert(retry.status().playing);assert.equal(notices.at(-1),'','successful retry clears the stale failure notice');
// An obsolete play promise aborted by load cannot clear a newer pending attempt.
retry.setPreferences({music:false});let rejectOld;
media.play=()=>{media.playCalls++;return new Promise((_,reject)=>{rejectOld=reject;});};
retry.setPreferences({music:true});const oldReject=rejectOld;media.listeners.error();retry.setPreferences({music:false});retry.setPreferences({music:true});
assert(failed.pending);oldReject({name:'AbortError'});await Promise.resolve();await Promise.resolve();assert(failed.pending,'the new attempt still owns its pending flag');
console.log('Audio: gesture gating, two looping tracks, independent mute, pause/resume, ducking, crossfade mute and materials passed.');
