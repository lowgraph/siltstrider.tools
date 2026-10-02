const assert=require('node:assert/strict');
module.exports=async c=>{
  const user={id:'user_qa_clarity',fullName:'QA – Clarity',firstName:'QA',username:'qa_clarity'};
  for(const theme of ['ashfall','morrowind'])for(const width of [1366,375])await c.check(`Clarity-F11/${theme}/${width}`,async()=>{
    await c.open('/about');await c.cleanup();await c.signIn(user);await c.viewport(width);await c.theme(theme);await c.open('/account');
    try{
      await c.until('document.querySelector("input[autocomplete=username]")');
      const before=(await c.request('GET','/api/account',{user})).body;
      assert.match(await c.evaluate('document.querySelector("#username-help").textContent'),/username is required.*including your icon/);
      await c.click('input[name=profile-icon][value="4"]');await c.button('Save profile');
      assert.equal(await c.evaluate('document.querySelector("input[autocomplete=username]").validity.valueMissing'),true);
      assert.deepEqual((await c.request('GET','/api/account',{user})).body,before,'Required-field validation leaves the account unchanged');
      await c.type('input[autocomplete=username]','QA_Clarity');await c.button('Save profile');
      await c.until('document.querySelector(".account-page [role=status]")?.textContent.includes("Profile saved")');
      const profile=(await c.request('GET','/api/account',{user})).body;
      assert.equal(profile.username,'QA_Clarity');assert.equal(profile.iconId,4);
      assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false);
      c.assertAccessible(await c.audit(`profile-${theme}-${width}`));await c.screenshot(`profile-${theme}-${width}`);
      return {requiredExplained:true,emptySaveBlocked:true,iconSaved:true};
    }finally{await c.open('/about');await c.cleanup();}
  });
};
