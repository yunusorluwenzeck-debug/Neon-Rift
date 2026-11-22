import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
for(const file of ['index.html','style.css','game.js','boot.js']){
 const p=path.join(root,'nonviolent',file);assert.ok(fs.existsSync(p),`Missing ${file}`);
 if(file.endsWith('.js')){const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});assert.equal(r.status,0,r.stderr)}
}
const html=fs.readFileSync(path.join(root,'nonviolent/index.html'),'utf8');
const boot=fs.readFileSync(path.join(root,'nonviolent/boot.js'),'utf8');
const game=fs.readFileSync(path.join(root,'nonviolent/game.js'),'utf8');
const css=fs.readFileSync(path.join(root,'nonviolent/style.css'),'utf8');
assert.match(html,/STARLIGHT RESCUE/);assert.match(html,/data-game=/);assert.match(html,/save-note/);
assert.match(game,/length:12/);assert.match(game,/beacons\.every/);assert.match(game,/energy>=3/);assert.match(game,/gameplayStart/);assert.match(game,/gameplayStop/);assert.match(game,/commercialBreak/);assert.doesNotMatch(game,/e\.code==='Escape'/);assert.match(game,/window\.addEventListener\('wheel'/);
assert.doesNotMatch(game,/bullet|weapon|shoot|enemy|boss|kill/i);
assert.doesNotMatch(html,/weapon|shoot|enemy|boss|kill/i);
assert.doesNotMatch(css,/fonts\.googleapis\.com/);
for(const font of ['SpaceGrotesk.ttf','BarlowCondensed-Bold.ttf','SpaceGrotesk-OFL.txt','Barlow-OFL.txt'])assert.ok(fs.existsSync(path.join(root,'dist/fonts',font)));
console.log('PASS: standalone peaceful game sources, syntax, 12-sector objective, platform lifecycle hooks, no combat mechanics/terms, bundled local fonts.');
