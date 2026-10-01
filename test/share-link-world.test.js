const { test } = require('node:test');
require('./helpers/pending-game-data.cjs');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');
const Module = require('node:module');
const path = require('node:path');

// LINK-1 for challenge run links (/challenge?run=...): the link's world wins over the one
// this browser kept, and a link that names no world leaves the kept one alone. The
// builder's links are covered in random-premade-start.test.js.
const bundled = require('esbuild').buildSync({
  stdin: { contents: `export * from './components/challenge-run-context.jsx';`, resolveDir: process.cwd() },
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime']
});
const fixture = new Module(path.resolve('share-link-world-fixture.cjs'), module);
fixture.paths = module.paths;
fixture._compile(bundled.outputFiles[0].text, path.resolve('share-link-world-fixture.cjs'));
const { ChallengeRunProvider, useChallengeRun } = fixture.exports;

const RUN = { race: 'Nord', sign: 'The Warrior', major: 'Join the Fighters Guild and reach Master.' };

async function runLink(world, arce) {
  const { encodeShareUrl } = await import('../lib/permalink-codec.mjs');
  const url = new URL('https://siltstrider.tools' + encodeShareUrl({ view: 'challenge', world: world || 'vanilla', arce: Boolean(arce), run: RUN }));
  if (!world) { url.searchParams.delete('world'); url.searchParams.delete('arce'); }
  return url.href;
}

async function open(url, storage) {
  const dom = new JSDOM('<div id="root"></div>', { url });
  for (const [key, value] of Object.entries(storage)) dom.window.localStorage.setItem(key, value);
  Object.assign(global, { window: dom.window, document: dom.window.document, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true });
  let challenge;
  function Probe() { challenge = useChallengeRun(); return null; }
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(ChallengeRunProvider, null, React.createElement(Probe))));
    return {
      race: challenge.run.race,
      profile: challenge.run.profile,
      kept: { world: window.localStorage.getItem('mw-world'), arce: window.localStorage.getItem('mw-arce') },
      search: window.location.search
    };
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
}

test('a run link that names no world opens the run and keeps the world this browser chose', async () => {
  const url = await runLink(null);
  assert.doesNotMatch(url, /world=|arce=/);
  const opened = await open(url, { 'mw-world': 'tr', 'mw-arce': '1' });
  assert.equal(opened.race, 'Nord', 'the run opens');
  assert.equal(opened.profile, 'tr_arce', 'a legacy seedless run captures the visitor world');
  assert.deepEqual(opened.kept, { world: 'tr', arce: '1' }, 'TR + ARCE is not reset to vanilla');
  assert.equal(opened.search, '', 'the address bar is clean');
});

test('a vanilla run link switches a TR + ARCE browser to vanilla', async () => {
  const opened = await open(await runLink('vanilla', false), { 'mw-world': 'tr', 'mw-arce': '1' });
  assert.equal(opened.race, 'Nord');
  assert.equal(opened.profile, 'vanilla');
  assert.deepEqual(opened.kept, { world: 'vanilla', arce: '0' });
});

test('a TR + ARCE run link on a first visit keeps TR + ARCE', async () => {
  const opened = await open(await runLink('tr', true), {});
  assert.equal(opened.race, 'Nord');
  assert.equal(opened.profile, 'tr_arce');
  assert.deepEqual(opened.kept, { world: 'tr', arce: '1' });
});
