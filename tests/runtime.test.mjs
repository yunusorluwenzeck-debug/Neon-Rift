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
await import('../dist/game.js');frame(0);elements.start.onclick();for(let t=16;t<30000;t+=16)frame(t);elements.pause.onclick();assert.equal(elements.overlay.hidden,false);elements.resume.onclick();assert.equal(elements.overlay.hidden,true);elements.settings.onclick();assert.equal(elements.overlay.hidden,false);elements.resume.onclick();elements.restart.onclick();frame(30016);elements.home.onclick();frame(30032);assert.equal(elements.menu.hidden,false);
console.log('PASS DOM integration: startup, 30s render loop, pause/resume, settings, restart, home; missing AudioContext tolerated. No visual rendering tested.');
