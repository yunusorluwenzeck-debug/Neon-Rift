// CrazyGames HTML5 SDK v3 adapter for NEON RIFT: New Horizons.
// The game remains playable outside CrazyGames; SDK calls are guarded.
export class CrazyGamesPlatform {
  constructor(provider=()=>globalThis.window?.CrazyGames?.SDK){
    this.provider=provider;this.sdk=null;this.initialized=false;this.playing=false;
    this.loadComplete=false;this.loadingStarted=false;this.loadingStopped=false;
  }
  async init(){
    try{
      const sdk=this.provider();
      if(!sdk||typeof sdk.init!=='function')return false;
      await sdk.init();
      if(sdk.environment==='disabled')return false;
      this.sdk=sdk;this.initialized=true;
      this.call('loadingStart');this.loadingStarted=true;
      if(this.loadComplete)this.finishLoading();
      return true;
    }catch(error){
      console.warn('CrazyGames SDK initialization failed; continuing without platform services.',error);
      this.sdk=null;this.initialized=false;
      return false;
    }
  }
  finishLoading(){
    this.loadComplete=true;
    if(!this.initialized||!this.sdk||this.loadingStopped)return;
    if(!this.loadingStarted){this.call('loadingStart');this.loadingStarted=true;}
    this.loadingStopped=true;
    this.call('loadingStop');
    if(this.playing)this.call('gameplayStart');
  }
  call(name,...args){
    if(name==='gameplayStart'){
      this.playing=true;
      if(!this.loadingStopped)return;
    }
    if(name==='gameplayStop')this.playing=false;
    if(!this.initialized||!this.sdk)return;
    const fn=this.sdk.game?.[name];
    if(typeof fn!=='function')return;
    try{
      const result=fn.apply(this.sdk.game,args);
      result?.catch?.(error=>console.warn('CrazyGames SDK event failed:',name,error));
      return result;
    }catch(error){console.warn('CrazyGames SDK event failed:',name,error);}
  }
  gameplayStart(){if(!this.playing)this.call('gameplayStart');}
  gameplayStop(){if(this.playing)this.call('gameplayStop');}
}
export const platform=new CrazyGamesPlatform();
