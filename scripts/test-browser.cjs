/* Local branch regression checks. Never signs in or writes to remote services. */
const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const base = option('--url', 'http://127.0.0.1:8765');
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw Error('Browser tests require a local server.');
const suite = option('--suite', 'all');
const filter = option('--filter', '');
const failFast = args.includes('--fail-fast');
if (!['all', 'matrix', 'travel', 'tools', 'settings', 'polish'].includes(suite)) throw Error('Use --suite all, matrix, travel, tools, settings or polish.');
const output = path.resolve(option('--out', `A:/Cache/travel-branch-browser-${Date.now()}`));
const chromePath = option('--chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const axePath = option('--axe-path', process.env.BROWSER_AXE_PATH);
if (!axePath || !fs.existsSync(axePath)) throw Error('Provide --axe-path pointing to an installed axe.min.js.');
const axeSource = fs.readFileSync(axePath, 'utf8');
fs.mkdirSync(output, { recursive: true });
const chromeProfile = fs.mkdtempSync(path.join(output, 'chrome-'));
const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${chromeProfile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const repo = path.join(__dirname, '..');
const gitHead = spawnSync('git', ['rev-parse','HEAD'], {cwd:repo,encoding:'utf8',windowsHide:true}).stdout?.trim();
const bundle = JSON.parse(fs.readFileSync(path.join(repo,'public/game-data/current.json'),'utf8'));
const report = { base, suite, gitHead, bundle, started: new Date().toISOString(), cases: [], runtimeErrors: [], serverErrors: [], fontStates: [] };
let socket, send, evaluate, current = 'setup', deliberateFailure = false, fetchMode = null;
const heldRequests = [], requests = new Map();
const networkTrace = [];
const ingredientSourceRequests = [];
const loadedDocuments = new Set();
let activeLoaderId = null;
function recordNetwork(method, params) {
  if (args.includes('--trace-network')) networkTrace.push({ method, ...params });
}

async function check(name, run) {
  if (!name.includes(filter)) return;
  current = name;
  try { const detail = await run(); report.cases.push({ name, passed: true, detail }); console.log(`PASS ${name}`); }
  catch (error) {
    const filename = name.replace(/[^a-z0-9-]/gi, '-');
    await screenshot(`${filename}-failure`).catch(() => {});
    const html = await evaluate('document.documentElement.outerHTML').catch(() => '');
    fs.writeFileSync(path.join(output, `${filename}-failure.html`), html);
    report.cases.push({ name, passed: false, error: error.stack }); console.log(`FAIL ${name}: ${error.message}`);
    if (failFast) throw error;
  }
}
async function until(expression, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { if (await evaluate(`Boolean(${expression})`)) return; await pause(100); }
  throw Error(`Timed out: ${expression}`);
}
async function idle() {
  const deadline = Date.now() + 30000;
  const pending = () => [...requests.entries()].filter(([, request]) => !request.loaderId || request.loaderId === activeLoaderId);
  while (Date.now() < deadline) { if (!pending().length) { await pause(250); if (!pending().length) return; } await pause(100); }
  throw Error(`Local page requests did not settle: ${JSON.stringify(pending())}`);
}
async function openDocument(url) {
  const navigation = await send('Page.navigate', { url });
  if (navigation.errorText) throw Error(`Navigation failed: ${navigation.errorText}`);
  if (navigation.loaderId) {
    activeLoaderId = navigation.loaderId;
    const deadline = Date.now() + 30000;
    while (!loadedDocuments.has(navigation.loaderId) && Date.now() < deadline) await pause(100);
    assert.ok(loadedDocuments.has(navigation.loaderId), 'New document finished loading');
  }
  await until('document.readyState === "complete" && document.querySelector("main h1")');
}
async function waitForFonts() {
  const deadline = Date.now() + 30000;
  let state;
  do {
    // Flush layout, then sample FontFaceSet in the current document so a stuck
    // load reports its font faces instead of only a Runtime.evaluate timeout.
    state = await evaluate(`(()=>{document.querySelector('main').getBoundingClientRect();return {url:location.href,theme:document.documentElement.dataset.theme,status:document.fonts.status,faces:[...document.fonts].map(f=>({family:f.family,status:f.status}))}})()`);
    const errors = state.faces.filter(face => face.status === 'error');
    assert.equal(errors.length, 0, `Font load errors: ${JSON.stringify(errors)}`);
    if (state.status === 'loaded') { report.fontStates.push(state); return; }
    await pause(100);
  } while (Date.now() < deadline);
  throw Error(`Fonts did not finish loading: ${JSON.stringify(state)}`);
}
async function navigate(route, profile = 'vanilla', extra = '') {
  const query = profile === 'vanilla' ? 'world=vanilla&arce=0' : `world=tr&arce=${profile === 'tr_arce' ? 1 : 0}`;
  await openDocument(`${base}/${route === 'home' ? '' : route}?${query}${extra}`);
  await idle();
  await waitForFonts();
}
async function viewport(width) { await send('Emulation.setDeviceMetricsOverride', { width, height: width < 600 ? 844 : 900, deviceScaleFactor: 1, mobile: false }); }
async function screenshot(name) {
  const capture = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(output, `${name}.png`), Buffer.from(capture.data, 'base64'));
}
async function key(key, code, number, modifiers = 0) {
  const text = !modifiers && key === 'Enter' ? '\r' : !modifiers && key === ' ' ? ' ' : undefined;
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: number, modifiers, ...(text ? { text } : {}) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: number, modifiers });
  await pause(80);
}
async function click(selector) {
  await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing control: '+${JSON.stringify(selector)});el.scrollIntoView({block:'center'});})()`);
  const rect = await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...rect });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...rect });
  await pause(150);
}
async function button(text) {
  const selector = await evaluate(`(()=>{const el=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!el)throw Error('Missing button '+${JSON.stringify(text)});el.dataset.browserButton='target';return '[data-browser-button="target"]'})()`);
  await click(selector); await evaluate(`document.querySelector('[data-browser-button="target"]')?.removeAttribute('data-browser-button')`);
}
async function type(selector, text) { await click(selector); await key('a', 'KeyA', 65, 2); await send('Input.insertText', { text }); await pause(150); }
async function pick(selector, query, label) {
  await type(selector, query);
  await until('document.querySelector("[role=listbox] [role=option]")');
  const index = await evaluate(`[...document.querySelectorAll('[role=listbox] [role=option]')].findIndex(el=>el.querySelector('span > span')?.textContent.trim()===${JSON.stringify(label)})`);
  assert.ok(index >= 0, `Missing location ${label}`);
  await click(`[role=listbox] [role=option]:nth-child(${index + 1})`);
  await until('!document.querySelector("[role=listbox]")');
}
async function audit(name) {
  await evaluate(axeSource);
  const result = await evaluate(`axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}).then(r=>r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})))`);
  fs.writeFileSync(path.join(output, `${name}-axe.json`), JSON.stringify(result, null, 2));
  return result;
}

function assertAccessible(notices) {
  const blockers = notices.filter(v => ['critical', 'serious'].includes(v.impact));
  assert.equal(blockers.length, 0, `Accessibility: ${blockers.map(v => v.id).join(', ')}`);
}

async function select(selector, label) {
  await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});const option=[...el.options].find(o=>o.textContent.trim()===${JSON.stringify(label)});if(!option)throw Error('Missing option '+${JSON.stringify(label)});el.value=option.value;el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await pause(150);
}
// An ARIA combobox (each Alchemy slot, CALC-3): type the name and choose it with Enter.
async function choose(selector, label) {
  const box = JSON.stringify(selector);
  await type(selector, label);
  await until(`document.querySelector(${box}).getAttribute('aria-expanded')==='true'&&document.querySelector('#'+document.querySelector(${box}).getAttribute('aria-controls')+' [role=option][aria-selected=true]')?.textContent.trim()===${JSON.stringify(label)}`);
  await key('Enter', 'Enter', 13);
  await until(`document.querySelector(${box}).getAttribute('aria-expanded')==='false'`);
  assert.equal(await evaluate(`document.querySelector(${box}).value`), label, `Chose ${label}`);
}
// The Builder's sections: tabs from 1024 px, one row of section buttons below (MOB-4).
async function builderTab(tab) {
  if (await evaluate('innerWidth >= 1024')) return click(`#btn-tab-${tab}`);
  const label = { builder: 'Configure', equipment: 'Loadouts', premade: 'Premades' }[tab];
  await evaluate(`(()=>{const el=[...document.querySelectorAll('.builder-phone-tabs button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!el)throw Error('Missing Builder section '+${JSON.stringify(label)});el.dataset.browserTab='target'})()`);
  await click('[data-browser-tab="target"]'); await evaluate(`document.querySelector('[data-browser-tab="target"]')?.removeAttribute('data-browser-tab')`);
}

async function matrix() {
  const routes = ['home', 'builder', 'equipment', 'challenge', 'leveler', 'factions', 'alchemy', 'enchanting', 'spellmaking', 'travel', 'vault', 'account', 'about', 'changelog', 'privacy', 'terms'];
  for (const profile of ['vanilla', 'tr', 'tr_arce']) for (const width of [1366, 375]) for (const route of routes) {
    await check(`${route}/${profile}/${width}`, async () => {
      await viewport(width); await navigate(route === 'equipment' ? 'builder' : route, profile);
      if (route === 'equipment') {
        await builderTab('builder');
        await select('#builder-race', 'Khajiit');
        await builderTab('equipment'); await idle(); await until('document.querySelector(".equipment-studio-root")');
      }
      const headings = await evaluate(`document.querySelectorAll('main h1').length`);
      assert.equal(headings, 1, 'Exactly one page h1');
      const themes = [];
      for (const theme of ['ashfall', 'morrowind']) {
        await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`); await pause(100);
        await waitForFonts();
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth + 1'), false, `Overflow in ${theme}`);
        const notices = await audit(`${route}-${profile}-${width}-${theme}`);
        themes.push({ theme, notices });
        await evaluate('window.scrollTo(0,0)'); await screenshot(`${route}-${profile}-${width}-${theme}`);
      }
      assertAccessible(themes.flatMap(t => t.notices));
      if (route === 'travel') {
        assert.equal(await evaluate('document.querySelectorAll("#travel-network-status").length'), 1);
        assert.equal(await evaluate('/Live:/.test(document.querySelector(".travel-workstation").textContent)'), false);
        assert.equal(await evaluate('document.getElementById("travel-options").open'), false);
      }
      return { headings, themes };
    });
  }
}

async function settingsRegression() {
  // Fake identity and API responses are confined to localhost browser fixtures.
  // The real route's SQL, ownership and concurrency are tested separately on SQLite.
  const { defaultAccountSettings } = await import('../lib/account-settings.mjs');
  const script = await send('Page.addScriptToEvaluateOnNewDocument', { source: `(()=>{
    const original=window.fetch.bind(window), listeners=new Set();
    const state=window.__settingsHarness={owner:'settings-one',calls:[],conflict:false};
    const defaults=${JSON.stringify(defaultAccountSettings())};
    const rows=()=>JSON.parse(sessionStorage.getItem('settings-fixture-rows')||'{}');
    const clerk=window.Clerk={loaded:true,user:{id:state.owner},session:{getToken:async()=> 'fixture-token'},
      addListener(fn){listeners.add(fn);fn({user:clerk.user,session:clerk.session});return()=>listeners.delete(fn)}};
    state.switchOwner=id=>{state.owner=id;clerk.user=id?{id}:null;clerk.session=id?{getToken:async()=> 'fixture-token'}:null;for(const fn of listeners)fn({user:clerk.user,session:clerk.session})};
    window.fetch=async(input,options={})=>{
      const url=new URL(typeof input==='string'?input:input.url,location.href);
      if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return original(input,options);
      if(url.pathname==='/api/account')return Response.json({username:null,iconId:0,premium:false,maxSaves:5});
      if(url.pathname==='/api/entitlements')return Response.json({tier:'free',maxSaves:5,currentSaves:0,remainingSaves:5});
      if(url.pathname==='/api/saves')return Response.json({saves:[],total:0});
      if(url.pathname!=='/api/settings')throw Error('Unexpected fixture API request');
      const all=rows(),row=all[state.owner]||{settings:structuredClone(defaults),revision:0};
      state.calls.push({owner:state.owner,method:options.method});
      if(options.method==='GET')return Response.json(row);
      const body=JSON.parse(options.body);
      if(state.conflict||body.revision!==row.revision){state.conflict=false;return Response.json({error:'REVISION_CONFLICT',message:'Settings changed in another tab or device.'},{status:409})}
      const next={settings:body.settings,revision:row.revision+1};all[state.owner]=next;sessionStorage.setItem('settings-fixture-rows',JSON.stringify(all));return Response.json(next);
    };
  })()` });
  async function choose(label, value) {
    const selector = await evaluate(`(()=>{const label=[...document.querySelectorAll('.account-settings-panel label')].find(el=>el.textContent.startsWith(${JSON.stringify(label)}));const el=label?.querySelector('select');if(!el)throw Error('Missing preference control');el.dataset.settingsTarget='yes';return '[data-settings-target="yes"]'})()`);
    await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('change',{bubbles:true}));el.removeAttribute('data-settings-target')})()`);
  }
  async function settled() { await until(`document.querySelector('.account-settings-panel [role="status"]')?.textContent==='Preferences are saved to your account.'`); }
  try {
    for (const width of [1366, 375]) for (const theme of ['ashfall', 'morrowind']) {
      await check(`Settings persistence/scopes/conflicts/${width}/${theme}`, async () => {
        await viewport(width);
        await evaluate(`sessionStorage.removeItem('settings-fixture-rows');localStorage.setItem('mw-world','vanilla');localStorage.setItem('mw-arce','0');localStorage.setItem('silt-theme','ashfall');localStorage.removeItem('silt-guest-settings-v1')`);
        await openDocument(`${base}/account`); await idle();
        await until(`document.querySelector('.account-settings-panel fieldset')?.disabled===false`);
        assert.equal(await evaluate(`__settingsHarness.calls.filter(c=>c.method==='PUT').length`),0,'Loading does not write');
        await button('Keep account defaults');
        await choose('Theme',theme); await choose('Preferred world','tr');
        await choose('Plan for','gold'); await choose('Assume Mages Guild membership','false');
        await settled();
        await openDocument(`${base}/account`); await idle(); await settled();
        assert.equal(await evaluate('document.documentElement.dataset.theme'),theme);
        assert.equal(await evaluate(`JSON.parse(sessionStorage.getItem('settings-fixture-rows'))['settings-one'].settings.world`),'tr');
        await choose('Tool default scope','dataset'); await choose('Edit tool defaults for','tr_arce');
        await choose('Assume Mages Guild membership','true'); await settled();
        assert.equal(await evaluate(`JSON.parse(sessionStorage.getItem('settings-fixture-rows'))['settings-one'].settings.datasetOverrides[0].toolDefaults.travel.mageGuild`),true);
        await evaluate(`document.querySelectorAll('.account-settings-panel details').forEach(el=>el.open=true)`);
        await waitForFonts();
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth + 1'),false);
        assertAccessible(await audit(`settings-${width}-${theme}`));
        await evaluate(`document.querySelector('.account-settings-panel').scrollIntoView({block:'start'})`); await screenshot(`settings-${width}-${theme}`);
        await evaluate(`document.querySelector('.account-settings-panel details').scrollIntoView({block:'start'})`); await screenshot(`settings-travel-${width}-${theme}`);
        await evaluate(`__settingsHarness.conflict=true`); await choose('Theme',theme==='ashfall'?'morrowind':'ashfall');
        await until(`document.querySelector('.account-settings-panel [role="alert"]')?.textContent.includes('Settings changed')`);
        assert.equal(await evaluate(`document.querySelector('.account-settings-panel fieldset').disabled`),true);
        await button('Discard unsaved preferences and reload saved settings'); await settled();
        assert.equal(await evaluate('document.documentElement.dataset.theme'),theme,'Conflict reload restores saved theme');
        await evaluate(`__settingsHarness.switchOwner('settings-two')`);
        await until(`document.querySelector('.account-settings-panel [role="status"]')?.textContent==='Using account defaults. Changes save automatically.'`);
        assert.equal(await evaluate('document.documentElement.dataset.theme'),'ashfall','Another account has its own defaults');
        await evaluate(`__settingsHarness.switchOwner(null)`);
        await until(`document.querySelector('.account-settings-panel [role="status"]')?.textContent.includes('kept in this browser')`);
        assert.equal(await evaluate('localStorage.getItem("silt-theme")'),'ashfall','Account edits did not overwrite guest theme');
        return { identity:'local fixture',persisted:true,worldScopes:true,conflict:true,ownerIsolation:true };
      });
    }
  } finally { await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: script.identifier }); }
}

async function toolsRegression() {
  await send('Browser.grantPermissions', { origin: base, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
  for (const profile of ['vanilla', 'tr', 'tr_arce']) for (const width of [1366, 375]) for (const theme of ['ashfall', 'morrowind']) {
    await check(`Tool inputs/sharing/navigation/${profile}/${width}/${theme}`, async () => {
      await viewport(width);
      // The next document applies its stored theme before paint. Do not start a
      // font load in the departing document and cancel it with navigation.
      await evaluate(`localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
      for (const [route, prefix] of [['alchemy','alc'], ['enchanting','ench'], ['spellmaking','spell']]) {
        await navigate(route, profile);
        assert.equal(await evaluate('document.documentElement.dataset.theme'), theme, 'Requested tool theme');
        await click(`#${prefix}-toggle-custom-stats`);
        await type(`#${prefix}-skill-input`, '60');
        assert.equal(await evaluate(`document.getElementById('${prefix}-skill-input').value`), '60');
        await button('Reset to character sheet');
        if (route === 'alchemy') {
          assert.equal(await evaluate(`document.querySelector('[aria-label="Crucible 1 ingredient"]').value`), '', 'Empty ingredients');
          await choose('[aria-label="Crucible 1 ingredient"]', 'Wickwheat');
          await choose('[aria-label="Crucible 2 ingredient"]', 'Marshmerrow');
          assert.match(await evaluate('document.querySelector(".alchemy-workstation").textContent'), /Restore Health/);
          await button('Clear All Ingredients');
        } else {
          assert.ok(await evaluate('Boolean(document.querySelector(".calc-empty-prompt"))'), 'Empty effect prompt');
          await button('Add Effect');
          await select('[aria-label="Effect 1"]', route === 'spellmaking' ? 'Light (Illusion, base 0.2)' : 'Light (base 0.2)');
          assert.equal(await evaluate('Boolean(document.querySelector(".calc-empty-prompt"))'), false);
        }
        assert.equal(await evaluate('document.querySelector("main").textContent.includes("NaN")'), false);
      }
      await navigate('challenge', profile);
      await type('#challenge-seed-input', 'invalid-seed'); await button('Load');
      assert.equal(await evaluate('document.getElementById("challenge-seed-note").getAttribute("role")'), 'alert');
      const { formatRunSeed } = await import('../lib/challenge-engine.mjs');
      const seed = formatRunSeed({code:'K7Q2M',profile,allowedBands:{Easy:true,Medium:true,Hard:false},restrictionCount:3,objectiveCount:2});
      await type('#challenge-seed-input', seed); await button('Load'); await idle();
      if (width < 600) await button('Run Summary Sheet');
      await button('Copy Summary'); await pause(100);
      const summary = await evaluate('navigator.clipboard.readText()');
      assert.ok(summary.length > 100, 'Markdown export');
      await click('[title="Copy shareable challenge link"]'); await pause(100);
      const shared = await evaluate('navigator.clipboard.readText()');
      assert.equal(new URL(shared).pathname, '/challenge');
      await openDocument(shared); await until('document.querySelector(".run-summary-sheet")'); await idle(); await waitForFonts();
      if (width < 600) await button('Run Summary Sheet');
      await button('Copy Summary'); await pause(100);
      assert.equal(await evaluate('navigator.clipboard.readText()'), summary, 'Share restores identical run');
      await type('#challenge-seed-input', seed); await button('Load'); await idle();
      await click('[title="Copy run summary in markdown format"]'); await pause(100);
      assert.equal(await evaluate('navigator.clipboard.readText()'), summary, 'Seed repeats identical run');
      await click('#react-btn-to-optimizer'); await until('document.querySelector("#panel-build:not([hidden])")');
      await builderTab('builder');
      await select('#builder-className', 'Custom Class');
      const characterFields = `['builder-race','builder-className','builder-sign','builder-spec','builder-fav1','builder-fav2'].map(id=>document.getElementById(id).value)`;
      const character = await evaluate(characterFields);
      await button('Copy Build Link'); await pause(100);
      const buildLink = await evaluate('navigator.clipboard.readText()');
      await openDocument(buildLink); await until('document.getElementById("builder-className")?.value === "Custom"'); await idle(); await waitForFonts();
      assert.deepEqual(await evaluate(characterFields), character, 'Share restores character fields');
      await builderTab('equipment'); await idle();
      await click('.equipment-ledger [role=button]');
      await until('document.querySelector("[role=dialog]")');
      assert.ok(await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'), 'Dialog receives focus');
      await key('Tab', 'Tab', 9, 1);
      assert.ok(await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'), 'Dialog traps focus');
      await key('Escape', 'Escape', 27);
      assert.equal(await evaluate('Boolean(document.querySelector("[role=dialog]"))'), false);
      await screenshot(`tools-interactions-${profile}-${width}-${theme}`);
      return { seed, exportedCharacters: true, equipmentDialog: true };
    });
  }
}

async function reverseAlchemyRegression() {
  for (const profile of ['vanilla','tr','tr_arce']) for (const width of [1366,375]) for (const theme of ['ashfall','morrowind']) {
    await check(`Alchemy effect finder/${profile}/${width}/${theme}`, async () => {
      await viewport(width);
      await evaluate(`localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
      await navigate('alchemy', profile);
      assert.equal(await evaluate('document.querySelectorAll(".reverse-alchemy-pair").length'), 0, 'No recipe before choosing an effect');
      await choose('[aria-label="Crucible 3 ingredient"]', 'Wickwheat');
      await choose('[aria-label="Crucible 4 ingredient"]', 'Marshmerrow');
      await type('#reverse-alchemy-search', 'restore health');
      await button('Restore Health');
      await until('document.querySelector(".reverse-alchemy-pair")');
      const pairNames = await evaluate(`document.querySelector('.reverse-alchemy-pair > p').textContent.split(' + ')`);
      assert.equal(await evaluate('document.querySelector(".reverse-alchemy-sources").open'), false, 'Sources start folded');
      const beforeSources = ingredientSourceRequests.filter(request => request.case === current).length;
      assert.equal(beforeSources, 0, 'No ingredient source download before opening a pair');
      await click('.reverse-alchemy-sources summary');
      await until('document.querySelector(".reverse-alchemy-sources").textContent.includes("Sources exclude theft")');
      assert.deepEqual(await evaluate('[...document.querySelectorAll(".reverse-alchemy-sources > div > div > p")].slice(0,2).map(el=>el.textContent)'), pairNames, 'Sources identify both ingredients');
      assert.ok(await evaluate('/Buy from|Harvest:|Dropped by|Find:|No dependable source is listed/.test(document.querySelector(".reverse-alchemy-sources").textContent)'), 'Source descriptions or an explicit absence');
      assert.equal(await evaluate('document.querySelector(".reverse-alchemy-sources [role=alert]")'), null);
      await click('.reverse-alchemy-pair button');
      assert.deepEqual(await evaluate(`[1,2,3,4].map(i=>document.querySelector('[aria-label="Crucible '+i+' ingredient"]').value)`), [...pairNames,'',''], 'Chosen pair replaces every slot');
      assert.match(await evaluate('document.getElementById("potion-name-input").value'), /Restore Health/);
      assert.equal(await evaluate('document.activeElement.id'), 'alchemy-potion-output', 'Chosen pair moves focus to the potion output');
      await type('#reverse-alchemy-search', 'no-such-effect-xyz');
      assert.ok(await evaluate('document.querySelector(".reverse-alchemy").textContent.includes("No matching effect")'));
      await type('#reverse-alchemy-search', '');
      await click('[aria-label="Remove Restore Health"]');
      assert.equal(await evaluate('document.querySelectorAll(".reverse-alchemy-pair").length'), 0, 'Removing targets clears results');
      await type('#reverse-alchemy-search', 'restore health'); await button('Restore Health');
      await type('#reverse-alchemy-search', 'restore fatigue'); await button('Restore Fatigue');
      assert.ok(await evaluate(`document.querySelectorAll('[aria-label="Desired potion effects"] li').length===2`), 'Multiple targets selected');
      // Vanilla has no pair with both effects. Keep that real empty result, then
      // return to a valid recipe before checking its expanded source layout.
      if (!await evaluate('Boolean(document.querySelector(".reverse-alchemy-sources"))')) {
        assert.ok(await evaluate('document.querySelector(".reverse-alchemy").textContent.includes("No ingredient pair")'));
        await click('[aria-label="Remove Restore Fatigue"]');
      }
      if (!await evaluate('document.querySelector(".reverse-alchemy-sources").open')) await click('.reverse-alchemy-sources summary');
      await until('document.querySelector(".reverse-alchemy-sources").textContent.includes("Sources exclude theft")');
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth + 2'), 'No horizontal overflow');
      assertAccessible(await audit(`reverse-alchemy-${profile}-${width}-${theme}`));
      await screenshot(`reverse-alchemy-${profile}-${width}-${theme}`);
      await navigate('alchemy', profile === 'vanilla' ? 'tr' : 'vanilla');
      assert.equal(await evaluate('document.querySelectorAll(".reverse-alchemy-pair").length'), 0, 'World switch clears prior recipes');
      return { searched: true, multipleEffects: true, filledPair: true, clearedOtherSlots: true, focus: true, worldIsolation: true, sources: { lazy: true, bothIngredients: true, profile, sourceRequests: ingredientSourceRequests.filter(request => request.case === current).length } };
    });
  }
  for (const profile of ['vanilla','tr','tr_arce']) for (const width of [1366,375]) for (const theme of ['ashfall','morrowind']) {
    await check(`Alchemy ingredient sources/${profile}/${width}/${theme}`, async () => {
      await viewport(width);
      await evaluate(`localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
      await navigate('alchemy', profile);
      assert.equal(await evaluate('document.querySelectorAll(".alchemy-ingredient-sources").length'), 0, 'No source buttons on empty slots');
      await choose('[aria-label="Crucible 1 ingredient"]', 'Wickwheat');
      assert.equal(await evaluate('document.querySelectorAll(".reverse-alchemy-pair").length'), 0, 'Individual sources need no effect-finder pair');
      assert.equal(await evaluate('document.querySelector(".alchemy-ingredient-sources > button").textContent'), 'Where to get it');
      assert.equal(ingredientSourceRequests.filter(request => request.case === current).length, 0, 'Selection alone does not download sources');
      await evaluate('document.querySelector(".alchemy-ingredient-sources > button").focus()');
      assert.ok(await evaluate('document.activeElement.matches(".alchemy-ingredient-sources > button")'), 'Source button receives keyboard focus');
      await key('Enter', 'Enter', 13);
      await until('document.querySelector(".alchemy-ingredient-sources").textContent.includes("Sources exclude theft")');
      assert.equal(await evaluate('document.querySelector(".alchemy-ingredient-sources > button").getAttribute("aria-expanded")'), 'true');
      assert.equal(await evaluate('document.querySelector(".alchemy-ingredient-sources > div > div > p").textContent'), 'Wickwheat');
      await choose('[aria-label="Crucible 1 ingredient"]', 'Marshmerrow');
      assert.equal(await evaluate('document.querySelector(".alchemy-ingredient-sources > button").getAttribute("aria-expanded")'), 'false', 'Replacing an ingredient closes old sources');
      assert.equal(await evaluate('document.querySelector(".alchemy-ingredient-sources").textContent.includes("Wickwheat")'), false);
      await click('.alchemy-ingredient-sources > button');
      await until('document.querySelector(".alchemy-ingredient-sources > div > div > p")?.textContent==="Marshmerrow"');
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth + 2'), 'No horizontal overflow with sources open');
      assertAccessible(await audit(`alchemy-ingredient-sources-${profile}-${width}-${theme}`));
      await screenshot(`alchemy-ingredient-sources-${profile}-${width}-${theme}`);
      for (const [slot, ingredient] of [[2,'Ash Yam'],[3,'Saltrice'],[4,'Wickwheat']]) await choose(`[aria-label="Crucible ${slot} ingredient"]`, ingredient);
      assert.equal(await evaluate('document.querySelectorAll(".alchemy-ingredient-sources > button").length'), 4, 'Every filled slot has its own source button');
      await button('Clear All Ingredients');
      assert.equal(await evaluate('document.querySelectorAll(".alchemy-ingredient-sources").length'), 0, 'Clearing selections removes all source buttons');
      await choose('[aria-label="Crucible 1 ingredient"]', 'Wickwheat'); await click('.alchemy-ingredient-sources > button');
      await navigate('alchemy', profile === 'vanilla' ? 'tr' : 'vanilla');
      assert.equal(await evaluate('document.querySelectorAll(".alchemy-ingredient-sources").length'), 0, 'World changes discard selected ingredient sources');
      return { selectedIngredient: true, lazy: true, keyboard: true, replacement: true, allSlots: true, clear: true, worldIsolation: true };
    });
  }
  for (const width of [1366,375]) await check(`Alchemy sources loading/failure/retry/${width}`, async () => {
    await viewport(width);
    await evaluate('caches.delete("silt-game-data-v1")');
    await navigate('alchemy', 'vanilla');
    await choose('[aria-label="Crucible 1 ingredient"]', 'Wickwheat');
    deliberateFailure = true; fetchMode = 'hold';
    await send('Fetch.enable', { patterns: [{ urlPattern: '*game-data/*/IngredientSources.json*' }] });
    try {
      await click('.alchemy-ingredient-sources > button');
      await until('document.querySelector(".alchemy-ingredient-sources [role=status]")?.textContent.includes("Loading ingredient sources")');
      await pause(200);
      assert.equal(await evaluate('document.querySelector(".alchemy-ingredient-sources [role=alert]")'), null, 'Pending data does not flash an error');
      assert.ok(heldRequests.length, 'Source request was held before failure');
      fetchMode = 'fail';
      for (const requestId of heldRequests.splice(0)) await send('Fetch.failRequest', { requestId, errorReason: 'Failed' });
      await until('document.querySelector(".alchemy-ingredient-sources [role=alert]")');
      fetchMode = null; await send('Fetch.disable');
      await click('.alchemy-ingredient-sources > div button');
      await until('document.querySelector(".alchemy-ingredient-sources").textContent.includes("Sources exclude theft")');
      assert.equal(await evaluate('document.querySelector(".alchemy-ingredient-sources [role=alert]")'), null, 'Retry recovers without resetting the selected ingredient');
      assert.equal(await evaluate('document.querySelector(\'[aria-label="Crucible 1 ingredient"]\').value'), 'Wickwheat');
      assertAccessible(await audit(`alchemy-sources-retry-${width}`));
      await screenshot(`alchemy-sources-retry-${width}`);
      return { lazy: true, loading: true, failure: true, retry: true, preservedIngredient: true };
    } finally { fetchMode = null; await send('Fetch.disable'); deliberateFailure = false; }
  });
}

async function factionAndLevelRegression() {
  for (const profile of ['vanilla','tr','tr_arce']) for (const width of [1366,375]) for (const theme of ['ashfall','morrowind']) {
    await check(`Faction and Level interactions/${profile}/${width}/${theme}`, async () => {
      await viewport(width);
      await evaluate(`localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
      await navigate('factions', profile);
      await type('#faction-search-input', 'Mages Guild');
      await until('document.querySelector(".faction-roster-item")');
      assert.ok(await evaluate('[...document.querySelectorAll(".faction-roster-item")].every(b=>/mages guild/i.test(b.textContent))'), 'Faction search filters the roster');
      await evaluate(`(()=>{const el=[...document.querySelectorAll('.faction-roster-item')].find(b=>[...b.querySelectorAll('span')].some(s=>s.textContent.trim()==='Mages Guild'));if(!el)throw Error('Missing Mages Guild');el.dataset.browserFaction='target'})()`);
      await click('[data-browser-faction=target]');
      await until('document.querySelectorAll(".rank-stepper-btn").length === 10');
      await click('.rank-stepper-btn:last-child');
      assert.ok(await evaluate('document.querySelector(".rank-stepper-btn:last-child").classList.contains("bg-surface-19")'), 'Chosen faction rank');
      assertAccessible(await audit(`faction-rank-${profile}-${width}-${theme}`));
      await screenshot(`faction-rank-${profile}-${width}-${theme}`);
      await type('#faction-search-input', 'no-such-faction-xyz');
      assert.equal(await evaluate('document.querySelectorAll(".faction-roster-item").length'), 0, 'Empty faction search');
      await click('[aria-label="Clear search"]');
      assert.ok(await evaluate('document.querySelectorAll(".faction-roster-item").length > 1'), 'Faction search resets');
      await navigate('leveler', profile);
      if (width < 600) await button('Leveling Optimizer & Stepper');
      await button('Stats & Skills');
      assert.equal(await evaluate('[...document.querySelectorAll(".level-mode-toggle-wrap button")].find(b=>b.textContent.trim()==="Stats & Skills").getAttribute("aria-pressed")'), 'true');
      await button('Stats Only');
      const before = await evaluate('document.getElementById("target-level-slider").value');
      await click('#target-level-slider'); await key('Home','Home',36); await key('ArrowRight','ArrowRight',39);
      assert.equal(await evaluate('document.getElementById("target-level-slider").value'), '2', 'Target level updates');
      await evaluate(`document.querySelector('button[aria-label^="Move "][aria-label$=" down"]:not(:disabled)').dataset.browserMove='target'`);
      const moved = await evaluate('document.querySelector("[data-browser-move=target]").getAttribute("aria-label")');
      await click('[data-browser-move=target]');
      assert.ok(await evaluate(`(()=>{const label=${JSON.stringify(moved)}.replace(/ down$/,' up');return !document.querySelector('button[aria-label="'+label+'"]').disabled})()`), 'Attribute priority moves');
      assert.equal(await evaluate('document.querySelector("main").textContent.includes("NaN")'), false, 'Finite level results');
      assertAccessible(await audit(`level-controls-${profile}-${width}-${theme}`));
      await screenshot(`level-controls-${profile}-${width}-${theme}`);
      return { factions: true, levelModes: true, targetBefore: before, moved };
    });
  }
}

async function savedTravel() {
  const skills = ['Block','Armorer','MediumArmor','HeavyArmor','BluntWeapon','LongBlade','Axe','Spear','Athletics','Enchant','Destruction','Alteration','Illusion','Conjuration','Mysticism','Restoration','Alchemy','Unarmored','Security','Sneak','Acrobatics','LightArmor','ShortBlade','Marksman','Mercantile','Speechcraft','HandToHand'];
  const attributes = ['Strength','Intelligence','Willpower','Agility','Speed','Endurance','Personality','Luck'];
  const save = {formatVersion:37,contentFiles:['Morrowind.esm','Tribunal.esm','Bloodmoon.esm'],
    identity:{name:'Browser Traveller',race:'Breton',gender:'Male',birthsign:'The Lady',level:3,cell:'Seyda Neen',class:{id:'mage',name:null,custom:false,specialization:null,favoredAttributes:[]}},
    vitals:{health:{current:50,max:50},magicka:{current:40,max:40},fatigue:{current:100,max:100},gold:50,reputation:0,bounty:0,timePlayedSeconds:1234},
    build:{skillKindSource:null,attributes:attributes.map((id,index)=>({id,index,base:40,modifier:0,damage:0,value:40})),skills:skills.map((id,index)=>({id,index,base:40,modifier:0,damage:0,value:40,progress:0,kind:'Misc'}))},
    progress:{quests:[],otherJournalIds:[],factions:[{id:'Mages Guild',rank:0,reputation:0,expelled:false}]},
    stuff:{inventory:[{id:'sc_divineintervention',count:1,soul:null,equipped:false,slot:null}],spells:['almsivi intervention']},warnings:[]};
  const fixture = path.join(output, 'synthetic-save.json'); fs.writeFileSync(fixture, JSON.stringify(save));
  for (const width of [1366,375]) await check(`Travel imported save/persistence/profiles/${width}`, async () => {
    await viewport(width); await navigate('vault');
    const {root} = await send('DOM.getDocument');
    const {nodeId} = await send('DOM.querySelector', {nodeId:root.nodeId,selector:'input[aria-label="Open an OpenMW save"]'});
    await send('DOM.setFileInputFiles', {nodeId,files:[fixture]});
    await until('document.querySelector("main").textContent.includes("Browser Traveller")'); await idle();
    await navigate('travel');
    await click('#travel-options > summary');
    const control = async label => evaluate(`(()=>{const el=[...document.querySelectorAll('#travel-options label')].find(el=>el.textContent.includes(${JSON.stringify(label)}))?.querySelector('input');if(!el)throw Error('Missing save option '+${JSON.stringify(label)});el.dataset.saveOption=${JSON.stringify(label)};return '[data-save-option='+JSON.stringify(${JSON.stringify(label)})+']'})()`);
    const guild = await control('Mages Guild member'), divine = await control('Divine Intervention'), almsivi = await control('Almsivi Intervention'), carried = await control('Carrying');
    await until(`document.querySelector(${JSON.stringify(guild)}).checked && document.querySelector(${JSON.stringify(almsivi)}).checked && !document.querySelector(${JSON.stringify(divine)}).checked`);
    await click(guild);
    assert.equal(await evaluate(`document.querySelector(${JSON.stringify(guild)}).checked`), false, 'Guild edit applied before navigation');
    await click(divine);
    assert.equal(await evaluate(`document.querySelector(${JSON.stringify(divine)}).checked`), true, 'Divine edit applied before navigation');
    await click(almsivi);
    assert.equal(await evaluate(`document.querySelector(${JSON.stringify(almsivi)}).checked`), false, 'Almsivi edit applied before navigation');
    await type(carried,'12.5');
    assert.equal(await evaluate(`document.querySelector(${JSON.stringify(carried)}).value`), '12.5', 'Carrying edit applied before navigation');
    const storedChoices = await evaluate(`JSON.parse(localStorage.getItem('silt-travel-options-v1'))`);
    assert.ok(Object.entries(storedChoices?.saves || {}).some(([key, entry]) => key.startsWith('vanilla:') &&
      entry.values?.mageGuild === false && entry.values?.divine === true &&
      entry.values?.almsivi === false && entry.values?.carried === 12.5), 'Edited vanilla choices stored before navigation');
    for (const profile of ['vanilla','tr','tr_arce','vanilla']) {
      await navigate('leveler',profile); await navigate('travel',profile); await click('#travel-options > summary');
      const g = await control('Mages Guild member'), d = await control('Divine Intervention'), a = await control('Almsivi Intervention'), c = await control('Carrying');
      await until('!document.querySelector("#travel-options").textContent.includes("Weighing your pack")'); await pause(300);
      assert.equal(await evaluate(`document.querySelector(${JSON.stringify(g)}).checked`), profile !== 'vanilla', 'Save/profile override isolation');
      assert.equal(await evaluate(`document.querySelector(${JSON.stringify(d)}).checked`), profile === 'vanilla');
      assert.equal(await evaluate(`document.querySelector(${JSON.stringify(a)}).checked`), profile !== 'vanilla');
      if (profile === 'vanilla') assert.equal(await evaluate(`document.querySelector(${JSON.stringify(c)}).value`), '12.5');
    }
    await button('Use save defaults');
    assert.equal(await evaluate(`document.querySelector(${JSON.stringify(await control('Mages Guild member'))}).checked`),true);
    assert.equal(await evaluate(`document.querySelector(${JSON.stringify(await control('Divine Intervention'))}).checked`),false);
    await screenshot(`travel-save-${width}`);
    await navigate('vault'); await button('Clear save');
    return { imported: true, editsApplied: true, editsStored: true, restoredOverrides: true, profilesIsolated: true, reset: true };
  });
}

async function travel() {
  for (const width of [1366, 375]) {
    await check(`Travel keyboard/search/layout/${width}`, async () => {
      await viewport(width); await navigate('travel', 'vanilla', '&from=Seyda%20Neen&to=Vivec');
      await evaluate('document.documentElement.dataset.theme="ashfall"');
      const old = await evaluate('document.getElementById("travel-results").textContent');
      await type('#travel-origin', 'Pelagiad');
      assert.equal(await evaluate('document.getElementById("travel-results").textContent'), old, 'Typing must not change the route');
      assert.equal(await evaluate(`[...document.querySelectorAll('[role=option] span > span:first-child')].filter(el=>el.textContent.trim()==='Pelagiad').length`), 1);
      await key('Escape', 'Escape', 27);
      assert.equal(await evaluate('document.getElementById("travel-origin").value'), 'Seyda Neen');
      await type('#travel-origin', 'Balmora'); await key('ArrowDown', 'ArrowDown', 40); await key('Enter', 'Enter', 13);
      assert.equal(await evaluate('document.getElementById("travel-origin").value'), 'Balmora');
      await type('#travel-origin', 'zzzzzzzz-no-place'); await key('Tab', 'Tab', 9);
      assert.equal(await evaluate('document.getElementById("travel-origin").value'), 'Balmora');
      await pick('#travel-origin', 'Seyda Neen', 'Seyda Neen');
      await button('Swap Origin and Destination');
      assert.equal(await evaluate('document.getElementById("travel-origin").value'), 'Vivec');
      await button('Swap Origin and Destination');
      await button('Cheapest');
      assert.match(await evaluate('document.querySelector(".travel-tradeoff").textContent'), /Fewest legs.*gold/);
      assert.match(await evaluate('document.querySelector(".travel-real-time").textContent'), /Real Time Approximation/);
      assert.equal(await evaluate('document.querySelector(".travel-tradeoff").closest("details") !== null'), false);
      await send('Browser.grantPermissions', { origin: base, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
      await button('Copy route link');
      await until(`[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Link copied')`);
      const shared = await evaluate('navigator.clipboard.readText()');
      assert.equal(new URL(shared).searchParams.get('plan'), 'gold');
      await openDocument(shared); await idle(); await waitForFonts();
      await until('document.querySelector(".travel-tradeoff")');
      await button('Fastest');
      assert.equal(await evaluate('Boolean(document.querySelector(".travel-tradeoff"))'), false);
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'forced-colors', value: 'active' }] });
      await click('#travel-origin'); await key('Tab', 'Tab', 9);
      const focus = await evaluate(`(()=>{const el=document.activeElement,css=getComputedStyle(el);return {visible:el.matches(':focus-visible'),outline:css.outlineStyle,width:css.outlineWidth}})()`);
      assert.ok(focus.visible && focus.outline !== 'none' && focus.width !== '0px', 'Keyboard focus in high contrast');
      await send('Emulation.setEmulatedMedia', { features: [] });
      const order = await evaluate(`(()=>{const a=document.querySelector('section[aria-label="Plan a journey"]'),b=document.getElementById('travel-results'),c=document.getElementById('travel-options');return Boolean(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING)&&Boolean(b.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_FOLLOWING)})()`);
      assert.ok(order, 'Route inputs, result and closed options reading order');
      await evaluate('document.getElementById("travel-results").scrollIntoView({block:"start"})'); await screenshot(`travel-interactions-${width}`);
      return { shared: new URL(shared).pathname, focus, order };
    });
  }
  await check('Travel network loading/failure/retry', async () => {
    deliberateFailure = true; fetchMode = 'hold';
    await send('Fetch.enable', { patterns: [{ urlPattern: '*game-data/current.json*' }] });
    await openDocument(`${base}/travel?world=vanilla`);
    await until('document.getElementById("travel-network-status")?.textContent.includes("Loading travel network")');
    assert.equal(await evaluate('document.querySelectorAll("#travel-network-status").length'), 1);
    assert.equal(await evaluate('/0 stops/.test(document.getElementById("travel-network-status").textContent)'), false);
    assert.equal(await evaluate('/No Route|not in the active network/.test(document.getElementById("travel-results").textContent)'), false);
    assert.equal(await evaluate('document.querySelector("#travel-results .text-danger-7")'), null);
    fetchMode = 'fail';
    for (const requestId of heldRequests.splice(0)) await send('Fetch.failRequest', { requestId, errorReason: 'Failed' });
    await until('document.getElementById("travel-network-status")?.getAttribute("role")==="alert"');
    assert.equal(await evaluate('document.querySelectorAll("#travel-network-status").length'), 1);
    fetchMode = null; await send('Fetch.disable'); await button('Retry');
    await until('document.getElementById("travel-network-status")?.textContent.match(/\\d+ stops/)&&!document.getElementById("travel-origin").disabled');
    deliberateFailure = false;
    return { recovered: true };
  });
}

async function polishRegression() {
  for (const theme of ['ashfall','morrowind']) {
    for (const width of [375,900,1024,1366,1440,1920]) await check(`Polish navigation/${theme}/${width}`, async () => {
      await viewport(width); await evaluate(`localStorage.setItem('silt-theme',${JSON.stringify(theme)})`); await navigate('home');
      if(width < 900) await button('Menu');
      const layout=await evaluate(`(()=>{const visible=el=>el&&el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0;
        const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
        return {direct:[...document.querySelectorAll('.nav-calculator-direct')].filter(visible).map(el=>el.textContent.trim()),
          menu:visible(document.getElementById('react-btn-dropdown-calc')),nav:rect(document.querySelector('.nav-primary')),
          world:rect(document.querySelector('.world-bar')),header:rect(document.querySelector('.header-tools')),
          overflow:document.documentElement.scrollWidth>innerWidth+1}})()`);
      assert.equal(layout.overflow,false,'Navigation must fit the viewport');
      assert.deepEqual(layout.direct,width>=1440?['Alchemy','Enchanting','Spellmaking']:[]);
      if(width>=1440) assert.ok(Math.abs(layout.nav.y-layout.world.y)<=8,'Direct calculator links and world switch fit the same row');
      if(width>=900&&width<1440) {
        assert.equal(layout.menu,true); await click('#react-btn-dropdown-calc');
        assert.deepEqual(await evaluate(`[...document.querySelectorAll('#react-calc-dropdown-menu button')].map(el=>el.textContent.trim())`),['Alchemy','Enchanting','Spellmaking']);
      }
      await screenshot(`polish-nav-${theme}-${width}`); return layout;
    });
    for (const width of [375,1366]) {
      await check(`Polish Travel/${theme}/${width}`,async()=>{
        await viewport(width); await navigate('travel');
        assert.equal(await evaluate('document.getElementById("travel-origin").value'),'Seyda Neen');
        assert.equal(await evaluate('document.getElementById("travel-destination").value'),'Balmora');
        await button('Least real time');
        assert.equal(await evaluate('new URLSearchParams(location.search).get("plan")'),'real');
        assert.match(await evaluate('document.getElementById("travel-results").textContent'),/Real Time Approximation/);
        await audit(`polish-travel-${theme}-${width}`); await screenshot(`polish-travel-${theme}-${width}`);
        return {defaultJourney:true,realObjective:true};
      });
      await check(`Polish Alchemy/${theme}/${width}`,async()=>{
        await viewport(width); await navigate('alchemy');
        const tools=await evaluate(`[...document.querySelectorAll('.alchemy-workstation select')].filter(el=>[...el.options].some(o=>o.value.startsWith('apparatus_'))).map(el=>[...el.options].filter(o=>o.value!=='none').map(o=>({name:o.textContent,quality:Number(o.textContent.match(/([\\d.]+)x/)?.[1])})))`);
        assert.equal(tools.length,4);
        for(const group of tools) {
          assert.ok(group.every(tool=>!/secretmaster/i.test(tool.name)));
          assert.ok(group.every((tool,index)=>index===0||tool.quality<=group[index-1].quality),'Apparatus quality descends');
        }
        await audit(`polish-alchemy-${theme}-${width}`); await screenshot(`polish-alchemy-${theme}-${width}`); return {sorted:true,obtainable:true};
      });
      await check(`Polish Enchanting/${theme}/${width}`,async()=>{
        await viewport(width); await navigate('enchanting'); await type('#enchant-soul-size','300');
        assert.equal(await evaluate('document.getElementById("enchant-soul-select").value'),'300');
        assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Constant').disabled`),true);
        await type('#enchant-soul-size','400');
        assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Constant').disabled`),false);
        await button('Constant'); await type('#enchant-soul-size','399');
        assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='When Used').getAttribute('aria-pressed')`),'true');
        await audit(`polish-enchanting-${theme}-${width}`); await screenshot(`polish-enchanting-${theme}-${width}`); return {customSoul:true,constantBoundary:true};
      });
    }
  }
}

(async () => {
  let port;
  for (let i = 0; i < 100; i++) { try { port = fs.readFileSync(path.join(chromeProfile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; break; } catch { await pause(100); } }
  if (!port) throw Error('Chrome did not start.');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve); socket.addEventListener('error', reject); });
  let id = 0; const pending = new Map();
  send = (method, params = {}) => new Promise((resolve, reject) => {
    const n = ++id, timer = setTimeout(() => { pending.delete(n); reject(Error(`CDP timeout: ${method}${params.expression ? ` (${params.expression.slice(0,300)})` : ''}`)); }, 45000);
    pending.set(n, { resolve, reject, timer }); socket.send(JSON.stringify({ id: n, method, params }));
  });
  socket.addEventListener('message', async event => {
    const msg = JSON.parse(event.data);
    if (msg.id) { const p = pending.get(msg.id); if (p) { pending.delete(msg.id); clearTimeout(p.timer); msg.error ? p.reject(Error(msg.error.message)) : p.resolve(msg.result); } }
    if (msg.method === 'Page.lifecycleEvent' && msg.params.name === 'load') {
      loadedDocuments.add(msg.params.loaderId);
      recordNetwork(msg.method, {loaderId:msg.params.loaderId,frameId:msg.params.frameId,name:msg.params.name});
    }
    if (msg.method === 'Page.frameNavigated' && !msg.params.frame.parentId) activeLoaderId = msg.params.frame.loaderId;
    if (msg.method === 'Runtime.exceptionThrown') report.runtimeErrors.push({ case: current, message: msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text });
    if (msg.method === 'Network.requestWillBeSent' && msg.params.request.url.startsWith(base) && msg.params.type !== 'WebSocket') {
      if (msg.params.request.url.endsWith('/IngredientSources.json')) ingredientSourceRequests.push({ case: current, url: msg.params.request.url });
      requests.set(msg.params.requestId, {url:msg.params.request.url,type:msg.params.type,loaderId:msg.params.loaderId,frameId:msg.params.frameId});
      recordNetwork(msg.method, {requestId:msg.params.requestId,...requests.get(msg.params.requestId)});
    }
    if (['Network.loadingFinished', 'Network.loadingFailed'].includes(msg.method)) {
      recordNetwork(msg.method, {requestId:msg.params.requestId,errorText:msg.params.errorText});
      requests.delete(msg.params.requestId);
    }
    if (msg.method === 'Network.responseReceived' && !deliberateFailure && msg.params.response.url.startsWith(base) && msg.params.response.status >= 500) report.serverErrors.push({ case: current, url: new URL(msg.params.response.url).pathname, status: msg.params.response.status });
    if (msg.method === 'Fetch.requestPaused') {
      if (fetchMode === 'hold') heldRequests.push(msg.params.requestId);
      else await send(fetchMode === 'fail' ? 'Fetch.failRequest' : 'Fetch.continueRequest', { requestId: msg.params.requestId, ...(fetchMode === 'fail' ? { errorReason: 'Failed' } : {}) });
    }
  });
  evaluate = async expression => { const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Page.setLifecycleEventsEnabled', {enabled:true});
  // Focused interaction runs also need a same-origin document before using storage.
  await navigate('home');
  if (['all','matrix'].includes(suite)) await matrix();
  if (['all','travel'].includes(suite)) await travel();
  if (['all','tools'].includes(suite)) { await toolsRegression(); await reverseAlchemyRegression(); await factionAndLevelRegression(); await savedTravel(); }
  if (['all','settings'].includes(suite)) await settingsRegression();
  if (['all','polish'].includes(suite)) await polishRegression();
  await send('Browser.close').catch(() => {});
})().catch(error => { if (!report.cases.some(item => item.name === current && !item.passed)) report.cases.push({ name: current, passed: false, error: error.stack }); }).finally(() => {
  socket?.close(); chrome.kill(); report.finished = new Date().toISOString();
  report.failed = report.cases.filter(item => !item.passed).length + report.runtimeErrors.length + report.serverErrors.length + (report.cases.length ? 0 : 1);
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  if (args.includes('--trace-network')) fs.writeFileSync(path.join(output, 'network-trace.json'), JSON.stringify(networkTrace, null, 2));
  console.log(JSON.stringify({ cases: report.cases.length, failed: report.failed, output }));
  process.exitCode = report.failed ? 1 : 0;
});
