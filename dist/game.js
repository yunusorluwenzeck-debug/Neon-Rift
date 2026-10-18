import {Game,STEP,UPGRADES,BOSSES,RARITIES,COMBO_WINDOW,comboMultiplier,clamp,validSnapshot} from './core.mjs?v=horizons-1';
import {SECTORS,SKILLS,bonuses,SAVE_KEY,SaveStore,validateProfile,canPlay,canBuy,skillCost,buySkill,refundSkills,settleRun} from './progression.mjs?v=horizons-1';
const $=id=>document.getElementById(id),canvas=$('space'),ctx=canvas.getContext('2d');
const portal=globalThis.NEON_PORTAL;let adGate=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let storage;try{storage=portal?.storage||localStorage;}catch{storage={getItem(){throw Error('storage blocked')},setItem(){throw Error('storage blocked')}};}
const saveStore=new SaveStore(storage,validSnapshot);
let profile=saveStore.load(),settings=profile.settings,best=profile.best;
if(reduced){settings.particles=false;settings.shake=false;}
const game=new Game(),keys=new Set(),pointer={active:false,id:null,x:0,y:0,ox:0,oy:0};
let backdrop=null,backdropKey='',trail=[],launchGlow=0,damageGlow=0,comboPulse=0;
let W=0,H=0,scale=1,offsetX=0,offsetY=0,last=0,acc=0,runTime=0,hudTimer=0,saveTimer=0,shake=0,particles=[],marks=[],bannerTime=0,modalState='',audio,voices=0,lastSound={},hangarTab='map';
if(portal){portal.onMute=muted=>{if(muted){clearInput();audio?.suspend().catch(()=>{})}else if(!document.hidden)audio?.resume().catch(()=>{})};$('fullscreen').hidden=!portal.allowFullscreen;}
const stars=Array.from({length:110},()=>({x:Math.random(),y:Math.random(),s:.4+Math.random()*1.5,z:Math.random()}));
const fmt=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
function status(text,error=false){if($('savestatus').textContent!==text)$('savestatus').textContent=text;$('savestatus').classList.toggle('save-error',error);}
function persist(capture=true){
  if(capture&&['play','paused','upgrade'].includes(game.state)&&game.runId)profile.activeRun=game.snapshot();
  profile.settings=settings;profile.best=best;
  const ok=saveStore.save(profile);
  status(ok?'Sparat på den här enheten':saveStore.error,!ok);return ok;
}
function soundLabel(){$('sound').textContent=settings.effects?'Ljud på':'Ljud av';$('sound').setAttribute('aria-label',settings.effects?'Stäng av ljudeffekter':'Slå på ljudeffekter');}
function unlock(){if(portal?.muted)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{})}catch{}}
function sound(kind){
  if(portal?.muted||!settings.effects||settings.volume<=0||!audio||audio.state!=='running'||voices>=10)return;
  const now=audio.currentTime;if(now-(lastSound[kind]??-10)<(kind==='shot'?.095:kind==='hit'?.07:.08))return;
  lastSound[kind]=now;
  const tones={shot:[660,.04,.016],hit:[220,.055,.025],kill:[120,.13,.035],dash:[420,.21,.055],damage:[85,.2,.065],pickup:[1080,.035,.009],choice:[740,.24,.055],upgrade:[830,.22,.045],charge:[155,.23,.03],bossFire:[78,.26,.055],combo:[650+Math.min(32,game.combo.streak)*12,.16,.025],victory:[520,.45,.035],defeat:[130,.4,.035]};
  const tone=tones[kind];if(!tone)return;
  const [hz,duration,volume]=tone;
  for(const [i,harmony]of (kind==='victory'?[1,1.25,1.5]:[1]).entries()){
    if(voices>=10)break;
    try{const o=audio.createOscillator(),gain=audio.createGain(),t=now+i*.09;o.type=['damage','kill','defeat'].includes(kind)?'triangle':'sine';
      o.frequency.setValueAtTime(hz*harmony,t);o.frequency.exponentialRampToValueAtTime(hz*harmony*(kind==='victory'?1:kind==='choice'?1.5:.5),t+duration);
      gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume*settings.volume+.0001,t+.006);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
      o.connect(gain);gain.connect(audio.destination);voices++;o.onended=()=>{voices--;o.disconnect();gain.disconnect();};o.start(t);o.stop(t+duration);
    }catch{}
  }
}
function resize(){W=innerWidth;H=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);const top=H<500?110:W<700?155:172,bottom=H<500?36:62;const available=Math.max(180,H-top-bottom);scale=Math.min(W/680,available/600,1.25);game.resize(W/scale,available/scale);offsetX=0;offsetY=top;pointer.active=false;acc=0;backdropKey='';}
addEventListener('resize',resize);resize();
function clearInput(){keys.clear();pointer.active=false;acc=0;}
function modal(tag,title,desc,label,action){clearInput();$('overlay').hidden=false;$('modalTag').textContent=tag;$('modalTitle').textContent=title;$('modalDesc').textContent=desc;$('choices').replaceChildren();$('debrief').replaceChildren();$('debrief').hidden=true;$('overlay').classList.remove('is-result','is-upgrade');$('resume').hidden=!action;$('resume').textContent=label||'';$('resume').onclick=action;$('restart').hidden=!['play','paused','upgrade','over'].includes(game.state);$('nextsector').hidden=true;$('home').textContent=['play','paused','upgrade'].includes(game.state)?'Spara och gå till menyn':'Till huvudmenyn';if(action)$('resume').focus();}
function closeModal(){$('overlay').hidden=true;modalState='';clearInput();}
function refreshMenu(){
  $('best').textContent=best.toLocaleString('sv');$('campaign-summary').textContent=`${profile.cleared}/${SECTORS.length} banor klarade · ${profile.wallet} riftkärnor`;
  $('start').textContent=`Spela bana ${profile.selected} ↗`;
  $('continue').hidden=!profile.activeRun;
  if(profile.activeRun)$('continue').textContent=`Fortsätt bana ${profile.activeRun.sector} · ${fmt(profile.activeRun.time)}`;
  const sector=SECTORS[profile.selected-1];$('mission-name').textContent=sector.name;$('mission-caption').textContent=`BANA ${String(sector.id).padStart(2,'0')} / ${SECTORS.length} · ${sector.firstReward} KÄRNOR VID FÖRSTA SEGERN`;
  $('route').replaceChildren();for(const level of SECTORS){const node=document.createElement('button');node.className='route-node'+(level.id<=profile.cleared?' cleared':level.id===profile.selected?' selected':'');node.textContent=String(level.id).padStart(2,'0');node.disabled=!canPlay(profile,level.id);node.setAttribute('aria-label',`Bana ${level.id}: ${level.name}${node.disabled?', låst':''}`);node.onclick=()=>{if(canPlay(profile,level.id)){profile.selected=level.id;refreshMenu();persist(false);}};$('route').append(node);}

}
function enterFlight(){closeModal();$('hangar').hidden=true;$('menu').hidden=true;$('hero-label').hidden=true;$('controls').hidden=true;$('hud').hidden=false;$('pause').hidden=false;document.body.classList.add('playing');}
function start(sector=profile.selected,adChecked=false){
  if(adGate)return false;
  if(!adChecked&&portal?.breakDue){adGate=true;clearInput();document.body.classList.add('ad-break');return portal.breakBeforePlay().finally(()=>{adGate=false;document.body.classList.remove('ad-break')}).then(()=>start(sector,true));}
  if(!canPlay(profile,sector))return false;
  if(profile.activeRun&&game.state==='menu'&&!confirm('En flygning är sparad. Vill du ersätta den med en ny?'))return false;
  unlock();profile.selected=sector;
  const runId=globalThis.crypto?.randomUUID?.()||`flight-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  game.reset({sector,skills:profile.skills,runId});particles=[];marks=[];trail=[];shake=0;damageGlow=0;launchGlow=1;bannerTime=0;saveTimer=0;
  enterFlight();game.offer('start');if(portal?.quickStart&&profile.stats.runs===0){game.drainEvents();game.choose('rapid');}events();hud();persist();if(document.hidden)unfocus();return true;
}
function continueRun(){
  const saved=profile.activeRun;if(!saved||!canPlay(profile,saved.sector)||!game.restore(saved)){status('Den sparade flygningen kunde inte läsas. Exportera sparfilen innan du börjar om.',true);return false;}
  unlock();particles=[];marks=[];trail=[];damageGlow=0;enterFlight();
  if(game.state==='upgrade')events();else showPause('Din sparade flygning är redo.');hud();return true;
}
function home(){if(adGate)return;if(['play','paused','upgrade'].includes(game.state))persist();game.state='menu';closeModal();$('hangar').hidden=true;$('menu').hidden=false;$('hero-label').hidden=false;$('controls').hidden=false;$('hud').hidden=true;$('pause').hidden=true;document.body.classList.remove('playing');refreshMenu();}
$('start').onclick=()=>start();$('continue').onclick=continueRun;$('restart').onclick=()=>start(game.sector);$('home').onclick=home;
function resume(){if(adGate)return;unlock();game.resume();closeModal();hud();persist();}
function showPause(prefix='Tid och strid är stoppade.'){
  modalState='pause';modal('FLYGNING PAUSAD','Andas ut.',prefix+' Skydd i 1,2 s när du fortsätter. System: '+UPGRADES.filter(u=>game.ranks[u.id]).map(u=>`${u.name} ${game.ranks[u.id]}/${u.max}`).join(' · '),'Fortsätt ↗',resume);
}
function pause(){if(game.state==='play'){game.pause();showPause();persist();}else if(game.state==='paused')resume();}
$('pause').onclick=pause;
$('sound').onclick=()=>{unlock();settings.effects=!settings.effects;soundLabel();persist();sound('choice');};
$('settings').onclick=()=>{
  unlock();if(game.state==='upgrade')return;
  const wasPlay=game.state==='play'||game.state==='paused';if(wasPlay){game.pause();persist();}
  modalState='settings';modal('DIN COCKPIT','Inställningar','Inställningarna sparas på den här enheten.','Tillbaka',()=>wasPlay?resume():closeModal());
  const box=document.createElement('div');box.className='settings';
  for(const [key,label]of [['effects','Ljudeffekter'],['particles','Fler partiklar'],['shake','Kameraskakning']]){const l=document.createElement('label'),i=document.createElement('input');i.type='checkbox';i.checked=!!settings[key];i.onchange=()=>{settings[key]=i.checked;soundLabel();persist();};l.append(i,document.createTextNode(label));box.append(l);}
  const l=document.createElement('label');l.textContent='Effektvolym ';const v=document.createElement('input');v.type='range';v.min=0;v.max=1;v.step=.05;v.value=settings.volume;v.oninput=()=>{settings.volume=+v.value;persist();};l.append(v);box.append(l);$('choices').append(box);
};
async function fullscreen(){
  if(portal&&!portal.allowFullscreen)return;
  try{if(document.fullscreenElement||document.webkitFullscreenElement){await(document.exitFullscreen?.()??document.webkitExitFullscreen?.());}
    else{const root=document.documentElement,request=root.requestFullscreen||root.webkitRequestFullscreen;if(!request){status('Fullskärm stöds inte här. På dator kan du använda F11.',true);return;}await request.call(root);}
  }catch{status('Fullskärm blockerades av webbläsaren. Öppna spellänken direkt och försök igen.',true);}
}
function fullscreenLabel(){$('fullscreen').textContent=(document.fullscreenElement||document.webkitFullscreenElement)?'Lämna fullskärm':'Fullskärm ⛶';resize();}
$('fullscreen').onclick=fullscreen;document.addEventListener('fullscreenchange',fullscreenLabel);document.addEventListener('webkitfullscreenchange',fullscreenLabel);
function dash(){unlock();game.dash();events();hud();}
$('dash').onpointerdown=e=>{e.preventDefault();dash();};
addEventListener('keydown',e=>{if(adGate){e.preventDefault();return}if(e.target.matches('input'))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&game.state!=='menu')e.preventDefault();keys.add(e.code);if(!e.repeat){if(e.code==='Space'&&$('overlay').hidden)dash();if(e.code==='KeyP'||e.code==='Escape')pause();if(e.code==='KeyF'&&$('overlay').hidden)fullscreen();if(game.state==='upgrade'&&/^Digit[123]$/.test(e.code))choose(game.choices[+e.code.slice(-1)-1]);}});
addEventListener('keyup',e=>keys.delete(e.code));
function unfocus(){clearInput();if(game.state==='play'){game.pause();showPause();}persist();}
addEventListener('blur',unfocus);document.addEventListener('visibilitychange',()=>{if(document.hidden)unfocus();});addEventListener('pagehide',()=>persist());
canvas.onpointerdown=e=>{if(game.state!=='play'||pointer.active)return;unlock();Object.assign(pointer,{active:true,id:e.pointerId,x:e.clientX,y:e.clientY,ox:e.clientX,oy:e.clientY});canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{if(pointer.active&&e.pointerId===pointer.id){pointer.x=e.clientX;pointer.y=e.clientY;}};
canvas.onpointerup=canvas.onpointercancel=e=>{if(e.pointerId===pointer.id)pointer.active=false;};
function input(){if(pointer.active){const dx=pointer.x-pointer.ox,dy=pointer.y-pointer.oy,d=Math.hypot(dx,dy);return d<5?{x:0,y:0}:{x:dx/Math.max(48,d),y:dy/Math.max(48,d)};}return{x:(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),y:(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)};}
function choose(id){if(game.choose(id)){closeModal();events();hud();persist();}}
function showUpgrade(e){
  modalState='upgrade';modal(e.reason==='start'?`BANA ${game.sector} · VÄLJ STARTSYSTEM`:e.reason==='boss'?`${game.lastBossName} BESEGRAD · +${game.combatStats().bossHeal} SKÖLD`:`UPPGRADERING / NIVÅ ${game.level}`,e.reason==='boss'?'Din bossbelöning.':e.reason==='start'?'Hur vill du slåss?':'Gör skeppet starkare.','Välj ett kort eller tryck 1, 2, 3. Högre raritet ger starkare bonus. Valet gäller den här flygningen.');
  $('overlay').classList.add('is-upgrade');
  for(const [i,id]of game.choices.entries()){
    const u=UPGRADES.find(u=>u.id===id),rarity=RARITIES.find(r=>r.id===game.choiceRarities[id])||RARITIES[0],b=document.createElement('button');
    b.className=`choice rarity-${rarity.id}`;b.style.setProperty('--order',i);
    b.innerHTML=`<div class="rarity-label"><span>${rarity.name}</span><span>${'◆'.repeat(RARITIES.indexOf(rarity)+1)}</span></div><i>${u.icon}</i><b>${u.name}</b><span>${game.describeUpgrade(id)}</span><small><span>${u.family} · NIVÅ ${game.ranks[id]+1}/${u.max}</span><kbd>${i+1}</kbd></small><div class="card-action">INSTALLERA <span>↗</span></div>`;
    b.onclick=()=>choose(id);$('choices').append(b);
  }$('choices').firstChild.focus();
}
function showResult(e){
  portal?.completed(game.time);
  const oldBest=profile.records[game.sector]?.best||0;
  const result=settleRun(profile,{runId:game.runId,sector:game.sector,won:e.won,score:game.score,time:game.time,kills:game.kills,bosses:game.bossesDefeated,dashes:game.dashes,damageTaken:game.damageTaken,peakCombo:game.combo.peak,comboBonus:game.combo.bonus,upgrades:game.upgradeHistory})||profile.lastResult;
  best=Math.max(best,game.score);persist(false);refreshMenu();modalState='result';
  const next=game.sector<SECTORS.length?game.sector+1:game.sector;
  modal(e.won?`BANA ${game.sector} KLAR · ${game.score>oldBest?'NYTT BANREKORD':'UPPDRAG SLUTFÖRT'}`:'SIGNALEN FÖRLORAD',e.won?(game.sector<SECTORS.length?'Nästa horisont.':'Riften är din.'):'Du är inte klar än.',e.won?(game.sector<SECTORS.length?`${SECTORS[next-1].name} är upplåst. Nästa flygning börjar direkt när du är redo.`:'Alla tolv banor är säkrade. Finslipa skeppet eller slå ditt banrekord.'):`Sista träffen: ${game.lastDamage}. Dina permanenta förbättringar finns kvar.`,e.won?(game.sector<SECTORS.length?`Starta bana ${next} ↗`:'Spela igen ↗'):'Försök igen ↗',()=>start(e.won?next:game.sector));
  $('overlay').classList.add('is-result');$('debrief').hidden=false;
  for(const [label,value]of [['POÄNG',game.score.toLocaleString('sv')],['FLYGTID',fmt(game.time)],['BÄSTA KOMBO',`${game.combo.peak} i rad`],['BOSSAR',`${game.bossesDefeated} / 3`]]){const cell=document.createElement('div'),small=document.createElement('small'),strong=document.createElement('strong');small.textContent=label;strong.textContent=value;cell.append(small,strong);$('debrief').append(cell);}
  const reward=document.createElement('div');reward.className='reward-strip';reward.textContent=e.won?`◈ +${result?.reward||0} riftkärnor · ${profile.wallet} att använda i skill tree`:`Kombo gav +${game.combo.bonus.toLocaleString('sv')} bonuspoäng`; $('debrief').append(reward);
  $('restart').hidden=true;$('nextsector').hidden=!e.won;$('nextsector').textContent='Förbättra skeppet · Skill tree ↗';$('nextsector').onclick=()=>openHangar('skills');
}
function burst(x,y,color,n){const cap=settings.particles?220:45;n=settings.particles?n:Math.ceil(n/4);for(let i=0;i<n&&particles.length<cap;i++){const a=Math.random()*Math.PI*2,s=30+Math.random()*150;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.2+Math.random()*.3,color});}}
function events(){for(const e of game.drainEvents()){
  sound(e.type==='finish'?(e.won?'victory':'defeat'):e.type);
  if(e.type==='banner'){$('banner').replaceChildren();const b=document.createElement('b'),s=document.createElement('span');b.textContent=e.title;s.textContent=e.text;$('banner').append(b,s);bannerTime=6;}
  if(e.type==='hit')burst(e.x,e.y,'#d8fff6',3);
  if(e.type==='kill'){burst(e.x,e.y,e.enemy==='boss'?'#f7d59a':'#f1bca3',e.enemy==='boss'?65:14);if(marks.length<90)marks.push({...e,kind:'points',life:.65});if(settings.shake&&e.enemy==='boss')shake=3;}
  if(e.type==='combo'){comboPulse=.6;}
  if(e.type==='bossDefeated'){burst(e.x,e.y,'#c8fff0',70);marks.push({...e,kind:'ring',life:.6,r:100});}
  if(e.type==='dash'){launchGlow=.35;marks.push({...e,kind:'ring',life:.35,r:35});burst(e.x,e.y,'#7cfbe1',12);}
  if(e.type==='arc')marks.push({...e,kind:'arc',life:.16});
  if(e.type==='nova')marks.push({...e,kind:'ring',life:.35,r:e.radius});
  if(e.type==='spawn')marks.push({...e,kind:'spawn',life:.7,r:16});
  if(e.type==='damage'){damageGlow=.7;shake=settings.shake?4:0;marks.push({...e,kind:'damage',life:1});$('hint').textContent=`−${e.amount} sköld · ${e.source}`;burst(e.x,e.y,'#ff8e9e',10);}
  if(e.type==='choice'){launchGlow=.5;burst(game.player.x,game.player.y,'#b5fff0',12);}
  if(e.type==='upgrade'){showUpgrade(e);persist();}
  if(e.type==='finish'){burst(e.x,e.y,'#c8fff0',100);showResult(e);}
}}
function hud(){
  const p=game.player,stats=game.combatStats();
  $('combo').textContent=`×${comboMultiplier(game.combo.streak).toFixed(2)}`;$('combo-caption').textContent=game.combo.streak?`${game.combo.streak} i rad`:'KOMBO';$('combo-meter').style.width=(game.combo.left/COMBO_WINDOW*100)+'%';$('combo-box').classList.toggle('hot',game.combo.streak>=4);$('combo-box').style.setProperty('--pulse',comboPulse);
  $('hud').classList.toggle('low-shield',p.hp/p.max<.3);
  for(let i=0;i<3;i++){$('encounter-'+i).className=i<game.bossesDefeated?'done':i===game.bossesDefeated?'current':'';}
  $('hp').style.width=100*p.hp/p.max+'%';$('hptext').textContent=`${Math.ceil(p.hp)} / ${p.max}`;$('timer').textContent=fmt(game.time);$('score').textContent=game.score.toLocaleString('sv');
  $('wave').textContent=game.bossSpawned?game.boss.name+' · FAS '+game.boss.phase:game.resting?'OMGRUPPERAR':`BANA ${game.sector} · ${SECTORS[game.sector-1].name.toUpperCase()}`;
  $('xp').style.width=Math.min(100,Math.max(game.xp/game.need,(game.time-game.lastUpgradeAt)/45)*100)+'%';
  $('level').textContent=`NIVÅ ${game.level} · ENERGI ${game.xp}/${game.need} · UPPGRADERING INOM ${Math.max(0,Math.ceil(45-(game.time-game.lastUpgradeAt)))} s`;
  const next=BOSSES[game.bossIndex];$('nextboss').textContent=game.bossSpawned?`BOSS ${game.bossIndex}/3`:next?`${next.name} OM ${fmt(Math.max(0,game.nextBossAt()-game.time))}`:'ALLA BOSSAR BESEGRADE';
  $('dash').querySelector('span').textContent=p.dashCooldown>0?p.dashCooldown.toFixed(1)+' s':'REDO';$('dash').style.setProperty('--charge',`${(1-p.dashCooldown/stats.dashCooldown)*360}deg`);$('dash').setAttribute('aria-label',p.dashCooldown>0?`Dash om ${p.dashCooldown.toFixed(1)} sekunder`:'Dash redo');
  $('bossbar').hidden=!game.bossSpawned;$('bossname').textContent=game.boss?.name||'';$('bosshp').style.width=game.boss?Math.max(0,100*game.boss.hp/game.boss.max)+'%':'0%';
  $('banner').style.opacity=bannerTime>0?'1':'0';$('settings').disabled=game.state==='upgrade';
  $('build').textContent=UPGRADES.filter(u=>game.ranks[u.id]).map(u=>`${u.icon} ${u.name} ${game.ranks[u.id]}`).join(' · ');
  if(game.time<14)$('hint').textContent=matchMedia('(pointer: coarse)').matches?'Dra som en styrspak. ⚡ ger dash + skydd.':'WASD / pilar: flyg · SPACE: dash · P: paus';
  else if(game.player.inv===0)$('hint').textContent=game.resting?'Nästa anfall närmar sig. Samla energin.':'Slå ut fiender inom 5 s för kombo · Träffar bryter sviten';
}
function openHangar(tab='map'){
  if(['play','paused','upgrade'].includes(game.state))persist();
  game.state='menu';closeModal();$('menu').hidden=true;$('hero-label').hidden=true;$('controls').hidden=true;$('hud').hidden=true;$('pause').hidden=true;document.body.classList.remove('playing');$('hangar').hidden=false;hangarTab=tab;renderHangar();
}
function renderHangar(){
  $('hangar-launch').textContent=profile.activeRun?'Fortsätt sparad flygning ↗':`Starta bana ${profile.selected} ↗`;$('hangar-launch').onclick=()=>profile.activeRun?continueRun():start(profile.selected);
  $('hangar-wallet').textContent=`${profile.wallet} RIFTKÄRNOR`;
  $('hangar-stats').textContent=`${profile.cleared}/${SECTORS.length} banor · ${profile.stats.wins} segrar · ${profile.stats.kills} fiender`;
  $('tab-map').setAttribute('aria-selected',hangarTab==='map');$('tab-skills').setAttribute('aria-selected',hangarTab==='skills');
  $('sector-grid').hidden=hangarTab!=='map';$('skill-tree').hidden=hangarTab!=='skills';$('refund').hidden=hangarTab!=='skills';
  $('hangar-note').textContent=hangarTab==='map'?'Klara alla tre bossar på en bana för att låsa upp nästa. En första seger ger 5–16 riftkärnor. Omspel ger 2.':profile.cleared?'Dina förbättringar följer med till varje ny flygning. Sparade flygningar behåller sin tidigare utrustning.':'Klara första banan för att få riftkärnor. Trädet sparas mellan flygningar.';
  $('sector-grid').replaceChildren();
  for(const s of SECTORS){const available=canPlay(profile,s.id),done=s.id<=profile.cleared,card=document.createElement('article');card.style.setProperty('--sector',SECTOR_LOOKS[s.id-1].accent);card.className=`sector-card ${done?'completed':available?'available':'locked'}`;
    const tag=document.createElement('small');tag.textContent=`${s.chapter} · BANA ${String(s.id).padStart(2,'0')} · ${done?'KLAR':available?'UPPLÅST':'LÅST'}`;
    const h=document.createElement('h3');h.textContent=s.name;const p=document.createElement('p');p.textContent=s.description;
    const stats=document.createElement('span');stats.className='sector-stats';stats.textContent=`Fiendeliv ×${s.hp.toFixed(2)} · skada ×${s.damage.toFixed(2)} · ${s.firstReward} kärnor första gången`;
    const button=document.createElement('button');button.className='primary';button.disabled=!available;button.textContent=available?`${done?'Spela igen':'Spela bana '+s.id} ↗`:`Klara bana ${s.id-1} först`;button.onclick=()=>{if(canPlay(profile,s.id))start(s.id);};
    const orbit=document.createElement('div');orbit.className='sector-art';orbit.setAttribute('aria-hidden','true');orbit.innerHTML=`<span class="planet"></span><span class="orbit-line"></span><b>${String(s.id).padStart(2,'0')}</b>`;card.append(orbit,tag,h,p,stats);if(done){const record=document.createElement('span');record.className='sector-record';const r=profile.records[s.id];record.textContent=`Rekord ${r.best.toLocaleString('sv')} · bästa tid ${fmt(r.time)} · kombo ${r.combo||0}`;card.append(record);}card.append(button);$('sector-grid').append(card);
  }
  $('skill-tree').replaceChildren();
  for(const branch of ['VAPEN','FÖRSVAR','RÖRLIGHET']){const lane=document.createElement('section');lane.className='skill-branch';const heading=document.createElement('h3');heading.textContent=branch;lane.append(heading);
    for(const s of SKILLS.filter(s=>s.branch===branch)){const card=document.createElement('article');card.className='skill-node'+(profile.skills[s.id]?' owned':'')+(s.capstone?' capstone':'')+(canBuy(profile,s.id)?' purchasable':'');
      const h=document.createElement('h4');h.textContent=`${s.icon} ${s.name}`;const rank=document.createElement('small');rank.textContent=`${s.capstone?'SIGNATURSYSTEM · ':''}NIVÅ ${profile.skills[s.id]}/${s.max}`;const p=document.createElement('p');p.textContent=s.desc;
      const req=document.createElement('span');req.className='skill-prereq';req.textContent=s.requires?`Kräver ${SKILLS.find(x=>x.id===s.requires).name} nivå ${s.requiredRank}`:'Grundsystem';
      const b=document.createElement('button');b.className='skill-buy';b.disabled=!canBuy(profile,s.id);b.textContent=profile.skills[s.id]>=s.max?'MAXNIVÅ':s.requires&&profile.skills[s.requires]<s.requiredRank?'FÖRKRAV SAKNAS':`Uppgradera · ${skillCost(profile,s.id)} kärnor`;b.onclick=()=>{if(buySkill(profile,s.id)){persist(false);renderHangar();sound('choice');}};
      const ranks=document.createElement('div');ranks.className='rank-pips';ranks.setAttribute('aria-hidden','true');for(let i=0;i<s.max;i++){const pip=document.createElement('i');pip.className=i<profile.skills[s.id]?'filled':'';ranks.append(pip);}card.append(h,rank,p,req,ranks,b);lane.append(card);
    }$('skill-tree').append(lane);
  }
  const stats=bonuses(profile.skills);$('loadout-summary').hidden=hangarTab!=='skills';$('loadout-summary').textContent=`DIN NÄSTA FLYGNING · ${100+stats.shield} sköld · +${Math.round((stats.damage-1)*100)} % vapenskada · ${(3*stats.dash).toFixed(2)} s dash · ${SKILLS.reduce((sum,s)=>sum+profile.skills[s.id],0)} installerade nivåer`;
  $('refund').disabled=!SKILLS.some(s=>profile.skills[s.id]>0);
}
$('open-hangar').onclick=()=>openHangar('map');$('open-tree').onclick=()=>openHangar('skills');$('close-hangar').onclick=home;
$('tab-map').onclick=()=>{hangarTab='map';renderHangar();};$('tab-skills').onclick=()=>{hangarTab='skills';renderHangar();};
$('refund').onclick=()=>{refundSkills(profile);persist(false);renderHangar();};
$('export-save').onclick=()=>{
  persist();const blob=new Blob([JSON.stringify(profile,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='NEON-RIFT-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('import-save').onclick=()=>{$('save-file').value='';$('save-file').click();};
$('save-file').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{if(file.size>2e6)throw Error('large');const imported=validateProfile(JSON.parse(await file.text()));if(!imported||(imported.activeRun&&!validSnapshot(imported.activeRun)))throw Error('invalid');
    if(!confirm('Ersätta dina nuvarande framsteg med sparfilen? Exportera först om du vill behålla båda.'))return;
    if(!saveStore.save(imported)){status(saveStore.error,true);return;}
    profile=imported;settings=profile.settings;best=profile.best;game.state='menu';soundLabel();home();status('Sparfil importerad. Alla framsteg är återställda.');
  }catch{status('Ogiltig sparfil. Dina nuvarande framsteg är kvar.',true);}
};
soundLabel();refreshMenu();
if(saveStore.error)status(saveStore.error,true);else if(profile.activeRun&&!validSnapshot(profile.activeRun))status('Flygningen kunde inte läsas. Exportera sparfilen innan du börjar om.',true);else status(saveStore.recovered?'En säkerhetskopia av dina framsteg har återställts.':'Sparas automatiskt på den här enheten');
const SECTOR_LOOKS=[
  {accent:'#84f5d2',nebula:'#173d44',planet:'#315b61',name:'LJUSBÄLTET'},
  {accent:'#ffc98d',nebula:'#3d2c29',planet:'#775b40',name:'JÄRNSTORM'},
  {accent:'#98bbff',nebula:'#1c2e50',planet:'#3d527f',name:'EKOSEKTORN'},
  {accent:'#c2a7ff',nebula:'#302344',planet:'#675077',name:'SVÄRMEN'},
  {accent:'#f6a4c2',nebula:'#341f35',planet:'#734b6e',name:'MÖRK MATERIA'},
  {accent:'#e3d5a5',nebula:'#333b39',planet:'#506d66',name:'SISTA HORISONTEN'},
  {accent:'#90e0ff',nebula:'#122f47',planet:'#466882',name:'PRISMAVALVET'},
  {accent:'#ff9db7',nebula:'#422331',planet:'#854858',name:'ROSENSTORMEN'},
  {accent:'#d3aeff',nebula:'#2c2249',planet:'#635081',name:'TVILLINGMÅNARNA'},
  {accent:'#a1e4bf',nebula:'#14332d',planet:'#35564b',name:'NOLLZONEN'},
  {accent:'#ffc377',nebula:'#402c19',planet:'#896247',name:'SOLBROTTET'},
  {accent:'#e6eeff',nebula:'#303552',planet:'#606b91',name:'EFTERGLÖDENS KÄRNA'}
];
function ship(x,y,size,angle,hero=false){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI/2);ctx.scale(size,size);
  const flame=reduced?1:1+Math.sin(runTime*24)*.08;
  // Three ion engines, faceted hull and inset cockpit stay readable at game scale.
  for(const engine of [-.48,0,.48]){
    const edge=engine===0?.8:.65;
    ctx.fillStyle='#72f4d633';ctx.beginPath();ctx.moveTo(engine-.13,edge);ctx.lineTo(engine,edge+flame*(hero?.9:.65));ctx.lineTo(engine+.13,edge);ctx.fill();
    ctx.fillStyle='#8bfbe5';ctx.beginPath();ctx.moveTo(engine-.06,edge);ctx.lineTo(engine,edge+flame*.42);ctx.lineTo(engine+.06,edge);ctx.fill();
    ctx.fillStyle='#e5fff6';ctx.fillRect(engine-.055,edge-.06,.11,.13);
  }
  ctx.shadowColor='#7cfbe1';ctx.shadowBlur=hero?13:3;ctx.fillStyle='#d6e7ed';ctx.strokeStyle='#d6fff4';ctx.lineWidth=hero?.018:.065;
  path([[0,-1.25],[.22,-.53],[.36,-.33],[.76,.14],[.91,.79],[.43,.57],[.26,.7],[0,.46],[-.26,.7],[-.43,.57],[-.91,.79],[-.76,.14],[-.36,-.33],[-.22,-.53]]);
  ctx.shadowBlur=0;
  for(const side of [-1,1]){
    ctx.fillStyle=side===-1?'#91b5c5':'#618698';ctx.strokeStyle='#a7d2da';
    path([[side*.22,-.53],[side*.4,.05],[side*.91,.79],[side*.43,.57],[side*.26,.7],[side*.18,.06]]);
    ctx.fillStyle=side===-1?'#dce9e6':'#90b0b6';ctx.strokeStyle='#b7d3d5';
    path([[side*.39,.03],[side*.7,.21],[side*.78,.58],[side*.46,.4]]);
    ctx.fillStyle='#162b37';ctx.strokeStyle='#203f4b';path([[side*.5,-.02],[side*.57,.04],[side*.57,.7],[side*.47,.66]]);
    ctx.strokeStyle='#8af6dc';ctx.lineWidth=.027;line(side*.53,.18,side*.53,.45);
    ctx.strokeStyle='#203c49';ctx.lineWidth=.018;line(side*.43,.39,side*.7,.55);
  }
  ctx.fillStyle='#eff6ef';ctx.strokeStyle='#c4ded9';path([[0,-1.25],[.2,-.48],[.15,.43],[0,.58],[-.15,.43],[-.2,-.48]]);
  ctx.fillStyle='#233e4f';ctx.strokeStyle='#4c828b';path([[0,-.83],[.135,-.35],[.1,.14],[0,.25],[-.1,.14],[-.135,-.35]]);
  ctx.fillStyle='#a6ffe1';ctx.strokeStyle='#91eadc';path([[0,-.7],[.053,-.28],[.04,.04],[0,.11],[-.04,.04],[-.053,-.28]]);
  ctx.strokeStyle='#567882';ctx.lineWidth=.016;line(0,.32,0,.5);
  if(hero){ctx.strokeStyle='#d8eeea66';ctx.lineWidth=.008;line(-.19,-.35,-.36,.28);line(.19,-.35,.36,.28);}
  ctx.restore();
}
function drawBackdrop(){
  const menu=game.state==='menu',sector=menu?profile.selected:game.sector,look=SECTOR_LOOKS[sector-1];
  const key=`${W}/${H}/${sector}/${menu}`;
  if(backdropKey!==key){
    backdropKey=key;backdrop=document.createElement('canvas');const ratio=Math.min(1,1600/W,1100/H);backdrop.width=Math.ceil(W*ratio);backdrop.height=Math.ceil(H*ratio);const b=backdrop.getContext('2d');b.scale(ratio,ratio);
    b.fillStyle='#102136';b.fillRect(0,0,W,H);
    const haze=b.createRadialGradient(W*.75,H*.35,0,W*.7,H*.4,Math.max(W,H)*.7);haze.addColorStop(0,look.nebula);haze.addColorStop(.58,'#192f48');haze.addColorStop(1,'#102136');b.fillStyle=haze;b.fillRect(0,0,W,H);
    // A distant eclipse and thin orbital debris establish depth without hiding combat.
    const px=W*(menu?.77:.86),py=H*(menu?.41:.18),r=Math.min(W*.24,H*.3);b.save();b.globalAlpha=menu?.9:.35;
    const air=b.createRadialGradient(px,py,r*.8,px,py,r*1.16);air.addColorStop(0,look.planet);air.addColorStop(.85,look.nebula);air.addColorStop(1,'#00000000');b.fillStyle=air;b.beginPath();b.arc(px,py,r*1.16,0,Math.PI*2);b.fill();
    const surface=b.createRadialGradient(px-r*.5,py-r*.5,1,px,py,r);surface.addColorStop(0,look.planet);surface.addColorStop(.42,'#29445b');surface.addColorStop(1,'#102238');b.fillStyle=surface;b.beginPath();b.arc(px,py,r,0,Math.PI*2);b.fill();
    b.strokeStyle=look.accent+'64';b.lineWidth=1;b.beginPath();b.ellipse(px,py,r*1.6,r*.37,-.45,0,Math.PI*2);b.stroke();
    b.beginPath();b.arc(px,py,r+.5,Math.PI*.85,Math.PI*1.76);b.stroke();b.restore();
    for(let i=0;i<27;i++){const x=((i*197+sector*63)%997)/997*W,y=((i*311+sector*137)%991)/991*H;b.fillStyle=i%2?'#95b6c707':'#9bbbc40b';b.beginPath();b.moveTo(x,y-3);b.lineTo(x+6,y);b.lineTo(x+2,y+5);b.lineTo(x-4,y+1);b.fill();}
    const shade=b.createLinearGradient(0,0,W,0);shade.addColorStop(0,'#102136a6');shade.addColorStop(menu?.45:.2,'#10213626');shade.addColorStop(1,'#10213600');b.fillStyle=shade;b.fillRect(0,0,W,H);
  }
  ctx.drawImage(backdrop,0,0,W,H);
  for(const s of stars){ctx.globalAlpha=.24+s.z*.43;ctx.fillStyle=s.z>.7?'#e4f7ee':'#abc6df';const x=(s.x*W-game.player.x*s.z*.016+W)%W,y=(s.y*H+(reduced?0:runTime*(1+s.z*3)))%H;ctx.fillRect(x,y,s.s,s.s);if(s.z>.94){ctx.globalAlpha=.18;ctx.fillRect(x-2,y+.5,5,1);}}
  ctx.globalAlpha=1;
}
const colors={hunter:'#ff7991',sniper:'#ffc483',rammer:'#c3a0ff',splitter:'#ff9dcc',warden:'#ffbd75',shard:'#ff7991',boss:'#ff99be'};
const hullColors={hunter:'#6e394f',sniper:'#695137',rammer:'#51476e',splitter:'#663e66',warden:'#655037',shard:'#6e394f',boss:'#58466b'};
function path(points,fill=true){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();if(fill)ctx.fill();ctx.stroke()}
function circle(x,y,r,fill=false){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill)ctx.fill();ctx.stroke()}
function line(x,y,tx,ty){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.stroke()}
function enemy(e){ctx.save();ctx.translate(e.x,e.y);const angle=e.mode==='warn'||e.mode==='rush'||e.mode==='aim'?e.angle:Math.atan2(game.player.y-e.y,game.player.x-e.x);ctx.rotate(angle);ctx.globalAlpha=e.age<.75?.75:1;ctx.strokeStyle=e.hit>0?'#fff':e.bossKind==='sentinel'?'#ffc483':e.bossKind==='hive'?'#c3a0ff':colors[e.type];ctx.fillStyle=e.hit>0?'#dae4ef':hullColors[e.type];ctx.lineWidth=2.4;const r=e.r;
if(e.type==='hunter'||e.type==='shard'){path([[r,0],[-r,-r*.7],[-r*.5,0],[-r,r*.7]]);line(-r*.3,-r*.6,-r*.3,r*.6)}
if(e.type==='sniper'){path([[r,0],[0,-r*.35],[-r,-r],[-r*.65,0],[-r,r],[0,r*.35]]);ctx.strokeRect(-6,-5,12,10);line(0,0,r+7,0)}
if(e.type==='rammer'){path([[r,-r*.65],[r,r*.65],[0,r],[-r,r*.6],[-r,-r*.6],[0,-r]]);path([[r,-r*.55],[r*.4,0],[r,r*.55]],false);ctx.strokeRect(-r*.65,-r*.4,r*.5,r*.8)}
if(e.type==='splitter'){path([[r,0],[0,-r],[-r*.75,-r*.45],[-r*.4,0],[-r*.75,r*.45],[0,r]]);ctx.setLineDash([3,4]);line(-r*.4,0,r,0);ctx.setLineDash([]);circle(0,-r*.4,4,true);circle(0,r*.4,4,true)}
if(e.type==='warden'){path([[r*.65,-r*.65],[r*.65,r*.65],[-r*.65,r*.65],[-r*.65,-r*.65]]);circle(0,0,r*.35);for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);line(r*.65,0,r+5,0);circle(r+5,0,3)}}
if(e.type==='boss'&&e.bossKind==='sentinel'){path([[r,0],[r*.2,-r*.8],[-r,-r],[-r*.6,0],[-r,r],[r*.2,r*.8]]);ctx.fillStyle='#473724';ctx.strokeRect(-r*.4,-r*.7,r*.8,r*.3);ctx.strokeRect(-r*.4,r*.4,r*.8,r*.3);ctx.fillStyle='#ffe8bd';circle(0,0,11,true);line(r*.1,-r*.55,r*.7,-r*.55);line(r*.1,r*.55,r*.7,r*.55)}
if(e.type==='boss'&&e.bossKind==='hive'){ctx.rotate(-angle+game.time*.16);path([[r,0],[r*.5,-r*.86],[-r*.5,-r*.86],[-r,0],[-r*.5,r*.86],[r*.5,r*.86]]);circle(0,0,r*.55);for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);ctx.fillStyle='#413454';ctx.strokeRect(r*.55,-8,19,16)}ctx.fillStyle='#d4bcff';circle(0,0,14,true)}
if(e.type==='boss'&&e.bossKind!=='sentinel'&&e.bossKind!=='hive'){ctx.rotate(-angle+Math.sin(game.time*.3)*.1);path([[0,-r*.9],[r*.4,-r*.5],[r*1.4,-r*.7],[r*1.2,r*.7],[r*.55,r*.25],[0,r],[-r*.55,r*.25],[-r*1.2,r*.7],[-r*1.4,-r*.7],[-r*.4,-r*.5]]);ctx.strokeStyle='#e4ddff';ctx.fillStyle='#302444';path([[0,-r*.6],[r*.32,0],[0,r*.6],[-r*.32,0]]);ctx.fillStyle='#ffcce4';circle(0,0,10+e.phase*3,true);ctx.strokeStyle=colors.boss;for(const side of [-1,1]){ctx.strokeRect(side*r*.85-8,-r*.35,16,r*.65);line(side*r*.55,-r*.2,side*r*1.1,-r*.4)}}
ctx.restore();if(e.hp<e.max&&e.type!=='boss'){ctx.fillStyle='#ffffff20';ctx.fillRect(e.x-18,e.y-e.r-9,36,3);ctx.fillStyle=colors[e.type];ctx.fillRect(e.x-18,e.y-e.r-9,36*Math.max(0,e.hp/e.max),3)}}
function warnings(){for(const e of game.enemies){if(e.mode==='aim'||e.mode==='warn'){ctx.save();ctx.strokeStyle=e.mode==='aim'?'#ffc483aa':'#c3a0ff44';ctx.lineWidth=e.mode==='aim'?1.5:(e.r+game.player.r)*2;ctx.setLineDash(e.mode==='aim'?[8,7]:[10,12]);const dist=e.mode==='aim'?1400:330;line(e.x,e.y,e.x+Math.cos(e.angle)*dist,e.y+Math.sin(e.angle)*dist);if(e.bossKind==='sentinel'&&e.mode==='aim'){const spread=(1+e.phase-1)*.19;for(const side of [-1,1])line(e.x,e.y,e.x+Math.cos(e.angle+side*spread)*dist,e.y+Math.sin(e.angle+side*spread)*dist)}ctx.restore()}if(e.type==='boss'&&e.mode==='ring'){ctx.strokeStyle='#ffb4c9';ctx.lineWidth=2;circle(e.x,e.y,e.r+15+(1.3-e.timer)*20);ctx.strokeStyle='#7cfbe1';for(const s of [-1,1])line(e.x,e.y,e.x+Math.cos(e.angle+s*.37)*160,e.y+Math.sin(e.angle+s*.37)*160)}}
for(const h of game.hazards){ctx.save();ctx.strokeStyle=h.active?'#ffd5ad':'#ffb477aa';ctx.fillStyle=h.active?'#ff99442b':'#ff99440b';ctx.lineWidth=2;if(!h.active)ctx.setLineDash([6,7]);if(h.kind==='mine'){circle(h.x,h.y,h.radius,true);ctx.setLineDash([]);if(!h.active){ctx.beginPath();ctx.arc(h.x,h.y,h.radius+5,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-h.warn/h.warning));ctx.stroke()}line(h.x-8,h.y-8,h.x+8,h.y+8);line(h.x+8,h.y-8,h.x-8,h.y+8)}else{ctx.translate(h.x,h.y);ctx.rotate(h.angle);ctx.fillRect(0,-h.radius,2400,h.radius*2);ctx.strokeRect(0,-h.radius,2400,h.radius*2);if(h.active){ctx.lineWidth=5;line(0,0,2400,0)}}ctx.restore()}}
function draw(){
  ctx.clearRect(0,0,W,H);drawBackdrop();
  if(game.state==='menu'){
    if(W>=780){const x=W*.75,y=H*.48,size=Math.min(W*.105,H*.185,155);ctx.strokeStyle='#93d3c42a';ctx.lineWidth=1;ctx.setLineDash([3,11]);circle(x,y,size*1.55);ctx.setLineDash([]);for(const side of [-1,1]){line(x+side*size*1.65,y-15,x+side*size*1.65,y+15);line(x+side*size*1.65,y,x+side*size*1.8,y);}ship(x,y+(reduced?0:Math.sin(runTime*.6)*5),size,-Math.PI/2-.3,true);}
    return;
  }
  ctx.save();ctx.translate(offsetX,offsetY);ctx.scale(scale,scale);ctx.beginPath();ctx.rect(0,0,game.w,game.h);ctx.clip();
  if(shake>0)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  ctx.strokeStyle='#a9d8cb60';ctx.lineWidth=1.5;
  for(const x of [14,game.w-14])for(const y of [14,game.h-14]){line(x,y,x+(x<30?28:-28),y);line(x,y,x,y+(y<30?28:-28));}
  // Ghosts and particle trails sit beneath all hazards, enemies and projectiles.
  if(!reduced)for(const t of trail){ctx.save();ctx.translate(t.x,t.y);ctx.rotate(t.angle+Math.PI/2);ctx.globalAlpha=t.life*(t.dash?.38:.13);ctx.fillStyle='#84f5d2';ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(14,14);ctx.lineTo(0,8);ctx.lineTo(-14,14);ctx.fill();ctx.restore();}
  for(const p of particles){ctx.globalAlpha=clamp(p.life*1.6,0,.65);ctx.strokeStyle=p.color;ctx.lineWidth=1.4;line(p.x,p.y,p.x-p.vx*.035,p.y-p.vy*.035);}ctx.globalAlpha=1;
  if(game.ranks.drone){ctx.strokeStyle='#baabff18';ctx.lineWidth=1;ctx.setLineDash([3,12]);circle(game.player.x,game.player.y,game.combatStats().orbit);ctx.setLineDash([]);}
  warnings();
  for(const g of game.gems){ctx.fillStyle='#8bf5cf';ctx.strokeStyle='#e2fff4';ctx.lineWidth=1.4;const r=g.value>2?7:5;ctx.save();ctx.translate(g.x,g.y);path([[0,-r],[r,0],[0,r],[-r,0]]);ctx.fillStyle='#edfff0';ctx.fillRect(-1,-2,2,3);ctx.restore();}
  for(const e of game.enemies)enemy(e);
  const shotColor=game.ranks.chain?'#bcb1ff':game.ranks.power?'#f8dd9b':'#8bf9da';
  for(const b of game.bullets){ctx.strokeStyle=shotColor+'99';ctx.lineWidth=5;line(b.x,b.y,b.x-b.vx*.021,b.y-b.vy*.021);ctx.strokeStyle='#f4fff9';ctx.lineWidth=2.2;line(b.x,b.y,b.x-b.vx*.014,b.y-b.vy*.014);}
  ctx.strokeStyle='#ffebcf';ctx.fillStyle='#ff8198';ctx.lineWidth=1.8;for(const s of game.shots){circle(s.x,s.y,5,true);ctx.fillStyle='#fff3d9';ctx.fillRect(s.x-1,s.y-1,2,2);ctx.fillStyle='#ff8198';}
  for(const d of game.dronePositions()){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.angle);ctx.strokeStyle='#c4b6ff';ctx.fillStyle='#39415c';ctx.lineWidth=1.5;path([[0,-11],[8,-2],[6,7],[0,11],[-6,7],[-8,-2]]);ctx.fillStyle='#e8e0ff';ctx.fillRect(-2,-5,4,10);ctx.restore();}
  const p=game.player;ship(p.x,p.y,18,p.angle);
  if(game.ranks.split){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.strokeStyle='#c0fff1';ctx.fillStyle='#344e5c';ctx.lineWidth=1;for(const side of [-1,1]){ctx.fillRect(-7,side*17-3,16,6);line(5,side*17,13,side*17);}ctx.restore();}
  if(p.inv>0){ctx.strokeStyle=p.dashTime>0?'#ccfff3':'#8af7d7a0';ctx.lineWidth=p.dashTime>0?2:1;ctx.setLineDash(p.dashTime>0?[]:[10,5]);circle(p.x,p.y,26);ctx.setLineDash([]);}
  if(launchGlow>0){ctx.strokeStyle='#a3f9df';ctx.globalAlpha=launchGlow*.45;ctx.lineWidth=1;circle(p.x,p.y,29+(1-launchGlow)*26);ctx.globalAlpha=1;}
  for(const m of marks){ctx.globalAlpha=Math.min(.8,m.life*2);ctx.lineWidth=1.5;
    if(m.kind==='arc'){ctx.strokeStyle='#cec2ff';line(m.x,m.y,(m.x+m.tx)/2+8,(m.y+m.ty)/2-8);line((m.x+m.tx)/2+8,(m.y+m.ty)/2-8,m.tx,m.ty);}
    else if(m.kind==='points'){ctx.globalAlpha=Math.min(.75,m.life*2);ctx.fillStyle='#c5ebd8';ctx.font='10px "Space Grotesk", sans-serif';ctx.fillText('+'+m.points,m.x+12,m.y-12-(.65-m.life)*25);}
    else if(m.kind==='damage'){ctx.strokeStyle='#ffc1b799';line(m.x,m.y,m.fromX,m.fromY);ctx.fillStyle='#ffd2bd';ctx.font='bold 14px sans-serif';ctx.fillText('−'+m.amount,m.x+20,m.y-20-(1-m.life)*20);}
    else{ctx.strokeStyle=m.kind==='spawn'?'#efa5aa':'#9be8d5';circle(m.x,m.y,m.r*(1.4-m.life));}
  }ctx.globalAlpha=1;ctx.restore();
  if(damageGlow>0&&!reduced){ctx.strokeStyle=`rgba(244,133,142,${damageGlow*.32})`;ctx.lineWidth=4;ctx.strokeRect(2,offsetY+2,W-4,H-offsetY-4);}
  if(pointer.active){ctx.strokeStyle='#a0eed866';ctx.fillStyle='#7cfbe10a';ctx.lineWidth=1.5;circle(pointer.ox,pointer.oy,48,true);const dx=pointer.x-pointer.ox,dy=pointer.y-pointer.oy,d=Math.hypot(dx,dy);circle(pointer.ox+dx/Math.max(1,d/48),pointer.oy+dy/Math.max(1,d/48),15,true);}
}
function frame(t){
  portal?.sync(game.state==='play');
  const dt=last?Math.min((t-last)/1000,.25):0;last=t;
  if(game.state==='play'){
    acc+=dt;while(acc>=STEP&&game.state==='play'){game.update(STEP,input());acc-=STEP;events();}if(game.state!=='play')acc=0;
    runTime+=dt;bannerTime=Math.max(0,bannerTime-dt);
    if(!reduced&&dt>0){const p=game.player,previous=trail.at(-1);if(!previous||Math.hypot(p.x-previous.x,p.y-previous.y)>5)trail.push({x:p.x,y:p.y,angle:p.angle,dash:p.dashTime>0,life:p.dashTime>0?.35:.2});if(trail.length>(settings.particles?26:8))trail.shift();}
    saveTimer+=dt;if(saveTimer>=3){saveTimer=0;persist();}
  }else{acc=0;if(game.state==='menu'&&!reduced)runTime+=dt;}
  // Cosmetic tails may finish over a reward screen; simulation timers stay frozen.
  if(game.state!=='paused'){
    shake=Math.max(0,shake-dt*25);launchGlow=Math.max(0,launchGlow-dt*1.7);damageGlow=Math.max(0,damageGlow-dt);comboPulse=Math.max(0,comboPulse-dt);
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
    for(const m of marks)m.life-=dt;marks=marks.filter(m=>m.life>0).slice(-90);
    for(const t of trail)t.life-=dt;trail=trail.filter(t=>t.life>0);
  }
  hudTimer+=dt;if(hudTimer>=.1){hudTimer=0;hud();}draw();requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
