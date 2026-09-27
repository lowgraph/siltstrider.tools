const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const postcss = require('postcss');

const globalsCss = fs.readFileSync('app/globals.css', 'utf8');
const ashfallCss = fs.readFileSync('app/theme-ashfall.css', 'utf8');
const root = postcss.parse(globalsCss);

test('desktop topbar defines minimum height of 150px and flex-start alignment canonically in globals.css', () => {
  let desktopMinHeightFound = false;
  let desktopFlexStartFound = false;

  root.walkAtRules('media', atRule => {
    if (atRule.params.includes('min-width: 900px') && !atRule.params.includes('max-width')) {
      atRule.walkRules(rule => {
        if (rule.selector === '.topbar') {
          rule.walkDecls('min-height', decl => {
            if (decl.value === '150px') desktopMinHeightFound = true;
          });
          rule.walkDecls('align-items', decl => {
            if (decl.value === 'flex-start') desktopFlexStartFound = true;
          });
        }
        if (rule.selector === '#react-header-slot .topbar') {
          rule.walkDecls('align-items', decl => {
            if (decl.value.includes('flex-start')) desktopFlexStartFound = true;
          });
        }
      });
    }
  });

  assert.ok(desktopMinHeightFound, 'globals.css must set .topbar min-height: 150px at min-width: 900px');
  assert.ok(desktopFlexStartFound, 'globals.css must set .topbar align-items: flex-start at min-width: 900px');
});

test('medium desktop (900px-1349px) wraps topbar and positions actions on row 1 for both themes', () => {
  let wrapFound = false;
  let actionsTopFound = false;
  let toolsFlexFound = false;

  root.walkAtRules('media', atRule => {
    if (atRule.params.includes('min-width: 900px') && atRule.params.includes('max-width: 1349px')) {
      atRule.walkRules(rule => {
        if (rule.selector === '.topbar') {
          rule.walkDecls('flex-wrap', decl => {
            if (decl.value === 'wrap') wrapFound = true;
          });
        }
        if (rule.selector === '.header-actions') {
          rule.walkDecls('top', decl => {
            if (decl.value === '18px') actionsTopFound = true;
          });
          rule.walkDecls('bottom', decl => {
            if (decl.value === 'auto') actionsTopFound = true;
          });
        }
        if (rule.selector.includes('.header-tools')) {
          rule.walkDecls('flex', decl => {
            if (decl.value.includes('100%')) toolsFlexFound = true;
          });
        }
      });
    }
  });

  assert.ok(wrapFound, 'medium desktop must set .topbar flex-wrap: wrap');
  assert.ok(actionsTopFound, 'medium desktop must set .header-actions top: 18px and bottom: auto');
  assert.ok(toolsFlexFound, 'medium desktop must set .header-tools flex: 1 1 100%');
});

test('structural header layout is universal and not gated behind :root[data-theme="ashfall"]', () => {
  // Ensure theme-ashfall.css does not retain duplicate scoped topbar layout wrappers
  const ashfallRoot = postcss.parse(ashfallCss);
  let scopedWrapFound = false;

  ashfallRoot.walkAtRules('media', atRule => {
    if (atRule.params.includes('min-width: 900px')) {
      atRule.walkRules(rule => {
        if (rule.selector.includes(':root[data-theme="ashfall"]') && rule.selector.includes('.topbar') && !rule.selector.includes('brand')) {
          rule.walkDecls('flex-wrap', decl => {
            if (decl.value === 'wrap') scopedWrapFound = true;
          });
        }
      });
    }
  });

  assert.equal(scopedWrapFound, false, 'theme-ashfall.css must not isolate topbar wrapping from morrowind theme');
});
