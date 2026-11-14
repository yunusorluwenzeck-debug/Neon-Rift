import {mkdir,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.join(root,'poki-new-horizons');
const output=path.join(root,'dist','downloads','NEON-RIFT-NEW-HORIZONS-poki.zip');
await mkdir(path.dirname(output),{recursive:true});
const result=spawnSync('python',['-c',`import pathlib,sys,zipfile
root=pathlib.Path(sys.argv[1])
with zipfile.ZipFile(sys.argv[2],'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted(root.rglob('*')):
  if p.is_file():
   info=zipfile.ZipInfo(p.relative_to(root).as_posix(),(2026,11,14,0,0,0))
   info.compress_type=zipfile.ZIP_DEFLATED
   info.external_attr=0o100644<<16
   z.writestr(info,p.read_bytes())
`,source,output],{encoding:'utf8'});
if(result.status!==0)throw new Error(result.stderr||'ZIP packaging failed');
const bytes=(await readFile(output)).length;
console.log(JSON.stringify({archive:path.relative(root,output),bytes,entry:'index.html'}));
