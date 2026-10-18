# NEON RIFT — complete project

## Play immediately
1. Extract this ZIP (right-click > Extract All on Windows).
2. Open PLAY-OFFLINE.html in Chrome, Edge, Firefox or Safari.

The offline version contains the game, styling and generated sound effects in
one file. It uses system fonts instead of downloading Google Fonts. No server,
account, API key, build step or package installation is needed for this file.
Browser privacy settings can affect local saving. Use the save-file export in
the hangar as a backup, especially when playing directly from a downloaded file.

## Bosses and upgrades
- Choose rapid fire, chain lightning or an orbit drone before launch.
- Sentinel arrives at 1:15. After a victory, the next boss countdown is capped
  at 85 seconds for Hive Mother and 105 seconds for Voidkeeper. If the original
  4:00 / 8:00 schedule comes sooner, that earlier time is kept. Only one boss
  encounter runs at a time, with a safe three-second recovery after a victory.
- The first two bosses each award a free upgrade and restore 30 shield.
- Collect energy for upgrades, or receive a guaranteed choice after 45 seconds
  without an upgrade. Combat pauses while choosing.
- Ten upgrade types support rapid fire, lightning, drones and dash builds.
- The HUD shows the next boss countdown, energy and time to the next upgrade.

## Afterglow presentation and game flow
- Reworked faceted player ship, engine trails, clearer projectiles, restrained
  debris, six sector palettes, distant planets and layered star parallax.
  Large background gradients are cached until a resize or scene/sector change.
- A redesigned launch screen, selectable sector route, cockpit HUD, rarity
  cards, planet cards, connected skill branches and post-flight debrief.
- The victory screen starts the next unlocked sector with one click, while
  keeping the skill tree available. The hangar also has a direct launch button.
- Boss recovery is 3 seconds instead of 12. Regular wave breaks are 5 seconds
  instead of 10. A wave break cannot extend the boss recovery. Energy remaining
  after a defeated miniboss is collected before the reward choice.
- Eliminate an enemy within 5 seconds of the previous one to extend a combo.
  Every 4 eliminations adds 25% to kill points, up to 3×. Taking actual damage
  breaks the combo; invulnerability still protects it. Pause and upgrade
  choices freeze its timer. The HUD shows the multiplier and time remaining.
- Best combos are saved per sector and shown in the debrief and sector records.
  Combos affect points, not damage, drop odds or permanent currency rewards.
- Softer, rate-limited effects include separate victory and defeat tones.
  Reduced motion disables menu transitions and decorative ship ghosts;
  particle and camera-shake settings continue to work.

## Campaign, skill tree and rarity
- Six sectors unlock in sequence. Defeat all three bosses in a sector to open
  the next. Completed sectors remain replayable.
- Later sectors have tougher, faster enemies, shorter gaps between attacks,
  earlier enemy combinations and advanced boss phases. Telegraph durations
  stay unchanged so attacks can still be read and avoided.
- First clears award 5–10 rift cores; replay wins award 2. Defeats award none.
- The post-victory screen links to a permanent skill tree: weapons, defense and
  mobility, with three skills per branch. Nodes have parent requirements,
  explicit effects, level caps and increasing costs. Refund all spent cores
  for free to try another build. Changes apply when starting a new flight;
  a resumed flight keeps the loadout it started with.
- In-run cards roll Common (62%), Rare (25%), Epic (10%) or Legendary (3%).
  Quality increases actual bonuses, not only card color. Every card shows
  its exact effect. Starter cards are Common. Boss rewards include at least
  one Epic card; the other two are at least Rare. Legendary is still possible.
- Fullscreen: use the header button or F. It depends on browser support and
  permission; some embedded browsers and mobile devices may not allow it.

## Saving and transferring progress
The campaign, permanent skills, currency, records, settings, upgrade history
and active flight are stored locally in this browser. Active flights checkpoint
every 3 seconds and on upgrade choices, pause, focus loss and leaving the page.
Continue restores a paused flight with a brief shield; a pending upgrade keeps
exactly the cards and rarities previously offered. Wins are settled once.

Open Bankarta or Skill tree for Exportera sparfil / Importera sparfil. Export
creates a JSON backup; import validates it before replacing current progress.
Move this file to another device or between the hosted and offline editions.
There is no automatic cloud sync. Clearing browser/site data can remove local
saves. A previous valid checkpoint is kept as a fallback. Storage failures are
shown in the interface; export the current progress before closing if saving
is blocked. Old best-score and sound settings are migrated automatically.

## Editable source
- dist/index.html: page, menus and HUD
- dist/style.css: appearance and responsive layout
- dist/game.js: rendering, audio, keyboard/touch controls and interface
- dist/core.mjs: game simulation, enemies, bosses, rarity effects and run snapshots
- dist/progression.mjs: campaign, skills, settlement, validation and persistence
- tests/core.test.mjs: 24 simulation tests
- tests/progression.test.mjs: 20 campaign, skill, rarity and persistence tests
- tests/flow.test.mjs: 17 tempo, combo and backwards-compatibility tests
- tests/runtime.test.mjs: mocked DOM/canvas integration smoke test
- tests/benchmark.mjs: simulation stress scenario, not a browser FPS test
- hosting/hosting.json: original Sites configuration for reference
- SOURCE-VERSION.txt: source commit for this export

All game artwork is drawn with Canvas and sound is synthesized with Web Audio.
There are no separate image or sound assets to download. The original stylesheet
uses optional Google Fonts; system-font fallbacks are included.

## Run the editable version locally
Install Python 3 if needed. Open a terminal in this extracted folder and run:

    python -m http.server 8000 --bind 127.0.0.1 --directory dist

On Windows, use `py` instead of `python` if needed. Then open:
http://localhost:8000

Keep the terminal open while playing. Press Ctrl+C to stop.
Do not directly double-click dist/index.html: its JavaScript modules need HTTP.
Use PLAY-OFFLINE.html instead for direct opening.

## Controls
WASD / arrow keys: move. Space: dash. P / Escape: pause. F: fullscreen.
On touchscreens, drag like a joystick and tap the lightning button to dash.
Weapons fire automatically. Select upgrades with a click/tap or 1, 2, 3.

## Tests
With a modern Node.js installation (tested here with Node 24), run:

    node tests/core.test.mjs
    node tests/progression.test.mjs
    node tests/flow.test.mjs
    node tests/runtime.test.mjs
    node tests/benchmark.mjs

Verification for this update: all 61 logic tests passed. Controller integration
with DOM/canvas doubles covers keyboard and touch movement, dash, pause/blur,
settings, all three bosses, victory/loss/restart, locked sectors, skill purchases,
rarity rewards, autosave, reload/continue, import/export, fullscreen request/exit
calls, direct next-sector and hangar launch, cached backgrounds, resize at
390×844 and 844×390, and offline-bundle syntax. JavaScript syntax and HTML
controller references were checked. Older version-one save data is covered by
compatibility tests, including records without combo data.

A simulation stress scenario completed a win with a prebuilt ship and damage
disabled. It is not evidence of gameplay balance or rendered performance.
Visual browser playtesting, real mobile layout/usability, native fullscreen,
sound mixing and actual rendered FPS remain unverified: the Sites skill requires
the supported control-browser environment, which was unavailable here.
Automated integration is not visual QA.

## Hosting
Upload the contents of dist/ to a static web host. There is no backend.
The included Sites configuration references the existing private project; it
is not needed to play locally or host elsewhere. The downloadable files do not
include the private site's access-control service. Configure access separately
if using another host. No hosting settings were changed by this export.

## Editing
Change the files inside dist/ to modify the game. PLAY-OFFLINE.html is a snapshot.
After editing, rebuild it with `node scripts/build-offline.mjs`.
The script bundles the current code and replaces downloaded fonts with system
font fallbacks. It does not modify the editable source files.
