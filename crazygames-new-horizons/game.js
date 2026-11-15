const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),stage=document.querySelector('#stage');
const $=id=>document.getElementById(id);
const ui={overlay:$('overlay'),start:$('start'),pause:$('pause'),energy:$('energy'),shield:$('shield'),time:$('time'),best:$('best'),toast:$('toast')};
const storeKey='neon-rift-new-horizons-crazygames-v1';
let best=0;try{best=Number(localStorage.getItem(storeKey))||0}catch{}ui.best.textContent=best;
import {platform} from './platform.mjs';
let phase='menu',last=0,elapsed=0,energy=0,shield=100,player={x:.5,y:.76,vx:0,vy:0},rocks=[],orbs=[],stars=[],keys=new Set(),pointer=null,toastTimer=0;
const rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function resize(){const r=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);seedStars();draw()}
function seedStars(){stars=Array.from({length:90},()=>({x:Math.random(),y:Math.random(),s:rand(.5,1.8),a:rand(.2,.8)}))}
function message(text){ui.toast.textContent=text;ui.toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove('visible'),1600)}
function reset(){elapsed=0;energy=0;shield=100;player={x:.5,y:.76,vx:0,vy:0};rocks=[];orbs=[];keys.clear();pointer=null;for(let i=0;i<7;i++)spawnRock(rand(0,1));for(let i=0;i<5;i++)spawnOrb(rand(0,1));hud()}
function hud(){ui.energy.textContent=energy;ui.shield.textContent=Math.round(shield)+'%';ui.time.textContent=new Date(elapsed*1000).toISOString().slice(14,19)}
function spawnRock(y=-.1){rocks.push({x:rand(.06,.94),y,r:rand(.018,.035),speed:rand(.12,.23),drift:rand(-.07,.07),spin:rand(0,6)})}
function spawnOrb(y=-.08){orbs.push({x:rand(.08,.92),y,r:.014,p:rand(0,6)})}
function dimensions(){const r=stage.getBoundingClientRect();return {w:r.width,h:r.height}}
function draw(){const {w,h}=dimensions();if(!w||!h)return;ctx.clearRect(0,0,w,h);const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#0b1b31');bg.addColorStop(1,'#080d1c');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 for(const s of stars){ctx.globalAlpha=s.a;ctx.fillStyle='#d8fff8';ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.s,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
 const neb=ctx.createRadialGradient(w*.72,h*.34,2,w*.72,h*.34,w*.42);neb.addColorStop(0,'#255d7044');neb.addColorStop(1,'#142b4000');ctx.fillStyle=neb;ctx.fillRect(0,0,w,h);
 for(const o of orbs){const x=o.x*w,y=o.y*h,pulse=1+Math.sin(o.p)*.18;ctx.shadowBlur=18;ctx.shadowColor='#83ffe0';ctx.fillStyle='#b5ffe9';ctx.beginPath();ctx.arc(x,y,o.r*w*pulse,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#8effdf99';ctx.beginPath();ctx.arc(x,y,o.r*w*2.1*pulse,0,Math.PI*2);ctx.stroke()}
 for(const r of rocks){const x=r.x*w,y=r.y*h,rad=r.r*w;ctx.save();ctx.translate(x,y);ctx.rotate(r.spin);ctx.fillStyle='#64788f';ctx.strokeStyle='#b5c8d5';ctx.lineWidth=1.5;ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rr=rad*(.78+(i%3)*.1);const px=Math.cos(a)*rr,py=Math.sin(a)*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
 // A compact glowing explorer vessel.
 const x=player.x*w,y=player.y*h;ctx.save();ctx.translate(x,y);ctx.shadowBlur=20;ctx.shadowColor='#7effe1';ctx.fillStyle='#b8ffeb';ctx.strokeStyle='#e6fff8';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-h*.035);ctx.quadraticCurveTo(w*.025,-h*.005,w*.018,h*.025);ctx.lineTo(0,h*.015);ctx.lineTo(-w*.018,h*.025);ctx.quadraticCurveTo(-w*.025,-h*.005,0,-h*.035);ctx.fill();ctx.stroke();ctx.fillStyle='#5bb6c7';ctx.beginPath();ctx.ellipse(0,h*.005,w*.006,h*.012,0,0,Math.PI*2);ctx.fill();ctx.restore();
 if(phase==='won'){ctx.fillStyle='#b7ffe8';ctx.font='700 14px system-ui';ctx.textAlign='center';ctx.fillText('GATEWAY REACHED',w/2,h*.18)}
}
function update(dt){elapsed+=dt;const ax=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0),ay=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);
 if(pointer){const dx=pointer.x-player.x,dy=pointer.y-player.y;player.vx=clamp(dx*5,-.9,.9);player.vy=clamp(dy*5,-.9,.9)}else{player.vx+=(ax*.95-player.vx)*Math.min(1,dt*5);player.vy+=(ay*.95-player.vy)*Math.min(1,dt*5)}
 player.x=clamp(player.x+player.vx*dt,.035,.965);player.y=clamp(player.y+player.vy*dt,.07,.93);
 for(const r of rocks){r.y+=r.speed*dt;r.x+=r.drift*dt;r.spin+=dt*.35;if(r.x<.03||r.x>.97)r.drift*=-1;if(Math.hypot((r.x-player.x)*1.15,r.y-player.y)<r.r+.024){shield=Math.max(0,shield-22*dt*8);r.y=1.1;message('Careful! Find a clear path.')}}rocks=rocks.filter(r=>r.y<1.1);while(rocks.length<7)spawnRock();
 for(const o of orbs){o.y+=.16*dt;o.p+=dt*3;if(Math.hypot((o.x-player.x)*1.15,o.y-player.y)<o.r+.028){energy++;o.y=2;message('+1 ENERGY')}}orbs=orbs.filter(o=>o.y<1.1);while(orbs.length<5)spawnOrb();
 if(elapsed>0&&Math.floor(elapsed)%18===0&&Math.floor(elapsed-dt)!==Math.floor(elapsed))message('A gateway signal is getting closer');hud();
 if(energy>=20){finish(true);return}if(shield<=0||elapsed>=100){finish(false)}
}
function finish(won){phase=won?'won':'over';sdkCall('gameplayStop');ui.pause.hidden=true;if(won){message('Gateway reached! Amazing journey.')}const score=energy*100+Math.round(elapsed);if(score>best){best=score;ui.best.textContent=best;try{localStorage.setItem(storeKey,String(best))}catch{}}
 const title=won?'A NEW HORIZON!':'VOYAGE COMPLETE';const body=won?'You collected enough energy to open the gateway. Ready for another journey?':'Your explorer needs a recharge. Every orb brings you closer to the gateway.';
 ui.overlay.innerHTML='<p class="eyebrow">'+(won?'MISSION COMPLETE':'TAKE A BREATHER')+'</p><h1>'+title+'</h1><p class="intro">'+body+'</p><ul><li>Energy collected: <b>'+energy+' / 20</b></li><li>Voyage time: <b>'+ui.time.textContent+'</b></li><li>Best score: <b>'+best+'</b></li></ul><button id="again" class="primary">EXPLORE AGAIN <span>↗</span></button><p class="controls">Move: WASD / Arrow keys · Touch: drag your ship</p>';
 ui.overlay.hidden=false;$('again').addEventListener('click',restart);
}
function restart(){begin()}
function begin(){reset();phase='playing';ui.overlay.hidden=true;ui.pause.hidden=false;last=performance.now();sdkCall('gameplayStart');canvas.focus({preventScroll:true})}
function sdkCall(name,...args){return platform.call(name,...args)}
ui.start.addEventListener('click',begin);ui.pause.addEventListener('click',()=>{if(phase!=='playing')return;phase='paused';sdkCall('gameplayStop');ui.overlay.innerHTML='<p class="eyebrow">PAUSED</p><h1>Take a moment.</h1><p class="intro">Your journey is waiting right here.</p><button id="resume" class="primary">CONTINUE <span>↗</span></button>';ui.overlay.hidden=false;ui.pause.hidden=true;$('resume').addEventListener('click',async()=>{phase='playing';ui.overlay.hidden=true;ui.pause.hidden=false;last=performance.now();sdkCall('gameplayStart')})});
window.addEventListener('keydown',e=>{if(e.code==='Escape'&&phase==='playing'){e.preventDefault();ui.pause.click();return}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)&&phase==='playing')e.preventDefault();keys.add(e.code)});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();if(phase==='playing')ui.pause.click()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='playing')ui.pause.click()});
function pointerPosition(e){const r=stage.getBoundingClientRect();return {x:clamp((e.clientX-r.left)/r.width,.04,.96),y:clamp((e.clientY-r.top)/r.height,.08,.92)}}
stage.addEventListener('pointerdown',e=>{if(phase!=='playing')return;pointer=pointerPosition(e);stage.setPointerCapture(e.pointerId)});stage.addEventListener('pointermove',e=>{if(pointer)pointer=pointerPosition(e)});const release=()=>{pointer=null};stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);stage.addEventListener('lostpointercapture',release);
function frame(now){const dt=Math.min(.04,Math.max(0,(now-last)/1000));last=now;if(phase==='playing')update(dt);draw();requestAnimationFrame(frame)}
new ResizeObserver(resize).observe(stage);window.addEventListener('resize',resize);resize();reset();requestAnimationFrame(frame);
(async()=>{await platform.init();sdkCall('loadingStop')})();
