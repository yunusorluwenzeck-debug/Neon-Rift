const target=document.documentElement.dataset.gameTarget||new URLSearchParams(location.search).get('portal')||'generic';
const sdkUrls={crazygames:'https://sdk.crazygames.com/crazygames-sdk-v3.js',poki:'https://game-cdn.poki.com/scripts/v2/poki-sdk.js'};
async function loadSdk(url){await new Promise(resolve=>{const s=document.createElement('script');let done=false;const finish=()=>{if(done)return;done=true;clearTimeout(timer);resolve()};const timer=setTimeout(finish,8000);s.src=url;s.onload=finish;s.onerror=finish;document.head.append(s)})}
if(sdkUrls[target])await loadSdk(sdkUrls[target]);
const sdk=target==='crazygames'?globalThis.CrazyGames?.SDK:target==='poki'?globalThis.PokiSDK:null;
let sdkReady=false;try{if(sdk?.init){await sdk.init();sdkReady=true}}catch{}
if(target==='crazygames'&&sdkReady){try{sdk.game?.loadingStart?.()}catch{}}
let local=null;try{local=globalThis.localStorage;const probe='__neon_rift_storage_test__';local.setItem(probe,'1');local.removeItem(probe)}catch{local=null}
const memory=new Map();let sdkDataUsable=target==='crazygames'&&sdkReady&&!!sdk?.data;
const store={
 get persistent(){return !!local||sdkDataUsable},
 get(key){if(sdkDataUsable){try{const value=sdk.data.getItem(key);if(value!==null)return JSON.parse(value)}catch{sdkDataUsable=false}}
  if(local){try{return JSON.parse(local.getItem(key)||'{}')}catch{local=null}}
  try{return JSON.parse(memory.get(key)||'{}')}catch{return {}}},
 set(key,value){const encoded=JSON.stringify(value);if(sdkDataUsable){try{sdk.data.setItem(key,encoded);return true}catch{sdkDataUsable=false}}
  if(local){try{local.setItem(key,encoded);return true}catch{local=null}}
  memory.set(key,encoded);return false}
};
globalThis.NEON_RIFT_PLATFORM={target,sdk,store,ready:sdkReady};
await import('./game.js');
if(target==='crazygames'&&sdkReady){try{sdk.game?.loadingStop?.()}catch{}}
if(target==='poki'&&sdkReady){try{sdk.gameLoadingFinished?.()}catch{}}
