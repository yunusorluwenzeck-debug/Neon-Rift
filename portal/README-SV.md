# NEON RIFT: publicera på spelportaler

Det här paketet innehåller tre engelska HTML5-versioner med samma spelmekanik:
12 banor, 18 permanenta färdigheter, 3 bossar per bana, 10 flyguppgraderingar i
fyra rariteter, tangentbord, touch, paus och sparning.

## Välj rätt ZIP

| Fil | Användning | Sparning och annonser |
| --- | --- | --- |
| NEON-RIFT-crazygames.zip | CrazyGames Developer Portal | SDK v3, Data Module, spelhändelser, plattformens ljudavstängning och midgame-annonser mellan avslutade flygningar. |
| NEON-RIFT-poki.zip | Poki for Developers | Poki SDK, spelhändelser, commercialBreak mellan avslutade flygningar. Lokal sparning. |
| NEON-RIFT-generic.zip | itch.io eller vanlig webbhosting | Lokal sparning, fullskärm och inga annonskopplingar. |

Varje ZIP har `index.html` direkt i roten. Ladda upp just portalens ZIP, inte hela
GitHub-projektet eller det yttre samlingspaketet. Startfilen är `index.html`.
Alla typsnitt och spelresurser ingår. Portalversionerna behöver ingen ChatGPT-inloggning.
Endast den valda portalens SDK hämtas externt. SDK-fel stoppar inte spelets uppstart.

## CrazyGames

1. Öppna https://developer.crazygames.com/ och välj att lägga till ett HTML5-spel.
2. Ladda upp `NEON-RIFT-crazygames.zip`. Ange NEON RIFT som namn och engelska som språk.
3. Välj **Yes, using the Data Module from the CrazyGames SDK** under Progress Save.
   Paketet använder den sparningen när SDK:n är aktiv. Kontosynk måste kontrolleras
   i portalens Preview. Din privata spellänks sparning förs inte automatiskt över;
   använd Exportera/Importera sparfil för att flytta framstegen.
4. Ladda upp omslagen i `covers/`: landscape 1920×1080, portrait 800×1200,
   square 800×800. De är marknadsföringsbilder byggda av spelets vektorformer,
   inte skärmbilder eller bevis på provspelning.
5. Spela in riktig gameplay i liggande och stående format. CrazyGames kräver
   förhandsvideor på högst 15–20 sekunder, max 50 MB, utan ljud, i de format
   som deras aktuella formulär anger. Videor ingår inte i detta paket.
6. Kör Preview/QA och kontrollera spel, ljud, annonser, spara/ladda och kontobyte.
   Skicka sedan till deras granskning.

CrazyGames bestämmer om spelet godkänns. Basic Launch har monetisering avstängd.
Intäktsdelning börjar vid godkänd Full Launch med full integration och QA.
Ett uppladdat ZIP eller en SDK-integration innebär alltså inte att pengar börjar
komma in direkt. Inga annonser finns på din privata Sites-version.

## Poki

1. Öppna https://developers.poki.com/ och gå till Poki for Developers.
2. Lägg till spelet och ladda upp `NEON-RIFT-poki.zip`.
3. Använd beskrivningen i `STORE-TEXT-EN.txt` som underlag.
4. Testa med Poki Inspector och deras playtest-flöde. Kontrollera särskilt touch,
   640×360, 836×470, surfplatta, omstart, ljud och att annonser släpper tillbaka spelet.
5. Komplettera de statiska och animerade miniatyrbilder som de efterfrågar.

Poki är en granskad plattform. Publicering och ersättning kräver att de väljer
spelet och erbjuder ett avtal. Deras web exclusive-alternativ innebär exklusivitet
på webben; ett non-exclusive-avtal kan i stället vara en engångslicens utan
intäktsdelning. Läs det konkreta erbjudandet innan du publicerar på flera portaler.
Låt gärna en vårdnadshavare gå igenom avtal och utbetalningsuppgifter med dig.

## itch.io och andra webbplatser

På https://itch.io/game/new väljer du HTML Game, laddar upp
`NEON-RIFT-generic.zip` och markerar att filen ska spelas i webbläsaren.
Prova först som draft. Välj exempelvis 960×640 med fullskärmsknapp. Markera
Mobile Friendly först efter att du har provat på en riktig mobil.
itch.io beskriver betalningar för inbäddade HTML5-spel som donationer; detta
paket lägger inte in något eget betalsystem. Andra portaler kan behöva en egen SDK.

## Vad som är verifierat och vad som återstår

Automatiska tester körs mot spellogik, sparfiler och kontroller med DOM/canvas-
testdubblar. SDK-tester använder också testdubblar. De kontrollerar init-fel,
start/stopp, muting, fel vid annonsbegäran och fortsatt spel efter annons.

Den här miljön saknar den stödda webbläsaren för visuell provspelning. Därför är
riktig browser-/mobilspelning, ljudmix, renderad FPS, annonser från portalernas
servrar, verklig kontosynk och portalernas QA fortfarande overifierade.
Omslagsbilderna är renderade och granskade som separata bilder.
Ingen ansökan, publicering hos spelportal eller utbetalningsregistrering har gjorts.
Din befintliga privata spellänk har inte gjorts offentlig.

## Bygg om från källkoden

Kräver Node.js och Python 3. Från projektmappen:

    node scripts/build-offline.mjs
    node scripts/build-portals.mjs

Engelsk text finns i `portal/english.json`. Portalversionerna genereras från den
svenska originalkoden, så stridslogiken behöver bara underhållas på ett ställe.
`portal/bridge.mjs` hanterar SDK-anrop. `portal/boot.mjs` laddar rätt SDK.

Testa en uppackad portalversion med en lokal HTTP-server. För exempelvis Poki:

    python -m http.server 8000 --bind 127.0.0.1 --directory portal-builds/poki

Öppna sedan http://localhost:8000. För riktiga portaltester ska deras Preview eller
Inspector användas. Webbläsarversionerna använder JavaScript-moduler, så dubbelklicka
inte deras index.html. Den svenska `PLAY-OFFLINE.html` kan däremot öppnas direkt.

## Källor och rättigheter

Portalregler kontrollerade 18 oktober 2026. Formulär och avtal kan ändras.

- CrazyGames lansering: https://docs.crazygames.com/
- Tekniska krav: https://docs.crazygames.com/requirements/technical/
- Språk, kontroller och fullskärm: https://docs.crazygames.com/requirements/gameplay/
- Data Module: https://docs.crazygames.com/sdk/data/
- Annonser: https://docs.crazygames.com/sdk/video-ads/
- Omslag och videor: https://docs.crazygames.com/requirements/game-covers/
- Poki uppladdning: https://developers.poki.com/guide/adding-your-game
- Poki SDK: https://developers.poki.com/guide/sdk-html5
- Poki krav: https://developers.poki.com/guide/requirements-quality
- Poki avtal: https://developers.poki.com/guide/revenue-deal-types
- itch.io HTML5: https://itch.io/docs/creators/html5

Spelgrafiken är projektets egna Canvas-/vektorformer. Ljud skapas med Web Audio.
Barlow Condensed och Space Grotesk distribueras med sina OFL-licenser i fonts/.
Inga tredjepartsbilder, musikfiler eller privata nycklar ingår. Kontrollera även
portalens namn- och avtalsgranskning; ingen varumärkesprövning har gjorts här.
