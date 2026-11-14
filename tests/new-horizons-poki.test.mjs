import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=rel=>readFile(path.join(root,rel),'utf8');
test('New Horizons is an independent, non-combat game page',async()=>{
 const html=await read('poki-new-horizons/index.html');
 const game=await read('poki-new-horizons/game.js');
 assert.match(html,/NEON RIFT: New Horizons/);
 assert.match(html,/poki-sdk\.js/);
 assert.match(game,/energy>=20/);
 assert.match(game,/spawnRock/);
 assert.match(game,/spawnOrb/);
 assert.doesNotMatch(game,/weapon|projectile|shoot|enemy|boss|fireWeapon/i);
});
test('Poki SDK lifecycle and ad break are integrated safely',async()=>{
 const game=await read('poki-new-horizons/game.js');
 for(const event of ['gameLoadingFinished','gameplayStart','gameplayStop','commercialBreak'])assert.ok(game.includes(event),event);
 assert.match(game,/8000/);
});
test('The standalone package script packages only the new edition folder',async()=>{
 const build=await read('scripts/build-new-horizons-poki.mjs');
 assert.match(build,/poki-new-horizons/);
 assert.match(build,/NEON-RIFT-NEW-HORIZONS-poki\.zip/);
});
test('Mobile, keyboard and pointer controls are present',async()=>{
 const html=await read('poki-new-horizons/index.html');
 const css=await read('poki-new-horizons/style.css');
 const game=await read('poki-new-horizons/game.js');
 assert.match(html,/viewport-fit=cover/);
 assert.match(css,/max-width:650px/);
 assert.match(css,/orientation:landscape/);
 assert.match(game,/ArrowUp/);
 assert.match(game,/pointerdown/);
});
