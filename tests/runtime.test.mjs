// DOM/canvas API smoke test. This is not visual browser QA.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const noop=()=>{};let frame;
class Element{constructor(){this.hidden=false;this.children=[];this.style={setProperty:noop};this.classList={add:noop,remove:noop};this.textContent=''}append(...items){this.children.push(...items)}replaceChildren(...items){this.children=items}get firstChild(){return this.children[0]}focus(){}setAttribute(){}querySelector(){return this.span??=new Element()}setPointerCapture(){}matches(){return false}}
const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const context=new Proxy({createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});elements.space.getContext=()=>context;
globalThis.document={getElementById:id=>{assert.ok(elements[id],`Missing DOM id ${id}`);return elements[id]},createElement:()=>new Element(),createTextNode:t=>t,body:new Element(),addEventListener:noop};
globalThis.window=globalThis;globalThis.innerWidth=1280;globalThis.innerHeight=800;globalThis.devicePixelRatio=1;globalThis.matchMedia=()=>({matches:false});globalThis.localStorage={getItem:()=>null,setItem:noop};globalThis.addEventListener=noop;globalThis.requestAnimationFrame=f=>frame=f;
// Inject only a test observer; the production module contains no test shortcuts.
const {Game,BOSSES}=await import('../dist/core.mjs?v=bosses-3');
let current;const originalReset=Game.prototype.reset;
Game.prototype.reset=function(){originalReset.call(this);current=this;this.player.inv=1000};
await import('../dist/game.js');frame(0);elements.start.onclick();
assert.equal(elements.choices.children.length,3);
assert.equal(elements.modalTag.textContent,'VÄLJ DITT STARTSYSTEM');
assert.equal(current.time,0);elements.choices.children[2].onclick();
assert.equal(current.ranks.drone,1);assert.equal(elements.overlay.hidden,true);
for(let t=16;t<30000;t+=16)frame(t);
elements.pause.onclick();assert.equal(elements.overlay.hidden,false);
elements.resume.onclick();assert.equal(elements.overlay.hidden,true);
elements.settings.onclick();assert.equal(elements.overlay.hidden,false);
elements.resume.onclick();
let wall=30000;
for(let i=0;i<BOSSES.length;i++){
  current.time=Math.max(BOSSES[i].at,current.intermissionUntil);current.lastUpgradeAt=current.time;
  frame(wall+=250);assert.equal(current.boss.name,BOSSES[i].name);
  assert.equal(elements.bossname.textContent,BOSSES[i].name);assert.equal(elements.bossbar.hidden,false);
  const b=current.boss;b.age=4;
  for(const phase of [1,2,3])for(let j=0;j<4;j++){
    b.hp=b.max*(phase===1?1:phase===2?.5:.2);b.timer=0;
    current.updateBoss(b,1/120);frame(wall+=16);
  }
  current.bullets.push({x:b.x,y:b.y,vx:0,vy:0,life:1,damage:99999});frame(wall+=250);
  if(i<2){assert.equal(current.state,'upgrade');assert.equal(elements.modalTitle.textContent,'Din bossbelöning.');assert.equal(elements.bossbar.hidden,true);elements.choices.firstChild.onclick()}
  else{assert.equal(current.state,'won');assert.equal(elements.modalTag.textContent,'RIFTEN ÄR STÄNGD')}
}
elements.resume.onclick();assert.equal(elements.choices.children.length,3);assert.equal(current.bossIndex,0);
elements.choices.firstChild.onclick();current.player.inv=0;current.player.hp=1;current.shot(current.player.x,current.player.y,0,0,999);frame(wall+=250);
assert.equal(elements.modalTag.textContent,'SIGNALEN FÖRLORAD');
elements.restart.onclick();assert.equal(current.bossIndex,0);elements.home.onclick();frame(wall+=16);
assert.equal(elements.menu.hidden,false);
console.log('PASS mocked DOM/canvas integration: starter choice, 30s loop, pause, settings, three boss HUDs and render paths, rewards, victory, loss and restart. No visual browser QA.');
