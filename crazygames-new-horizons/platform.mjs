// CrazyGames HTML5 SDK v3 adapter for NEON RIFT: New Horizons.
// The game remains playable outside CrazyGames; SDK calls are guarded.
export class CrazyGamesPlatform {
  constructor(provider=()=>globalThis.window?.CrazyGames?.SDK){this.provider=provider;this.sdk=null;this.initialized=false;this.playing=false;}
  async init(){
    try{const sdk=this.provider();if(!sdk||typeof sdk.init!=='function')return false;await sdk.init();if(sdk.environment==='disabled')return false;this.sdk=sdk;this.initialized=true;return true;}
    catch(error){console.warn('CrazyGames SDK initialization failed; continuing without platform services.',error);this.sdk=null;this.initialized=false;return false;}
  }
  call(name,...args){if(!this.initialized||!this.sdk)return;const fn=this.sdk.game?.[name];if(typeof fn!=='function')return;try{const result=fn.apply(this.sdk.game,args);result?.catch?.(error=>console.warn('CrazyGames SDK event failed:',name,error));return result;}catch(error){console.warn('CrazyGames SDK event failed:',name,error);}}
  gameplayStart(){if(this.playing)return;this.playing=true;this.call('gameplayStart');}
  gameplayStop(){if(!this.playing)return;this.playing=false;this.call('gameplayStop');}
}
export const platform=new CrazyGamesPlatform();