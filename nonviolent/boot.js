const target=document.documentElement.dataset.gameTarget||new URLSearchParams(location.search).get('portal')||'generic';
const sdkUrls={crazygames:'https://sdk.crazygames.com/crazygames-sdk-v3.js',poki:'https://game-cdn.poki.com/scripts/v2/poki-sdk.js'};
async function loadSdk(url){await new Promise(resolve=>{const s=document.createElement('script');let done=false;const finish=()=>{if(done)return;done=true;clearTimeout(timer);resolve()};const timer=setTimeout(finish,8000);s.src=url;s.onload=finish;s.onerror=finish;document.head.append(s)})}
if(sdkUrls[target])await loadSdk(sdkUrls[target]);
const sdk=target==='crazygames'?globalThis.CrazyGames?.SDK:target==='poki'?globalThis.PokiSDK:null;
let sdkReady=false;try{if(sdk?.init){await sdk.init();sdkReady=true}}catch{}
if(target==='crazygames'&&sdkReady){try{sdk.game?.loadingStart?.()}catch{}}
const storage=target==='crazygames'&&sdkReady&&sdk.data?sdk.data:localStorage;
const store={get(key){try{return JSON.parse(storage.getItem(key)||'{}')}catch{return {}}},set(key,value){try{storage.setItem(key,JSON.stringify(value));return true}catch{return false}}};
globalThis.NEON_RIFT_PLATFORM={target,sdk,store,ready:sdkReady};
await import('./game.js');
if(target==='crazygames'&&sdkReady){try{sdk.game?.loadingStop?.()}catch{}}
if(target==='poki'&&sdkReady){try{sdk.gameLoadingFinished?.()}catch{}}
