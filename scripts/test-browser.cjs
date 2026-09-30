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
if (!['all', 'matrix', 'travel', 'tools'].includes(suite)) throw Error('Use --suite all, matrix, travel or tools.');
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
const report = { base, suite, gitHead, bundle, started: new Date().toISOString(), cases: [], runtimeErrors: [], serverErrors: [] };
let socket, send, evaluate, current = 'setup', deliberateFailure = false, fetchMode = null;
const heldRequests = [], requests = new Set();

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
  }
}
async function until(expression, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { if (await evaluate(`Boolean(${expression})`)) return; await pause(100); }
  throw Error(`Timed out: ${expression}`);
}
async function idle() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) { if (!requests.size) { await pause(250); if (!requests.size) return; } await pause(100); }
  throw Error('Local page requests did not settle.');
}
async function navigate(route, profile = 'vanilla', extra = '') {
  const query = profile === 'vanilla' ? 'world=vanilla&arce=0' : `world=tr&arce=${profile === 'tr_arce' ? 1 : 0}`;
  await send('Page.navigate', { url: `${base}/${route === 'home' ? '' : route}?${query}${extra}` });
  await until('document.readyState === "complete" && document.querySelector("main h1")');
  await idle();
  await evaluate('document.fonts.ready.then(() => true)');
}
async function viewport(width) { await send('Emulation.setDeviceMetricsOverride', { width, height: width < 600 ? 844 : 900, deviceScaleFactor: 1, mobile: false }); }
async function screenshot(name) {
  const capture = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(output, `${name}.png`), Buffer.from(capture.data, 'base64'));
}
async function key(key, code, number, modifiers = 0) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: number, modifiers });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: number, modifiers });
  await pause(80);
}
async function click(selector) {
  await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing control');el.scrollIntoView({block:'center'});})()`);
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

async function matrix() {
  const routes = ['home', 'builder', 'equipment', 'challenge', 'leveler', 'factions', 'alchemy', 'enchanting', 'spellmaking', 'travel', 'vault', 'account', 'about', 'changelog', 'privacy', 'terms'];
  for (const profile of ['vanilla', 'tr', 'tr_arce']) for (const width of [1366, 390]) for (const route of routes) {
    await check(`${route}/${profile}/${width}`, async () => {
      await viewport(width); await navigate(route === 'equipment' ? 'builder' : route, profile);
      if (route === 'equipment') {
        await select('#builder-race', 'Khajiit');
        await click('#btn-tab-equipment'); await idle(); await until('document.querySelector(".equipment-studio-root")');
      }
      const headings = await evaluate(`document.querySelectorAll('main h1').length`);
      assert.equal(headings, 1, 'Exactly one page h1');
      const themes = [];
      for (const theme of ['ashfall', 'morrowind']) {
        await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`); await pause(100);
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

async function toolsRegression() {
  await send('Browser.grantPermissions', { origin: base, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
  for (const profile of ['vanilla', 'tr', 'tr_arce']) for (const width of [1366, 390]) {
    await check(`Tool inputs/sharing/navigation/${profile}/${width}`, async () => {
      await viewport(width);
      for (const [route, prefix] of [['alchemy','alc'], ['enchanting','ench'], ['spellmaking','spell']]) {
        await navigate(route, profile);
        await click(`#${prefix}-toggle-custom-stats`);
        await type(`#${prefix}-skill-input`, '60');
        assert.equal(await evaluate(`document.getElementById('${prefix}-skill-input').value`), '60');
        await button('Reset to character sheet');
        if (route === 'alchemy') {
          assert.equal(await evaluate(`document.querySelector('[aria-label="Crucible 1 ingredient"]').value`), '', 'Empty ingredients');
          await select('[aria-label="Crucible 1 ingredient"]', 'Wickwheat');
          await select('[aria-label="Crucible 2 ingredient"]', 'Marshmerrow');
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
      await send('Page.navigate', {url:shared}); await until('document.querySelector(".run-summary-sheet")'); await idle();
      if (width < 600) await button('Run Summary Sheet');
      await button('Copy Summary'); await pause(100);
      assert.equal(await evaluate('navigator.clipboard.readText()'), summary, 'Share restores identical run');
      await type('#challenge-seed-input', seed); await button('Load'); await idle();
      await click('[title="Copy run summary in markdown format"]'); await pause(100);
      assert.equal(await evaluate('navigator.clipboard.readText()'), summary, 'Seed repeats identical run');
      await click('#react-btn-to-optimizer'); await until('document.querySelector("#panel-build:not([hidden])")');
      await click('#btn-tab-builder');
      await select('#builder-className', 'Custom Class');
      const characterFields = `['builder-race','builder-className','builder-sign','builder-spec','builder-fav1','builder-fav2'].map(id=>document.getElementById(id).value)`;
      const character = await evaluate(characterFields);
      await button('Copy Build Link'); await pause(100);
      const buildLink = await evaluate('navigator.clipboard.readText()');
      await send('Page.navigate', {url:buildLink}); await until('document.getElementById("builder-className")?.value === "Custom"'); await idle();
      assert.deepEqual(await evaluate(characterFields), character, 'Share restores character fields');
      await click('#btn-tab-equipment'); await idle();
      await click('.equipment-ledger [role=button]');
      await until('document.querySelector("[role=dialog]")');
      assert.ok(await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'), 'Dialog receives focus');
      await key('Tab', 'Tab', 9, 1);
      assert.ok(await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'), 'Dialog traps focus');
      await key('Escape', 'Escape', 27);
      assert.equal(await evaluate('Boolean(document.querySelector("[role=dialog]"))'), false);
      await screenshot(`tools-interactions-${profile}-${width}`);
      return { seed, exportedCharacters: true, equipmentDialog: true };
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
  for (const width of [1366,390]) await check(`Travel imported save/persistence/profiles/${width}`, async () => {
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
    await click(guild); await click(divine); await click(almsivi); await type(carried,'12.5');
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
    return { imported: true, restoredOverrides: true, profilesIsolated: true, reset: true };
  });
}

async function travel() {
  for (const width of [1366, 390]) {
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
      await send('Page.navigate', { url: shared }); await idle();
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
    await send('Page.navigate', { url: `${base}/travel?world=vanilla` });
    await until('document.getElementById("travel-network-status")?.textContent.includes("Loading travel network")');
    assert.equal(await evaluate('document.querySelectorAll("#travel-network-status").length'), 1);
    assert.equal(await evaluate('/0 stops/.test(document.getElementById("travel-network-status").textContent)'), false);
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

(async () => {
  let port;
  for (let i = 0; i < 100; i++) { try { port = fs.readFileSync(path.join(chromeProfile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; break; } catch { await pause(100); } }
  if (!port) throw Error('Chrome did not start.');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve); socket.addEventListener('error', reject); });
  let id = 0; const pending = new Map();
  send = (method, params = {}) => new Promise((resolve, reject) => {
    const n = ++id, timer = setTimeout(() => { pending.delete(n); reject(Error(`CDP timeout: ${method}`)); }, 45000);
    pending.set(n, { resolve, reject, timer }); socket.send(JSON.stringify({ id: n, method, params }));
  });
  socket.addEventListener('message', async event => {
    const msg = JSON.parse(event.data);
    if (msg.id) { const p = pending.get(msg.id); if (p) { pending.delete(msg.id); clearTimeout(p.timer); msg.error ? p.reject(Error(msg.error.message)) : p.resolve(msg.result); } }
    if (msg.method === 'Runtime.exceptionThrown') report.runtimeErrors.push({ case: current, message: msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text });
    if (msg.method === 'Network.requestWillBeSent' && msg.params.request.url.startsWith(base) && msg.params.type !== 'WebSocket') requests.add(msg.params.requestId);
    if (['Network.loadingFinished', 'Network.loadingFailed'].includes(msg.method)) requests.delete(msg.params.requestId);
    if (msg.method === 'Network.responseReceived' && !deliberateFailure && msg.params.response.url.startsWith(base) && msg.params.response.status >= 500) report.serverErrors.push({ case: current, url: new URL(msg.params.response.url).pathname, status: msg.params.response.status });
    if (msg.method === 'Fetch.requestPaused') {
      if (fetchMode === 'hold') heldRequests.push(msg.params.requestId);
      else await send(fetchMode === 'fail' ? 'Fetch.failRequest' : 'Fetch.continueRequest', { requestId: msg.params.requestId, ...(fetchMode === 'fail' ? { errorReason: 'Failed' } : {}) });
    }
  });
  evaluate = async expression => { const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  if (['all','matrix'].includes(suite)) await matrix();
  if (['all','travel'].includes(suite)) await travel();
  if (['all','tools'].includes(suite)) { await toolsRegression(); await savedTravel(); }
  await send('Browser.close').catch(() => {});
})().catch(error => { report.cases.push({ name: current, passed: false, error: error.stack }); }).finally(() => {
  socket?.close(); chrome.kill(); report.finished = new Date().toISOString();
  report.failed = report.cases.filter(item => !item.passed).length + report.runtimeErrors.length + report.serverErrors.length + (report.cases.length ? 0 : 1);
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ cases: report.cases.length, failed: report.failed, output }));
  process.exitCode = report.failed ? 1 : 0;
});
