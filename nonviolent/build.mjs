import {readFile,writeFile,mkdir,rm,cp} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.join(root,'nonviolent'),out=path.join(root,'nonviolent-builds');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
const records=[];
for(const target of ['crazygames','poki']){
 const dest=path.join(out,target);await mkdir(dest,{recursive:true});
 for(const file of ['index.html','style.css','game.js','boot.js']) {
  let content=await readFile(path.join(source,file),'utf8');
  if(file==='index.html')content=content.replace('<html lang="en" data-game="neon-rift-starlight">',`<html lang="en" data-game="neon-rift-starlight" data-game-target="${target}">`);
  await writeFile(path.join(dest,file),content);
 }
 await cp(path.join(root,'dist/fonts'),path.join(dest,'fonts'),{recursive:true});
 await writeFile(path.join(dest,'START-HERE.txt'),`NEON RIFT: STARLIGHT RESCUE\nPlatform build: ${target}\nEntry file: index.html\nUpload this ZIP as an HTML5 game package.\nControls: WASD / arrow keys, Space to boost, P or Escape to pause. Touch: drag to steer, tap Boost.\nNo weapons, shooting or combat.\n`);
 const archive=path.join(out,`NEON-RIFT-STARLIGHT-RESCUE-${target}.zip`);
 const zip=spawnSync('python',['-c',`import pathlib,sys,zipfile\nroot=pathlib.Path(sys.argv[1])\nwith zipfile.ZipFile(sys.argv[2],'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:\n for p in sorted(root.rglob('*')):\n  if p.is_file():\n   info=zipfile.ZipInfo(p.relative_to(root).as_posix(),(2026,11,22,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,p.read_bytes())\n`,dest,archive],{encoding:'utf8'});
 if(zip.status!==0)throw Error(zip.stderr);
 records.push({platform:target,file:path.basename(archive),bytes:(await readFile(archive)).length,entry:'index.html'});
}
await writeFile(path.join(out,'manifest.json'),JSON.stringify({title:'NEON RIFT: Starlight Rescue',version:1,violentContent:false,builds:records},null,2));
console.log(JSON.stringify(records,null,2));
