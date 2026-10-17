import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=name=>readFile(new URL(name,root),'utf8');
const [html,css,core,game]=await Promise.all(['dist/index.html','dist/style.css','dist/core.mjs','dist/game.js'].map(read));
const script=core.replace(/^export /gm,'')+'\n'+game.replace(/^import .*?;\n/,'');
const style=css.replace(/@import url\([^;]+;/g,'');
const offline=html.replace(/<link rel="stylesheet" href="style.css[^\"]*">/,'<style>'+style+'</style>')
  .replace(/<script type="module" src="game.js[^\"]*"><\/script>/,'<script>'+script+'</script>');
if(offline.includes('type="module"')||offline.includes('href="style.css'))throw new Error('Offline build failed: external game files remain');
await writeFile(new URL('PLAY-OFFLINE.html',root),offline);
console.log('Built PLAY-OFFLINE.html from current source.');
