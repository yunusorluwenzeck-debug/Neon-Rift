import {PortalBridge} from './bridge.mjs';
const target=document.documentElement.dataset.portal||'generic';
const urls={crazygames:'https://sdk.crazygames.com/crazygames-sdk-v3.js',poki:'https://game-cdn.poki.com/scripts/v2/poki-sdk.js'};
async function script(url){
  await new Promise(resolve=>{const el=document.createElement('script');let done=false;const finish=()=>{if(done)return;done=true;clearTimeout(timer);resolve()};const timer=setTimeout(finish,8000);el.src=url;el.onload=finish;el.onerror=finish;document.head.append(el)});
}
if(urls[target])await script(urls[target]);
const sdk=target==='crazygames'?globalThis.CrazyGames?.SDK:target==='poki'?globalThis.PokiSDK:null;
const bridge=new PortalBridge(target,sdk);
// Start only after initialization. A failed or blocked SDK still allows offline play.
let timer;
await Promise.race([bridge.init(),new Promise(resolve=>{timer=setTimeout(resolve,10000)})]);clearTimeout(timer);
// If init has not finished, retire this instance so a late SDK cannot swap save stores mid-flight.
if(!bridge.ready)bridge.retired=true;
const active=bridge.ready?bridge:new PortalBridge(target);
globalThis.NEON_PORTAL=active;
await import('./game.js');
active.loaded();document.getElementById('portal-loading')?.remove();document.body.classList.remove('portal-loading');
