// Persistent campaign data. No DOM or game-loop dependencies.
export const SAVE_KEY = 'neon-rift-save-v1';
export const SAVE_VERSION = 1;
export const SECTORS = [
  ['Första ljuset','Lär känna riften. Tre väktare väntar.'],
  ['Järnbältet','Tåligare fiender och tätare anfall.'],
  ['Ekofältet','Prickskyttar finns med från början.'],
  ['Svärmens hjärta','Bossarna öppnar med sin andra fas.'],
  ['Mörk materia','Murbräckor jagar dig redan från start.'],
  ['Den sista riften','Stäng den första riften. Sex nya horisonter väntar.'],
  ['Prismavalvet','Prickskyttar och spjut korsar dina flyktvägar. Byt riktning efter siktlinjen.'],
  ['Rosenstormen','Murbräckor leder jakten. Locka fram rusningen och smit åt sidan.'],
  ['Tvillingmånarna','Delande svärmar fyller närstriden. Blixtar och drönare hittar fler mål.'],
  ['Nollzonen','Minläggare och prickskyttar delar upp arenan. Spara dash till en öppning.'],
  ['Solbrottet','Snabba jaktgrupper avlöser tungt pansar. Växla mellan avstånd och närstrid.'],
  ['Efterglödens kärna','Alla formationer växlar. Tre rasande väktare skyddar kampanjens sista kärna.']
].map(([name,description],i)=>({id:i+1,name,description,
  hp:i<6?1+i*.28:2.65+(i-6)*.24,damage:i<6?1+i*.12:1.65+(i-6)*.06,
  speed:1+Math.min(i,8)*.04,spawn:1+Math.min(i,8)*.13,attack:1+Math.min(i,8)*.05,
  threat:i<6?Math.floor(i/2):4,bossPhase:i>=3?1:0,firstReward:11+i,
  chapter:i<6?'YTTRE RIFTEN':'BORTOM HORISONTEN',
  formation:i<6?'classic':['crossfire','charge','swarm','siege','hunt','convergence'][i-6],
  opening:i<6?0:(i-5)%3
}));
export const SKILLS = [
  {id:'reactor',name:'Jonreaktor',branch:'VAPEN',icon:'✦',max:3,cost:1,desc:'+6 % skada med alla vapen per nivå.'},
  {id:'coil',name:'Pulsladdare',branch:'VAPEN',icon:'≋',max:3,cost:2,requires:'reactor',requiredRank:2,desc:'5 % kortare skottintervall per nivå.'},
  {id:'resonance',name:'Resonans',branch:'VAPEN',icon:'ϟ',max:2,cost:3,requires:'coil',requiredRank:2,desc:'+12 % skada med blixtar och drönare per nivå.'},
  {id:'lancer',name:'Väktarbrytare',branch:'VAPEN',icon:'⋔',max:2,cost:3,requires:'coil',requiredRank:2,desc:'+12 % skada mot bossar med alla vapen per nivå.'},
  {id:'relay',name:'Blixtrelä',branch:'VAPEN',icon:'⌁',max:2,cost:3,requires:'resonance',requiredRank:1,desc:'+35 m räckvidd per blixtsprång och nivå. Kräver Kedjeblixt i flygningen.'},
  {id:'overdrive',name:'Åskhjärta',branch:'VAPEN',icon:'ϟ',max:1,cost:5,requires:'resonance',requiredRank:2,capstone:true,desc:'Kedjeblixt utlöses varannan träff i stället för var tredje. Kräver Kedjeblixt i flygningen.'},
  {id:'broadside',name:'Sidobatterier',branch:'VAPEN',icon:'⋔',max:2,cost:4,requires:'coil',requiredRank:1,desc:'Sidoskotten får +15 procentenheter av huvudskottets skada per nivå. Kräver Vingkanoner i flygningen.'},
  {id:'gyro',name:'Drönarturbiner',branch:'VAPEN',icon:'◎',max:2,cost:4,requires:'resonance',requiredRank:1,desc:'+20 % omloppshastighet för drönare per nivå. Kräver Omloppsdrönare i flygningen.'},
  {id:'hull',name:'Förstärkt skrov',branch:'FÖRSVAR',icon:'⊕',max:3,cost:1,desc:'+15 maxsköld från flygningens start per nivå.'},
  {id:'regen',name:'Reparationsväv',branch:'FÖRSVAR',icon:'⊛',max:3,cost:2,requires:'hull',requiredRank:2,desc:'+4 sköld vid varje signalpaus per nivå.'},
  {id:'bastion',name:'Bastion',branch:'FÖRSVAR',icon:'◈',max:2,cost:3,requires:'regen',requiredRank:2,desc:'5 % mindre inkommande skada per nivå.'},
  {id:'recovery',name:'Fältverkstad',branch:'FÖRSVAR',icon:'⊕',max:2,cost:3,requires:'regen',requiredRank:1,desc:'+8 extra sköld efter Sentinel och Hive Mother per nivå.'},
  {id:'aegis',name:'Fasskrov',branch:'FÖRSVAR',icon:'◇',max:2,cost:3,requires:'bastion',requiredRank:1,desc:'+0,15 s osårbarhet efter en träff per nivå. Grundvärde: 0,85 s.'},
  {id:'lifeline',name:'Sista gnistan',branch:'FÖRSVAR',icon:'✧',max:1,cost:5,requires:'bastion',requiredRank:2,capstone:true,desc:'En gång per flygning: överlev en dödlig träff med 30 % sköld, 2 s skydd och rensa skott inom 120 m.'},
  {id:'nanoweave',name:'Nanoläkning',branch:'FÖRSVAR',icon:'✚',max:3,cost:3,requires:'regen',requiredRank:1,desc:'Efter 5 s utan skada: återställ 0,4 sköld per sekund och nivå. Stannar vid full sköld.'},
  {id:'hazardguard',name:'Fältdämpare',branch:'FÖRSVAR',icon:'⬡',max:2,cost:4,requires:'bastion',requiredRank:1,desc:'10 % mindre skada från minfält och klyvstrålar per nivå. Kombineras med Bastion.'},
  {id:'thrusters',name:'Jondrift',branch:'RÖRLIGHET',icon:'↗',max:3,cost:1,desc:'+4 % flyghastighet per nivå.'},
  {id:'capacitor',name:'Riftkondensator',branch:'RÖRLIGHET',icon:'◎',max:3,cost:2,requires:'thrusters',requiredRank:2,desc:'6 % kortare dashladdning per nivå.'},
  {id:'salvager',name:'Bärgningssensor',branch:'RÖRLIGHET',icon:'⌖',max:2,cost:3,requires:'capacitor',requiredRank:2,desc:'+25 m radie för att samla energi per nivå.'},
  {id:'slipstream',name:'Solsegel',branch:'RÖRLIGHET',icon:'»',max:2,cost:3,requires:'capacitor',requiredRank:1,desc:'+10 % hastighet under dash per nivå. Vanlig flyghastighet påverkas inte.'},
  {id:'dashguard',name:'Fasspår',branch:'RÖRLIGHET',icon:'◎',max:2,cost:3,requires:'salvager',requiredRank:1,desc:'+0,08 s osårbarhet vid dash per nivå. Grundvärde: 0,35 s.'},
  {id:'vacuum',name:'Stjärnsamlare',branch:'RÖRLIGHET',icon:'⌖',max:1,cost:5,requires:'salvager',requiredRank:2,capstone:true,desc:'Dash samlar direkt all energi inom 200 m från startpunkten.'},
  {id:'tractor',name:'Energitraktor',branch:'RÖRLIGHET',icon:'⌖',max:2,cost:3,requires:'salvager',requiredRank:1,desc:'Energi inom samlingsradien flyger mot skeppet 25 % snabbare per nivå.'},
  {id:'shockdrive',name:'Stötförstärkare',branch:'RÖRLIGHET',icon:'↗',max:2,cost:4,requires:'slipstream',requiredRank:1,desc:'+20 % skada med Riftmotor och Efterstöt per nivå. Kräver respektive system i flygningen.'}
];
// The nine original keys remain required; added skills default to zero in old saves.
export const LEGACY_SKILL_IDS=['reactor','coil','resonance','hull','regen','bastion','thrusters','capacitor','salvager'];
export function validSkills(raw) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
  const clean=cleanSkills(raw);
  return SKILLS.every(s=>raw[s.id]===clean[s.id]||(!Object.hasOwn(raw,s.id)&&!LEGACY_SKILL_IDS.includes(s.id)));
}
const whole=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
const finite=(v,min=0,max=1e12)=>Number.isFinite(v)&&v>=min&&v<=max;
export function cleanSkills(input={}) {
  const result={};for(const s of SKILLS)result[s.id]=whole(input?.[s.id],0,s.max)?input[s.id]:0;
  for(const s of SKILLS)if(s.requires&&result[s.requires]<s.requiredRank)result[s.id]=0;
  return result;
}
export function bonuses(skills={}) {
  const r=cleanSkills(skills);
  return {damage:1+r.reactor*.06,fire:.95**r.coil,resonance:1+r.resonance*.12,shield:r.hull*15,repair:r.regen*4,armor:1-r.bastion*.05,speed:1+r.thrusters*.04,dash:1-r.capacitor*.06,magnet:r.salvager*25,
    bossDamage:1+r.lancer*.12,chainRange:r.relay*35,chainEvery:r.overdrive?2:3,bossHeal:30+r.recovery*8,hitGrace:.85+r.aegis*.15,lifeline:!!r.lifeline,dashSpeed:1+r.slipstream*.1,dashGrace:.35+r.dashguard*.08,vacuum:!!r.vacuum,
    sideBonus:r.broadside*.15,droneSpeed:1+r.gyro*.2,passiveHeal:r.nanoweave*.4,hazardArmor:1-r.hazardguard*.1,pickupSpeed:1+r.tractor*.25,dashPower:1+r.shockdrive*.2};
}
export function newProfile() {
  return {version:SAVE_VERSION,cleared:0,wallet:0,skills:cleanSkills(),selected:1,best:0,settings:{effects:true,particles:true,shake:true,volume:.35},records:{},stats:{runs:0,wins:0,kills:0,bosses:0,seconds:0},settled:[],redeemedCodes:[],activeRun:null,lastResult:null};
}
export function canPlay(profile,id) {return whole(id,1,SECTORS.length)&&id<=Math.min(SECTORS.length,profile.cleared+1);}
export function skillCost(profile,id) {const s=SKILLS.find(s=>s.id===id);return s?s.cost+profile.skills[id]:Infinity;}
export function canBuy(profile,id) {
  const s=SKILLS.find(s=>s.id===id);
  return !!s&&profile.skills[id]<s.max&&(!s.requires||profile.skills[s.requires]>=s.requiredRank)&&profile.wallet>=skillCost(profile,id);
}
export function buySkill(profile,id) {if(!canBuy(profile,id))return false;profile.wallet-=skillCost(profile,id);profile.skills[id]++;return true;}
export function refundSkills(profile) {
  let total=0;for(const s of SKILLS){const n=profile.skills[s.id];total+=n*s.cost+n*(n-1)/2;}
  profile.wallet+=total;profile.skills=cleanSkills();return total;
}
const GIFT_CODES=Object.freeze({YUNUS10000:10000});
export function redeemCode(profile,input) {
  const code=typeof input==='string'?input.trim().toUpperCase():'';
  if(!Object.hasOwn(GIFT_CODES,code))return {ok:false,reason:'invalid'};
  if(profile.redeemedCodes.includes(code))return {ok:false,reason:'used'};
  const amount=GIFT_CODES[code];
  if(profile.wallet>1e7-amount)return {ok:false,reason:'limit'};
  profile.wallet+=amount;profile.redeemedCodes.push(code);
  return {ok:true,amount};
}
export function runRewards(result,cleared=0) {
  const combat=Math.min(12,Math.floor(result.kills/20)),bosses=result.bosses*3;
  const clear=result.won?(result.sector>cleared?SECTORS[result.sector-1].firstReward:8):0;
  return {combat,bosses,clear,total:combat+bosses+clear};
}
export function settleRun(profile,result) {
  if(!result||typeof result.runId!=='string'||!result.runId||profile.settled.includes(result.runId)||!canPlay(profile,result.sector)||!finite(result.score)||!finite(result.time)||!finite(result.kills)||!whole(result.bosses,0,3)||typeof result.won!=='boolean'||(result.won&&result.bosses!==3))return null;
  if(result.peakCombo!==undefined&&!whole(result.peakCombo,0,1e9))return null;
  const firstClear=result.won&&result.sector>profile.cleared;
  const rewards=runRewards(result,profile.cleared),reward=rewards.total;
  profile.wallet+=reward;if(firstClear)profile.cleared=result.sector;
  profile.selected=Math.min(profile.cleared+1,SECTORS.length);
  profile.best=Math.max(profile.best,result.score);
  profile.stats.runs++;profile.stats.wins+=+result.won;profile.stats.kills+=result.kills;profile.stats.bosses+=result.bosses;profile.stats.seconds+=result.time;
  if(result.won){const prev=profile.records[result.sector];profile.records[result.sector]={wins:(prev?.wins||0)+1,best:Math.max(prev?.best||0,result.score),time:Math.min(prev?.time??Infinity,result.time),combo:Math.max(prev?.combo||0,result.peakCombo||0)};}
  profile.settled.push(result.runId);profile.settled=profile.settled.slice(-2000);
  profile.activeRun=null;profile.lastResult={...result,reward,rewards,firstClear};return profile.lastResult;
}
// Validate imported content before allowing it to replace a working save.
export function validateProfile(raw) {
  if(!raw||raw.version!==SAVE_VERSION||!whole(raw.cleared,0,SECTORS.length)||!whole(raw.wallet,0,1e7)||!finite(raw.best)||!raw.skills||!raw.settings||!raw.stats||!Array.isArray(raw.settled)||raw.settled.length>2000)return null;
  if(!validSkills(raw.skills))return null;const skills=cleanSkills(raw.skills);
  const redeemedCodes=raw.redeemedCodes===undefined?[]:raw.redeemedCodes;
  if(!Array.isArray(redeemedCodes)||redeemedCodes.length>100||new Set(redeemedCodes).size!==redeemedCodes.length||redeemedCodes.some(code=>typeof code!=='string'||!/^[A-Z0-9_-]{1,40}$/.test(code)))return null;
  if(!whole(raw.selected,1,Math.min(SECTORS.length,raw.cleared+1)))return null;
  for(const key of ['runs','wins','kills','bosses','seconds'])if(!finite(raw.stats[key]))return null;
  for(const key of ['effects','particles','shake'])if(typeof raw.settings[key]!=='boolean')return null;
  if(!finite(raw.settings.volume,0,1)||raw.settled.some(id=>typeof id!=='string'||!id||id.length>100))return null;
  const p=newProfile();Object.assign(p,{cleared:raw.cleared,wallet:raw.wallet,skills,selected:raw.selected,best:raw.best,settings:{...raw.settings},stats:{...raw.stats},settled:[...raw.settled],redeemedCodes:[...redeemedCodes]});
  for(let i=1;i<=raw.cleared;i++){const r=raw.records?.[i];if(!r||!whole(r.wins,1,1e9)||!finite(r.best)||!finite(r.time))return null;if(r.combo!==undefined&&!whole(r.combo,0,1e9))return null;p.records[i]={wins:r.wins,best:r.best,time:r.time,combo:r.combo||0};}
  if(raw.activeRun!=null){if(!raw.activeRun||raw.activeRun.version!==1||!canPlay(p,raw.activeRun.sector)||typeof raw.activeRun.runId!=='string'||!raw.activeRun.runId||p.settled.includes(raw.activeRun.runId))return null;p.activeRun=raw.activeRun;}
  if(raw.lastResult!=null){const r=raw.lastResult;if(!r||typeof r.runId!=='string'||!p.settled.includes(r.runId)||!whole(r.sector,1,SECTORS.length)||typeof r.won!=='boolean'||!finite(r.score)||!finite(r.time)||!whole(r.reward,0,64))return null;if(r.rewards&&(!['combat','bosses','clear','total'].every(k=>whole(r.rewards[k],0,64))||r.rewards.combat+r.rewards.bosses+r.rewards.clear!==r.reward||r.rewards.total!==r.reward))return null;p.lastResult=r;}
  return p;
}
export class SaveStore {
  constructor(storage,validateRun=()=>true) {this.storage=storage;this.validateRun=validateRun;this.error='';this.recovered=false;}
  parse(text) {try{const p=validateProfile(JSON.parse(text));return p&&(!p.activeRun||this.validateRun(p.activeRun))?p:null;}catch{return null;}}
  load() {
    try {
      const main=this.storage.getItem(SAVE_KEY),backup=this.storage.getItem(SAVE_KEY+'-backup');
      const p=this.parse(main);if(p)return p;
      const old=this.parse(backup);if(old){this.recovered=true;return old;}
      if(main){this.error='Sparfilen kunde inte läsas. Tidigare framsteg kunde inte återställas.';return newProfile();}
      const fresh=newProfile();fresh.best=Math.max(0,Math.min(1e12,Number(this.storage.getItem('neon-rift-best'))||0));
      const legacy=JSON.parse(this.storage.getItem('neon-rift-settings')||'null');
      if(legacy){for(const k of ['effects','particles','shake'])if(typeof legacy[k]==='boolean')fresh.settings[k]=legacy[k];if(finite(legacy.volume,0,1))fresh.settings.volume=legacy.volume;}
      return fresh;
    } catch {this.error='Webbläsaren tillåter inte sparning här. Använd Exportera sparfil.';return newProfile();}
  }
  save(profile) {
    try {
      const text=JSON.stringify(profile);if(!this.parse(text))throw new Error('invalid save');
      const previous=this.storage.getItem(SAVE_KEY);
      if(this.parse(previous)){try{this.storage.setItem(SAVE_KEY+'-backup',previous);}catch{}}
      else if(previous){this.storage.setItem(SAVE_KEY+'-unreadable',previous);}
      this.storage.setItem(SAVE_KEY,text);this.error='';return true;
    } catch {this.error='Kunde inte spara. Dina framsteg finns kvar här. Exportera en sparfil innan du stänger.';return false;}
  }
}
