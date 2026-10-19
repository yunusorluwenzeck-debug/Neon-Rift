import {readFile,writeFile,mkdir,rm,cp,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'portal-builds');
const translations=JSON.parse(await readFile(path.join(root,'portal/english.json'),'utf8'));
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pattern=new RegExp(Object.keys(translations).sort((a,b)=>b.length-a.length).map(escape).join('|'),'g');
const english=s=>s.replace(pattern,match=>translations[match]);
const read=file=>readFile(path.join(root,file),'utf8');
await mkdir(out,{recursive:true});
const records=[];
for(const target of ['generic','crazygames','poki']){
  const dest=path.join(out,target);await rm(dest,{recursive:true,force:true});await mkdir(dest,{recursive:true});
  for(const source of ['progression.mjs','core.mjs','game.js','style.css','index.html']){
    let content=english(await read('dist/'+source));
    if(source.endsWith('.mjs')||source==='game.js')content=content.replace(/\.mjs(?:\?v=[\w-]+)?/g,'.js');
    if(source==='index.html'){
      content=content.replace('<html lang="en">',`<html lang="en" data-portal="${target}">`).replace('<body>','<body class="portal-loading"><div id="portal-loading" role="status">Calibrating flight systems…</div>');
      content=content.replace(/src="game.js[^\"]*"/,'src="boot.js"');
      if(target!=='generic')content=content.replace('id="fullscreen"','id="fullscreen" hidden');
    }
    await writeFile(path.join(dest,source.replace('.mjs','.js')),content);
  }
  for(const file of ['bridge','boot'])await writeFile(path.join(dest,file+'.js'),(await read('portal/'+file+'.mjs')).replace("'./bridge.mjs'","'./bridge.js'"));
  await cp(path.join(root,'dist/fonts'),path.join(dest,'fonts'),{recursive:true});
  const archive=path.join(out,`NEON-RIFT-${target}.zip`);
  // Deterministic ZIP, root index.html, only runtime files. No Site IDs or credentials.
  const zip=spawnSync('python',['-c',`import pathlib,sys,zipfile
root=pathlib.Path(sys.argv[1])
with zipfile.ZipFile(sys.argv[2],'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted(root.rglob('*')):
  if p.is_file():
   info=zipfile.ZipInfo(p.relative_to(root).as_posix(),(2026,10,19,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,p.read_bytes())
`,dest,archive],{encoding:'utf8'});if(zip.status)throw Error(zip.stderr);
  const bytes=(await readFile(archive)).length;records.push({target,archive:path.basename(archive),bytes});
}
await writeFile(path.join(out,'manifest.json'),JSON.stringify({version:'workshop-1',language:'en',entry:'index.html',builds:records},null,2));
console.log(JSON.stringify(records));
