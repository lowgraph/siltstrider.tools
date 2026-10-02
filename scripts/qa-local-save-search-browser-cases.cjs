const assert = require('node:assert/strict');
const KEY = 'siltstrider-saved-characters';

module.exports = async c => {
  for (const profile of ['vanilla', 'tr', 'tr_arce']) for (const width of [1366, 375]) for (const theme of ['ashfall', 'morrowind']) {
    await c.check(`QA-31/${profile}/${width}/${theme}`, async () => {
      const saved = ['a', 'b'].map(id => ({id, name: `QA – Local ${id}`, character: {race: 'Nord', className: 'Custom', sign: 'The Warrior'}}));
      const encoded = JSON.stringify(saved);
      await c.viewport(width);
      await c.evaluate(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('silt-theme',${JSON.stringify(theme)}); localStorage.setItem(${JSON.stringify(KEY)},${JSON.stringify(encoded)})`);
      await c.navigate('builder', profile);
      await c.until('document.querySelector(".builder-phone-tabs, #btn-tab-builder")');
      await c.builderTab('builder');
      const first = '[data-local-character-id="a"] [data-local-delete]';
      const stored = () => c.evaluate(`localStorage.getItem(${JSON.stringify(KEY)})`);
      await c.until(`document.querySelector(${JSON.stringify(first)})`);
      await c.click(first);
      await c.until('document.querySelector("[role=alertdialog]")');
      assert.equal(await stored(), encoded, 'Opening keeps every local character');
      assert.equal(await c.evaluate('document.activeElement.textContent'), 'Cancel', 'Cancel is the safe first focus');
      const dialog = await c.evaluate(`(()=>{const e=document.querySelector('[role=alertdialog]'),r=e.querySelector('div').getBoundingClientRect();return {name:document.getElementById(e.getAttribute('aria-labelledby')).textContent,description:document.getElementById(e.getAttribute('aria-describedby')).textContent,fits:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}})()`);
      assert.equal(dialog.name, 'Delete character?');
      assert.match(dialog.description, /QA – Local a.*cannot be undone/);
      assert.equal(dialog.fits, true, 'Confirmation fits the viewport');
      await c.key('Escape', 'Escape', 27);
      await c.until('!document.querySelector("[role=alertdialog]")');
      assert.equal(await c.evaluate(`document.activeElement===document.querySelector(${JSON.stringify(first)})`), true, 'Escape restores focus');
      assert.equal(await stored(), encoded);
      await c.click(first); await c.button('Cancel');
      assert.equal(await stored(), encoded, 'Cancel preserves storage');
      await c.click(first);
      await c.screenshot(`QA-31-${profile}-${width}-${theme}-confirmation`);
      c.assertAccessible(await c.audit(`QA-31-${profile}-${width}-${theme}-confirmation`));
      await c.button('Delete character');
      await c.until('!document.querySelector("[data-local-character-id=a]")');
      assert.deepEqual(JSON.parse(await stored()), saved.slice(1));
      assert.equal(await c.evaluate('document.activeElement===document.querySelector("[data-local-character-id=b] [data-local-delete]")'), true, 'Remaining character receives focus');
      await c.click('[data-local-character-id="b"] [data-local-delete]');
      await c.button('Delete character');
      await c.until('!document.querySelector("[data-local-delete]")');
      assert.deepEqual(JSON.parse(await stored()), []);
      assert.equal(await c.evaluate('document.activeElement.id'), 'btn-save-local-character', 'Last deletion focuses Save this character');
      assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'), false, 'No page overflow');
      await c.screenshot(`QA-31-${profile}-${width}-${theme}-empty`);
      return {dialog, touch: c.touch};
    });
  }
  for (const profile of ['vanilla', 'tr', 'tr_arce']) for (const width of [1366, 375]) for (const theme of ['ashfall', 'morrowind']) {
    await c.check(`QA-32/${profile}/${width}/${theme}`, async () => {
      await c.viewport(width);
      await c.evaluate(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
      await c.navigate('home', profile);
      await c.click('.search-trigger');
      const input = '.search-dialog input[role=combobox]';
      const first = '#search-listbox .search-option .search-option-title';
      await c.until(`document.querySelector(${JSON.stringify(input)})`);
      const find = async (query, title) => {
        // Clear the previous deferred result before asserting an equivalent
        // spelling, so a stale result cannot make the next query pass.
        await c.type(input, 'zzzzzzzz');
        await c.until('document.querySelector(".search-empty")?.textContent.includes("zzzzzzzz")');
        await c.type(input, query);
        await c.until(`document.querySelector(${JSON.stringify(first)})?.textContent===${JSON.stringify(title)}`);
        assert.equal(await c.evaluate(`document.querySelector(${JSON.stringify(first)}).querySelector('mark')?.textContent`), title, `${query}: original label highlighted`);
        assert.equal(await c.evaluate(`document.querySelector(${JSON.stringify(input)}).value`), query);
      };
      await find("Ald'ruhn", 'Ald-ruhn'); // Default All group, from header search.
      await c.button('Places');
      const spellings = ["Ald'ruhn", 'Ald-ruhn', 'Aldruhn', 'Ald’ruhn', 'Ald ruhn'];
      for (const query of spellings) await find(query, 'Ald-ruhn');
      await c.screenshot(`QA-32-${profile}-${width}-${theme}-apostrophe`);
      c.assertAccessible(await c.audit(`QA-32-${profile}-${width}-${theme}-search`));
      await find('Sadrith Mora', 'Sadrith Mora');
      await find('SadrithMora', 'Sadrith Mora');
      await find('Vos', 'Vos');
      assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'), false, 'Search has no page overflow');
      await c.key('Escape', 'Escape', 27);
      await c.until('!document.querySelector(".search-dialog")');
      if (width === 1366 && !c.touch) await c.key('k', 'KeyK', 75, 2);
      else await c.click('.search-trigger');
      await c.until(`document.querySelector(${JSON.stringify(input)})`);
      await find("Ald'ruhn", 'Ald-ruhn');
      if (c.touch) await c.click('#search-listbox .search-option');
      else await c.key('Enter', 'Enter', 13);
      await c.until('document.querySelector("#travel-destination")?.value==="Ald-ruhn"');
      assert.equal(await c.evaluate('location.pathname'), '/travel', 'Result opens the Travel Planner');
      assert.equal(await c.evaluate('document.querySelector("#travel-destination").value'), 'Ald-ruhn', 'Travel receives the canonical destination');
      await c.screenshot(`QA-32-${profile}-${width}-${theme}-travel`);
      return {spellings, multiword: ['Sadrith Mora', 'SadrithMora'], shortName: 'Vos', keyboardShortcut: width === 1366 && !c.touch, touch: c.touch};
    });
  }
};
