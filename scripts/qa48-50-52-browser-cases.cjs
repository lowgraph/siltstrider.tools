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

async function brokenWords(c, selector) {
  return c.evaluate(`(()=>{const broken=[];for(const root of document.querySelectorAll(${JSON.stringify(selector)})){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode()){
      const n=walker.currentNode;if(!n.parentElement.getClientRects().length)continue;
      for(const m of n.textContent.matchAll(/[A-Za-z0-9]{2,}/g)){const r=document.createRange();r.setStart(n,m.index);r.setEnd(n,m.index+m[0].length);
        if(new Set([...r.getClientRects()].filter(b=>b.width>0).map(b=>Math.round(b.top))).size>1)broken.push(m[0]);}
    }}return broken})()`);
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
  for (const profile of ['vanilla', 'tr', 'tr_arce']) for (const width of [375, 390, 1366]) for (const theme of ['ashfall', 'morrowind']) await c.check(`QA-49/${profile}/${width}/${theme}`, async () => {
    await setup(c, 'enchanting', profile, width, theme);
    const list='[aria-label="Ranked enchanters"]';
    await c.until(`document.querySelector('${list}')?.children.length>0`);
    await c.evaluate(`document.querySelector('${list}').scrollIntoView({block:'center'})`);
    const read=()=>c.evaluate(`([...document.querySelectorAll('${list} > div')].map(row=>{
      const name=row.querySelector('.font-serif'),range=document.createRange();range.selectNodeContents(name);
      const n=name.getBoundingClientRect(),price=row.lastElementChild.getBoundingClientRect(),r=row.getBoundingClientRect();
      return {text:name.textContent.trim(),clipped:name.scrollWidth>name.clientWidth+1||getComputedStyle(name).textOverflow==='ellipsis',
        contained:n.left>=r.left&&n.right<=r.right&&(n.right<=price.left+1||n.bottom<=price.top+1),price:row.lastElementChild.textContent.trim(),
        lines:new Set([...range.getClientRects()].filter(b=>b.width>0).map(b=>Math.round(b.top))).size};
    }))`);
    const rows=await read();(c.report.enchanterRows ||= []).push({profile,width,theme,rows});
    await c.screenshot(`QA-49-layout-${profile}-${width}-${theme}`);
    assert.ok(rows.length>0);
    for(const row of rows){assert.equal(row.clipped,false,'Full name and place are visible: '+JSON.stringify(row));assert.equal(row.contained,true,'Names leave room for price');}
    assert.deepEqual(await brokenWords(c,`${list} .font-serif`),[],'Names wrap between words');
    await c.type('[aria-label="Search enchanters"]','Audenian Valius');
    await c.until(`document.querySelector('${list}')?.firstElementChild?.textContent.includes('Audenian Valius')`);
    const searched=await read();assert.equal(searched.length,1);assert.match(searched[0].text,/vivec.*telvanni/i);
    assert.equal(searched[0].clipped,false);assert.deepEqual(await brokenWords(c,`${list} .font-serif`),[]);
    await c.click(`${list} > :first-child`);
    assert.equal(await c.evaluate(`document.querySelector('${list} > :first-child').classList.contains('border-accent')`),true);
    const effectLabel=await c.evaluate(`[...document.querySelector('select[aria-label="Effect 1"]').options].find(o=>o.textContent.includes('Restore Health')).textContent.trim()`);
    await c.select('select[aria-label="Effect 1"]',effectLabel);
    await c.until(`document.querySelector('${list} > div')?.lastElementChild.textContent.trim().endsWith(' g')`);
    const priced=await read();assert.match(priced[0].price,/^[\d,]+ g$/);assert.equal(priced[0].clipped,false);assert.equal(priced[0].contained,true);
    await c.type('[aria-label="Search enchanters"]','');
    await c.evaluate(`document.querySelector('${list}').scrollTop=document.querySelector('${list}').scrollHeight`);
    const last=await c.evaluate(`(()=>{const l=document.querySelector('${list}'),r=l.lastElementChild,a=r.getBoundingClientRect(),b=l.getBoundingClientRect();return {inside:a.bottom<=b.bottom+1,scrollable:l.scrollHeight>l.clientHeight}})()`);
    assert.equal(last.inside,true,'The last enchanter can be scrolled into view');
    await finish(c,`QA-49-${profile}-${width}-${theme}`);
    return {rows,searched,last,selection:true};
  });
};
