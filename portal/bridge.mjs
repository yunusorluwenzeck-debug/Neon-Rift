// Platform calls live outside the simulation. No SDK, ads or tracking on the private Site.
export class PortalBridge {
  constructor(target='generic',sdk=null) {
    this.target=target;this.sdk=sdk;this.retired=false;
    this.ready=false;this.playing=false;this.busy=false;this.breakDue=false;this.platformMuted=false;this.onMute=null;
    this.quickStart=target==='crazygames';this.allowFullscreen=target==='generic';this.storage=null;
  }
  get muted(){return this.busy||this.platformMuted;}
  call(object,name,...args){try{return object?.[name]?.(...args)}catch{return undefined}}
  async init(){
    if(!this.sdk)return;
    try {
      await this.sdk.init();if(this.retired)return;
      if(this.target==='crazygames'&&!['crazygames','local'].includes(this.sdk.environment))return;
      this.ready=true;
      if(this.target==='crazygames'){
        const update=settings=>{this.platformMuted=!!settings?.muteAudio;this.onMute?.(this.muted)};
        update(this.sdk.game.settings);this.call(this.sdk.game,'addSettingsChangeListener',update);
        // Deliberately do not mix cloud and local saves. SaveStore reports SDK failures.
        this.storage={getItem:key=>this.sdk.data.getItem(key),setItem:(key,value)=>this.sdk.data.setItem(key,value)};
        this.call(this.sdk.game,'loadingStart');
      }
    }catch{this.ready=false}
  }
  loaded(){if(!this.ready)return;if(this.target==='crazygames')this.call(this.sdk.game,'loadingStop');else this.call(this.sdk,'gameLoadingFinished')}
  sync(playing){
    playing=!!playing&&!this.busy;if(playing===this.playing)return;this.playing=playing;
    if(this.ready)this.call(this.target==='crazygames'?this.sdk.game:this.sdk,playing?'gameplayStart':'gameplayStop');
  }
  completed(seconds){if(this.target!=='generic'&&this.ready)this.breakDue=true;this.sync(false)}
  async breakBeforePlay(){
    if(this.busy||!this.ready||!this.breakDue)return false;
    this.breakDue=false;this.sync(false);this.busy=true;this.onMute?.(true);
    try {
      if(this.target==='crazygames')await new Promise(resolve=>{
        let finished=false;
        const finish=()=>{if(finished)return;finished=true;resolve()};
        // The SDK reports unfilled/blocked ads through adError. Wait for its callback;
        // a wall-clock timeout could accidentally restart combat underneath an ad.
        try{this.sdk.ad.requestAd('midgame',{adStarted:()=>this.onMute?.(true),adFinished:finish,adError:finish})}catch{finish()}
      });
      else if(this.target==='poki')await this.sdk.commercialBreak(()=>this.onMute?.(true));
    }catch{}finally{this.busy=false;this.onMute?.(this.muted)}
    return true;
  }
}
