// 배포본(dist)을 정적 서버로 띄우고, 한국어 화면을 Playwright로 캡처한다.
// 이 브라우저(에이전트 측)는 화면 캡처가 막혀 있어 CI 러너에서 실행한다.
//   npm install && npx vite build --base=/battledrones-ko/
//   npm i --no-save playwright && npx playwright install --with-deps chromium
//   node tools/wrapup/screenshots.mjs
// 결과: docs/screenshots/01-*.png ... 09-*.png
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('dist');
const OUT = path.resolve('docs/screenshots');
const PREFIX = '/battledrones-ko/';
const PORT = 8123;
const T = 120000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    let rel = decodeURIComponent(url.pathname);
    if (rel.startsWith(PREFIX)) rel = rel.slice(PREFIX.length);
    else rel = rel.replace(/^\//, '');
    let file = path.join(ROOT, rel);
    if (rel === '' || rel.endsWith('/')) file = path.join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(body);
  } catch (err) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found');
  }
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await mkdir(OUT, { recursive: true });
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch({
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--mute-audio',
  ],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(T);
page.setDefaultNavigationTimeout(T);

let failures = 0;

const shot = async (name) => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.screenshot({ path: path.join(OUT, name), timeout: T, animations: 'disabled', caret: 'hide' });
      console.log('shot ' + name + ' (attempt ' + attempt + ')');
      return true;
    } catch (err) {
      console.log('shot failed ' + name + ' attempt ' + attempt + ' :: ' + (err && err.message ? err.message.split('\n')[0] : err));
      await sleep(2000);
    }
  }
  failures += 1;
  return false;
};

const step = async (label, fn) => {
  try {
    await fn();
  } catch (err) {
    failures += 1;
    console.log('step failed: ' + label + ' :: ' + (err && err.message ? err.message.split('\n')[0] : err));
  }
};

const hit = async (name, opts = {}) => {
  await page.getByRole('button', { name, exact: opts.exact !== false }).first().click({ timeout: T });
};

const title = async () => console.log('title: ' + (await page.title()));

await page.goto('http://127.0.0.1:' + PORT + PREFIX, { waitUntil: 'load', timeout: T });
await sleep(15000);
await title();

await step('menu', () => shot('01-menu.png'));

await step('english', async () => {
  await hit('English');
  await sleep(4000);
  await shot('02-english.png');
  await page.getByRole('button', { name: '한국어', exact: true }).first().click({ timeout: T });
  await sleep(3000);
});

await step('credits', async () => {
  await page.getByRole('button', { name: '크레딧', exact: true }).first().click({ timeout: T });
  await sleep(2500);
  await shot('03-credits.png');
  await page.getByRole('button', { name: '크레딧', exact: true }).first().click({ timeout: T });
  await sleep(1500);
});

await step('ops', async () => {
  await page.getByRole('button', { name: /^🎖 작전$/ }).first().click({ timeout: T });
  await sleep(4000);
  await shot('04-ops.png');
});

await step('map', async () => {
  await page.getByRole('button', { name: /^⚔ 스커미시$/ }).first().click({ timeout: T });
  await sleep(2500);
  await page.getByRole('button', { name: /^군도/ }).first().click({ timeout: T });
  await sleep(2500);
  await hit('보통');
  await sleep(2500);
  await shot('05-map.png');
});

await step('opener', async () => {
  await page.getByRole('button', { name: /^▶ 플레이$/ }).last().click({ timeout: T });
  await sleep(6000);
  await shot('06-opener.png');
});

await step('ingame', async () => {
  const cards = page.locator('button', { hasText: '×3' });
  await cards.first().click({ timeout: T });
  await sleep(45000);
  await shot('07-ingame.png');
});

await step('pause', async () => {
  await page.getByRole('button', { name: '❚❚', exact: true }).first().click({ timeout: T });
  await sleep(3500);
  await shot('08-pause.png');
});

await step('help', async () => {
  await page.getByRole('button', { name: '플레이 방법', exact: true }).first().click({ timeout: T });
  await sleep(4000);
  await shot('09-help.png');
});

await browser.close();
server.close();
console.log('screenshots done, failures=' + failures);
if (failures > 0) process.exitCode = 1;
