# Verification · 19 October 2026

## Workshop and reward update · 19 October

- All 95 focused logic/SDK tests passed: 24 core, 20 campaign/save/rarity,
  17 pacing/combo, 11 expansion, 8 SDK adapter and 15 workshop tests.
- The new workshop tests cover exact/duplicate/invalid code redemption, wallet
  limits, purchases before a first victory, export/import persistence, old-save
  migration, reward thresholds/caps, loss rewards and all six skills in actual
  simulation paths. Healing stops while paused or choosing an upgrade and its
  damage-free countdown survives reload.
- Native controller integration also exercised the code form, invalid-code
  feedback, storage-quota failure followed by retry, reload and duplicate
  redemption. The three exported English controllers each redeemed the code,
  verified persistence and rejected a second claim.
- Existing native and portal controller checks passed for start, movement/dash,
  boss wins, defeat, pause, progression, save/resume and viewport changes.
- Package syntax, translations, relative resources, local fonts/licenses and
  all three ZIPs passed. The native offline file and portal kits were rebuilt.
- These checks use DOM/Canvas/SDK doubles. No visual browser playthrough or
  real ads/cloud services were tested; the supported browser tool was unavailable.

## Visibility correction · 18 October

- Removed a malformed font-import fragment that was joined to the `:root`
  selector, preventing the shared text, neon and font tokens from being read.
  The offline builder now preserves the bundled-font stylesheet verbatim.
- Brightened the arena, menus, cards, disabled labels, ship hulls and projectiles.
  Increased health/XP/boss meter thickness. Gameplay rules and saves are unchanged.
- Parsed all 479 CSS selectors and declarations, and verified a separate valid
  `:root` in the native, offline and all three portal outputs (tinycss2/cssselect2).
- Calculated selected solid-color text/background contrast pairs: main text
  15.04:1; upgrade description 7.50:1; locked level 5.69:1; unavailable skill
  5.91:1; skill prerequisite 6.61:1; HUD label 9.65:1. These are sampled color
  checks, not a complete rendered accessibility audit.
- Reran native controller integration and all three exported controller runs
  listed below, plus package validation and JavaScript syntax checks. All passed.
  These use DOM/Canvas/SDK doubles; the supported browser tool was unavailable,
  so the updated appearance has not been visually checked in a real browser.
- Rebuilt `PLAY-OFFLINE.html` and all three games in the downloadable publishing kit.

## Completed

- 24 core simulation tests: fixed-step movement, dash, collision, immunity,
  warnings, all enemy types, boss phases, upgrade caps, resets and terminal guards.
- 20 campaign/save/rarity tests: all 12 unlocks, rewards, purchases/refunds,
  actual upgrade effects, exact choices on restore, import validation and recovery.
- 17 pacing/combo tests: scoring, timer pause, short boss recovery, forward
  encounter scheduling, energy sweep and compatible older snapshots.
- 11 expansion tests: new sector formations, 24-node prerequisites/refunds,
  original-save migration and actual behavior of all nine new skills.
- 8 SDK adapter tests with doubles: initialization failure, event ordering,
  platform mute, Data Module access, ad completion/error, duplicate guards and
  correct per-platform APIs.
- Native controller integration with DOM/Canvas doubles: controls, full-screen
  API request/exit, pause/focus, settings, saved-run resume, skill purchases,
  all three bosses, victory, immediate next-sector flow, defeat/restart,
  save export/import and 390×844 / 844×390 resize handling.
- Three English exported controller runs with DOM/Canvas/SDK doubles: all
  menus, 12 sectors, 24 skills, keyboard movement/dash/pause, three boss wins,
  first-clear save, next sector, ad gate and defeat. Resizes to 640×360 and
  390×844 were exercised as controller calls, not visually inspected layouts.
- Package checks: JavaScript syntax, English-text scan, relative dependencies,
  local fonts/licenses, ZIP integrity, root index.html and 11 runtime files per
  package. Each uncompressed game is under 1 MB. No private hosting metadata.
- Three promotional PNG covers rendered and visually inspected at 1920×1080,
  800×1200 and 800×800. These are artwork, not gameplay captures.

## Simulation timing

A historical run on 18 October of tests/benchmark.mjs completed 39,200 simulation updates in 885 ms CPU,
ending in victory after 326.67 simulated seconds, with a peak of 9 enemies.
This scenario uses an invulnerable prebuilt ship to reach encounters. It measures
simulation throughput only. It is not browser FPS, mobile performance or a
balanced human playthrough measurement. Runtime and random seed affect results.

## Still needs real-world testing

The supported browser-control capability was unavailable in this environment.
There was no visual browser playthrough. Real input feel, responsive rendering,
sound mix, Chrome/Edge/Safari/mobile compatibility and rendered FPS remain
unverified. No live SDK ads, cloud saves, identity changes, portal submission
or external QA were exercised. Portal Preview/Inspector and real device testing
are required before commercial release. Required gameplay videos are not included.
