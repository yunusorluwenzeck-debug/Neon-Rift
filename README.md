# NEON RIFT — complete project

## Play immediately
1. Extract this ZIP (right-click > Extract All on Windows).
2. Open PLAY-OFFLINE.html in Chrome, Edge, Firefox or Safari.

The offline version contains the game, styling and generated sound effects in
one file. It uses system fonts instead of downloading Google Fonts. No server,
account, API key, build step or package installation is needed for this file.
Browser privacy settings can affect saving settings and best scores locally.

## Bosses and upgrades
- Choose rapid fire, chain lightning or an orbit drone before launch.
- Sentinel arrives at 1:15, Hive Mother at 4:00 and Voidkeeper at 8:00.
  Only one boss encounter runs at a time; a long encounter delays the next one.
- The first two bosses each award a free upgrade and restore 30 shield.
- Collect energy for upgrades, or receive a guaranteed choice after 45 seconds
  without an upgrade. Combat pauses while choosing.
- Ten upgrade types support rapid fire, lightning, drones and dash builds.
- The HUD shows the next boss countdown, energy and time to the next upgrade.

## Editable source
- dist/index.html: page, menus and HUD
- dist/style.css: appearance and responsive layout
- dist/game.js: rendering, audio, keyboard/touch controls and interface
- dist/core.mjs: game simulation, enemies, boss, collision and upgrades
- tests/core.test.mjs: 24 simulation tests
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
WASD / arrow keys: move. Space: dash. P / Escape: pause.
On touchscreens, drag like a joystick and tap the lightning button to dash.
Weapons fire automatically. Select upgrades with a click/tap or 1, 2, 3.

## Tests
With a modern Node.js installation (tested here with Node 24), run:

    node tests/core.test.mjs
    node tests/runtime.test.mjs
    node tests/benchmark.mjs

Verification performed during development: 24 simulation tests, a mocked
DOM/canvas integration test, syntax checks and a simulated run through all three bosses.
Visual browser playtesting, real mobile usability, sound mixing and actual
rendered FPS were not verified. The benchmark disables player damage and uses
a prebuilt ship; it is not evidence of gameplay balance.

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
