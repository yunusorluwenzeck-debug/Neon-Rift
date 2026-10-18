// Controller integration with DOM/canvas test doubles. This is NOT visual browser QA.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const noop=()=>{};let frame,current,download,requests=0,exits=0,backgrounds=0;
class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.hidden=false;this.disabled=false;this.children=[];this.style={setProperty:noop};this.classList={add:noop,remove:noop,toggle:noop};this.textContent='';this.attributes={};}
  append(...items){this.children.push(...items)}replaceChildren(...items){this.children=items}get firstChild(){return this.children[0]}
  getContext(){return context}
  focus(){}setAttribute(k,v){this.attributes[k]=String(v)}querySelector(){return this.span??=new Element('span')}setPointerCapture(){}matches(){return false}
  click(){if(this.download)download=this;else this.onclick?.()}
}
const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const context=new Proxy({createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});elements.space.getContext=()=>context;
const listeners={};const on=(type,f)=>(listeners[type]??=[]).push(f);const dispatch=(type,event={})=>{for(const f of listeners[type]||[])f(event)};
const root=new Element();root.requestFullscreen=async()=>{requests++;document.fullscreenElement=root;dispatch('fullscreenchange')};
globalThis.document={getElementById:id=>{assert.ok(elements[id],`Missing DOM id ${id}`);return elements[id]},createElement:t=>{if(t==='canvas')backgrounds++;return new Element(t)},createTextNode:t=>t,body:new Element(),documentElement:root,addEventListener:on,fullscreenElement:null,exitFullscreen:async()=>{exits++;document.fullscreenElement=null;dispatch('fullscreenchange')}};
globalThis.window=globalThis;globalThis.innerWidth=1280;globalThis.innerHeight=800;globalThis.devicePixelRatio=1;globalThis.matchMedia=()=>({matches:false});globalThis.confirm=()=>true;
const saved=new Map();globalThis.localStorage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)};globalThis.addEventListener=on;globalThis.requestAnimationFrame=f=>frame=f;
const {Game,BOSSES,STEP,validSnapshot}=await import('../dist/core.mjs?v=afterglow-1');
const {SAVE_KEY,validateProfile}=await import('../dist/progression.mjs?v=afterglow-1');
const read=()=>JSON.parse(saved.get(SAVE_KEY));
// Observer and invulnerability are test-only; production has no debug shortcuts.
const originalReset=Game.prototype.reset;Game.prototype.reset=function(options){originalReset.call(this,options);this.random=()=>.42;current=this;this.player.inv=1000};
await import('../dist/game.js');frame(0);
await elements.fullscreen.onclick();assert.equal(requests,1);assert.equal(elements.fullscreen.textContent,'Lämna fullskärm');await elements.fullscreen.onclick();assert.equal(exits,1);
elements['open-hangar'].onclick();assert.equal(elements['sector-grid'].children.length,6);assert.equal(elements['sector-grid'].children[1].children.at(-1).disabled,true);elements['sector-grid'].children[1].children.at(-1).onclick();assert.equal(current.state,'menu');elements['close-hangar'].onclick();
elements.start.onclick();assert.equal(elements.choices.children.length,3);assert.match(elements.modalTag.textContent,/BANA 1/);assert.equal(current.time,0);assert.ok(validSnapshot(read().activeRun));assert.equal(elements.choices.children[2].className,'choice rarity-common');elements.choices.children[2].onclick();assert.equal(current.ranks.drone,1);assert.equal(elements.overlay.hidden,true);assert.equal(elements.route.children.length,6);
let wall=0;for(;wall<30000;wall+=16)frame(wall);
assert.equal(backgrounds,2,'Menu and flight backdrops are cached across frames');assert.ok(read().activeRun.time>25);assert.equal(read().activeRun.ranks.drone,1);
// Keyboard movement, dash, paused simulation and focus-loss protection.
const oldX=current.player.x;dispatch('keydown',{target:new Element(),code:'KeyD',preventDefault:noop});for(let i=0;i<15;i++)frame(wall+=16);dispatch('keyup',{code:'KeyD'});assert.ok(current.player.x>oldX);
elements.dash.onpointerdown({preventDefault:noop});assert.equal(current.dashes,1);assert.ok(current.player.dashCooldown>0);
elements.pause.onclick();const pausedTime=current.time;for(let i=0;i<20;i++)frame(wall+=16);assert.equal(current.time,pausedTime);assert.equal(read().activeRun.state,'paused');elements.resume.onclick();assert.equal(current.state,'play');
dispatch('blur');assert.equal(current.state,'paused');elements.resume.onclick();assert.ok(current.player.inv>=1.2);
elements.settings.onclick();assert.equal(current.state,'paused');const effectBox=elements.choices.firstChild.children[0].children[0];effectBox.checked=false;effectBox.onchange();assert.equal(read().settings.effects,false);elements.resume.onclick();
// Win through all three boss collision paths, including all renderer phases.
for(let i=0;i<BOSSES.length;i++){
  current.xp=0;current.gems=[];current.time=Math.max(BOSSES[i].at,current.intermissionUntil);current.lastUpgradeAt=current.time;frame(wall+=250);
  assert.equal(current.boss.name,BOSSES[i].name);assert.equal(elements.bossname.textContent,BOSSES[i].name);assert.equal(elements.bossbar.hidden,false);
  const b=current.boss;b.age=4;for(const phase of [1,2,3])for(let j=0;j<4;j++){b.hp=b.max*(phase===1?1:phase===2?.5:.2);b.timer=0;current.updateBoss(b,STEP);frame(wall+=16)}
  current.bullets.push({x:b.x,y:b.y,vx:0,vy:0,life:1,damage:99999});frame(wall+=250);
  if(i<2){assert.equal(current.state,'upgrade');assert.equal(elements.modalTitle.textContent,'Din bossbelöning.');assert.equal(elements.bossbar.hidden,true);assert.ok(['epic','legendary'].includes(current.choiceRarities[current.choices[0]]));assert.ok(validSnapshot(read().activeRun));elements.choices.firstChild.onclick();}
  else{assert.equal(current.state,'won');assert.match(elements.modalTag.textContent,/BANA 1 KLAR/)}
}
assert.equal(read().cleared,1);assert.equal(read().wallet,5);assert.equal(elements.debrief.children.length,5);assert.equal(read().activeRun,null);assert.equal(read().stats.wins,1);assert.ok(validateProfile(read()));assert.equal(elements.nextsector.hidden,false);
const quickNext=elements.resume.onclick;assert.match(elements.resume.textContent,/Starta bana 2/);elements.nextsector.onclick();assert.equal(elements.hangar.hidden,false);assert.equal(elements['skill-tree'].hidden,false);assert.equal(elements['skill-tree'].children.length,3);
const buy=(branch,index)=>elements['skill-tree'].children[branch].children[index+1].children.at(-1);
assert.equal(buy(1,1).disabled,true);buy(1,0).onclick();buy(1,0).onclick();assert.equal(read().skills.hull,2);assert.equal(read().wallet,2);assert.equal(buy(1,1).disabled,false);buy(1,1).onclick();assert.equal(read().wallet,0);assert.equal(read().skills.regen,1);
elements['tab-map'].onclick();assert.equal(elements['sector-grid'].children[1].children.at(-1).disabled,false);assert.equal(elements['sector-grid'].children[2].children.at(-1).disabled,true);elements['hangar-launch'].onclick();assert.equal(current.sector,2);quickNext();assert.equal(current.sector,2);assert.equal(current.player.max,130);assert.equal(current.ranks.drone,0);assert.equal(current.bossIndex,0);elements.choices.firstChild.onclick();
// Touch movement and resize execute without errors at phone / landscape dimensions.
globalThis.innerWidth=390;globalThis.innerHeight=844;dispatch('resize');const touchX=current.player.x;elements.space.onpointerdown({pointerId:1,clientX:60,clientY:650});elements.space.onpointermove({pointerId:1,clientX:108,clientY:650});for(let i=0;i<10;i++)frame(wall+=16);assert.ok(current.player.x>touchX);elements.space.onpointerup({pointerId:1});globalThis.innerWidth=844;globalThis.innerHeight=390;dispatch('resize');frame(wall+=16);assert.ok(current.player.x<=current.w-20);
elements.home.onclick();assert.equal(elements.menu.hidden,false);const checkpoint=read().activeRun;assert.equal(checkpoint.sector,2);assert.ok(validSnapshot(checkpoint));
// Simulate a reload: persistent map stays, controller state is re-created.
await import('../dist/game.js?reload-test');assert.equal(elements.continue.hidden,false);elements.continue.onclick();assert.equal(current.state,'paused');assert.equal(current.sector,2);assert.equal(current.player.max,130);assert.equal(current.ranks.rapid,1);assert.equal(current.time,checkpoint.time);elements.resume.onclick();frame(wall+=16);
current.player.inv=0;current.player.hp=1;current.shot(current.player.x,current.player.y,0,0,999);frame(wall+=250);assert.equal(current.state,'over');assert.equal(elements.modalTag.textContent,'SIGNALEN FÖRLORAD');assert.equal(read().cleared,1);assert.equal(read().wallet,0);assert.equal(read().activeRun,null);assert.equal(read().stats.runs,2);
elements.resume.onclick();assert.equal(current.time,0);assert.equal(current.bossIndex,0);assert.equal(current.player.max,130);assert.equal(current.ranks.rapid,0);assert.equal(current.state,'upgrade');elements.home.onclick();elements['open-hangar'].onclick();elements['export-save'].onclick();assert.equal(download.download,'NEON-RIFT-save.json');
const before=saved.get(SAVE_KEY);await elements['save-file'].onchange({target:{files:[{size:10,text:async()=>'{broken'}]}});assert.equal(saved.get(SAVE_KEY),before);assert.match(elements.savestatus.textContent,/Ogiltig/);
const imported=read();imported.settings.volume=.75;await elements['save-file'].onchange({target:{files:[{size:1000,text:async()=>JSON.stringify(imported)}]}});assert.equal(read().settings.volume,.75);assert.equal(elements.menu.hidden,false);assert.equal(elements.continue.hidden,false);
// The self-contained distribution must parse without module imports or assets.
const offline=fs.readFileSync(new URL('../PLAY-OFFLINE.html',import.meta.url),'utf8');const script=offline.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(script);assert.doesNotThrow(()=>new vm.Script(script));assert.ok(!/^import /m.test(script));
console.log('PASS controller integration: fullscreen request/exit API, locked map, keyboard/touch input, dash, pause/blur, settings, autosave, all three bosses, rarity rewards, victory debrief, skill purchases, direct next-sector and hangar launch, cached backgrounds, mobile-size resize, reload/continue, loss/restart, export/import, and offline syntax. DOM/canvas doubles only; no visual browser QA.');
