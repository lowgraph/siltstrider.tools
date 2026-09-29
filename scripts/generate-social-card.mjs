/**
 * Renders public/og-image.png, the 1200×630 card that Reddit, Discord and other
 * sites show with every link. The sample character's numbers come from the staged
 * game bundle through the site's own maths (scripts/social-card/facts.mjs), so
 * restage the bundle first when the data changes.
 *
 * npm run social-card     Needs Chrome or Edge; set CHROME_PATH to use another.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { SAMPLE, cardFacts, cardValues, fillCard, loadCharacterCatalogs } from './social-card/facts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'og-image.png');
const WIDTH = 1200;
const HEIGHT = 630;

const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
].filter(Boolean);

const dataUri = (file, type) => `data:${type};base64,${fs.readFileSync(path.join(ROOT, file)).toString('base64')}`;

const browser = BROWSERS.find(file => fs.existsSync(file));
if (!browser) throw new Error('No Chrome or Edge found; set CHROME_PATH');

const facts = cardFacts(await loadCharacterCatalogs(ROOT, SAMPLE.world));
const html = fillCard(fs.readFileSync(path.join(ROOT, 'scripts', 'social-card', 'card.html'), 'utf8'), {
  ...cardValues(facts),
  pelagiad: dataUri('public/fonts/Pelagiad.ttf', 'font/ttf'),
  border: dataUri('public/textures/mw-border.png', 'image/png'),
  bevel: dataUri('public/textures/mw-bevel.png', 'image/png'),
  groove: dataUri('public/textures/mw-groove.png', 'image/png')
});

// A private profile, so a running browser never takes the job over.
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'silt-social-card-'));
try {
  const page = path.join(work, 'card.html');
  const shot = path.join(work, 'card.png');
  fs.writeFileSync(page, html);
  execFileSync(browser, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--force-device-scale-factor=1', `--window-size=${WIDTH},${HEIGHT}`, '--virtual-time-budget=5000',
    `--user-data-dir=${path.join(work, 'profile')}`, `--screenshot=${shot}`, pathToFileURL(page).href
  ], { stdio: 'pipe', timeout: 60000 });
  const { width, height } = await sharp(shot).metadata();
  if (width !== WIDTH || height !== HEIGHT) throw new Error(`The browser rendered ${width}×${height}, not ${WIDTH}×${HEIGHT}`);
  await sharp(shot).png({ compressionLevel: 9 }).toFile(OUT);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}

console.log(`Wrote ${path.relative(ROOT, OUT)}: ${facts.name}, ${facts.line}; Health ${facts.health}, Magicka ${facts.magicka}, Fatigue ${facts.fatigue}; level ${facts.nextLevel}: ${facts.bonuses.map(b => `${b.attribute} ×${b.multiplier}`).join(', ')}, Health ${facts.healthFrom} → ${facts.healthTo}`);
