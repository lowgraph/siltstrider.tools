const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const postcss = require('postcss');
const css = postcss.parse(fs.readFileSync('app/globals.css', 'utf8'));

test('root layout uses consolidated global styles before theme overrides', () => {
  const layout = fs.readFileSync('app/layout.jsx', 'utf8');
  assert.doesNotMatch(layout, /legacy-compat/);
  assert.ok(layout.indexOf("import './globals.css'") < layout.indexOf("import './theme-ashfall.css'"));
  assert.equal(fs.existsSync('app/legacy-compat.css'), false);
  const fonts = [];
  css.walkAtRules('font-face', rule => fonts.push(rule));
  assert.equal(fonts.length, 1, 'Pelagiad has one canonical font-face');
  assert.match(css.toString(), /SIL OPEN FONT LICENSE/);
});

test('dynamically generated vital classes keep their theme-aware gradients', () => {
  for (const kind of ['health', 'magicka', 'fatigue']) {
    const rules = [];
    css.walkRules(`.vital-${kind}`, rule => rules.push(rule));
    assert.ok(rules.some(rule => rule.nodes.some(d => d.prop === 'background' && d.value === `var(--gradient-${kind})`)));
  }
});

test('retired control selectors are absent while mobile navigation remains styled', () => {
  for (const file of ['app/globals.css', 'app/theme-ashfall.css']) {
    postcss.parse(fs.readFileSync(file, 'utf8')).walkRules(rule => {
      assert.doesNotMatch(rule.selector, /#(?:enc-out|challenge-advanced|account-status|account-user|react-arce)\b/);
    });
  }
  const media = [];
  css.walkAtRules('media', rule => media.push(rule.toString()));
  assert.ok(media.some(rule => rule.includes('.menu-drawer')));
  assert.ok(media.some(rule => rule.includes('.phone-tabs')));
});

test('Ashfall grouped selectors retain active typography and calculator field overrides', () => {
  const theme = postcss.parse(fs.readFileSync('app/theme-ashfall.css', 'utf8'));
  const rules = [];
  theme.walkRules(rule => rules.push(rule));
  assert.ok(rules.some(rule => rule.selector.includes(':is(.kicker, .btn)') &&
    rule.nodes.some(d => d.prop === 'font-family' && d.value === 'var(--font-sans)')));
  assert.ok(rules.some(rule => rule.selector.includes('#panel-alchemy') && rule.selector.includes('input[type="number"]') &&
    rule.nodes.some(d => d.prop === 'border-radius' && d.value === '10px' && d.important)));
  assert.ok(rules.some(rule => rule.selector.includes(':is(.region-tag, .gear-ar-tag)')));
});
