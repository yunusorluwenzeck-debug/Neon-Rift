import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
for(const target of ['generic','crazygames','poki']){
 const dir=path.join(root,'portal-builds',target),html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
 assert.match(html,/<html lang="en"/);assert.match(html,new RegExp(`data-portal="${target}"`));assert.ok(!html.includes('chatgpt'));
 for(const file of fs.readdirSync(dir)){
  const location=path.join(dir,file);if(!fs.statSync(location).isFile())continue;const source=fs.readFileSync(location,'utf8');
  assert.ok(!/[åäöÅÄÖ]/.test(source),`Untranslated Swedish in ${target}/${file}`);
  if(file.endsWith('.js')){const check=spawnSync(process.execPath,['--check',location],{encoding:'utf8'});assert.equal(check.status,0,check.stderr)}
  if(['.js','.html','.css'].includes(path.extname(file)))for(const m of source.matchAll(/(?:from\s+|import\(|src=|href=|url\()["'](\.\/?[^"']+|fonts\/[^"']+)["']/g)){
   const relative=m[1].split('?')[0];assert.ok(fs.existsSync(path.join(dir,relative)),`Missing ${relative}`);
  }
 }
 assert.ok(fs.existsSync(path.join(dir,'fonts/Barlow-OFL.txt')));assert.ok(fs.existsSync(path.join(dir,'fonts/SpaceGrotesk-OFL.txt')));
 const zip=spawnSync('python',['-c',`import sys,zipfile
with zipfile.ZipFile(sys.argv[1]) as z:
 assert z.testzip() is None
 assert 'index.html' in z.namelist()
 assert len(z.namelist()) == 11
 assert all(not n.startswith(('/', '../','.openai')) for n in z.namelist())
 assert sum(i.file_size for i in z.infolist()) < 1000000
`,path.join(root,'portal-builds',`NEON-RIFT-${target}.zip`)],{encoding:'utf8'});assert.equal(zip.status,0,zip.stderr);
}
console.log('PASS three portal packages: JS syntax, English text, relative file links, root index.html, 11 files each, local fonts/licences, valid ZIPs, under 1 MB unpacked each.');
