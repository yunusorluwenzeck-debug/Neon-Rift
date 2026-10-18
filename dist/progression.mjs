// Persistent campaign data. No DOM or game-loop dependencies.
export const SAVE_KEY = 'neon-rift-save-v1';
export const SAVE_VERSION = 1;
export const SECTORS = [
  ['Första ljuset','Lär känna riften. Tre väktare väntar.'],
  ['Järnbältet','Tåligare fiender och tätare anfall.'],
  ['Ekofältet','Prickskyttar finns med från början.'],
  ['Svärmens hjärta','Bossarna öppnar med sin andra fas.'],
  ['Mörk materia','Murbräckor jagar dig redan från start.'],
  ['Den sista riften','Kampanjens hårdaste möte. Bygg ditt bästa skepp.']
].map(([name,description],i)=>({id:i+1,name,description,hp:1+i*.28,damage:1+i*.12,speed:1+i*.04,spawn:1+i*.13,attack:1+i*.05,threat:Math.floor(i/2),bossPhase:i>=3?1:0,firstReward:5+i}));
export const SKILLS = [
  {id:'reactor',name:'Jonreaktor',branch:'VAPEN',icon:'✦',max:3,cost:1,desc:'+6 % skada med alla vapen per nivå.'},
  {id:'coil',name:'Pulsladdare',branch:'VAPEN',icon:'≋',max:3,cost:2,requires:'reactor',requiredRank:2,desc:'5 % kortare skottintervall per nivå.'},
  {id:'resonance',name:'Resonans',branch:'VAPEN',icon:'ϟ',max:2,cost:3,requires:'coil',requiredRank:2,desc:'+12 % skada med blixtar och drönare per nivå.'},
  {id:'hull',name:'Förstärkt skrov',branch:'FÖRSVAR',icon:'⊕',max:3,cost:1,desc:'+15 maxsköld från flygningens start per nivå.'},
  {id:'regen',name:'Reparationsväv',branch:'FÖRSVAR',icon:'⊛',max:3,cost:2,requires:'hull',requiredRank:2,desc:'+4 sköld vid varje signalpaus per nivå.'},
  {id:'bastion',name:'Bastion',branch:'FÖRSVAR',icon:'◈',max:2,cost:3,requires:'regen',requiredRank:2,desc:'5 % mindre inkommande skada per nivå.'},
  {id:'thrusters',name:'Jondrift',branch:'RÖRLIGHET',icon:'↗',max:3,cost:1,desc:'+4 % flyghastighet per nivå.'},
  {id:'capacitor',name:'Riftkondensator',branch:'RÖRLIGHET',icon:'◎',max:3,cost:2,requires:'thrusters',requiredRank:2,desc:'6 % kortare dashladdning per nivå.'},
  {id:'salvager',name:'Bärgningssensor',branch:'RÖRLIGHET',icon:'⌖',max:2,cost:3,requires:'capacitor',requiredRank:2,desc:'+25 m radie för att samla energi per nivå.'}
];
const whole=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
const finite=(v,min=0,max=1e12)=>Number.isFinite(v)&&v>=min&&v<=max;
export function cleanSkills(input={}) {
  const result={};for(const s of SKILLS)result[s.id]=whole(input?.[s.id],0,s.max)?input[s.id]:0;
  for(const s of SKILLS)if(s.requires&&result[s.requires]<s.requiredRank)result[s.id]=0;
  return result;
}
export function bonuses(skills={}) {
  const r=cleanSkills(skills);
  return {damage:1+r.reactor*.06,fire:.95**r.coil,resonance:1+r.resonance*.12,shield:r.hull*15,repair:r.regen*4,armor:1-r.bastion*.05,speed:1+r.thrusters*.04,dash:1-r.capacitor*.06,magnet:r.salvager*25};
}
export function newProfile() {
  return {version:SAVE_VERSION,cleared:0,wallet:0,skills:cleanSkills(),selected:1,best:0,settings:{effects:true,particles:true,shake:true,volume:.35},records:{},stats:{runs:0,wins:0,kills:0,bosses:0,seconds:0},settled:[],activeRun:null,lastResult:null};
}
export function canPlay(profile,id) {return whole(id,1,SECTORS.length)&&id<=Math.min(SECTORS.length,profile.cleared+1);}
export function skillCost(profile,id) {const s=SKILLS.find(s=>s.id===id);return s?s.cost+profile.skills[id]:Infinity;}
export function canBuy(profile,id) {
  const s=SKILLS.find(s=>s.id===id);
  return !!s&&profile.cleared>0&&profile.skills[id]<s.max&&(!s.requires||profile.skills[s.requires]>=s.requiredRank)&&profile.wallet>=skillCost(profile,id);
}
export function buySkill(profile,id) {if(!canBuy(profile,id))return false;profile.wallet-=skillCost(profile,id);profile.skills[id]++;return true;}
export function refundSkills(profile) {
  let total=0;for(const s of SKILLS){const n=profile.skills[s.id];total+=n*s.cost+n*(n-1)/2;}
  profile.wallet+=total;profile.skills=cleanSkills();return total;
}
export function settleRun(profile,result) {
  if(!result||typeof result.runId!=='string'||!result.runId||profile.settled.includes(result.runId)||!canPlay(profile,result.sector)||!finite(result.score)||!finite(result.time)||!finite(result.kills)||!whole(result.bosses,0,3)||typeof result.won!=='boolean'||(result.won&&result.bosses!==3))return null;
  if(result.peakCombo!==undefined&&!whole(result.peakCombo,0,1e9))return null;
  const firstClear=result.won&&result.sector>profile.cleared;
  const reward=result.won?(firstClear?SECTORS[result.sector-1].firstReward:2):0;
  profile.wallet+=reward;if(firstClear)profile.cleared=result.sector;
  profile.selected=Math.min(profile.cleared+1,SECTORS.length);
  profile.best=Math.max(profile.best,result.score);
  profile.stats.runs++;profile.stats.wins+=+result.won;profile.stats.kills+=result.kills;profile.stats.bosses+=result.bosses;profile.stats.seconds+=result.time;
  if(result.won){const prev=profile.records[result.sector];profile.records[result.sector]={wins:(prev?.wins||0)+1,best:Math.max(prev?.best||0,result.score),time:Math.min(prev?.time??Infinity,result.time),combo:Math.max(prev?.combo||0,result.peakCombo||0)};}
  profile.settled.push(result.runId);profile.settled=profile.settled.slice(-2000);
  profile.activeRun=null;profile.lastResult={...result,reward,firstClear};return profile.lastResult;
}
// Validate imported content before allowing it to replace a working save.
export function validateProfile(raw) {
  if(!raw||raw.version!==SAVE_VERSION||!whole(raw.cleared,0,SECTORS.length)||!whole(raw.wallet,0,1e7)||!finite(raw.best)||!raw.skills||!raw.settings||!raw.stats||!Array.isArray(raw.settled)||raw.settled.length>2000)return null;
  const skills=cleanSkills(raw.skills);for(const s of SKILLS)if(raw.skills[s.id]!==skills[s.id])return null;
  if(!whole(raw.selected,1,Math.min(SECTORS.length,raw.cleared+1)))return null;
  for(const key of ['runs','wins','kills','bosses','seconds'])if(!finite(raw.stats[key]))return null;
  for(const key of ['effects','particles','shake'])if(typeof raw.settings[key]!=='boolean')return null;
  if(!finite(raw.settings.volume,0,1)||raw.settled.some(id=>typeof id!=='string'||!id||id.length>100))return null;
  const p=newProfile();Object.assign(p,{cleared:raw.cleared,wallet:raw.wallet,skills,selected:raw.selected,best:raw.best,settings:{...raw.settings},stats:{...raw.stats},settled:[...raw.settled]});
  for(let i=1;i<=raw.cleared;i++){const r=raw.records?.[i];if(!r||!whole(r.wins,1,1e9)||!finite(r.best)||!finite(r.time))return null;if(r.combo!==undefined&&!whole(r.combo,0,1e9))return null;p.records[i]={wins:r.wins,best:r.best,time:r.time,combo:r.combo||0};}
  if(raw.activeRun!=null){if(!raw.activeRun||raw.activeRun.version!==1||!canPlay(p,raw.activeRun.sector)||typeof raw.activeRun.runId!=='string'||!raw.activeRun.runId||p.settled.includes(raw.activeRun.runId))return null;p.activeRun=raw.activeRun;}
  if(raw.lastResult!=null){const r=raw.lastResult;if(!r||typeof r.runId!=='string'||!p.settled.includes(r.runId)||!whole(r.sector,1,SECTORS.length)||typeof r.won!=='boolean'||!finite(r.score)||!finite(r.time)||!finite(r.reward,0,20))return null;p.lastResult=r;}
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
