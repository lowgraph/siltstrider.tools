const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot, hydrateRoot } = require('react-dom/client');
const { renderToString } = require('react-dom/server');
const { act } = React;
const ROOT = path.resolve(__dirname, '..');

function loadComponents() {
  const output = require('esbuild').buildSync({ stdin: { contents: `
    export { AccountProvider } from './components/account-context.jsx';
    export { AccountSettingsProvider, useAccountSettings } from './components/account-settings-context.jsx';
    export { ShellProvider, useShell } from './components/shell-context.jsx';
    export { ThemeProvider, useTheme } from './components/theme-provider.jsx';
    export { ChallengeRunProvider, useChallengeRun } from './components/challenge-run-context.jsx';
    export { default as SettingsPanel } from './components/account-settings-panel.jsx';
    export { GearAdvisorView } from './components/character-builder/gear-advisor.jsx';
  `, resolveDir: ROOT, loader: 'jsx' }, bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime'] });
  const filename = path.join(ROOT, 'settings-ui-memory.cjs');
  const compiled = new Module(filename, module);
  compiled.paths = module.paths;
  compiled._compile(output.outputFiles[0].text, filename);
  return compiled.exports;
}

async function mount(t, { url = 'https://siltstrider.tools/account', settings, revision = 1, owner = 'one', delay = null, children = null, hydrate = false, initialize } = {}) {
  const { defaultAccountSettings } = await import('../lib/account-settings.mjs');
  const dom = new JSDOM('<div id="root"></div>', { url });
  const previous = { fetch: global.fetch, Event: global.Event, window: global.window, document: global.document };
  Object.assign(global, { window: dom.window, document: dom.window.document, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true });
  const calls = [];
  let listener, stored = settings || defaultAccountSettings(), currentRevision = revision;
  window.Clerk = { loaded: true, user: owner ? { id: owner } : null,
    session: owner ? { getToken: async () => `token-${window.Clerk.user.id}` } : null,
    addListener: callback => { listener = callback; callback({ user: window.Clerk.user, session: window.Clerk.session }); return () => {}; } };
  initialize?.(window);
  global.fetch = async (url, options = {}) => {
    if (url === '/api/account') return Response.json({ username: null, iconId: 0 });
    assert.equal(url, '/api/settings');
    calls.push({ method: options.method, body: options.body && JSON.parse(options.body), auth: options.headers.Authorization });
    if (options.method === 'GET') return delay || Response.json({ settings: stored, revision: currentRevision });
    stored = JSON.parse(options.body).settings;
    currentRevision++;
    return Response.json({ settings: stored, revision: currentRevision });
  };
  const C = loadComponents();
  let observed;
  function Probe() { observed = { preferences: C.useAccountSettings(), shell: C.useShell(), theme: C.useTheme(), challenge: C.useChallengeRun() }; return null; }
  const tree = React.createElement(C.AccountProvider, null, React.createElement(C.AccountSettingsProvider, null,
    React.createElement(C.ThemeProvider, null, React.createElement(C.ShellProvider, { initialView: 'account' },
      React.createElement(C.ChallengeRunProvider, null, React.createElement(Probe), React.createElement(C.SettingsPanel), children?.(C))))));
  let root;
  if (hydrate) {
    const win = global.window, doc = global.document;
    delete global.window; delete global.document;
    const html = renderToString(tree);
    global.window = win; global.document = doc;
    document.getElementById('root').innerHTML = html;
    await act(async () => { root = hydrateRoot(document.getElementById('root'), tree); });
  } else {
    root = createRoot(document.getElementById('root'));
    await act(async () => root.render(tree));
  }
  t.after(async () => { await act(async () => root.unmount()); dom.window.close(); Object.assign(global, previous); });
  const changeOwner = async next => act(async () => {
    window.Clerk.user = next ? { id: next } : null;
    window.Clerk.session = next ? { getToken: async () => `token-${next}` } : null;
    listener({ user: window.Clerk.user, session: window.Clerk.session });
  });
  const choose = async (label, value) => act(async () => {
    const element = [...document.querySelectorAll('label')].find(item => item.textContent.startsWith(label))?.querySelector('select');
    assert.ok(element, label);
    element.value = value;
    element.dispatchEvent(new window.Event('change', { bubbles: true }));
  });
  return { C, calls, observe: () => observed, choose, changeOwner, dom };
}

test('account preferences hydrate without writes, apply world/theme/tools and need no username', async t => {
  const { defaultAccountSettings } = await import('../lib/account-settings.mjs');
  const settings = { ...defaultAccountSettings(), world: 'tr_arce', worldChosen: true, theme: 'morrowind', toolDefaults: { travel: {}, gear: { theft: true }, challenge: { preset: 'cursed' } } };
  const errors = [], previous = console.error;
  console.error = (...args) => { errors.push(args.join(' ')); previous(...args); };
  t.after(() => { console.error = previous; });
  const ui = await mount(t, { settings, hydrate: true });
  assert.equal(ui.observe().shell.profile, 'tr_arce');
  assert.equal(document.documentElement.dataset.theme, 'morrowind');
  assert.equal(ui.observe().challenge.settings.preset, 'cursed');
  assert.equal(ui.observe().preferences.revision, 1);
  assert.equal(ui.calls.filter(call => call.method === 'PUT').length, 0);
  assert.ok(document.querySelector('#settings-heading'));
  assert.equal(errors.length, 0, 'no hydration or React warnings');
});

test('World and theme clicks before a delayed response win without changing guest storage', async t => {
  const { defaultAccountSettings } = await import('../lib/account-settings.mjs');
  let resolve;
  const response = new Promise(yes => { resolve = yes; });
  const ui = await mount(t, { delay: response, initialize: win => { win.localStorage.setItem('mw-world', 'vanilla'); win.localStorage.setItem('silt-theme', 'ashfall'); } });
  await act(async () => { ui.observe().shell.setProfile('tr'); ui.observe().theme.setTheme('morrowind'); });
  await act(async () => resolve(Response.json({ settings: defaultAccountSettings(), revision: 3 })));
  assert.equal(ui.observe().preferences.settings.world, 'vanilla');
  assert.equal(ui.observe().preferences.settings.worldChosen, false);
  assert.equal(ui.observe().preferences.settings.theme, 'morrowind');
  assert.equal(ui.observe().shell.profile, 'tr');
  assert.equal(window.localStorage.getItem('mw-world'), 'vanilla');
  assert.equal(window.localStorage.getItem('silt-theme'), 'ashfall');
});

test('a cleaned shared world keeps priority over a late account default', async t => {
  const { defaultAccountSettings } = await import('../lib/account-settings.mjs');
  let resolve;
  const response = new Promise(yes => { resolve = yes; });
  const ui = await mount(t, { url: 'https://siltstrider.tools/account?world=vanilla&arce=0', delay: response });
  await act(async () => { window.history.replaceState({}, '', '/account'); window.dispatchEvent(new window.Event('silt-shell-change')); });
  await act(async () => resolve(Response.json({ settings: { ...defaultAccountSettings(), world: 'tr_arce', worldChosen: true }, revision: 1 })));
  assert.equal(ui.observe().shell.profile, 'vanilla');
  assert.equal(ui.observe().preferences.settings.world, 'tr_arce');
  assert.equal(ui.calls.filter(call => call.method === 'PUT').length, 0);
});

test('controls edit sparse world-specific choices and reset only the requested tool', async t => {
  const ui = await mount(t);
  await ui.choose('Tool default scope', 'dataset');
  await ui.choose('Edit tool defaults for', 'tr');
  await ui.choose('Assume Mages Guild membership', 'false');
  await ui.choose('Steal early gear', 'true');
  let settings = ui.observe().preferences.settings;
  assert.equal(settings.datasetOverrides[0].world, 'tr');
  assert.equal(settings.datasetOverrides[0].toolDefaults.travel.mageGuild, false);
  assert.equal(settings.datasetOverrides[0].toolDefaults.gear.theft, true);
  assert.deepEqual(settings.toolDefaults.travel, {});
  await act(async () => [...document.querySelectorAll('button')].find(button => button.textContent === 'Reset Travel defaults in every world').click());
  settings = ui.observe().preferences.settings;
  assert.deepEqual(settings.datasetOverrides[0].toolDefaults.travel, {});
  assert.equal(settings.datasetOverrides[0].toolDefaults.gear.theft, true);
  const future = [...document.querySelectorAll('label')].filter(label => ['Modpack', 'Mod version'].some(name => label.textContent.startsWith(name)));
  assert.ok(future.every(label => label.querySelector('select').disabled));
  assert.doesNotMatch(document.querySelector('.account-settings-panel').textContent, /quest.reward|difficult.encounter/i);
});

test('sign-out restores guest preferences rather than keeping the account document', async t => {
  const { defaultAccountSettings } = await import('../lib/account-settings.mjs');
  const ui = await mount(t, { settings: { ...defaultAccountSettings(), world: 'tr_arce', worldChosen: true, theme: 'morrowind' }, initialize: win => { win.localStorage.setItem('mw-world', 'tr'); win.localStorage.setItem('silt-theme', 'ashfall'); } });
  await ui.changeOwner(null);
  assert.equal(ui.observe().preferences.owner, null);
  assert.equal(ui.observe().preferences.settings.world, 'tr');
  assert.equal(ui.observe().shell.profile, 'tr');
  assert.equal(document.documentElement.dataset.theme, 'ashfall');
});

test('Gear defaults apply, while a current edit survives later settings changes', async t => {
  const { defaultAccountSettings } = await import('../lib/account-settings.mjs');
  const build = { race: 'Nord', gender: 'Female', maj: ['Long Blade'], min: [] };
  const ui = await mount(t, { settings: { ...defaultAccountSettings(), toolDefaults: { gear: { theft: true } } },
    children: C => React.createElement(C.GearAdvisorView, { build, result: { status: 'idle' }, bisResult: { status: 'idle' } }) });
  const checkbox = [...document.querySelectorAll('label')].find(label => label.textContent.includes('Steal early gear') && label.querySelector('input'))?.querySelector('input');
  assert.ok(checkbox);
  assert.equal(checkbox.checked, true);
  await act(async () => checkbox.click());
  await act(async () => ui.observe().preferences.update(settings => ({ ...settings, theme: 'morrowind' })));
  assert.equal(checkbox.checked, false);
});

test('edits save with the loaded revision and a fresh mount sees those preferences', async t => {
  const ui = await mount(t, { revision: 4 });
  await ui.choose('Theme', 'morrowind');
  await act(async () => ui.observe().preferences.retry());
  assert.equal(ui.calls.at(-1).method, 'PUT');
  assert.equal(ui.calls.at(-1).body.revision, 4);
  assert.equal(ui.observe().preferences.revision, 5);
  assert.equal(ui.observe().preferences.dirty, false);
  await act(async () => ui.observe().preferences.reload());
  assert.equal(ui.observe().preferences.settings.theme, 'morrowind');
  assert.equal(ui.observe().preferences.revision, 5);
});

test('a world-specific named Challenge preset replaces inherited dials coherently', async t => {
  const { defaultAccountSettings } = await import('../lib/account-settings.mjs');
  const ui = await mount(t, { settings: { ...defaultAccountSettings(), toolDefaults: { challenge: { preset: 'standard', restrictionCount: '3', objectiveCount: '2', allowedBands: { Easy: true, Medium: true, Hard: false, Grind: false } } } } });
  await ui.choose('Tool default scope', 'dataset');
  await ui.choose('Edit tool defaults for', 'vanilla');
  await ui.choose('Preset', 'cursed');
  assert.equal(ui.observe().challenge.settings.preset, 'cursed');
  assert.equal(ui.observe().challenge.settings.restrictionCount, '5');
  assert.equal(ui.observe().challenge.settings.allowedBands.Easy, false);
});

test('an open seed keeps its choices while account defaults change and can restore preferred settings', async t => {
  const ui = await mount(t);
  await act(async () => {
    ui.observe().challenge.setRun(run => ({ ...run, race: 'Nord', major: 'Keep this run' }));
    ui.observe().challenge.updateSettings({ preset: 'custom', restrictionCount: '1' }, { preferred: false });
  });
  await ui.choose('Preset', 'cursed');
  await ui.choose('Preferred world', 'tr');
  assert.equal(ui.observe().challenge.settings.restrictionCount, '1');
  assert.equal(ui.observe().challenge.run.major, 'Keep this run');
  await act(async () => ui.observe().challenge.restorePreferred());
  assert.equal(ui.observe().challenge.settings.preset, 'cursed');
  assert.equal(ui.observe().challenge.run.major, 'Keep this run');
});

test('reset all clears account scopes and preferences while retaining the generated run', async t => {
  const { defaultAccountSettings } = await import('../lib/account-settings.mjs');
  const settings = { ...defaultAccountSettings(), world: 'tr', theme: 'morrowind', overrideSaveToggles: true,
    defaultScope: 'dataset', toolDefaults: { travel: { objective: 'gold' } },
    datasetOverrides: [{ world: 'tr', modpackId: null, modVersionId: null, toolDefaults: { gear: { theft: true } } }] };
  const ui = await mount(t, { settings, revision: 6 });
  await act(async () => ui.observe().challenge.setRun(run => ({ ...run, race: 'Nord', major: 'Keep this run' })));
  await act(async () => [...document.querySelectorAll('button')].find(button => button.textContent === 'Reset all settings').click());
  assert.deepEqual(ui.observe().preferences.settings, defaultAccountSettings());
  assert.equal(ui.observe().shell.profile, 'vanilla');
  assert.equal(ui.observe().challenge.run.major, 'Keep this run');
  await act(async () => ui.observe().preferences.retry());
  assert.equal(ui.calls.at(-1).body.revision, 6);
  assert.deepEqual(ui.calls.at(-1).body.settings, defaultAccountSettings());
});


test('QA-23 account Preferred world is explicit; header and browser choices do not autosave it', async t => {
  const ui=await mount(t,{hydrate:true});
  assert.equal(ui.observe().preferences.settings.worldChosen,false);
  await ui.choose('Preferred world','tr_arce');
  assert.equal(ui.observe().preferences.settings.worldChosen,true);
  assert.equal(ui.observe().preferences.settings.world,'tr_arce');
  assert.equal(ui.observe().shell.profile,'tr_arce');
  await act(async()=>ui.observe().shell.setProfile('tr'));
  assert.equal(ui.observe().preferences.settings.world,'tr_arce');
  assert.equal(ui.observe().shell.profile,'tr');
  await ui.choose('Preferred world','browser');
  assert.equal(ui.observe().preferences.settings.worldChosen,false);
});

test('QA-23 legacy account world does not replace the browser or write during hydration', async t => {
  const ui=await mount(t,{hydrate:true,settings:{version:1,world:'vanilla'},initialize:win=>{
    win.localStorage.setItem('mw-world','tr');win.localStorage.setItem('mw-arce','1');
  }});
  assert.equal(ui.observe().shell.profile,'tr_arce');
  assert.equal(ui.observe().preferences.settings.version,2);
  assert.equal(ui.observe().preferences.settings.worldChosen,false);
  assert.equal(ui.calls.filter(call=>call.method==='PUT').length,0);
});
