# NEON RIFT: New Horizons — CrazyGames edition

A standalone, non-combat space exploration game. Collect 20 energy orbs, avoid drifting space rocks, protect the explorer's shield, and reach the gateway.

## Controls
- Desktop: WASD or arrow keys.
- Touch: drag the explorer ship inside the play area.
- Escape or Pause: pause; Continue resumes.

## CrazyGames SDK
This edition loads CrazyGames HTML5 SDK v3 from the official SDK CDN and awaits window.CrazyGames.SDK.init(). The adapter sends gameplayStart and gameplayStop through the SDK Game module, and loadingStop after initialization. SDK access is guarded so local/off-platform preview remains playable. No external advertising is included.

## Build and test
Run node --check crazygames-new-horizons/game.js, node --check crazygames-new-horizons/platform.mjs, node --test tests/new-horizons-crazygames.test.mjs, then node scripts/build-new-horizons-crazygames.mjs.

This ZIP is a submission package, not a published game. Test the hosted build in CrazyGames Preview / Quality Assurance Tool before requesting review.