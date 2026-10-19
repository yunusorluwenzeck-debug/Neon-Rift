import assert from 'node:assert/strict';
import {Game,STEP,validSnapshot} from '../dist/core.mjs';
import {newProfile,redeemCode,validateProfile,SaveStore,buySkill,refundSkills,settleRun,runRewards,SKILLS} from '../dist/progression.mjs';
let passed=0;const test=(name,fn)=>{fn();passed++;console.log('PASS',name)};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const flight=skills=>{const g=new Game({random:()=>.42});g.reset({skills,runId:'workshop-test'});g.stage=0;g.spawnTimer=999;return g};
const tick=(g,seconds)=>{for(let i=0;i<Math.round(seconds/STEP);i++)g.update(STEP)};
const result=(overrides={})=>({runId:'run',sector:1,won:false,score:100,time:60,kills:40,bosses:1,...overrides});

test('Yunus10000 grants exactly 10000 cores once, accepting whitespace and case',()=>{
 const p=newProfile();assert.deepEqual(redeemCode(p,' Yunus10000 '),{ok:true,amount:10000});assert.equal(p.wallet,10000);assert.deepEqual(p.redeemedCodes,['YUNUS10000']);
 const saved=JSON.stringify(p);assert.deepEqual(redeemCode(p,'yunus10000'),{ok:false,reason:'used'});assert.equal(JSON.stringify(p),saved);
});
test('Invalid codes and wallet limits never mutate profile or consume a code',()=>{
 const p=newProfile();for(const code of ['',null,'__proto__','Yunus1000','Yunus10000x']){const before=JSON.stringify(p);assert.equal(redeemCode(p,code).ok,false);assert.equal(JSON.stringify(p),before)}
 p.wallet=9999999;assert.equal(redeemCode(p,'Yunus10000').reason,'limit');assert.deepEqual(p.redeemedCodes,[]);p.wallet=0;assert.ok(redeemCode(p,'Yunus10000').ok);
});
test('Gift cores can fund upgrades before a victory, respecting costs and prerequisites',()=>{
 const p=newProfile();redeemCode(p,'Yunus10000');assert.equal(buySkill(p,'regen'),false);assert.ok(buySkill(p,'hull'));assert.ok(buySkill(p,'hull'));assert.ok(buySkill(p,'regen'));assert.equal(p.wallet,9995);assert.equal(p.cleared,0);assert.equal(refundSkills(p),5);assert.equal(p.wallet,10000);assert.equal(redeemCode(p,'Yunus10000').reason,'used');
});
test('Redemption persists through storage, export/import and a spent-core refund',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)},store=new SaveStore(storage),p=newProfile();redeemCode(p,'Yunus10000');buySkill(p,'reactor');assert.ok(store.save(p));
 const copy=validateProfile(JSON.parse(JSON.stringify(store.load())));assert.equal(copy.wallet,9999);assert.equal(copy.skills.reactor,1);assert.equal(redeemCode(copy,'Yunus10000').reason,'used');
});
test('Old profiles and active runs migrate all six skills and redemption history',()=>{
 const p=newProfile(),g=flight();delete p.redeemedCodes;for(const key of ['broadside','gyro','nanoweave','hazardguard','tractor','shockdrive']){delete p.skills[key];delete g.permanent[key]}
 const saved=g.snapshot();delete saved.quietFor;p.activeRun=saved;const migrated=validateProfile(p);assert.ok(migrated);assert.deepEqual(migrated.redeemedCodes,[]);assert.equal(migrated.skills.nanoweave,0);assert.ok(validSnapshot(saved));const copy=flight();assert.ok(copy.restore(saved));assert.equal(copy.quietFor,0);assert.equal(copy.permanent.gyro,0);
});
test('Malformed code history and healing counters reject import',()=>{
 for(const codes of [null,'YUNUS10000',['YUNUS10000','YUNUS10000'],[2],['<script>'],Array(101).fill('A')]){const p=newProfile();p.redeemedCodes=codes;assert.equal(validateProfile(p),null)}
 for(const v of [-1,6,'5',null]){const s=flight().snapshot();s.quietFor=v;assert.equal(validSnapshot(s),false)}
});
test('Defeats award earned kills and bosses once without unlocking a sector',()=>{
 const p=newProfile(),r=settleRun(p,result());assert.equal(r.reward,5);assert.deepEqual(r.rewards,{combat:2,bosses:3,clear:0,total:5});assert.equal(p.cleared,0);assert.equal(p.wallet,5);assert.equal(settleRun(p,result()),null);assert.equal(p.wallet,5);assert.ok(validateProfile(p));
});
test('Kill rewards use exact thresholds and cap; winning and replay bonuses stack',()=>{
 assert.equal(runRewards(result({kills:19,bosses:0})).total,0);assert.equal(runRewards(result({kills:20,bosses:0})).total,1);assert.equal(runRewards(result({kills:10000,bosses:0})).total,12);
 const p=newProfile();assert.equal(settleRun(p,result({won:true,bosses:3,kills:20})).reward,21);assert.equal(settleRun(p,result({runId:'replay',won:true,bosses:3,kills:20})).reward,18);assert.equal(p.wallet,39);assert.ok(validateProfile(p));
});
test('Sidobatterier strengthens actual side bullets while main damage is unchanged',()=>{
 const skills={reactor:2,coil:1,broadside:2},g=flight(skills);g.ranks.split=1;g.potency.split=1;const e=g.spawn('rammer',{x:g.player.x+220,y:g.player.y});e.age=2;g.update(STEP);assert.equal(g.bullets.length,3);near(g.bullets[0].damage/g.bullets[1].damage,.85);near(g.bullets[2].damage,g.bullets[0].damage);near(g.bullets[1].damage,flight({reactor:2,coil:1}).combatStats().damage);
});
test('Drönarturbiner changes actual angular motion while preserving orbit size',()=>{
 const g=flight({reactor:2,coil:2,resonance:1,gyro:2});g.ranks.drone=1;g.time=.5;const d=g.dronePositions()[0];near(d.angle,1.4);near(Math.hypot(d.x-g.player.x,d.y-g.player.y),65);
});
test('Nanoläkning waits five seconds, heals at the promised rate, and stops at full shield',()=>{
 const g=flight({hull:2,regen:1,nanoweave:3});g.player.hp=50;tick(g,5);near(g.player.hp,50);tick(g,1);near(g.player.hp,51.2);g.player.hp=g.player.max-.1;tick(g,1);near(g.player.hp,g.player.max);
 g.player.inv=0;g.damage(10,'test',0,0);const hp=g.player.hp;tick(g,4);near(g.player.hp,hp);assert.ok(g.quietFor<5);
});
test('Healing freezes in pause/upgrade and its delay survives a saved-flight reload',()=>{
 const g=flight({hull:2,regen:1,nanoweave:2});g.player.hp=50;tick(g,4);const snapshot=g.snapshot(),copy=flight();assert.ok(copy.restore(snapshot));copy.update(10);near(copy.player.hp,50);near(copy.quietFor,4);copy.resume();tick(copy,2);near(copy.player.hp,50.8);copy.offer('support');const hp=copy.player.hp;copy.update(10);near(copy.player.hp,hp);copy.reset({skills:g.permanent});assert.equal(copy.quietFor,0);
});
test('Fältdämpare reduces real mine damage but does not change projectile damage',()=>{
 const skills={hull:2,regen:2,bastion:1,hazardguard:2},g=flight(skills);g.player.inv=0;const before=g.player.hp;g.hazard('mine',g.player.x,g.player.y,0,50,0);g.hazards[0].active=true;g.update(STEP);near(before-g.player.hp,13.7);
 const bullet=flight(skills);bullet.player.inv=0;const hp=bullet.player.hp;bullet.shot(bullet.player.x,bullet.player.y,0,0,18);bullet.update(STEP);near(hp-bullet.player.hp,17.1);
});
test('Energitraktor moves nearby pickups 50 percent faster without changing XP values',()=>{
 const base={thrusters:2,capacitor:2,salvager:1},a=flight(base),b=flight({...base,tractor:2});for(const g of [a,b])g.addGem(g.player.x+100,g.player.y,3);a.update(STEP);b.update(STEP);near((b.player.x+100-b.gems[0].x)/(a.player.x+100-a.gems[0].x),1.5);tick(b,.3);assert.equal(b.xp,3);assert.equal(b.score,15);
});
test('Stötförstärkare increases dash contact and nova damage in real collisions',()=>{
 const skills={thrusters:2,capacitor:1,slipstream:1,shockdrive:2},g=flight(skills);g.ranks.dash=1;g.fireTimer=999;g.player.dx=1;g.player.dy=0;const e=g.spawn('rammer',{x:g.player.x+40,y:g.player.y});e.age=2;g.dash();g.update(STEP);near(e.max-e.hp,77);
 const n=flight(skills);n.ranks.dash=n.ranks.nova=1;n.fireTimer=999;n.player.dx=n.player.dy=0;const enemy=n.spawn('rammer',{x:n.player.x+80,y:n.player.y});enemy.age=2;n.dash();n.player.dashTime=STEP/2;n.update(STEP);near(enemy.max-enemy.hp,63);assert.equal(SKILLS.length,24);
});
console.log(`${passed} workshop tests passed`);
