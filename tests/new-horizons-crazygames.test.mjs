import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CrazyGamesPlatform} from '../crazygames-new-horizons/platform.mjs';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('CrazyGames edition loads the official HTML5 SDK v3',async()=>{
 const html=await read('crazygames-new-horizons/index.html');
 assert.match(html,/sdk\\.crazygames\\.com\\/crazygames-sdk-v3\\.js/);
 assert.doesNotMatch(html,/poki-sdk|game-cdn\\.poki/i);
 assert.match(html,/type="module" src="\\.\\/game\\.js"/);
});

test('SDK initializes before Game module lifecycle events',async()=>{
 const calls=[];
 const sdk={environment:'local',async init(){calls.push('init')},game:{loadingStop(){calls.push('loadingStop')},gameplayStart(){calls.push('start')},gameplayStop(){calls.push('stop')}}};
 const platform=new CrazyGamesPlatform(()=>sdk);
 assert.equal(await platform.init(),true);
 platform.call('loadingStop');platform.gameplayStart();platform.gameplayStart();platform.gameplayStop();platform.gameplayStop();
 assert.deepEqual(calls,['init','loadingStop','start','stop']);
});

test('SDK failures and disabled environments fail safely',async()=>{
 const failed=new CrazyGamesPlatform(()=>({async init(){throw new Error('offline')}}));
 assert.equal(await failed.init(),false);assert.doesNotThrow(()=>failed.call('gameplayStart'));
 const disabled=new CrazyGamesPlatform(()=>({environment:'disabled',async init(){}}));
 assert.equal(await disabled.init(),false);
});

test('Keyboard and pointer controls remain wired for desktop and touch',async()=>{
 const html=await read('crazygames-new-horizons/index.html');
 const game=await read('crazygames-new-horizons/game.js');
 const css=await read('crazygames-new-horizons/style.css');
 for(const key of ['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','KeyD','KeyA','KeyS','KeyW'])assert.ok(game.includes(key),key);
 for(const event of ['pointerdown','pointermove','pointerup','pointercancel'])assert.ok(game.includes(event),event);
 assert.match(css,/touch-action:none/);assert.match(css,/orientation:landscape/);assert.match(html,/viewport-fit=cover/);
});

test('The standalone exploration edition keeps its own save key and mechanics',async()=>{
 const game=await read('crazygames-new-horizons/game.js');
 assert.match(game,/neon-rift-new-horizons-crazygames-v1/);
 assert.match(game,/energy>=20/);assert.match(game,/spawnRock/);assert.match(game,/spawnOrb/);
 assert.doesNotMatch(game,/PokiSDK|commercialBreak|gameLoadingFinished/);
});