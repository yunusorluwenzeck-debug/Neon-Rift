// Controller integration with DOM/canvas test doubles. This is NOT visual browser QA.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const target=process.argv[2]||'generic',build=new URL('../portal-builds/'+target+'/',import.meta.url);
const html=fs.readFileSync(new URL('index.html',build),'utf8');
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
const {PortalBridge}=await import('../portal/bridge.mjs');
let releaseAd,adCalls=0,suspends=0;
const sdk={init:async()=>{},environment:'crazygames',game:{settings:{},addSettingsChangeListener(){},gameplayStart(){},gameplayStop(){},loadingStart(){},loadingStop(){}},data:localStorage,ad:{requestAd:(_,c)=>{adCalls++;c.adStarted();releaseAd=c.adFinished}},gameplayStart(){},gameplayStop(){},gameLoadingFinished(){},commercialBreak:cb=>{adCalls++;cb();return new Promise(resolve=>releaseAd=resolve)}};
globalThis.NEON_PORTAL=new PortalBridge(target,target==='generic'?null:sdk);await NEON_PORTAL.init();
globalThis.AudioContext=class{constructor(){this.state='running';this.currentTime=0}async resume(){this.state='running'}async suspend(){suspends++;this.state='suspended'}};
const {Game,STEP,validSnapshot}=await import(new URL('core.js',build));
const {SAVE_KEY,SECTORS,SKILLS}=await import(new URL('progression.js',build));
const reset=Game.prototype.reset;Game.prototype.reset=function(options){reset.call(this,options);current=this;this.random=()=>.42;this.player.inv=1000};
await import(new URL('game.js',build));frame(0);
assert.match(elements.start.textContent,/Play sector 1/);assert.match(elements['mission-caption'].textContent,/1.*12/);assert.equal(elements.route.children.length,12);assert.equal(elements.fullscreen.hidden,target!=='generic');
elements['open-tree'].onclick();assert.equal(elements['skill-tree'].children.length,3);assert.equal(elements['skill-tree'].children.flatMap(l=>l.children.slice(1)).length,18);assert.match(elements['loadout-summary'].textContent,/YOUR NEXT FLIGHT/);elements['close-hangar'].onclick();
elements.start.onclick();if(target==='crazygames'){assert.equal(current.state,'play');assert.equal(current.ranks.rapid,1)}else{assert.equal(current.state,'upgrade');assert.match(elements.modalTag.textContent,/CHOOSE A STARTING SYSTEM/);elements.choices.firstChild.onclick()}
let wall=0;for(let i=0;i<120;i++)frame(wall+=1000/60);assert.ok(current.time>1.9);assert.ok(validSnapshot(current.snapshot()));
const x=current.player.x;dispatch('keydown',{target:new Element(),code:'KeyD',repeat:false,preventDefault:noop});for(let i=0;i<10;i++)frame(wall+=16);dispatch('keyup',{code:'KeyD'});assert.ok(current.player.x>x);
dispatch('keydown',{target:new Element(),code:'Space',repeat:false,preventDefault:noop});assert.equal(current.dashes,1);dispatch('keyup',{code:'Space'});
elements.pause.onclick();frame(wall+=16);assert.equal(current.state,'paused');const time=current.time;frame(wall+=100);assert.equal(current.time,time);elements.resume.onclick();
// Accelerate encounters with test-only observer access; normal production has no skip buttons.
for(let i=0;i<3;i++){current.beginBoss();current.boss.age=4;current.boss.x=current.w/2;current.boss.y=current.h/4;current.bullets.push({x:current.boss.x,y:current.boss.y,vx:0,vy:0,life:1,damage:1e9});frame(wall+=16);if(i<2){assert.equal(current.state,'upgrade');elements.choices.firstChild.onclick()}}
assert.equal(current.state,'won');assert.match(elements.resume.textContent,/Start sector 2/);const persisted=JSON.parse(saved.get(SAVE_KEY));assert.equal(persisted.cleared,1);assert.equal(persisted.wallet,5);
const next=elements.resume.onclick();
if(target!=='generic'){
 assert.equal(adCalls,1);assert.equal(NEON_PORTAL.busy,true);assert.equal(current.state,'won');assert.ok(suspends>0);let prevented=false;dispatch('keydown',{target:new Element(),code:'Space',repeat:false,preventDefault:()=>prevented=true});assert.equal(prevented,true);
 elements.home.onclick();assert.equal(current.state,'won');elements.resume.onclick();assert.equal(adCalls,1);releaseAd();await next;
}
assert.equal(current.sector,2);assert.equal(current.state,'upgrade');elements.choices.firstChild.onclick();assert.equal(current.state,'play');
innerWidth=640;innerHeight=360;dispatch('resize');frame(wall+=16);assert.ok(current.player.x>=16&&current.player.x<=current.w-16);
innerWidth=390;innerHeight=844;dispatch('resize');frame(wall+=16);assert.ok(validSnapshot(current.snapshot()));
current.player.inv=0;current.shots.push({x:current.player.x,y:current.player.y,vx:0,vy:0,life:1,damage:1e6});frame(wall+=16);assert.equal(current.state,'over');assert.match(elements.modalTitle.textContent,/not done yet/);
assert.equal(SECTORS.length,12);assert.equal(SKILLS.length,18);
console.log(`PASS ${target} export: English controller, 12 sectors, 18 skills, start, movement, dash, pause, three boss wins, next sector, ad gate, failed flight and viewport resizing. Mock DOM/canvas/SDK only.`);
