import assert from 'node:assert/strict';
import {StoryPlayer,CHAPTERS,AFTERMATH,GALLERY_CHAPTERS,paginateLines} from '../dist/story.js';
import {Game} from '../dist/engine.js';
const story=new StoryPlayer(),game=new Game();let done=0;
game.start();const before=JSON.stringify(game.snapshot());story.start(0,()=>done++);
for(let i=0;i<600;i++){if(story.active)story.update(1/60);else game.update(1/60,{});}
assert.equal(JSON.stringify(game.snapshot()),before,'combat must remain frozen while narrative is active');
assert(story.complete);story.next();assert.equal(story.index,1);assert.equal(story.text,'');
story.next();assert(story.complete);assert.equal(story.index,1,'first press reveals text, without discarding a line');
story.next();assert.equal(story.index,2);while(story.active)story.next();assert(!story.active);assert.equal(done,1);
story.finish();assert.equal(done,1,'completion is idempotent');
story.start(3,()=>done++);story.finish();assert.equal(done,2,'skipping invokes the same continuation');
story.start(2,()=>done++);story.cancel();assert.equal(done,2,'cancel must not resume an abandoned run');
for(const chapter of GALLERY_CHAPTERS){story.start(chapter);assert.equal(story.index,0);assert.equal(story.text,'');story.update(.01);assert(story.active);assert(chapter.lines.length>=2);assert(chapter.scene>=0&&chapter.scene<=3);assert(['story','storyNew','storyEnd'].includes(chapter.atlas));story.finish();
 const pages=paginateLines(chapter.lines,72);
 chapter.lines.forEach((line,i)=>assert.equal(pages.filter(p=>p.sourceIndex===i).map(p=>p.text).join(' '),line.text));
 assert(pages.every(p=>p.text.length<=82),'phone pages must remain concise');
}
assert(CHAPTERS.at(-1).location.includes('FINZIONE SATIRICA'));
console.log('Story flow, text reveal, skip, cancel, scene mapping, frozen combat: passed.');

assert.equal(CHAPTERS.length,7);assert(!/netanyahu/i.test(JSON.stringify(CHAPTERS)));assert(CHAPTERS.at(-1).lines.some(l=>l.text.includes('patatine')));
assert.equal(CHAPTERS[5].id,'trump');assert.equal(GALLERY_CHAPTERS.length,10);
assert.equal(AFTERMATH.trump[0].scene,1);assert.equal(AFTERMATH.president[0].scene,2);assert.equal(AFTERMATH.president[1].scene,3);
assert.equal(AFTERMATH.president[1].title,'Un primo passo');
assert(AFTERMATH.president[1].lines.some(l=>l.text.includes('C’è ancora molto da fare')));
// Skipping an aftermath advances to the epilogue, never to a new game.
const order=[];let finalCalls=0,index=0;
function next(){const chapter=AFTERMATH.president[index++];if(chapter){order.push(chapter.id);story.start(chapter,next,72);}else finalCalls++;}
next();assert.equal(story.chapter.id,'presidente-fuga');story.finish();assert(story.active);assert.equal(story.chapter.id,'epilogo');story.finish();story.finish();
assert.deepEqual(order,['presidente-fuga','epilogo']);assert.equal(finalCalls,1);
console.log('Two boss aftermaths, epilogue continuation, gallery and mobile pagination: passed.');
