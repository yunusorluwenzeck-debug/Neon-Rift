# NEON RIFT · New Horizons

A complete Canvas 2D space survival game. Twelve sequential sectors, twenty-four
permanent skills, three bosses per sector and ten temporary upgrades in four
rarities. Move with WASD/arrows, dash with Space, pause with P/Escape. Touch uses
a relative joystick and a separate dash button. Weapons fire automatically.

## Play or download

- Private hosted game: https://neon-rift-flight.fairyridge9.chatgpt.site
- Open `PLAY-OFFLINE.html` directly to play the Swedish self-contained version.
- `dist/downloads/NEON-RIFT-publishing-kit.zip`: three English portal builds,
  promotional covers and Swedish upload instructions. Extract it and read
  `START-HERE.txt`. Upload only the inner ZIP matching your chosen platform.

Portal integration is prepared for submission and QA. No portal account,
application, commercial agreement or payout setup has been created. Acceptance
and revenue are not guaranteed. The existing hosted game stays private.

## Workshop update

- Open Skill tree, enter `Yunus10000`, then Redeem / Lös in: +10,000 rift cores.
  One redemption per save. The wallet and redemption history are saved together;
  failed writes leave the code retryable. Export/import retains its used status.
- Six more permanent skills: Broadside Batteries, Drone Turbines, Nanoweave,
  Field Dampers, Energy Tractor and Shock Amplifier. All affect real simulation.
- Kills and bosses now earn cores even after a defeat. Purchases no longer require
  a first victory. First-clear and replay bonuses are more generous.
- Old saves load with the six new skills at zero and no previously redeemed codes.
  Stored flights preserve their original equipment and healing countdown.

## What changed in New Horizons

- Six additional sectors with sniper crossfire, charging groups, splitting
  swarms, minefield sieges and rotating formations. Each has its own palette.
- Nine additional permanent skills, including more frequent lightning, boss
  damage, dash protection, collection on dash and one emergency rescue per run.
- Clear prerequisite states, signature skill styling and a live loadout summary.
- Old version-one saves migrate new skills to zero. Existing progress and
  active flights remain supported; a spent rescue remains spent after reload.
- English portal exports generated from the Swedish source. Local OFL fonts.
- CrazyGames v3 lifecycle, Data Module and platform mute; Poki lifecycle and
  commercial breaks. Ads are requested only when returning from a finished run.
  The private and offline versions load no portal SDK and contain no ads.

## Source

- `dist/core.mjs`: fixed-step simulation, enemies, bosses and collision
- `dist/progression.mjs`: campaign, skill tree, rewards and validated saving
- `dist/game.js`: Canvas rendering, audio, controls and interface
- `dist/index.html` / `dist/style.css`: menus, HUD and responsive layout
- `dist/fonts/`: bundled fonts and original SIL Open Font License files
- `portal/bridge.mjs` / `portal/boot.mjs`: isolated SDK adapters
- `portal/english.json`: English export translations
- `portal/README-SV.md`: portal upload instructions and current official sources
- `portal/STORE-TEXT-EN.txt`: store copy and controls
- `portal/covers/`: promotional vector art and PNG exports, not screenshots
- `scripts/`: offline, portal and publishing-kit builders
- `tests/`: logic, controller, SDK-adapter and package checks

Artwork is drawn in Canvas from the project's own vector shapes. Sound effects
are synthesized with Web Audio. There is no music, backend, chat or purchase UI.

## Run locally

Use Python 3 to serve the editable module version:

    python -m http.server 8000 --bind 127.0.0.1 --directory dist

Open http://localhost:8000. On Windows `py` can replace `python`.
Keep the terminal open; Ctrl+C stops it. The module version needs HTTP.
`PLAY-OFFLINE.html` instead embeds all code, CSS and fonts for direct opening.

## Save data

Sectors unlock only after beating the previous sector's three bosses. First
clears add an 11–22 core victory bonus; replay victories add 8. Every run also
earns 1 core per 20 kills (up to 12) and 3 per defeated boss, even on defeat.
Skill refunds return all spent cores. Skill purchases apply to new runs; active saved runs keep their loadout.

Progress, settings, records and active flight checkpoints save automatically.
Export/import JSON in the hangar to move saves between sites or devices.
Normal/offline/Poki builds use local storage. The active CrazyGames SDK uses
its Data Module; select that option when submitting. Real cloud synchronization
still needs validation in CrazyGames Preview. Old saves remain compatible.

## Build

Node.js and Python 3 are needed for distribution:

    node scripts/build-offline.mjs
    node scripts/build-portals.mjs
    python scripts/package-publishing-kit.py

The portal builder writes `portal-builds/`, an ignored build directory, and
creates generic, CrazyGames and Poki ZIPs with index.html at the root. Each
includes local fonts and the original licences. The kit builder adds guides
and pre-rendered covers. No Sites configuration or credentials enter those ZIPs.

To regenerate cover PNGs from their vector source:

    python -m pip install cairosvg fonttools
    python scripts/build-covers.py

## Verification

Tested with Node.js 24:

    node tests/core.test.mjs
    node tests/progression.test.mjs
    node tests/flow.test.mjs
    node tests/horizons.test.mjs
    node tests/workshop.test.mjs
    node tests/portal.test.mjs
    node tests/runtime.test.mjs
    node tests/portal-runtime.test.mjs generic
    node tests/portal-runtime.test.mjs crazygames
    node tests/portal-runtime.test.mjs poki
    node tests/package.test.mjs
    node tests/benchmark.mjs

95 focused logic/SDK tests passed, plus the native controller, three exported
controllers and package checks. DOM, Canvas and SDK tests use doubles, not a real
browser. See `TEST-REPORT.md` for coverage and limitations. Real browser/device
playtesting, sound mix, rendered FPS, real ads and portal QA remain unverified.

## Hosting and commercial release

Upload the contents of `dist/` to a static host, or choose a portal build from
the publishing kit. Other hosts do not inherit the private Site's access control.
Read `portal/README-SV.md` before submitting. CrazyGames Basic Launch has no
monetization. Full Launch requires platform selection and QA. Poki agreements
can include web exclusivity, so review the actual offer before a multi-portal
release. Required gameplay preview videos are not included.
