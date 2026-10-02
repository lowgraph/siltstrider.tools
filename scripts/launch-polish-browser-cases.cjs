/* Assigned launch-polish regressions against the staged local bundle. */
const assert = require('node:assert/strict');
module.exports = async c => {
  const read = expression => c.evaluate(expression);
  const finish = async name => {
    assert.ok(await read('document.documentElement.scrollWidth <= innerWidth + 1'), 'No page overflow');
    c.assertAccessible(await c.audit(name));
    await c.screenshot(name);
  };
  for (const theme of ['ashfall','morrowind']) for (const width of [1366,375]) {
    await c.check(`UI-04/${theme}/${width}`,async()=>{
      await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
      await c.viewport(width);await c.navigate('alchemy');
      await c.until(`document.querySelector('[aria-label="Crucible 1 ingredient"]:not([disabled])')`);
      await c.click('#alc-toggle-custom-stats');
      for(const stat of ['skill','int','luck'])await c.type('#alc-'+stat+'-input','0');
      await c.choose('[aria-label="Crucible 1 ingredient"]','Saltrice');await c.choose('[aria-label="Crucible 2 ingredient"]','Marshmerrow');
      const chance=()=>read(`[...document.querySelectorAll('span')].find(s=>s.textContent==='Brew Success Chance').nextElementSibling.textContent`);
      assert.equal(await chance(),'0%');
      assert.match(await read('document.querySelector(".alchemy-workstation").textContent'),/All shared effects round to zero/);
      await c.click('[title="Clear Slot 2"]');
      assert.match(await chance(),/not calculated yet/);
      await c.choose('[aria-label="Crucible 2 ingredient"]','Marshmerrow');
      await finish(`UI-04-${theme}-${width}`);return {zeroVisible:true,incompleteEmpty:true};
    });
    await c.check(`UI-03/${theme}/${width}`,async()=>{
      await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
      await c.viewport(width);await c.navigate('challenge');
      await c.type('#challenge-seed-input','NOT-A-VALID-SEED');await c.button('Load');
      assert.match(await read('document.querySelector("#challenge-seed-note").textContent'),/not a Silt Strider seed/);
      await c.button('Generate Run');
      assert.doesNotMatch(await read('document.querySelector("#challenge-seed-note").textContent'),/not a Silt Strider seed/);
      const seed=await read('document.querySelector("#challenge-seed-input").value');
      await c.type('#challenge-seed-input','garbage');await c.button('Load');
      assert.match(await read('document.querySelector("#challenge-seed-note").textContent'),/not a Silt Strider seed/);
      await c.type('#challenge-seed-input',seed);await c.button('Load');
      assert.doesNotMatch(await read('document.querySelector("#challenge-seed-note").textContent'),/not a Silt Strider seed/);
      await finish(`UI-03-${theme}-${width}`);return {generateClears:true,validLoadClears:true,invalidStillReported:true};
    });
    const name=`FLOW-01/${theme}/${width}`;
    await c.check(name,async()=>{
      await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
      await c.viewport(width);await c.navigate('enchanting');
      await c.until(`document.querySelector('[aria-label="Effect 1"] option[value]:not([value=""])')`);
      const item=async value=>c.evaluate(`(()=>{const s=document.querySelector('#enchant-item-select');s.value=${JSON.stringify(value)};s.dispatchEvent(new Event('change',{bubbles:true}))})()`);
      const pressed=()=>read(`document.querySelector('[aria-labelledby="enchant-type-label"] [aria-pressed="true"]').textContent.trim()`);
      await item('Common Ring');await c.pause(100);
      assert.equal(await read(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='On Strike').disabled`),true);
      await item('Ebony Staff');await c.pause(100);await c.button('On Strike');assert.equal(await pressed(),'On Strike');
      await item('Common Shirt');await c.pause(100);assert.equal(await pressed(),'When Used');
      await item('Custom Item');await c.pause(100);
      assert.ok(await read('Boolean(document.querySelector("#enchant-custom-kind"))'),'Custom item declares its kind');
      await c.select('#enchant-custom-kind','Melee weapon');await c.button('On Strike');
      await finish(name.replaceAll('/','-'));return {apparel:true,weapon:true,switch:true,custom:true};
    });
  }
};
