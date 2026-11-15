import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'dist/crazygames-new-horizons');
await stat(path.join(root, 'index.html'));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\\/+/, '');
    const file = path.resolve(root, relative);
    if (file !== root && !file.startsWith(root + path.sep)) throw new Error('Invalid path');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const baseUrl = 'http://127.0.0.1:' + address.port + '/';
const playwrightModule = process.env.PLAYWRIGHT_MODULE;
assert.ok(playwrightModule, 'PLAYWRIGHT_MODULE must point to the installed Playwright module');
const { chromium } = await import(playwrightModule);
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const pageErrors = [];

async function openDevice({ name, width, height, mobile = false }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => pageErrors.push(name + ': ' + error.message));
  await page.route('https://sdk.crazygames.com/**', route => route.abort());
  await page.addInitScript(() => {
    window.__cgEvents = [];
    const game = {};
    for (const event of ['loadingStop', 'gameplayStart', 'gameplayStop']) {
      game[event] = () => window.__cgEvents.push(event);
    }
    window.CrazyGames = {
      SDK: {
        environment: 'local',
        init: async () => { window.__cgEvents.push('init'); },
        game
      }
    };
  });
  const response = await page.goto(baseUrl + '?qa=1', { waitUntil: 'domcontentloaded' });
  assert.ok(response?.ok(), name + ': local deploy output returned HTTP ' + (response?.status() ?? 'no response'));
  await page.waitForFunction(
    () => Boolean(window.__NEON_RIFT_QA__) && window.__cgEvents?.includes('loadingStop'),
    null,
    { timeout: 10000 }
  );
  const state = await page.evaluate(() => window.__NEON_RIFT_QA__());
  assert.ok(state.canvas.width > 0 && state.canvas.height > 0, name + ': canvas has a drawable size');
  assert.ok(state.stage.width > 0 && state.stage.height > 0, name + ': game stage has a visible size');
  return { context, page };
}

try {
  const desktop = await openDevice({ name: 'desktop', width: 1280, height: 800 });
  const desktopPage = desktop.page;
  assert.equal(await desktopPage.title(), 'NEON RIFT: New Horizons');
  await desktopPage.locator('#start').click();
  await desktopPage.waitForFunction(() => window.__NEON_RIFT_QA__().phase === 'playing');
  assert.ok((await desktopPage.evaluate(() => window.__cgEvents)).includes('gameplayStart'), 'desktop: SDK gameplayStart fired');
  const desktopBefore = await desktopPage.evaluate(() => window.__NEON_RIFT_QA__().player.x);
  await desktopPage.keyboard.down('ArrowRight');
  await desktopPage.waitForTimeout(450);
  await desktopPage.keyboard.up('ArrowRight');
  const desktopAfter = await desktopPage.evaluate(() => window.__NEON_RIFT_QA__().player.x);
  assert.ok(desktopAfter > desktopBefore + 0.025, 'desktop: arrow-key movement changes ship position');
  await desktopPage.keyboard.press('Escape');
  await desktopPage.waitForFunction(() => window.__NEON_RIFT_QA__().phase === 'paused');
  assert.ok((await desktopPage.evaluate(() => window.__cgEvents)).includes('gameplayStop'), 'desktop: pause sends gameplayStop');
  await desktopPage.locator('#resume').click();
  await desktopPage.waitForFunction(() => window.__NEON_RIFT_QA__().phase === 'playing');
  await desktop.context.close();

  const portrait = await openDevice({ name: 'mobile portrait', width: 390, height: 844, mobile: true });
  const portraitPage = portrait.page;
  const portraitStage = await portraitPage.locator('#stage').boundingBox();
  assert.ok(portraitStage.width > 300 && portraitStage.height >= 260, 'portrait: stage fits a phone viewport');
  assert.ok(portraitStage.x >= 0 && portraitStage.x + portraitStage.width <= 391, 'portrait: no horizontal overflow');
  const startBox = await portraitPage.locator('#start').boundingBox();
  assert.ok(startBox && startBox.y >= portraitStage.y && startBox.y + startBox.height <= portraitStage.y + portraitStage.height, 'portrait: start button remains inside game stage');
  await portraitPage.locator('#start').click();
  await portraitPage.waitForFunction(() => window.__NEON_RIFT_QA__().phase === 'playing');
  const before = await portraitPage.evaluate(() => window.__NEON_RIFT_QA__().player);
  const cdp = await portrait.context.newCDPSession(portraitPage);
  const startX = portraitStage.x + portraitStage.width * before.x;
  const startY = portraitStage.y + portraitStage.height * before.y;
  const targetX = portraitStage.x + portraitStage.width * 0.76;
  const targetY = portraitStage.y + portraitStage.height * 0.56;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y: startY, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: targetX, y: targetY, id: 1 }] });
  await portraitPage.waitForTimeout(450);
  const after = await portraitPage.evaluate(() => window.__NEON_RIFT_QA__());
  assert.ok(after.pointerActive, 'portrait: touch drag is being tracked');
  assert.ok(after.player.x > before.x + 0.04, 'portrait: dragging right moves the ship right');
  assert.ok(after.player.y < before.y - 0.04, 'portrait: dragging up moves the ship up');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await portraitPage.waitForFunction(() => !window.__NEON_RIFT_QA__().pointerActive);
  await portrait.context.close();

  const landscape = await openDevice({ name: 'mobile landscape', width: 844, height: 390, mobile: true });
  const landscapePage = landscape.page;
  const landscapeStage = await landscapePage.locator('#stage').boundingBox();
  assert.ok(landscapeStage.width > 700 && landscapeStage.height > 200, 'landscape: stage uses available screen space');
  assert.ok(landscapeStage.x >= 0 && landscapeStage.x + landscapeStage.width <= 845, 'landscape: no horizontal overflow');
  const landscapeStart = await landscapePage.locator('#start').boundingBox();
  assert.ok(landscapeStart && landscapeStart.y >= landscapeStage.y && landscapeStart.y + landscapeStart.height <= landscapeStage.y + landscapeStage.height, 'landscape: start button remains inside game stage');
  await landscape.context.close();

  assert.deepEqual(pageErrors, [], 'no uncaught browser JavaScript errors');
  process.stdout.write('Browser QA passed on the exact Vercel static output: desktop keyboard, SDK lifecycle, mobile portrait touch drag, mobile landscape layout; no uncaught page errors.\\n');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
