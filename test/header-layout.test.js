const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const postcss = require('postcss');

const globalsCss = fs.readFileSync('app/globals.css', 'utf8');
const ashfallCss = fs.readFileSync('app/theme-ashfall.css', 'utf8');
const root = postcss.parse(globalsCss);

test('desktop topbar uses clean 2-row layout with flex-wrap: wrap and avoids excessive min-height', () => {
  let desktopWrapFound = false;
  let forced150pxFound = false;

  root.walkAtRules('media', atRule => {
    if (atRule.params.includes('min-width: 900px') && !atRule.params.includes('max-width')) {
      atRule.walkRules(rule => {
        if (rule.selector === '.topbar') {
          rule.walkDecls('flex-wrap', decl => {
            if (decl.value === 'wrap') desktopWrapFound = true;
          });
          rule.walkDecls('min-height', decl => {
            if (decl.value === '150px') forced150pxFound = true;
          });
        }
      });
    }
  });

  assert.ok(desktopWrapFound, 'globals.css must set .topbar flex-wrap: wrap at min-width: 900px');
  assert.equal(forced150pxFound, false, 'globals.css must not force .topbar min-height: 150px to prevent excessive top space');
});

test('desktop topbar brand does not collapse to 0 flex-basis and leaves room for header actions', () => {
  let brandCollapseFound = false;
  let brandHeadroomFound = false;

  root.walkAtRules('media', atRule => {
    if (atRule.params.includes('min-width: 900px') && !atRule.params.includes('max-width')) {
      atRule.walkRules(rule => {
        if (rule.selector === '.brand' || rule.selector === '.topbar .brand') {
          rule.walkDecls('flex', decl => {
            if (decl.value === '1 1 0' || decl.value === '0 1 0px') brandCollapseFound = true;
          });
          rule.walkDecls('max-width', decl => {
            if (decl.value.includes('calc(100% - 480px)')) brandHeadroomFound = true;
          });
        }
      });
    }
  });

  assert.equal(brandCollapseFound, false, '.brand must not collapse to flex-basis 0');
  assert.ok(brandHeadroomFound, '.brand must have max-width: calc(100% - 480px) headroom to prevent clipping title');
});

test('header actions (row 1) and header tools (row 2) are separated across all desktop viewports', () => {
  let actionsRow1Found = false;
  let toolsRow2Found = false;

  root.walkAtRules('media', atRule => {
    if (atRule.params.includes('min-width: 900px') && !atRule.params.includes('max-width')) {
      atRule.walkRules(rule => {
        if (rule.selector === '.header-actions') {
          let hasTop = false;
          let hasBottomAuto = false;
          rule.walkDecls('top', decl => { if (decl.value === '14px') hasTop = true; });
          rule.walkDecls('bottom', decl => { if (decl.value === 'auto') hasBottomAuto = true; });
          if (hasTop && hasBottomAuto) actionsRow1Found = true;
        }
        if (rule.selector.includes('.header-tools')) {
          rule.walkDecls('flex', decl => {
            if (decl.value.includes('100%')) toolsRow2Found = true;
          });
        }
      });
    }
  });

  assert.ok(actionsRow1Found, 'header-actions must be positioned on Row 1 (top: 14px, bottom: auto)');
  assert.ok(toolsRow2Found, 'header-tools must be full-width (flex: 1 1 100%) on Row 2');
});

test('structural header layout is universal and not gated behind :root[data-theme="ashfall"]', () => {
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
