"""Bundle reviewed portal builds, covers and instructions; never include private hosting metadata."""
from pathlib import Path
import zipfile,json
root=Path(__file__).resolve().parent.parent
out=root/'dist/downloads';out.mkdir(exist_ok=True)
files={}
for platform in ['generic','crazygames','poki']:
 p=root/f'portal-builds/NEON-RIFT-{platform}.zip'
 if not p.is_file():raise SystemExit('Run node scripts/build-portals.mjs first')
 files[p.name]=p
for name in ['README-SV.md','STORE-TEXT-EN.txt']:files[name]=root/'portal'/name
files['START-HERE.txt']=root/'portal/README-SV.md'
for p in sorted((root/'portal/covers').glob('*')):files['covers/'+p.name]=p
files['manifest.json']=root/'portal-builds/manifest.json'
with zipfile.ZipFile(out/'NEON-RIFT-publishing-kit.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for name,p in sorted(files.items()):
  info=zipfile.ZipInfo(name,(2026,10,18,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,p.read_bytes())
print('Built dist/downloads/NEON-RIFT-publishing-kit.zip', (out/'NEON-RIFT-publishing-kit.zip').stat().st_size,'bytes')
