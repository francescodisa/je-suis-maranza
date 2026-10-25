import { LEVELS } from './campaign.js';
import { ArcadeAudio } from './audio.js';
import { Game } from './engine.js';
import { Renderer } from './renderer.js';
import { StoryPlayer, CHAPTERS, AFTERMATH, GALLERY_CHAPTERS } from './story.js';
import { TouchState, objectTarget, setupPhoneLayout, protectPlaySurface, gameplaySpeech, speechPages } from './mobile.js';
import { SAVE_KEY, createSave, readSave, restoreSave } from './save.js';

const $ = id => document.getElementById(id);
const canvas=$('game'), renderer=new Renderer(canvas);
let soundOn=true, musicOn=true, audio=null, paused=false, helping=false, previousMode='', lastHud=0, best=0, galleryOpen=false, lastStoryLine='',sceneView=false,aftermathKey='';
const story=new StoryPlayer(),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
try{best=Number(localStorage.getItem('maranza-record'))||0;soundOn=localStorage.getItem('maranza-audio')!=='off';musicOn=localStorage.getItem('maranza-music')!=='off';}catch{}
function audioNotice(text){for(const id of ['audioNotice','menuAudioNotice']){$(id).textContent=text;$(id).hidden=!text;}}
function wakeAudio(){try{if(!audio)audio=new ArcadeAudio({effects:soundOn,music:musicOn,onNotice:audioNotice});audio?.wake();}catch{audioNotice('Questo browser non riesce ad avviare l’audio.');}}
const game=new Game({onEvent:e=>audio?.play(e)});
window.maranza={game,renderer,story,audioStatus:()=>audio?.status(),snapshot:()=>({...game.snapshot(),story:story.active?{chapter:story.chapter.id,line:story.index}:null})};
const keys=new Set(),touchState=new TouchState(),touch=touchState.value;
let isPhone=()=>false,rotateDismissed=false;
isPhone=setupPhoneLayout(()=>{clearInput();showTouch();});
function clearInput(){keys.clear();touchState.reset();$('stick').style.transform='translate(0px,0px)';document.querySelectorAll('[data-action]').forEach(b=>b.classList.remove('pressed'));}
function input(){const pressed=touchState.consume();return{x:touch.x+Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA')),y:touch.y+Number(keys.has('ArrowDown')||keys.has('KeyS'))-Number(keys.has('ArrowUp')||keys.has('KeyW')),punch:pressed.punch||keys.has('KeyJ'),kick:pressed.kick||keys.has('KeyK'),jump:pressed.jump||keys.has('Space'),special:pressed.special||keys.has('KeyL')};}
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLSelectElement)return;if((e.target instanceof HTMLButtonElement||e.target instanceof HTMLAnchorElement)&&['Enter','Space'].includes(e.code))return;if(paused&&e.code!=='Escape'&&e.code!=='Tab')return;if(helping&&e.code==='Escape'&&!e.repeat){e.preventDefault();closeHelp();return;}if(story.active&&!helping){if(['Enter','Space','Escape'].includes(e.code)){e.preventDefault();if(!e.repeat){if(e.code==='Escape')story.finish();else story.next();updateStory();}}return;}if(galleryOpen){if(e.code==='Escape'){e.preventDefault();closeGallery();}return;}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD','KeyJ','KeyK','KeyL','Escape','Enter'].includes(e.code))e.preventDefault();if(e.code==='Escape'&&!e.repeat){if(helping)closeHelp();else togglePause();return;}if(e.code==='Enter'&&!e.repeat){if(game.state.mode==='title')start();else if(paused)togglePause();else if(['levelclear','gameover','victory'].includes(game.state.mode))advance();}keys.add(e.code);});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{clearInput();if(['playing','bossescape'].includes(game.state.mode)&&!paused&&!helping)togglePause();});
document.addEventListener('visibilitychange',()=>{audio?.suspend(document.hidden||paused||helping);if(document.hidden){clearInput();if(['playing','bossescape'].includes(game.state.mode)&&!paused&&!helping)togglePause();}});

function showTouch(){
 const s=game.state,combat=s.mode==='playing'&&!paused&&!helping&&!story.active&&!galleryOpen;
 const hasTouch=isPhone()||matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
 $('touchControls').hidden=!hasTouch||!combat;
 $('cabinet').classList.toggle('is-combat',combat);
 $('cabinet').classList.toggle('is-story',story.active);
 $('cabinet').classList.toggle('scene-view',story.active&&sceneView);
 $('cabinet').classList.toggle('is-playing',s.mode!=='title'&&!story.active&&!galleryOpen);
 document.querySelector('.app').classList.toggle('in-run',s.mode!=='title');
 $('menuBtn').hidden=paused||helping||story.active||galleryOpen||(!combat&&!['bossescape','levelclear'].includes(s.mode)&&!(isPhone()&&s.mode==='title'));
 $('menuBtn').setAttribute('aria-expanded',String(paused));
 $('targetHud').hidden=!combat;$('objectiveHint').hidden=true;
 if(!combat)$('speechHud').hidden=true;
 $('rotateHint').hidden=!combat||rotateDismissed;
}
$('dismissRotate').onclick=()=>{rotateDismissed=true;showTouch();};
function setAudio(){
 for(const [id,on,label] of [['audioBtn',soundOn,'effetti sonori'],['menuAudio',soundOn,'effetti sonori'],['musicBtn',musicOn,'musica'],['menuMusic',musicOn,'musica']]){const b=$(id);b.textContent=(label==='musica'?'♫ MUSICA':'FX')+' '+(on?'ON':'OFF');b.title=(on?'Disattiva ':'Attiva ')+label;b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed',String(on));}
 audio?.setPreferences({effects:soundOn,music:musicOn});
 try{localStorage.setItem('maranza-audio',soundOn?'on':'off');localStorage.setItem('maranza-music',musicOn?'on':'off');}catch{}
}
const difficultyHints={facile:'La difficoltà precedente, con più tempo per reagire.',normale:'Pattuglie più rapide, prese frequenti e meno recuperi.',difficile:'Inseguimenti serrati, recuperi scarsi e boss più resistenti.'};
$('difficulty').onchange=()=>{$('difficultyHint').textContent=difficultyHints[$('difficulty').value];};
$('difficulty').onchange();
function start(){if($('startBtn').disabled)return;aftermathKey='';$('saveNotice').textContent='Puoi salvare qui e riprendere dallo stesso punto su questo browser.';wakeAudio();if(audio)audio.lastAmbience=-30;clearInput();story.cancel();galleryOpen=false;paused=false;helping=false;$('pauseBtn').textContent='Ⅱ';$('pauseBtn').setAttribute('aria-label','Pausa');game.reset($('difficulty').value);game.start();$('pauseScreen').hidden=true;$('helpScreen').hidden=true;playStory(0);}
function returnToTitle(){
 clearInput();story.cancel();galleryOpen=false;paused=false;helping=false;aftermathKey='';lastStoryLine='';setSceneView(false);
 game.reset($('difficulty').value);previousMode='';
 $('pauseScreen').hidden=true;$('helpScreen').hidden=true;$('pauseBtn').textContent='Ⅱ';$('pauseBtn').setAttribute('aria-label','Pausa');
 refreshSave();syncMode();updateHUD();audio?.suspend(document.hidden);$('startBtn').focus({preventScroll:true});
}
function advance(){clearInput();if(game.state.mode==='levelclear'){game.nextLevel();playStory(game.state.level);wakeAudio();}else if(['gameover','victory'].includes(game.state.mode))returnToTitle();}
function updateMenu(){
 const s=game.state;
 $('menuStage').textContent=s.mode==='title'?'IMPOSTAZIONI':`ATTO ${s.level+1} / ${LEVELS.length} · ${s.levelName.replace(/^\d+\s*·\s*/,'')}`;
 $('menuScore').textContent=s.score.toLocaleString('it-IT');$('menuRecord').textContent=Math.max(best,s.score).toLocaleString('it-IT');
 $('menuEnergy').textContent=Math.floor(s.motivation)+' / 100';$('menuAlarm').textContent=Math.round(s.alarm)+'%';$('menuObjects').textContent=s.objectsDestroyed;
 $('menuFreed').textContent=s.freed;
 $('menuObjective').textContent=s.objective;$('saveBtn').disabled=!['playing','bossescape','levelclear'].includes(s.mode);
 $('resumeBtn').textContent=s.mode==='title'?'TORNA →':'RIPRENDI →';
}
function togglePause(){
 if(!['title','playing','bossescape','levelclear'].includes(game.state.mode)||helping||story.active||galleryOpen)return;
 paused=!paused;clearInput();$('pauseScreen').hidden=!paused;
 $('pauseBtn').textContent=paused?'▶':'Ⅱ';$('pauseBtn').setAttribute('aria-label',paused?'Riprendi':'Pausa');
 if(paused){updateMenu();$('resumeBtn').focus({preventScroll:true});}else(game.state.mode==='title'?$('startBtn'):canvas).focus({preventScroll:true});
 showTouch();audio?.suspend(paused);
}
function refreshSave(){
 try{const saved=readSave(localStorage.getItem(SAVE_KEY));$('loadBtn').hidden=false;$('loadBtn').textContent=`RIPRENDI · ATTO ${saved.state.level+1} · ${saved.state.score.toLocaleString('it-IT')} PUNTI`;$('loadBtn').title=saved.version<7?'Il vecchio salvataggio riparte dall’inizio dell’atto con le nuove regole.':'';}
 catch{$('loadBtn').hidden=true;}
}
$('saveBtn').onclick=()=>{
 try{localStorage.setItem(SAVE_KEY,createSave(game));$('saveNotice').textContent='Partita salvata. Puoi riprendere da questo punto sullo stesso browser.';refreshSave();}
 catch{$('saveNotice').textContent='Il browser non riesce a salvare. Puoi continuare la partita.';}
};
$('loadBtn').onclick=()=>{
 try{const restored=restoreSave(game,localStorage.getItem(SAVE_KEY));aftermathKey='';if(restored.migrated)game.toast('Il salvataggio è stato aggiornato. Riparti dall’inizio dell’atto, conservando i punti e le risorse.',8);$('difficulty').value=game.difficulty;$('difficulty').onchange();story.cancel();galleryOpen=false;paused=false;helping=false;clearInput();previousMode='';syncMode();wakeAudio();canvas.focus({preventScroll:true});}
 catch{$('loadBtn').textContent='Non riesco a caricare questa partita.';}
};
refreshSave();
function playStory(chapter,fromGallery=false,onDone=null){
 wakeAudio();clearInput();lastStoryLine='';setSceneView(false);
 story.start(chapter,()=>{clearInput();if(onDone){onDone();return;}galleryOpen=fromGallery;previousMode='';syncMode();(fromGallery?$('closeGallery'):canvas).focus({preventScroll:true});},isPhone()?72:Infinity);
 previousMode='';syncMode();updateStory();$('storyNext').focus({preventScroll:true});
}
function maybeAftermath(){
 const s=game.state,key=s.level+':'+s.bossFled;
 if(story.active||galleryOpen||paused||helping||!s.bossFled||!['levelclear','victory'].includes(s.mode)||aftermathKey===key)return;
 aftermathKey=key;const chapters=AFTERMATH[s.bossFled]||[];let index=0;
 const next=()=>{if(index<chapters.length)playStory(chapters[index++],false,next);else{previousMode='';syncMode();$('continueBtn').focus({preventScroll:true});}};next();
}
function updateStory(){if(!story.active)return;const ch=story.chapter,line=story.line,key=ch.id+story.index;$('storyText').textContent=story.text;$('storyNext').textContent=!story.complete?'MOSTRA TUTTO IL TESTO':story.index===story.lineCount-1?(galleryOpen?'TORNA ALLA GALLERIA':ch.id==='epilogo'?'VEDI IL RISULTATO':ch.id.includes('fuga')?'CONTINUA':'ENTRA IN GIOCO'):'CONTINUA →';if(key!==lastStoryLine){lastStoryLine=key;$('storyChapter').textContent=ch.number+' / '+ch.title;$('storyLocation').textContent=ch.location;$('storySpeaker').textContent=line.speaker;$('storyAccessible').textContent=line.speaker+'. '+line.text;$('storyCount').textContent=String(story.index+1).padStart(2,'0')+' / '+String(story.lineCount).padStart(2,'0');} }
function openGallery(){if($('galleryBtn').disabled)return;clearInput();galleryOpen=true;previousMode='';syncMode();$('closeGallery').focus({preventScroll:true});}
function closeGallery(){story.cancel();galleryOpen=false;previousMode='';syncMode();$('galleryBtn').focus({preventScroll:true});}
GALLERY_CHAPTERS.forEach((chapter,i)=>{const b=document.createElement('button');b.className='scene-card';b.innerHTML=`<span class="scene-thumb scene-${chapter.scene} ${chapter.atlas==='storyNew'?'scene-new':chapter.atlas==='storyEnd'?'scene-end':''}" aria-hidden="true"></span><span class="scene-name"><small>${chapter.number}</small>${chapter.title}</span>`;b.onclick=()=>playStory(chapter,true);$('sceneList').append(b);});
function setSceneView(value){sceneView=!!value;$('cabinet').classList.toggle('scene-view',story.active&&sceneView);$('storyView').textContent=sceneView?'TORNA AL DIALOGO':'GUARDA L’IMMAGINE';$('storyView').setAttribute('aria-pressed',String(sceneView));}
$('storyView').onclick=()=>setSceneView(!sceneView);
$('galleryBtn').onclick=openGallery;$('closeGallery').onclick=closeGallery;$('storyNext').onclick=()=>{story.next();updateStory();};$('storySkip').onclick=()=>story.finish();
function openHelp(){helping=true;clearInput();$('helpScreen').hidden=false;showTouch();$('closeHelp').focus({preventScroll:true});}
function closeHelp(){helping=false;clearInput();$('helpScreen').hidden=true;showTouch();(paused?$('menuHelp'):game.state.mode==='title'?$('startBtn'):canvas).focus({preventScroll:true});}
$('startBtn').onclick=start;$('continueBtn').onclick=advance;$('pauseBtn').onclick=togglePause;$('resumeBtn').onclick=togglePause;$('restartBtn').onclick=returnToTitle;$('helpBtn').onclick=openHelp;$('closeHelp').onclick=closeHelp;
for(const id of ['audioBtn','menuAudio'])$(id).onclick=()=>{soundOn=!soundOn;setAudio();wakeAudio();};for(const id of ['musicBtn','menuMusic'])$(id).onclick=()=>{musicOn=!musicOn;setAudio();wakeAudio();};setAudio();
$('menuBtn').onclick=togglePause;$('menuHelp').onclick=openHelp;
async function fullscreen(){try{const box=document.querySelector('.app');if(document.fullscreenElement)await document.exitFullscreen();else if(box.requestFullscreen)await box.requestFullscreen();else $('saveNotice').textContent='Qui lo schermo intero non è disponibile. Prova a ruotare il telefono.';}catch{$('saveNotice').textContent='Qui lo schermo intero non è disponibile. Prova a ruotare il telefono.';}}
$('fullBtn').onclick=fullscreen;$('menuFull').onclick=fullscreen;
const joy=$('joystick');
function joyMove(e){if(!touchState.owns('move',e.pointerId))return;const r=joy.getBoundingClientRect(),max=r.width*.31;let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;const len=Math.hypot(x,y);if(len>max){x=x/len*max;y=y/len*max;}touch.x=Math.abs(x/max)<.15?0:x/max;touch.y=Math.abs(y/max)<.15?0:y/max;$('stick').style.transform=`translate(${x}px,${y}px)`;}
joy.addEventListener('pointerdown',e=>{e.preventDefault();if(!touchState.claim('move',e.pointerId))return;joy.setPointerCapture(e.pointerId);joyMove(e);wakeAudio();});
joy.addEventListener('pointermove',joyMove);
const releaseJoy=e=>{if(touchState.release('move',e.pointerId))$('stick').style.transform='translate(0px,0px)';};
for(const type of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(type,releaseJoy);
document.querySelectorAll('[data-action]').forEach(b=>{
 const action=b.dataset.action;
 b.addEventListener('pointerdown',e=>{e.preventDefault();if(!touchState.claim(action,e.pointerId))return;b.setPointerCapture(e.pointerId);b.classList.add('pressed');wakeAudio();});
 const release=e=>{if(touchState.release(action,e.pointerId))b.classList.remove('pressed');};
 for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,release);
});
protectPlaySurface($('cabinet'),()=>$('cabinet').classList.contains('is-combat'));
// Keep keyboard navigation inside an open menu/help dialog.
document.addEventListener('keydown',e=>{
 if(e.key!=='Tab'||(!paused&&!helping))return;
 const box=helping?$('helpScreen'):$('pauseScreen'),nodes=[...box.querySelectorAll('button:not([disabled]),select,a[href]')].filter(n=>!n.hidden),first=nodes[0],last=nodes.at(-1);
 if(e.shiftKey&&(document.activeElement===first||!box.contains(document.activeElement))){e.preventDefault();last.focus();}
 else if(!e.shiftKey&&(document.activeElement===last||!box.contains(document.activeElement))){e.preventDefault();first.focus();}
});

function syncMode(){const s=game.state,mode=s.mode+':'+story.active+':'+galleryOpen;if(mode===previousMode)return;previousMode=mode;clearInput();$('footerKey').innerHTML='<kbd>ESC</kbd> '+(story.active?'SALTA SCENA':galleryOpen?'MENU':'PAUSA');$('titleScreen').hidden=s.mode!=='title'||story.active||galleryOpen;$('galleryScreen').hidden=!galleryOpen||story.active;$('storyScreen').hidden=!story.active;$('hud').hidden=s.mode==='title'||story.active||galleryOpen;$('resultScreen').hidden=story.active||!['levelclear','gameover','victory'].includes(s.mode);$('toast').hidden=s.mode!=='playing'||story.active||galleryOpen;showTouch();if(!story.active&&['levelclear','gameover','victory'].includes(s.mode)){
 if(s.score>best){best=s.score;try{localStorage.setItem('maranza-record',String(best));}catch{}}
 $('resultScore').textContent=s.score.toLocaleString('it-IT');$('resultObjects').textContent=s.objectsDestroyed;
 const won=s.mode==='victory',lost=s.mode==='gameover';$('resultEyebrow').textContent=won?'LA STRADA CONTINUA':lost?'IL CORTEO SI ALLONTANA':`ATTO ${String(s.level+1).padStart(2,'0')} COMPLETATO`;
 $('resultTitle').textContent=won?'Un primo passo è fatto.':lost?(s.defeatReason==='arrest'?'Ti hanno arrestato.':'Ti hanno fermato.'):LEVELS[s.level].nextTitle;
 $('resultCopy').textContent=won?`Trump e il Presidente sono fuggiti. Il bombardamento si è fermato e il corteo ha raggiunto il palazzo.

${s.recruited} agenti hanno esitato. ${s.freed} manifestanti sono stati liberati.

La partita finisce qui. Fuori c’è ancora molto da fare.`:lost?(s.defeatReason==='arrest'?'Conserva un po’ di motivazione per le prese: ti serve a liberarti o a convincere chi ti trattiene.':'Aspetta il momento giusto per proteggerti. Quando compare il segnale di una presa, prova ad allontanarti.'):LEVELS[s.level].nextCopy;
 $('continueBtn').innerHTML=(lost||won?'SCHERMATA INIZIALE':'PROSSIMO ATTO')+' <span>→</span>';
 }}
const speechMeasure=document.createElement('canvas').getContext('2d');
let caption=null;
function updateSpeech(s,combat){
 const hud=$('speechHud'),message=combat?gameplaySpeech(s):null;
 if(!message){hud.hidden=true;caption=null;return false;}
 hud.hidden=false;hud.dataset.tone=message.tone;hud.dataset.speakerKind=/AGENTE|RADIO/.test(message.speaker)?'police':'player';
 const mobile=isPhone(),textNode=$('speechText'),style=getComputedStyle(textNode),width=textNode.clientWidth;
 const key=message.key+':'+message.text+':'+mobile;
 if(!caption||caption.key!==key||caption.width!==width){
  speechMeasure.font=style.font;
  caption={key,width,start:s.time,duration:Math.max(.8,message.remaining||3.4),pages:mobile?speechPages(message.text,Math.max(120,width-2),text=>speechMeasure.measureText(text).width):[message.text]};
  $('speechAccessible').textContent=message.speaker+'. '+message.text;
 }
 const page=Math.min(caption.pages.length-1,Math.floor(Math.max(0,s.time-caption.start)/caption.duration*caption.pages.length));
 const speaker=message.speaker+(caption.pages.length>1?' · '+(page+1)+'/'+caption.pages.length:'');
 if($('speechSpeaker').textContent!==speaker)$('speechSpeaker').textContent=speaker;
 if(textNode.textContent!==caption.pages[page])textNode.textContent=caption.pages[page];
 return true;
}
function updateHUD(){
 const s=game.state,p=s.player,combat=s.mode==='playing'&&!paused&&!helping&&!story.active&&!galleryOpen;
 $('playerName').textContent=p.name||'MARANZA';
 const motivation=Math.max(0,Math.floor(s.motivation??100)),broken=(p.guardBroken||0)>0;
 $('motivationText').textContent=motivation+' / 100';$('motivationBar').style.width=motivation+'%';$('motivationBar').classList.toggle('low',motivation<40);
 const guardButton=document.querySelector('[data-action="kick"]');guardButton.classList.toggle('is-blocking',!!p.blocking);guardButton.classList.toggle('is-exhausted',broken||motivation<=0);guardButton.setAttribute('aria-label',`Proteggiti, tieni premuto. Motivazione ${motivation} su 100${broken?', protezione esaurita':''}.`);
 $('objectiveHint').hidden=true;
 const bossFight=!!s.boss?.groundPhase;$('attackLabel').textContent=bossFight?'CORAZZA':'SPACCA';document.querySelector('[data-action="punch"]').setAttribute('aria-label',bossFight?`Colpisci la corazza di ${s.boss.name} quando è esposta`:'Spacca gli oggetti per recuperare motivazione');
 const target=objectTarget(s);$('targetName').textContent=target?(target===s.boss?'CORAZZA · '+target.name:target.label||target.name):'VERSO L’USCITA →';$('targetBar').style.width=target?`${target.hp/target.maxHp*100}%`:'0%';
 $('targetHud').hidden=!combat||!target;
 $('touchEnergy').textContent='40';const specialButton=document.querySelector('[data-action="special"]');specialButton.classList.toggle('is-ready',s.motivation>=40);specialButton.setAttribute('aria-label',`Convinci. Costa 40 motivazione; ne hai ${motivation}.`);
 $('hpText').textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;$('healthBar').style.width=`${p.hp/p.maxHp*100}%`;
 $('alarmBar').style.width=`${s.alarm}%`;$('stageNumber').textContent=`ATTO ${String(s.level+1).padStart(2,'0')} / ${String(LEVELS.length).padStart(2,'0')}`;$('stageName').textContent=s.levelName.replace(/^\d+\s*·\s*/,'');$('score').textContent=String(s.score).padStart(6,'0');$('record').textContent=String(Math.max(s.score,best)).padStart(6,'0');$('combo').textContent=s.combo>1?`${s.combo} COLPI ×${(1+Math.min(s.combo,15)*.05).toFixed(2)}`:'';
 const speech=updateSpeech(s,combat||(s.mode==='bossescape'&&!paused&&!helping&&!story.active&&!galleryOpen)),important=/motivazione|pattuglia|presa|preso|afferrato|presidente|bombard|salvataggio/i.test(s.toast?.text||'');
 const toast=!!(combat&&!speech&&s.toast?.ttl>0&&(!isPhone()||important));$('toast').hidden=!toast;if(toast)$('toast').textContent=s.toast.text;
 $('direction').hidden=!combat||bossFight;
}
let then=performance.now();function loop(now){let dt=Math.min((now-then)/1000,.05);then=now;if(story.active){if(!helping&&!document.hidden&&!sceneView)story.update(dt);renderer.narrative(story,reducedMotion);updateStory();}else{if(!paused&&!helping&&!galleryOpen)game.update(dt,input());renderer.render(game.state);}maybeAftermath();syncMode();audio?.update(story.active?{...game.state,level:story.chapter.musicLevel??Math.max(0,CHAPTERS.indexOf(story.chapter))}:game.state,{paused:paused||helping,story:story.active||galleryOpen,hidden:document.hidden});if(now-lastHud>80){updateHUD();lastHud=now;}requestAnimationFrame(loop);}
await renderer.loadAssets?.();$('startBtn').disabled=false;$('galleryBtn').disabled=false;syncMode();requestAnimationFrame(loop);
