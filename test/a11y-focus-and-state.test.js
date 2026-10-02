const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { pathToFileURL } = require('node:url');
const React = require('react');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const ASHFALL = fs.readFileSync(path.join(ROOT, 'app', 'theme-ashfall.css'), 'utf8');

/** Top-level rules of a stylesheet as { media, selector, body }, in file order. */
function rules(css) {
  const out = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let i = 0;
  const block = (from, media) => {
    let pos = from;
    while (pos < text.length) {
      const open = text.indexOf('{', pos), close = text.indexOf('}', pos);
      if (close !== -1 && (open === -1 || close < open)) return close + 1;
      if (open === -1) return text.length;
      const head = text.slice(pos, open).trim();
      if (head.startsWith('@media') || head.startsWith('@supports')) { pos = block(open + 1, head); continue; }
      const end = text.indexOf('}', open);
      out.push({ media, selector: head, body: text.slice(open + 1, end) });
      pos = end + 1;
    }
    return pos;
  };
  while (i < text.length) i = block(i, null);
  return out;
}

async function load(file, deps) {
  const full = path.join(ROOT, file);
  const code = require('esbuild').transformSync(fs.readFileSync(full, 'utf8'), { loader: 'jsx', format: 'cjs', jsx: 'automatic' }).code;
  for (const match of code.matchAll(/require\("([^"]+\.mjs)"\)/g)) {
    deps[match[1]] ??= await import(pathToFileURL(path.resolve(path.dirname(full), match[1])));
  }
  const mod = new Module(full, module);
  mod.paths = module.paths;
  mod.require = id => deps[id] || require(id);
  mod._compile(code, full);
  return mod.exports.default;
}

function mount() {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  return require('react-dom/client').createRoot(document.getElementById('root'));
}

test('the modern theme draws focus with an outline that no state rule can clear', () => {
  const all = rules(ASHFALL);
  const focus = all.filter(r => r.selector.includes(':focus-visible') && !r.media);
  const general = focus.find(r => /^:root\[data-theme="ashfall"\] :focus-visible$/.test(r.selector));
  assert.ok(general, 'a theme-wide :focus-visible rule');
  assert.match(general.body, /outline:\s*2px solid var\(--color-accent\)/);
  // Only text fields may switch the outline off: they show focus by border and halo.
  for (const r of focus.filter(r => /outline:\s*(none|0)\b/.test(r.body))) {
    assert.match(r.selector, /^:root\[data-theme="ashfall"\] :is\(select, \.mw-select, input, textarea\):focus/, `${r.selector} hides the ring`);
  }
  assert.doesNotMatch(ASHFALL, /--af-ring|box-shadow:\s*var\(--af-ring\)/, 'no box-shadow ring left to be cleared');
});

test('in Windows high contrast every focused control gets an outline, inputs included', () => {
  const all = rules(ASHFALL);
  const forced = all.filter(r => r.media && r.media.includes('forced-colors: active'));
  assert.equal(forced.length, 1);
  const [rule] = forced;
  assert.equal(all[all.length - 1], rule, 'last in the file, so it wins ties with the input rule');
  assert.match(rule.selector, /:is\(select, \.mw-select, input, textarea, \*\):focus-visible/, 'as specific as the input rule');
  assert.match(rule.body, /outline:\s*2px solid Highlight !important/);
  // The rule it must beat: same specificity, earlier in the file.
  const input = all.findIndex(r => r.selector.startsWith(':root[data-theme="ashfall"] :is(select, .mw-select, input, textarea):focus-visible'));
  assert.ok(input !== -1 && input < all.indexOf(rule));
});

test('the Manual Step Override disclosure says whether it is open and what it opens', async () => {
  const stub = () => null;
  const LevelStepEditor = await load('components/level-simulator/level-step-editor.jsx', {
    './level-itinerary-card': { __esModule: true, default: stub }, './attribute-priority-ranker': { __esModule: true, default: stub }
  });
  const root = mount();
  try {
    await React.act(async () => root.render(React.createElement(LevelStepEditor, {
      currentState: null, steps: [], stepIndex: 0, targetLevel: 2, levelCap: 50, priority: [], mode: 'stats_only',
      onStepIndexChange() {}, onTargetLevelChange() {}, onSelectArchetype() {}, onReorderPriority() {},
      onApplyStrategy() {}, onResetPlan() {}, onApplyManualStep() {}
    })));
    const button = document.querySelector('.manual-edit-disclosure > button');
    assert.equal(button.getAttribute('aria-expanded'), 'false');
    assert.equal(button.getAttribute('aria-controls'), null, 'no reference to a form that is not there');
    assert.match(button.className, /\bbg-transparent\b/, 'no browser-default grey behind the text');
    await React.act(async () => button.click());
    assert.equal(button.getAttribute('aria-expanded'), 'true');
    const form = document.getElementById(button.getAttribute('aria-controls'));
    assert.ok(form && form.classList.contains('manual-step-form'), 'it controls the form it opened');
    await React.act(async () => button.click());
    assert.equal(button.getAttribute('aria-expanded'), 'false');
    assert.equal(document.getElementById('manual-step-form'), null);
  } finally {
    await React.act(async () => root.unmount());
  }
});

test('the enchantment type buttons announce which one is chosen, and only one is', async () => {
  const data = { status: 'ready', data: { profile: 'vanilla', catalogs: {
    Attributes: [], Skills: [], MagicEffects: [], GameSettings: [],
    EffectRules: [{ key: 'fire', name: 'Fire Damage', baseCost: 5, school: 'destruction', allowEnchanting: true, allowSpellmaking: true, castSelf: true, castTouch: true, castTarget: true }]
  } } };
  const Enchanting = await load('components/calculators/enchanting/enchanting-workstation.jsx', {
    '../../character-context': { useActiveCharacter: () => ({ build: {}, sheet: {} }) },
    '../../shell-context': { useShell: () => ({ profile: 'vanilla', world: 'vanilla' }) },
    '../../active-character-link': require('./helpers/active-character-link.cjs'),'./reverse-alchemy': require('./helpers/reverse-alchemy.cjs'),'./ingredient-combobox': require('./helpers/ingredient-combobox.cjs'),
    '../../use-game-data': { useGameData: () => data }
  });
  const root = mount();
  try {
    await React.act(async () => root.render(React.createElement(Enchanting)));
    const group = document.querySelector('[role="group"][aria-labelledby="enchant-type-label"]');
    assert.ok(group, 'a labelled group');
    assert.equal(document.getElementById('enchant-type-label').textContent.trim(), 'Enchantment Type');
    const buttons = [...group.querySelectorAll('button')];
    const pressed = () => buttons.filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.textContent.trim());
    assert.equal(pressed().length, 1);
    const strike = buttons.find(b => b.textContent.trim() === 'On Strike');
    assert.equal(strike.disabled, true, 'apparel cannot use On Strike');
    await React.act(async () => {
      const item = document.querySelector('#enchant-item-select');
      item.value = 'Ebony Staff'; item.dispatchEvent(new window.Event('change', {bubbles:true}));
    });
    await React.act(async () => strike.click());
    assert.deepEqual(pressed(), ['On Strike']);
    const constant = buttons.find(b => b.textContent.trim() === 'Constant');
    assert.equal(constant.getAttribute('aria-pressed'), 'false', 'a disabled choice still reports its state');
  } finally {
    await React.act(async () => root.unmount());
  }
});
