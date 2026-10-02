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
