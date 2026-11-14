# NEON RIFT: New Horizons (Poki edition)

This is a separate, self-contained, non-violent browser game. It does not import the original combat simulation or its weapons, enemies, boss encounters, or combat upgrades.

## Gameplay
- Explore a neon nebula and collect 20 energy orbs.
- Avoid drifting space rocks.
- Keep the explorer's shield charged and reach the gateway.
- Keyboard: WASD or arrow keys.
- Touch: drag the explorer around the play area.
- Local best score is saved when browser storage is available.

## Run locally
Serve this folder over HTTP (the Poki SDK is optional for local play):

    python -m http.server 8000

Open http://localhost:8000/poki-new-horizons/.

## Poki integration
The page initializes Poki SDK when available, calls `gameLoadingFinished`, tracks `gameplayStart` / `gameplayStop`, and requests a `commercialBreak` between completed voyages. If the SDK is blocked or unavailable, the game remains playable without ads.

## Release checklist (not yet completed)
- [ ] Run the project build and automated checks.
- [ ] Test in a desktop browser and at least one real iOS and Android device.
- [ ] Test portrait and landscape, keyboard, pointer and touch.
- [ ] Test Poki Inspector and verify real SDK lifecycle and ad callbacks.
- [ ] Capture three genuine gameplay screenshots.
- [ ] Prepare store title, description, controls, category, developer details and required platform history.
- [ ] Have the account owner/guardian review and submit any platform agreements and declarations.
- [ ] Submit the final hosted playable URL for Poki review.

No submission or publication is claimed by this repository change.
