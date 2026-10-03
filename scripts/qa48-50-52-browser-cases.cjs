const assert = require('node:assert/strict');

async function setup(c, view, profile, width, theme, query = '') {
  await c.viewport(width);
  await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
  await c.navigate(view, profile, query);
  await c.waitForFonts();
}

async function finish(c, name) {
  assert.equal(await c.evaluate('document.documentElement.scrollWidth > innerWidth + 1'), false, 'Page fits the viewport');
  c.assertAccessible(await c.audit(name));
  await c.screenshot(name);
}

module.exports = async c => {
  for (const profile of ['vanilla', 'tr', 'tr_arce']) for (const width of [375, 390, 1366]) for (const theme of ['ashfall', 'morrowind']) await c.check(`QA-48/${profile}/${width}/${theme}`, async () => {
    await setup(c, 'leveler', profile, width, theme);
    await c.until('document.querySelector(".priority-list")');
    await c.evaluate('document.querySelector(".priority-list").scrollIntoView({block:"center"})');
    const tiles = await c.evaluate(`([...document.querySelectorAll('.priority-list > div')].map(tile => {
      const label=tile.querySelector('span[title]'), range=document.createRange();range.selectNodeContents(label);
      const t=tile.getBoundingClientRect(), l=label.getBoundingClientRect(), buttons=[...tile.querySelectorAll('button')].map(b=>b.getBoundingClientRect());
      return {name:label.title, text:label.textContent.trim(), lines:new Set([...range.getClientRects()].filter(r=>r.width>0).map(r=>Math.round(r.top))).size,
        inside:l.left>=t.left&&l.right<=t.right&&buttons.every(b=>b.left>=t.left&&b.right<=t.right), separate:l.right<=buttons[0].left};
    }))`);
    (c.report.priorityTiles ||= []).push({profile,width,theme,tiles});
    await c.screenshot(`QA-48-layout-${profile}-${width}-${theme}`);
    assert.equal(tiles.length, 8);
    for (const tile of tiles) {
      assert.equal(tile.lines, 1, `${tile.name} stays whole: ${JSON.stringify(tile)}`);
      assert.equal(tile.inside, true, `${tile.name} fits its tile`);
      assert.equal(tile.separate, true, `${tile.name} leaves room for arrows`);
    }
    const first=tiles[0].name, second=tiles[1].name;
    await c.click(`button[aria-label="Move ${first} down"]`);
    await c.until(`document.querySelector('.priority-list span[title]').title===${JSON.stringify(second)}`);
    await c.click(`button[aria-label="Move ${first} up"]`);
    await c.until(`document.querySelector('.priority-list span[title]').title===${JSON.stringify(first)}`);
    assert.equal(await c.evaluate('document.querySelector(".priority-list button").disabled'), true);
    assert.equal(await c.evaluate('[...document.querySelectorAll(".priority-list button")].at(-1).disabled'), true);
    await finish(c, `QA-48-${profile}-${width}-${theme}`);
    return {tiles,reorder:true,boundaries:true};
  });
};
