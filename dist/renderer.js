import { LEVELS } from './campaign.js';
// 480 × 270 internal raster, doubled without smoothing for a coherent arcade grid.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rand=n=>{const k=Math.sin(n*127.1+311.7)*43758.5453;return k-Math.floor(k)};
const snap=n=>Math.round(n/2)*2;
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(snap(x),snap(y),Math.max(2,snap(w)),Math.max(2,snap(h)));};
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(snap(p[0]),snap(p[1])):c.moveTo(snap(p[0]),snap(p[1])));c.closePath();c.fill();}
function label(c,str,x,y,size=18,color='#fff2d0',align='center'){c.font=`bold ${size}px monospace`;c.textAlign=align;c.fillStyle='#101725';c.fillText(str,snap(x)+2,snap(y)+2);c.fillStyle=color;c.fillText(str,snap(x),snap(y));}
function shadow(c,x,y,w){c.fillStyle='#10122366';c.beginPath();c.ellipse(snap(x),snap(y),w*.5,6,0,0,Math.PI*2);c.fill();}
const PROPS={bin:['urban',0],car:['urban',1],window:['urban',2],supercar:['luxury',0],bag:['luxury',1],safe:['luxury',2],coupe:['prestige',0],limo:['prestige',1],tesla:['tesla',0],cybertruck:['tesla',1],vending:['extras',0],watch:['extras',1],clock:['extras',2],statue:['extras',3]};
const ART={hero:'hero',guards:'guards',boss:'boss',bossRoster:'bosses-v10',storyEnd:'story-v10',woman:'woman-v2',crowd:'crowd-v2',urban:'urban-props-v2',luxury:'luxury-props-v2',prestige:'prestige-cars-v2',streetA:'streets-a-v2',streetB:'streets-b-v2',streetC:'streets-c-v4',storyNew:'story-v4',cover:'cover-v3',story:'story-v3',tesla:'tesla-v3',extras:'objects-v3'};
export class Renderer{
 constructor(canvas){this.canvas=canvas;canvas.width=960;canvas.height=540;this.out=canvas.getContext('2d',{alpha:false});this.scene=document.createElement('canvas');this.scene.width=480;this.scene.height=270;this.c=this.scene.getContext('2d',{alpha:false});this.images={};this.sheets={};this.missing=[];this.time=0;}
 async loadAssets(){
  await Promise.all(Object.entries(ART).map(async([key,file])=>{try{const img=new Image();img.src=`./assets/${file}.png`;await img.decode();this.images[key]=img;if(!['streetA','streetB','streetC','cover','story','storyNew','storyEnd'].includes(key))this.sheets[key]=this.prepare(img,key);}catch(e){this.missing.push(key);console.error('Artwork unavailable:',key,e.message);}}));
  if(this.sheets.hero)this.sheets.civilian=this.palette(this.sheets.hero);
 }
 prepare(image,name){
  const cv=document.createElement('canvas');cv.width=image.width;cv.height=image.height;const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const data=c.getImageData(0,0,cv.width,cv.height).data;
  let columns=[0,.25,.5,.75,1],rows=[0,.5,1];
  // The art has deliberate unequal widths for vehicles and storefronts.
  if(name==='urban')columns=[0,.313,.6836,1];
  if(name==='luxury')columns=[0,.412,.686,1];
  if(name==='prestige')columns=[0,.45,1];
  if(name==='tesla')columns=[0,.5,1];
  if(name==='boss'){columns=[0,.5,1];rows=[0,1];}
  if(name==='crowd')rows=[0,.3775,.716,1];
  const frames=[];
  for(let row=0;row<rows.length-1;row++)for(let col=0;col<columns.length-1;col++){
   const left=Math.round(columns[col]*image.width),right=Math.round(columns[col+1]*image.width),top=Math.round(rows[row]*image.height),bottom=Math.round(rows[row+1]*image.height);
   let minX=right,minY=bottom,maxX=left,maxY=top;
   for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*image.width+x)*4+3]>96){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
   if(maxX<minX){minX=left;maxX=right-1;minY=top;maxY=bottom-1;}
   frames.push({sx:Math.max(left,minX-1),sy:Math.max(top,minY-1),sw:Math.min(right,maxX+2)-Math.max(left,minX-1),sh:Math.min(bottom,maxY+2)-Math.max(top,minY-1),left,top,cellW:right-left});
  }
  if(name==='bossRoster'){
   // Each row has two armor poses and two unhurt running poses. Use a stable
   // per-pair scale so animation never changes the apparent body size.
   const scales=[0,1].map(row=>({armor:174/((frames[row*4].sh+frames[row*4+1].sh)/2),run:130/((frames[row*4+2].sh+frames[row*4+3].sh)/2)}));
   return{image,frames,cols:4,scales};
  }
  const upright=name==='boss'?[0,1]:name==='crowd'?[4,5,6,7]:name==='hero'||name==='woman'?[0,1,2,3]:name==='guards'?[0,1,4,5]:[0];
  return{image,frames,cols:columns.length-1,scale:(name==='boss'?226:name==='crowd'?94:124)/(upright.reduce((sum,i)=>sum+frames[i].sh,0)/upright.length)};
 }
 palette(sheet){
  const cv=document.createElement('canvas');cv.width=sheet.image.width;cv.height=sheet.image.height;const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(sheet.image,0,0);const d=c.getImageData(0,0,cv.width,cv.height),a=d.data;
  for(let i=0;i<a.length;i+=4){const r=a[i],g=a[i+1],b=a[i+2];if(a[i+3]>0&&b-r>25&&b-g>16&&b>45){a[i]=Math.min(255,b*1.05);a[i+1]=(g*.7+b*.3)*.85;a[i+2]=r*.85+g*.18;}}
  c.putImageData(d,0,0);return{...sheet,image:cv};
 }
 // All figures use the same source artwork, proportions and raster grid.
 person(e,s,decor=null){
  if(e.type==='boss'){this.boss(e,s);return;}
  const c=this.c,isPlayer=e===s.player,character=e.character||(e.type==='woman'?'woman':e.type==='man'?'man':null),isWoman=character==='woman',isMan=character==='man',isCrowd=e.type==='crowd',isCivil=e.type==='protester'||(e.type==='ally'&&!e.originalType),ally=!isPlayer&&(isWoman||isMan||isCivil||e.type==='ally');
  const key=isPlayer?(isWoman?'woman':'hero'):isWoman?'woman':isMan?'hero':isCrowd?'crowd':isCivil?'civilian':'guards',sheet=this.sheets[key];if(!sheet)return;
  const t=decor?.time??s.time,held=isPlayer&&s.playerArrest,hesitant=!decor&&!ally&&!isPlayer&&e.stoodDown>0,action=e.captorId||held?'hurt':e.action||'idle',dead=e.dead||action==='down';
  let frame=0;
  if(isCrowd){frame=(e.variant||0)%4+(action==='punch'?8:action==='walk'?4:0);}
  else if(isPlayer||isWoman||isMan||isCivil){frame=dead||action==='hurt'?6:action==='special'?7:e.blocking?0:action==='kick'?4:action==='punch'?3:e.z>0||action==='jump'?5:action==='walk'?1+Math.floor(t*8)%2:0;}
  else{const row=['soldier','elite'].includes(e.originalType||e.type)?4:0;frame=row+(dead||action==='hurt'?3:action==='punch'||action==='kick'?2:action==='walk'?Math.floor(t*7)%2:0);}
  const f=sheet.frames[frame],scale=sheet.scale*(decor?.scale||1),x=decor?.x??(e.x-s.cameraX),y=(decor?.y??e.y)-(e.z||0),w=f.sw*scale,h=f.sh*scale;
  if(x<-160||x>1120)return;
  let anchor=f.sw*.5;
  if(!isCrowd){const anchors=key==='guards'?[.4,.4,.37,.6,.4,.43,.36,.62]:isWoman?[.5,.5,.5,.43,.3,.53,.57,.5]:[.47,.5,.48,.45,.32,.52,.58,.52];anchor=f.left+f.cellW*anchors[frame]-f.sx;}
  else if(action==='punch')anchor=f.sw*.4;
  if(!decor)shadow(c,x,e.y,dead?76:52);
  c.save();c.translate(snap(x),snap(y));c.scale(e.dir||1,1);c.globalAlpha=decor?.alpha??1;
  if(dead){c.rotate(-1.48);c.translate(22,0);c.globalAlpha*=clamp((e.deadTimer||.1)/.7,.1,1);}
  if(e.invuln>0&&Math.floor(t*17)%2===0)c.globalAlpha*=.55;
  if(e.leaving)c.globalAlpha*=.75;
  if(action==='hurt')c.translate(-4,2);if(e.captorId)c.translate(0,6);
  if(action==='windup')c.translate(-4,0);if(isPlayer&&e.blocking)c.translate(-3,3);if(held)c.rotate(-.06);if(hesitant){c.translate(0,2);c.rotate(Math.sin(t*1.8+e.id)*.025);}
  const bob=action==='walk'?Math.abs(Math.sin(t*11))*2:Math.sin(t*2.4)*.8;
  c.drawImage(sheet.image,f.sx,f.sy,f.sw,f.sh,snap(-anchor*scale),snap(-h-bob),snap(w),snap(h));
  if(isPlayer&&e.blocking&&!decor){
   // Crossed sleeves and exposed knuckles, never a physical shield item.
   poly(c,[[-6,-75],[1,-81],[24,-102],[29,-96],[9,-68]],isWoman?'#65242e':'#102459');
   poly(c,[[-3,-76],[2,-78],[23,-97],[26,-94],[7,-71]],isWoman?'#c85854':'#5579bf');
   poly(c,[[7,-91],[13,-96],[31,-75],[25,-69]],isWoman?'#953339':'#173677');
   const skin=isWoman?'#bc8b66':'#e9b991';rect(c,20,-102,8,7,skin);rect(c,6,-96,8,7,skin);
   c.strokeStyle=s.motivation<25?'#e8a36faa':'#b8d5edbb';c.lineWidth=2;c.beginPath();c.moveTo(36,-112);c.lineTo(44,-101);c.lineTo(46,-76);c.lineTo(38,-62);c.stroke();
  }
  if(hesitant&&!dead){
   // A hand to the helmet and a still stance make the hesitation visible.
   poly(c,[[10,-66],[24,-72],[30,-102],[23,-108],[17,-81],[5,-76]],'#273846');
   poly(c,[[15,-75],[23,-79],[26,-98],[21,-99],[17,-83],[10,-79]],'#6b8090');
   rect(c,21,-109,10,9,'#d4b89e');
  }
  if(ally&&!dead&&!decor)rect(c,-15,-2,30,2,'#8ae0c8');
  c.restore();
  if(isPlayer&&!decor&&!dead){
   if(e.blockFlash>0){const perfect=e.perfectBlock,fx=x+(e.dir||1)*36,fy=y-88;for(let i=0;i<5;i++){const a=-1.2+i*.6;rect(c,fx+Math.cos(a)*21*(e.dir||1),fy+Math.sin(a)*25,perfect?8:5,3,perfect?'#fff2bd':'#a8d8ed');}if(perfect)label(c,'PARATA!',x,y-146,18,'#fff2bd');}
   if(e.guardBroken>0)label(c,'MOTIVAZIONE ESAURITA',clamp(x,150,810),y-145,16,'#ffc797');
  }
  if(!decor&&!isPlayer&&!dead){
   if(ally){
    const near=Math.abs(e.x-s.player.x)<240&&!s.persuasion;
    if(near&&!e.leaving&&!e.captorId&&!e.distractionPhase){
     if(isWoman||isMan)label(c,e.name||(isWoman?'NORA':'MARANZA'),x,y-140,18,'#c3f4df');
     else if(e.waiting&&e.role==='megaphone')label(c,'MEGAFONO',x,y-140,16,'#ffe6b6');
    }
    if(e.role==='megaphone'&&!e.leaving){
     const side=e.dir||1,mx=x+side*25,my=y-75;
     poly(c,[[mx,my-5],[mx+side*14,my-12],[mx+side*14,my+8],[mx,my+3]],'#eadfc4');
     rect(c,mx-2,my,5,12,'#414956');
    }
    if(e.role==='resident'&&!e.leaving){rect(c,x-24,y-64,15,17,'#e8e1c3');rect(c,x-20,y-61,5,11,'#af4e50');rect(c,x-23,y-58,11,5,'#af4e50');}
   }else if(e.stoodDown>0)this.hesitation(x,y,t,e.id);
   if(action==='windup'&&!ally&&!e.captiveId){
    if(e.attackKind==='grab'){this.cuffs(x+22,y-150,1);label(c,'PRESA IN ARRIVO',x+22,y-164,18,'#ffd4b1');}
    else label(c,'!',x+22,y-141,22,'#ffe484');
   }
  }
 }
 scenery(s){
  const c=this.c,cam=s.cameraX||0,t=s.time,level=s.level||0,meta=LEVELS[level].scenery,img=this.images[meta.sheet];
  if(img){const sh=img.height/meta.rows,sy=meta.row*sh,floor=meta.floor*sh,worldW=960+(s.worldWidth-960)*.37,shift=-Math.floor(cam*.37);
   c.drawImage(img,0,sy,img.width,floor,shift,0,worldW,346);
   c.drawImage(img,0,sy+floor,img.width,sh-floor,shift,344,worldW,196);
  }else{rect(c,0,0,960,345,'#675263');rect(c,0,345,960,195,'#4c424a');}
  // Atmospheric lights and fluttering paper belong to scenery only.
  if(level>3){for(let k=0;k<3;k++){const x=150+k*390-cam*.22;poly(c,[[x,340],[x-75+Math.sin(t*.35+k)*70,0],[x+24+Math.sin(t*.35+k)*70,0]],LEVELS[level].final?'#ffdc8614':'#bbc9ff0c');}}
  this.crowd(s);
  for(let i=0;i<13;i++){const x=((i*173+t*(6+i%3))%2430)-cam*.65,y=330+Math.sin(t*.8+i)*22;if(x>0&&x<960){c.save();c.translate(snap(x),snap(y));c.rotate(Math.sin(t+i)*.7);rect(c,-3,-1,6,2,i%2?'#ebc89a99':'#baaf9b88');c.restore();}}
  if(s.gateX&&s.gateX-cam<950&&s.gateX-cam>60){const x=s.gateX-cam;for(let i=0;i<3;i++)poly(c,[[x-4,390+i*21],[x+5,396+i*21],[x-4,402+i*21],[x,396+i*21]],'#ffca6666');}
 }
 crowd(s){
  if(!this.sheets.crowd)return;const c=this.c,cam=s.cameraX||0,t=s.time,level=s.level;
  // Two ranks of protesters, varied spacing, identities and animation phase.
  for(let row=0;row<2;row++)for(let i=0;i<Math.ceil(s.worldWidth/46)+2;i++){
   const wx=25+i*46+row*19,group=Math.floor(i/9),walk=(i+row)%7===0,phase=t+i*.61+row*2.3;
   const x=wx-cam*.94+(walk?Math.sin(t*.6+i)*17:Math.sin(phase*.5)*2),y=row===0?315+(i%3)*3:340+(i%3)*2;
   if(x<-50||x>1010)continue;
   // Gaps keep the crowd readable and leave room for short police advances.
   if(row===1&&i%11>7)continue;
   const change=walk?'walk':Math.floor(phase*.55)%5===0?'walk':'idle';
   this.person({type:'crowd',variant:(i+row*3)%4,dir:i%6===0?-1:1,action:change,z:0},s,{x,y,scale:row===0?.58:.74,time:phase,alpha:row===0?.70:.91});
  }
  // Police advances and a retreating/holding crowd. Protesters never hit people,
  // including the purely scenic figures behind the playable street.
  for(let k=0;k<Math.ceil(s.worldWidth/475);k++){
   const x=325+k*475-cam*.94;if(x<-120||x>1080)continue;
   const phase=(t+k*1.37)%5.2,advance=phase>1.8&&phase<2.8,swing=phase>2.15&&phase<2.6,retreat=phase>2.05&&phase<3.4;
   this.person({type:'crowd',variant:k%4,dir:retreat?-1:1,action:retreat?'walk':'idle',z:0},s,{x:x-(retreat?14:0),y:348,scale:.85,time:t+k,alpha:.94});
   this.person({type:level>3?'soldier':'cop',dir:-1,action:swing?'punch':advance?'walk':'idle',z:0},s,{x:x+78-(advance?10:0),y:348,scale:.63,time:t+k,alpha:.94});
  }
  // Cloth banners sway with their bearers; poles sit behind the front row.
  const messages=level<2?['LA CITTÀ È DI CHI LA VIVE','AFFITTI GIÙ, SALARI SU','CI DOBBIAMO VIVERE ANCHE NOI']:level<4?['QUESTA STRADA L’ABBIAMO PAGATA TUTTI','UN SALARIO NON BASTA','IL FUTURO NON È IN VETRINA']:level<6?['CHI PAGA IL CONTO?','IL PORTO ERA PUBBLICO','I SOLDI C’ERANO']:['FERMATE LE BOMBE','LE PERSONE SONO ANCORA LÌ','DISERTARE È POSSIBILE'];
  for(let j=0;j<Math.ceil(s.worldWidth/330);j++){const wx=170+j*330,x=wx-cam*.94;if(x<-160||x>1110)continue;const y=232+(j%3)*17+Math.sin(t*1.7+j)*3,w=Math.max(j%2?132:192,Math.min(220,messages[j%3].length*4.5)),h=32;
   rect(c,x-w*.42,y+24,3,83,'#74553c');rect(c,x+w*.42,y+24,3,83,'#74553c');
   poly(c,[[x-w/2,y],[x,y+Math.sin(t*2+j)*3],[x+w/2,y+2],[x+w/2,y+h],[x,y+h-2],[x-w/2,y+h+1]],j%3===0?'#b64748':'#e5d2ad');
   rect(c,x-w/2+2,y+2,w-4,2,j%3===0?'#e37e64':'#f9e5bd');
   c.font='bold 10px monospace';c.textAlign='center';c.fillStyle=j%3===0?'#fff0c6':'#302b3c';
   const words=messages[j%3].split(' '),lines=[''];
   for(const word of words){const last=lines.length-1,next=(lines[last]+' '+word).trim();if(c.measureText(next).width>w-10&&lines[last])lines.push(word);else lines[last]=next;}
   lines.forEach((line,i)=>c.fillText(line,snap(x),snap(y+(lines.length>1?12:21)+i*12),w-10));
  }
 }
 object(o,s){
  if(o.type==='machine'){this.machine(o,s);return;}
  const info=PROPS[o.type];if(!info)return;const sheet=this.sheets[info[0]];if(!sheet)return;
  const c=this.c,x=o.x-s.cameraX,y=o.y,broken=o.destroyed||o.hp<=0,base=sheet.frames[info[1]],f=sheet.frames[info[1]+(broken?sheet.cols:0)],scale=Math.min(o.w/base.sw,o.h/base.sh),w=f.sw*scale,h=f.sh*scale;
  if(x+w/2<-30||x-w/2>990)return;
  shadow(c,x,y,o.w*.83);c.save();c.translate(snap(x),snap(y));if(broken&&o.type==='car')c.scale(-1,1);
  if(o.hitFlash>0){c.translate(snap(Math.sin(s.time*80)*5),0);c.filter='brightness(1.45)';}
  c.drawImage(sheet.image,f.sx,f.sy,f.sw,f.sh,snap(-w/2),snap(-h),snap(w),snap(h));c.restore();
  if(!broken&&o.hp<o.maxHp){rect(c,x-25,y-h-12,50,5,'#141827');rect(c,x-23,y-h-10,46*o.hp/o.maxHp,2,'#f4c46f');}
  if(broken&&['car','coupe','supercar','limo','tesla','cybertruck'].includes(o.type)){
   for(let i=0;i<3;i++){const phase=(s.time*.35+i*.31)%1,xx=x+o.w*.25+Math.sin(phase*4+i)*10,yy=y-h-phase*40;c.fillStyle=`rgba(58,55,62,${.16*(1-phase)})`;c.beginPath();c.ellipse(snap(xx),snap(yy),8+phase*12,5+phase*10,0,0,Math.PI*2);c.fill();}
  }
 }
 machine(o,s){
  const c=this.c,x=o.x-s.cameraX,y=o.y,broken=o.destroyed||o.hp<=0,inactive=broken||o.disabled;
  if(x<-200||x>1160)return;
  const scale=Math.min((o.w||248)/248,(o.h||168)/168);
  shadow(c,x,y,230*scale);c.save();c.translate(snap(x),snap(y));c.scale(scale,scale);
  if(o.hitFlash>0){c.translate(snap(Math.sin(s.time*80)*4),0);c.filter='brightness(1.4)';}
  // A tracked unmanned apparatus: chassis, armored cabinet and launch racks.
  // The President fights separately after this unmanned apparatus is disabled.
  rect(c,-122,-31,244,28,'#111b27');rect(c,-114,-27,228,20,'#445361');
  for(let i=0;i<9;i++){rect(c,-110+i*25,-24,18,15,'#152230');rect(c,-106+i*25,-21,10,8,'#71818a');}
  poly(c,[[-112,-36],[-98,-70],[92,-70],[112,-36],[102,-25],[-103,-25]],'#293949');
  rect(c,-95,-62,185,9,'#718081');rect(c,-94,-50,184,13,'#172736');
  if(broken){
   poly(c,[[-80,-60],[-87,-103],[-36,-116],[-17,-73],[14,-102],[44,-79],[82,-91],[93,-60]],'#35414b');
   poly(c,[[-77,-98],[-34,-109],[-20,-80],[-46,-83]],'#71817e');
   rect(c,-20,-70,49,10,'#121b27');rect(c,-10,-77,15,7,'#a56f41');
   for(let i=0;i<4;i++){const phase=(s.time*.25+i*.23)%1;c.globalAlpha=.3*(1-phase);rect(c,-30+i*20+Math.sin(s.time+i)*7,-105-phase*90,18+phase*20,14+phase*14,'#77747a');}c.globalAlpha=1;
  }else{
   rect(c,-76,-139,152,77,'#162b3a');rect(c,-70,-134,140,69,'#435766');
   rect(c,-68,-134,136,7,'#839797');rect(c,62,-126,8,59,'#243642');
   rect(c,-59,-118,65,35,'#10202c');rect(c,-55,-114,57,27,'#172f37');
   const open=!inactive&&(o.vulnerable??s.boss?.vulnerable??true);
   for(let i=0;i<5;i++)rect(c,-51+i*10,-109,5,inactive?7:9+((Math.floor(s.time*4)+i)%3)*3,inactive?'#43545b':open?'#81d7b6':'#d88955');
   for(let i=0;i<3;i++){rect(c,19,-116+i*11,28,4,'#152f3a');rect(c,52,-116+i*11,5,4,inactive?'#465760':i===0?'#ffc57c':'#89b8b1');}
   rect(c,-61,-77,113,8,'#172c37');for(let i=0;i<7;i++)rect(c,-54+i*15,-76,7,5,'#bd9360');
   for(const side of [-1,1]){
    const sx=side<0?-115:79;
    poly(c,[[sx,-76],[sx+33,-76],[sx+33,-144],[sx+22,-157],[sx,-144]],'#203541');
    rect(c,sx+4,-139,22,55,'#5d7278');rect(c,sx+7,-134,16,9,'#0e202b');rect(c,sx+7,-116,16,9,'#0e202b');rect(c,sx+7,-98,16,9,'#0e202b');
    rect(c,sx+4,-144,22,4,'#a6b3aa');
   }
   rect(c,34,-167,4,28,'#879b98');rect(c,28,-169,16,5,'#c9a467');
   const blink=Math.floor(s.time*3)%2===0;rect(c,-13,-148,25,7,inactive?'#485960':open?'#7fe0bc':blink?'#ffb77a':'#884837');
   for(const bx of [-67,56])for(const by of [-130,-72])rect(c,bx,by,4,4,'#b7c1ac');
   if(!inactive){
    if(open)label(c,'ESPOSTA',0,-184,18,'#a7f1d5');
    rect(c,-94,-173,188,7,'#15202c');rect(c,-92,-171,184*clamp(o.hp/o.maxHp,0,1),3,'#e8b66c');
   }
  }
  c.restore();
 }
 boss(e,s){
  const sheet=this.sheets.bossRoster;if(!sheet||e.fled)return;
  const c=this.c,x=e.x-s.cameraX,y=e.y,t=s.time,ground=!!e.groundPhase,fleeing=!!e.fleeing||e.action==='flee',running=fleeing&&(e.escapeTimer||0)>1.1,armorHit=!fleeing&&e.invuln>0,row=e.kind==='trump'?0:1;
  const frame=row*4+(fleeing?2+(running?Math.floor(t*10)%2:0):ground&&e.vulnerable?1:0),f=sheet.frames[frame],scale=sheet.scales[row][fleeing?'run':'armor'],w=f.sw*scale,h=f.sh*scale;
  if(x<-230||x>1200)return;
  // The armor portraits face left in the atlas; the suit poses run right.
  shadow(c,x,y,fleeing?50:140);c.save();c.translate(snap(x),snap(y));c.scale(fleeing?(e.dir||1):-(e.dir||-1),1);
  // Defeat opens the armor; the unharmed politician remains upright and runs.
  if(armorHit)c.filter='brightness(1.22)';
  if(!fleeing&&e.action==='windup')c.translate(3,-2);
  else if(!fleeing&&e.action==='punch')c.translate(-4,0);
  const bob=fleeing?(running?Math.abs(Math.sin(t*15))*4:0):ground&&e.action==='walk'?Math.abs(Math.sin(t*8))*3:Math.sin(t*2);
  c.drawImage(sheet.image,f.sx,f.sy,f.sw,f.sh,snap(-w/2),snap(-h-bob),snap(w),snap(h));c.restore();
  if(fleeing){
   // Small dust pixels establish movement without an impact or injury effect.
   if(running)for(let i=0;i<3;i++){const phase=(t*2+i*.3)%1;rect(c,x-(e.dir||1)*(18+phase*31),y-2-phase*5,6-phase*3,3,'#c8b49299');}
   return;
  }
  if(ground){
   const bx=clamp(x,120,840),by=Math.max(138,y-h-25);
   label(c,e.vulnerable?'PANNELLI ESPOSTI':'CORAZZA CHIUSA',bx,by,18,e.vulnerable?'#ffe6a1':'#d2d7df');
   rect(c,bx-85,by+7,170,8,'#111c2d');rect(c,bx-82,by+9,164*clamp(e.hp/e.maxHp,0,1),4,e.vulnerable?'#edb572':'#8094a5');
  }
 }
 hesitation(x,y,t,id=0){
  const c=this.c,phase=t*2+id*.7,cy=y-164+Math.sin(phase)*3;
  // Pixel question marks remain recognizable when the canvas is reduced.
  const mark=(mx,my,unit,color)=>{
   const glyph=['01110','11011','00011','00110','00100','00000','00100'];
   glyph.forEach((row,iy)=>[...row].forEach((on,ix)=>{if(on==='1')rect(c,mx+ix*unit,my+iy*unit,unit,unit,color);}));
  };
  rect(c,x-19,cy-23,38,43,'#142a36');rect(c,x-17,cy-21,34,39,'#d4eee6');
  poly(c,[[x-7,cy+17],[x+3,cy+17],[x-2,cy+27]],'#d4eee6');
  mark(x-10,cy-15,4,'#254850');
  for(const side of [-1,1]){
   const mx=x+side*(30+Math.sin(phase)*3)-4,my=cy-10+Math.cos(phase+side)*7;
   mark(mx,my,2,'#bce6d5');
  }
 }
 cuffs(x,y,scale=1){
  const c=this.c;c.save();c.translate(snap(x),snap(y));c.scale(scale,scale);c.strokeStyle='#f2d5b5';c.lineWidth=3;
  c.strokeRect(-15,-6,10,11);c.strokeRect(5,-6,10,11);rect(c,-5,-1,10,3,'#f2d5b5');c.restore();
 }
 threats(s){
  const c=this.c;
  for(const e of s.enemies){
   if(e.hidden||e.dead||e.defeated||e.captiveId||e.stoodDown>0||e.action!=='windup')continue;
   const grab=e.attackKind==='grab',slam=e.attackKind==='slam',x=(e.attackX??e.x+e.dir*(e.reach||54))-s.cameraX,y=e.attackY??e.y;
   if(x<-100||x>1060)continue;
   const progress=clamp(1-(e.attackTimer||0)/(e.attackDuration||e.windup||.7),0,1),rx=slam?65:42,ry=slam?32:22;
   c.save();c.fillStyle=grab?'#a7709136':'#d9725130';c.strokeStyle=progress>.72?'#ffe6a1':grab?'#efbacb':'#e8a66d';c.lineWidth=2;
   c.beginPath();c.ellipse(snap(x),snap(y),rx,ry,0,0,Math.PI*2);c.fill();c.stroke();
   if(grab){this.cuffs(x,y,.8);c.setLineDash([5,5]);c.beginPath();c.ellipse(snap(x),snap(y),rx+6,ry+5,0,0,Math.PI*2);c.stroke();}
   else{const gap=12+(1-progress)*20;for(const dir of [-1,1]){rect(c,x+dir*gap-2,y-8,4,16,'#ffe0a1');rect(c,x+dir*gap-(dir<0?0:9),y-8,9,2,'#ffe0a1');rect(c,x+dir*gap-(dir<0?0:9),y+6,9,2,'#ffe0a1');}}
   c.restore();
  }
 }
 pressure(s){
  const c=this.c,p=s.player,a=s.playerArrest;
  if(a){
   const x=clamp(p.x-s.cameraX,80,880),y=Math.max(175,p.y-166),time=Math.max(0,a.remaining);
   this.cuffs(p.x-s.cameraX,p.y-67,1.2);
   rect(c,x-57,y,114,40,'#151d2bf2');
   label(c,time.toFixed(1)+' s',x,y+24,22,'#ffd6a9');
   rect(c,x-49,y+31,98,5,'#574353');rect(c,x-49,y+31,98*clamp(a.escapeProgress||0,0,1),5,'#a8d9c1');
  }
  const returning=s.enemies.filter(e=>e.returnWarning&&!e.defeated);
  if(returning.length){
   const x=20,y=340;
   poly(c,[[x,y],[x+11,y-10],[x+11,y+10]],'#ffd3a1');
   label(c,'ARRIVANO',40,y+6,18,'#ffd9aa','left');
  }
 }
 arrests(s){
  const c=this.c;
  if(s.arrest){
   const a=[...s.allies,...(s.civilians||[])].find(a=>a.id===s.arrest.allyId);if(!a)return;const x=clamp(a.x-s.cameraX,100,860),y=a.y-154;
   // Pixel handcuffs and an explicit rescue countdown are readable without color.
   c.strokeStyle='#d8e8ef';c.lineWidth=3;c.strokeRect(snap(x-12),snap(a.y-62),8,8);c.strokeRect(snap(x+3),snap(a.y-62),8,8);rect(c,x-4,a.y-59,7,2,'#d8e8ef');
   rect(c,x-96,y,192,34,'#361c2f');rect(c,x-90,y+27,180,4,'#693d40');rect(c,x-90,y+27,180*clamp(s.arrest.remaining/s.arrest.duration,0,1),4,'#ffba6a');label(c,'CONVINCI · '+Math.ceil(s.arrest.remaining)+'s',x,y+21,18,'#ffddbd');
  }
 }
 pickup(p,s){const c=this.c,x=p.x-s.cameraX,y=p.y-Math.sin(s.time*5+p.x)*4;shadow(c,x,p.y,25);if(p.type==='food'){
   poly(c,[[x-13,y-3],[x,y-25],[x+13,y-3]],'#442937');poly(c,[[x-10,y-5],[x,y-22],[x+10,y-5]],'#f6c473');rect(c,x-11,y-6,22,4,'#b56d40');rect(c,x-4,y-15,4,4,'#b74545');rect(c,x+3,y-9,4,3,'#61985c');
  }else label(c,'♥',x,y-5,24,'#99ebbf');}
 bomb(b,s){
  const c=this.c,x=b.x-s.cameraX,y=b.y,r=b.r||50,t=clamp((b.timer||0)/(b.duration||1.3),0,1);if(x<-100||x>1060)return;
  c.fillStyle=b.exploded?'#ffb26099':'#e4524144';c.strokeStyle='#ffb786';c.lineWidth=2;c.beginPath();c.ellipse(snap(x),snap(y),r,r*.43,0,0,Math.PI*2);c.fill();c.stroke();
  if(b.exploded){for(let i=0;i<9;i++){const a=i*.7;rect(c,x+Math.cos(a)*r*.8,y+Math.sin(a)*r*.35-12,8,12,i%2?'#ffdd94':'#f4804e');}return;}
  rect(c,x-10,y-1,20,2,'#ffdba2');rect(c,x-1,y-10,2,20,'#ffdba2');const by=y-180*t-24;poly(c,[[x-5,by-16],[x+5,by-16],[x+7,by-4],[x+2,by+6],[x-2,by+6],[x-7,by-4]],'#1b2436');rect(c,x-3,by-13,4,13,'#8c98a4');rect(c,x-8,by-18,16,4,'#4a5b70');
 }
 particle(p,s){
  const c=this.c,x=p.x-s.cameraX,y=p.y-(p.z||0),alpha=clamp(p.life/(p.maxLife||1),0,1);c.save();c.globalAlpha=alpha;
  if(p.type==='text')label(c,p.text,x,y,18,p.color||'#ffe0a0');
  else if(p.type==='wave'){c.strokeStyle=p.color||'#a0e9d2';c.lineWidth=4;const r=(1-alpha)*230;c.beginPath();c.ellipse(snap(x),snap(y),r,r*.6,0,0,Math.PI*2);c.stroke();}
  else if(p.type==='spark'){const r=3+alpha*6;poly(c,[[x-r,y],[x-2,y-2],[x,y-r],[x+2,y-2],[x+r,y],[x+2,y+2],[x,y+r],[x-2,y+2]],p.color||'#ffe3ab');}
  else rect(c,x,y,6,3,p.color||'#d1e2de');c.restore();
 }
 present(){this.out.setTransform(1,0,0,1,0,0);this.out.imageSmoothingEnabled=false;this.out.drawImage(this.scene,0,0,960,540);}
 cover(time=0){
  const c=this.c,img=this.images.cover;c.setTransform(.5,0,0,.5,0,0);c.imageSmoothingEnabled=false;rect(c,0,0,960,540,'#0b1230');
  if(img)c.drawImage(img,0,0,img.width,img.height,0,0,960,540);
  for(let i=0;i<22;i++){const p=(time*.13+i*.131)%1,x=570+rand(i)*360+Math.sin(time+i)*4,y=520-p*340;rect(c,x,y,2,2,`rgba(255,175,93,${.5*(1-p)})`);}
  this.present();
 }
 narrative(story,reducedMotion=false){
  const c=this.c,img=this.images[story.chapter.atlas||'story'],scene=story.chapter.scene,t=reducedMotion?0:story.elapsed;
  c.setTransform(.5,0,0,.5,0,0);c.imageSmoothingEnabled=false;rect(c,0,0,960,540,'#111728');
  if(img){const sw=img.width/2,sh=img.height/2,sx=(scene%2)*sw,sy=Math.floor(scene/2)*sh,z=reducedMotion?1:1.025+Math.min(t,25)*.0005;c.drawImage(img,sx+1,sy+1,sw-2,sh-2,snap(480-480*z+Math.sin(t*.1)*3),snap(270-270*z),snap(960*z),snap(540*z));}
  if(!reducedMotion){
   if(story.chapter.effect==='rain'){for(let i=0;i<70;i++){const x=(i*137+t*65)%1020-30,y=(i*83+t*290)%560;rect(c,x,y,2,8,'#c1dbff50');}}
   if(story.chapter.effect==='embers'){for(let i=0;i<28;i++){const p=(t*.17+i*.137)%1;rect(c,rand(i)*960+Math.sin(t+i)*9,530-p*470,2,2,`rgba(255,191,120,${.5*(1-p)})`);}}
   if(story.chapter.effect==='glass'){for(let i=0;i<12;i++){const on=Math.sin(t*1.7+i*3.2)>.96;if(on){const x=480+rand(i)*420,y=80+rand(i+10)*250;rect(c,x-3,y,8,2,'#fff2c3aa');rect(c,x,y-3,2,8,'#fff2c3aa');}}}
   if(story.chapter.effect==='water'){for(let i=0;i<25;i++){const x=150+rand(i)*640,y=340+rand(i+40)*120;rect(c,x+Math.sin(t+i)*5,y,5+rand(i+50)*14,2,'#ffda8a44');}}
   if(story.chapter.effect==='broadcast'){rect(c,0,(t*35)%540,960,4,'#cbe1ff12');for(let y=0;y<540;y+=8)rect(c,0,y,960,2,'#10152e18');for(let i=0;i<9;i++)rect(c,828+i*8,94,4,-0+2+Math.floor((Math.sin(t*15+i)*.5+.5)*14),story.complete?'#ba9e56':'#ffe195');}
  }
  this.present();
 }
 render(state){
  if(state.mode==='title'){this.cover(performance.now()/1000);return;}
  const s=state.mode==='title'?{...state,time:performance.now()/1000}:state,c=this.c;this.time=s.time;c.setTransform(.5,0,0,.5,0,0);c.imageSmoothingEnabled=false;rect(c,0,0,960,540,'#191521');c.save();
  if(s.shake>0)c.translate(snap((rand(s.time*100)-.5)*s.shake),snap((rand(s.time*130)-.5)*s.shake*.6));this.scenery(s);
  for(const b of s.bombs)this.bomb(b,s);this.threats(s);
  const items=[];for(const o of s.objects)items.push({e:o,y:o.y,kind:'object'});for(const e of [...s.enemies,...s.allies])if(!e.hidden)items.push({e,y:e.y,kind:'person'});for(const civilian of s.civilians||[s.civilian])if(civilian&&!civilian.rescued&&civilian.distractionPhase!=='away'&&civilian.distractionPhase!=='done')items.push({e:civilian,y:civilian.y,kind:'person'});for(const p of s.pickups)items.push({e:p,y:p.y,kind:'pickup'});items.push({e:s.player,y:s.player.y,kind:'person'});
  items.sort((a,b)=>a.y-b.y);for(const item of items)this[item.kind](item.e,s);for(const p of s.particles)this.particle(p,s);
  this.arrests(s);this.pressure(s);
  if(LEVELS[s.level].rain){for(let i=0;i<50;i++){const x=(i*137+s.time*67)%1000-20,y=(i*61+s.time*265)%550;rect(c,x,y,2,6,'#9dbada2a');}}
  c.restore();rect(c,0,536,960,4,'#161525');this.present();
 }
}
