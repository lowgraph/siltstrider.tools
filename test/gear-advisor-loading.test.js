const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = React;

// BLD-2 review: the Gear Advisor ranks as soon as the build changes, but its catalogs
// (about 180 KB compressed in vanilla, 530 KB in TR) load only when it nears the screen,
// or when asked for. useGameData is replaced to record whether loading is on, and
// gearRanking is counted, so no catalog is fetched here.
const ROOT = path.resolve(__dirname, '..');
const GEAR_ROWS = path.join(ROOT, 'lib', 'gear-rows.mjs');

async function loadAdvisor() {
  const result = await require('esbuild').build({
    entryPoints: [path.join(ROOT, 'components/character-builder/gear-advisor.jsx')],
    bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
    external: ['react', 'react/jsx-runtime'],
    plugins: [{
      name: 'gear-advisor-seams',
      setup(build) {
        build.onResolve({ filter: /use-game-data$/ }, () => ({ path: 'use-game-data', namespace: 'seam' }));
        build.onResolve({ filter: /gear-rows\.mjs$/ }, (args) => (args.namespace === 'seam' ? undefined : { path: 'gear-rows', namespace: 'seam' }));
        build.onLoad({ filter: /^use-game-data$/, namespace: 'seam' }, () => ({
          contents: `export function useGameData(feature, options) {
            const enabled = Boolean(options && options.enabled);
            globalThis.__gearLoads.push([feature, enabled]);
            return { status: enabled ? 'loading' : 'idle', retry() {} };
          }`,
          loader: 'js'
        }));
        build.onLoad({ filter: /^gear-rows$/, namespace: 'seam' }, () => ({
          contents: `export * from ${JSON.stringify(GEAR_ROWS)};
            import { gearRanking as real } from ${JSON.stringify(GEAR_ROWS)};
            export function gearRanking(...args) { globalThis.__rankings += 1; return real(...args); }`,
          resolveDir: ROOT, loader: 'js'
        }));
      }
    }]
  });
  const file = path.join(ROOT, 'gear-advisor-seamed.cjs');
  const m = new Module(file, module);
  m.paths = module.paths;
  m._compile(result.outputFiles[0].text, file);
  return m.exports;
}

const BUILD = { name: 'Hrolfa', race: 'Nord', gender: 'Female', spec: 'Combat', fav1: 'Strength', fav2: 'Endurance',
  maj: ['Heavy Armor', 'Long Blade', 'Block', 'Armorer', 'Athletics'], min: ['Restoration', 'Medium Armor', 'Spear', 'Mercantile', 'Speechcraft'] };

async function mount({ observer = null } = {}, check) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/builder' });
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const hadObserver = 'IntersectionObserver' in global;
  const saved = global.IntersectionObserver;
  if (observer) global.IntersectionObserver = observer; else delete global.IntersectionObserver;
  globalThis.__gearLoads = [];
  globalThis.__rankings = 0;
  const exports = await loadAdvisor();
  const root = createRoot(document.getElementById('root'));
  const render = (props) => act(async () => root.render(React.createElement(exports.default, { attrs: { Strength: 50, Endurance: 50 }, onEquip() {}, ...props })));
  try {
    await check(render);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    if (hadObserver) global.IntersectionObserver = saved; else delete global.IntersectionObserver;
  }
}
const loading = () => globalThis.__gearLoads.filter(([feature]) => feature === 'gear').map(([, on]) => on);

function fakeObserver() {
  const instances = [];
  class FakeObserver {
    constructor(callback, options) { this.callback = callback; this.options = options; this.targets = []; instances.push(this); }
    observe(el) { this.targets.push(el); }
    disconnect() { this.disconnected = true; }
    fire(isIntersecting) { this.callback(this.targets.map((target) => ({ target, isIntersecting }))); }
  }
  FakeObserver.instances = instances;
  return FakeObserver;
}

test('the catalogs wait until the advisor nears the screen; the ranking does not', async () => {
  const Observer = fakeObserver();
  await mount({ observer: Observer }, async (render) => {
    await render({ build: BUILD });
    assert.ok(loading().length > 0 && loading().every((on) => on === false), 'nothing loads on arrival');
    assert.ok(globalThis.__rankings >= 1, 'the ranking is computed at once');
    const [observer] = Observer.instances;
    assert.equal(observer.targets[0], document.getElementById('gear-advisor'), 'it watches the advisor');
    assert.match(observer.options.rootMargin, /^\d+px/, 'with a margin, so loading starts before it is on screen');
    await act(async () => observer.fire(false));
    assert.equal(loading().at(-1), false, 'still out of reach');
    await act(async () => observer.fire(true));
    assert.equal(loading().at(-1), true, 'near the screen: the catalogs load');
    assert.equal(observer.disconnected, true, 'and it stops watching');
  });
});

test('asking for gear before scrolling loads it too', async () => {
  await mount({ observer: fakeObserver() }, async (render) => {
    await render({ build: BUILD });
    const optimize = [...document.querySelectorAll('button')].find((b) => /Optimize Gear/.test(b.textContent));
    assert.ok(optimize);
    await act(async () => optimize.click());
    assert.equal(loading().at(-1), true);
  });
});

test('without an observer the catalogs load at once, as before', async () => {
  await mount({ observer: null }, async (render) => {
    await render({ build: BUILD });
    assert.equal(loading().at(-1), true);
  });
});

test('typing the name does not re-rank; changing a skill does', async () => {
  await mount({ observer: fakeObserver() }, async (render) => {
    await render({ build: BUILD });
    const first = globalThis.__rankings;
    for (const name of ['H', 'Hr', 'Hrolfa the Bold']) await render({ build: { ...BUILD, name } });
    assert.equal(globalThis.__rankings, first, 'no re-rank per keystroke');
    await render({ build: { ...BUILD, name: 'Hrolfa the Bold', maj: ['Axe', 'Long Blade', 'Block', 'Armorer', 'Athletics'] } });
    assert.equal(globalThis.__rankings, first + 1, 'a new major skill re-ranks');
    await render({ build: { ...BUILD, name: undefined, maj: ['Axe', 'Long Blade', 'Block', 'Armorer', 'Athletics'] } });
    assert.equal(globalThis.__rankings, first + 1, 'a missing name is the same build');
  });
});
