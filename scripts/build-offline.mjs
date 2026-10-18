import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=name=>readFile(new URL(name,root),'utf8');
const [html,css,progression,core,game]=await Promise.all(['dist/index.html','dist/style.css','dist/progression.mjs','dist/core.mjs','dist/game.js'].map(read));
const bundle=source=>source.replace(/^import .*?;\n/gm,'').replace(/^export /gm,'');
const script=[progression,core,game].map(bundle).join('\n').replace(/<\/script/gi,'<\\/script');
// Source CSS already uses bundled fonts; preserve valid rules verbatim.
let style=css;
for(const font of ['BarlowCondensed-Bold.ttf','SpaceGrotesk.ttf']){const data=await readFile(new URL('dist/fonts/'+font,root));style=style.replace('fonts/'+font,'data:font/ttf;base64,'+data.toString('base64'));}
const offline=html.replace(/<link rel="stylesheet" href="style.css[^\"]*">/,()=>'<style>'+style+'</style>')
  .replace(/<script type="module" src="game.js[^\"]*"><\/script>/,()=>'<script>'+script+'</script>');
if(offline.includes('type="module"')||offline.includes('href="style.css')||/^import /m.test(script))throw new Error('Offline build failed: external game files remain');
await writeFile(new URL('PLAY-OFFLINE.html',root),offline);
console.log('Built PLAY-OFFLINE.html from current source.');
