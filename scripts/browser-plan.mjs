#!/usr/bin/env node
/* Prints the browser groups a change needs; runs nothing.
 *
 *   npm run test:browser:plan                 changes against origin/main, plus uncommitted
 *   npm run test:browser:plan -- --base main  another base
 *   npm run test:browser:plan -- --files lib/enchant-math.mjs,app/globals.css
 *
 * Unit tests always run. Shared foundations (layout, global CSS, shell, data
 * loader, build config) and unknown app files get the full browser set; freeze
 * acceptance always runs everything (BROWSER_TESTS.md, "Targeted runs").
 */
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const run = (suite, filter = '', extra = '') => ({ kind: 'browser', suite, filter, extra });
const vault = () => ({ kind: 'vault' });

// Any of these changes everything a page renders or how it is built.
const FULL = [
  /^package(-lock)?\.json$/, /^next\.config\./, /^(postcss|tailwind)\.config\./, /^wrangler\./,
  /^app\/layout\.jsx$/, /^app\/(globals|theme-[\w-]+)\.css$/, /^app\/page\.jsx$/,
  /^components\/(shell-context|app-shell|use-game-data|theme-[\w-]+)\.jsx$/,
  /^lib\/(bundle-loader|theme|sign-in-handoff)\.mjs$/,
  /^scripts\/(build-cloudflare|cloudflare-assets|test-browser)\.cjs$/,
];

// Never rendered: unit tests (always run) cover them.
const IGNORE = [
  /\.md$/i, /^docs\//, /^test\//, /^\.github\//, /^\.claude\//, /^LICENSE$/,
  /^components\/views\/changelog-view\.jsx$/, /^scripts\/browser-plan\.mjs$/,
  /^scripts\/(generate-favicons|generate-social-card|stage-game-data)\.mjs$/, /^scripts\/social-card\//,
];

// Each area lists the existing case filters that cover it (case names in scripts/*-cases.cjs and test-browser.cjs).
const AREAS = [
  { area: 'Alchemy', match: /alchemy|ingredient|apparatus/i, runs: [
    run('tools', 'Alchemy'), run('qa', 'QA-06/'), run('qa', 'QA-20/Restore-Health'), run('qa', 'QA-30/'),
    run('launch', 'UI-04'), run('launch', 'ingredient-labels'), run('polish', 'Polish Alchemy'), run('qa', 'QA-34/'),
    run('qa', 'Clarity-Beginner/'), run('qa', 'Clarity-CALC4/'), run('qa', 'QA-45/')] },
  { area: 'Enchanting', match: /enchant/i, runs: [
    run('qa', '/enchanting/'), run('launch', 'FLOW-01'), run('polish', 'Polish Enchanting'), run('qa', 'QA-44/'), run('qa', 'QA-47/')] },
  { area: 'Spellmaking', match: /spellmak/i, runs: [run('tools', 'Tool inputs'), run('qa', 'QA-47/')] },
  { area: 'Travel', match: /travel/i, runs: [
    run('travel'), run('tools', 'Travel imported save'), run('qa', 'QA-07/'), run('qa', 'QA-16/'), run('qa', 'QA-25/'),
    run('launch', 'UI-05'), run('launch', 'SUS-02/'), run('polish', 'Polish Travel'), run('touch', 'QA-18/saved-Travel', '--touch'), run('qa', 'QA-36/'),
    run('qa', 'Clarity-Beginner/'), run('qa', 'Clarity-Copy/'), run('qa', 'Clarity-FLOW04/'), run('qa', 'FLOW-04/save-check/'), run('qa', 'QA-42/'), run('qa', 'QA-45/')] },
  { area: 'Level Simulator', match: /level-simulator|level-math|leveler|health/i, runs: [
    run('qa', '/level-health/'), run('qa', 'QA-27/'), run('qa', 'QA-28/'), run('launch', 'SS-09/'),
    run('tools', 'Faction and Level interactions'), run('qa', 'QA-37/'), run('qa', 'QA-41/'), run('qa', 'Clarity-Beginner/')] },
  { area: 'Gear Advisor', match: /best-in-slot|gear-|equipment/i, runs: [
    run('qa', 'QA-08/'), run('qa', 'QA-10/'), run('qa', 'QA-26/'), run('qa', 'QA-33/'), run('qa', 'QA-35/'), run('qa', 'QA-39/'), run('qa', 'QA-40/'), run('qa', 'QA-45/')] },
  { area: 'Builder and character', match: /character-builder|character-(context|name|math|sheet)|premade|configurator|choice-help|class-|birthsign|race-/i, runs: [
    run('qa', 'QA-05/'), run('qa', 'QA-09/'), run('qa', 'QA-12/'), run('qa', 'QA-29/'), run('touch', 'QA-18/tap-popover', '--touch'), run('qa', 'QA-35/'),
    run('qa', 'Clarity-Beginner/'), run('qa', 'Clarity-F04-F11/'), run('qa', 'Clarity-Copy/')] },
  { area: 'Faction Journal', match: /faction|journal/i, runs: [
    run('qa', 'QA-11/'), run('qa', 'QA-20/ranks'), run('launch', 'SS-08/'), run('launch', 'SS-10/'),
    run('tools', 'Faction and Level interactions'), run('qa', 'QA-38/'), run('qa', 'Clarity-FLOW03/'), run('qa', 'QA-43/'), run('qa', 'QA-45/'), run('qa', 'QA-47/')] },
  { area: 'Challenge Runs', match: /challenge/i, runs: [run('launch', 'UI-03'), vault()] },
  { area: 'About', match: /about-view|seo-breadcrumbs/i, runs: [run('qa', 'QA-15/')] },
  { area: 'Search', match: /search/i, runs: [run('qa', 'QA-32/'), run('launch', 'SS-10/'), run('launch', 'ingredient-labels')] },
  { area: 'Home', match: /home-hub|home-data/i, runs: [run('matrix'), run('hydration', 'QA-17/home'), run('qa', 'QA-35/'), run('qa', 'QA-46/'), run('qa', 'Clarity-Beginner/'), run('qa', 'Clarity-Copy/')] },
  { area: 'Vault, account and settings', match: /character-vault|cloud-|account|settings|sign-?in|sign-?out|local-characters|confirmation-dialog|^cloudflare\//i, runs: [
    run('qa', 'QA-31/'), run('qa', 'QA-46/'), run('settings'), run('qa', 'Clarity-Copy/'), vault()],
    note: 'Vault/account changes also need npm run test:vault -- --clarity (F-11, F-17, F-12).' },
];

const FULL_PLAN = [run('all'), run('qa'), run('launch'), run('hydration'), run('touch', '', '--touch'), vault()];

const key = item => item.kind === 'vault' ? 'vault' : `${item.suite}|${item.filter}|${item.extra}`;

/** Changed paths in, browser runs out: { full, runs, areas, unmatched, notes }. */
export function planBrowserRuns(files) {
  const paths = [...new Set((files || []).map(file => String(file).trim().replaceAll('\\', '/').replace(/^\.\//, '')).filter(Boolean))];
  const areas = new Set();
  const notes = new Set();
  const unmatched = [];
  const runs = new Map();
  let full = false;
  for (const file of paths) {
    if (IGNORE.some(rule => rule.test(file))) continue;
    if (FULL.some(rule => rule.test(file))) { full = true; areas.add(`shared foundation (${file})`); continue; }
    const hits = /^(app|components|lib|scripts|cloudflare|public)\//.test(file) ? AREAS.filter(entry => entry.match.test(file)) : [];
    if (!hits.length) {
      // An app file with no known area could affect anything: be broad, not silent.
      if (/^(app|components|lib)\//.test(file)) { full = true; areas.add(`unmapped app file (${file})`); }
      else unmatched.push(file);
      continue;
    }
    for (const hit of hits) {
      areas.add(hit.area);
      if (hit.note) notes.add(hit.note);
      for (const item of hit.runs) runs.set(key(item), item);
    }
  }
  return { full, runs: full ? FULL_PLAN : [...runs.values()], areas: [...areas], unmatched, notes: [...notes] };
}

export function commandFor(item) {
  if (item.kind === 'vault') return 'npm run test:vault';
  return ['node scripts/test-browser.cjs', `--suite ${item.suite}`, item.filter && `--filter '${item.filter}'`, item.extra].filter(Boolean).join(' ');
}

function changedFiles(base) {
  const git = (...args) => {
    const result = spawnSync('git', args, { encoding: 'utf8', windowsHide: true });
    if (result.status !== 0) throw Error(`git ${args.join(' ')} failed: ${result.stderr.trim()}`);
    return result.stdout.split('\n');
  };
  return [...git('diff', '--name-only', `${base}...HEAD`), ...git('diff', '--name-only', 'HEAD'), ...git('ls-files', '--others', '--exclude-standard')];
}

function main(args) {
  const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
  const listed = option('--files', null);
  const base = option('--base', 'origin/main');
  const files = listed ? listed.split(',') : changedFiles(base);
  const plan = planBrowserRuns(files);
  console.log(`Changed files: ${files.filter(Boolean).length}${listed ? '' : ` (against ${base}, plus uncommitted)`}`);
  console.log(`Areas: ${plan.areas.length ? plan.areas.join(', ') : 'none that render'}`);
  if (plan.full) console.log('A shared foundation or unmapped app file changed: run the full browser set.');
  console.log('\nAlways:\n  npm test');
  if (plan.runs.length) {
    console.log('\nBrowser (set BROWSER_AXE_PATH, or add --axe-path; start the local server first):');
    for (const item of plan.runs) console.log(`  ${commandFor(item)}`);
  } else console.log('\nNo browser groups needed.');
  for (const note of plan.notes) console.log(`\nNote: ${note}`);
  if (plan.unmatched.length) console.log(`\nNot mapped (check by hand): ${plan.unmatched.join(', ')}`);
  console.log('\nAlso run the cases you add for this fix (--filter <its ID>). Freeze acceptance runs everything.');
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exit(1); }
}
