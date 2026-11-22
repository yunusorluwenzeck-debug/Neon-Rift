# NEON RIFT: Starlight Rescue

A separate, non-violent space exploration edition for family-friendly game portals.

- Explore 12 star sectors and restore three ancient beacons in each.
- Collect starlight, steer around drifting asteroids and open the rift gate.
- Earn peaceful ship upgrades: Ion Glide, Soft Shield and Starlight Magnet.
- Keyboard: WASD / arrow keys to steer, Space to boost, P or Escape to pause.
- Touch: drag the playfield to steer; tap Boost to accelerate. CrazyGames device-specific help uses SDK System Info (mobile/tablet), not generic touch detection.
- No weapons, shooting, combat, enemies, boss fights, gore, or hostile targeting.

Build portal packages with `node nonviolent/build.mjs`. Output is written to
`nonviolent-builds/`, with a separate ZIP for CrazyGames and Poki.


## Platform notes

- CrazyGames build uses SDK v3 gameplay/loading events and the CrazyGames Data Module when the SDK is available. During submission, enable the matching Progress Save / Data Module option so cloud progress can sync; the game uses that store rather than a separate local save on CrazyGames.
- Poki build uses the HTML5 SDK v2, calls `gameLoadingFinished`, sends gameplay start/stop events, and requests commercial breaks at natural continue points.
- The build script creates two independent ZIPs with `index.html` at the archive root. The workflow uploads both ZIPs as a downloadable build artifact.
- The automated checks do not replace a visual playthrough. Run the CrazyGames Preview and Poki Inspector on desktop and mobile, check portrait and landscape, and verify save/load and commercial-break event logs before submission.

- Poki `commercialBreak()` is requested only when returning from pause; gameplay events are de-duplicated. Local storage access is guarded, with an in-memory fallback and a visible notice when persistent storage is unavailable.
