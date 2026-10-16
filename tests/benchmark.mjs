import {Game,STEP} from '../dist/core.mjs';
import {performance} from 'node:perf_hooks';
const g=new Game();g.reset();g.player.inv=1000;g.ranks={rapid:3,power:3,split:1,chain:2,drone:2,orbit:1,dash:1,nova:1,shield:1,magnet:1};
const start=performance.now();let updates=0,peak=0;for(let i=0;i<720/STEP;i++){if(g.state==='upgrade')g.choose(g.choices[0]);if(g.terminal)break;const angle=g.time*.045;g.update(STEP,{x:Math.cos(angle),y:Math.sin(angle)});g.drainEvents();updates++;peak=Math.max(peak,g.enemies.length)}
console.log(JSON.stringify({scenario:'720 simulated seconds, prebuilt ship and damage disabled for stress coverage',state:g.state,gameSeconds:g.time,updates,cpuMilliseconds:Math.round(performance.now()-start),peakEnemies:peak,bossHp:g.boss?.hp}));
