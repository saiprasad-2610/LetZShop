import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
const out='artifacts/final-hardening', results=[];
const baseline=execFileSync('git',['show','9e01750:apps/storefront/src/components/landing/Screen6BrandStudio.tsx'],{encoding:'utf8'}).replace(/\r\n/g,'\n');
const current=fs.readFileSync('apps/storefront/src/components/landing/Screen6BrandStudio.tsx','utf8').replace(/\r\n/g,'\n').replace("import { LANDING_ANCHORS } from './anchors';\n",'').replace('id={LANDING_ANCHORS.customize}','id="themes"');
assert.equal(current,baseline,'Screen 6 must differ only in its semantic anchor.');
const response=await fetch('http://localhost:4000/subscriptions/plans');
const payload=await response.json();const plans=payload.data||payload;const launch=plans.find(p=>p.code==='STARTER_MONTHLY'&&p.purchasable);
assert.ok(launch);
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  for(const [width,height] of [[1680,945],[1440,900],[1280,900],[1024,900],[768,900],[390,844]]) for(const locale of ['en-IN','mr-IN','hi-IN']) {
    const context=await browser.newContext({viewport:{width,height}});
    await context.addInitScript(locale=>localStorage.setItem('letzshop_landing_locale',locale),locale);
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://localhost:3000/#pricing',{waitUntil:'networkidle'});
    await page.getByTestId('launch-price').locator('strong').waitFor();
    assert.equal(Number(await page.getByTestId('launch-price').getAttribute('data-price-paise')),launch.pricePaise);
    assert.equal(Number(await page.getByTestId('launch-price').getAttribute('data-period-days')),30);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    const ids=await page.locator('[id]').evaluateAll(nodes=>nodes.map(n=>n.id));assert.equal(new Set(ids).size,ids.length);
    for(const [anchor,testId] of [['features','system-scene'],['themes','screen4-showcase'],['how-it-works','screen5-journey'],['pricing','screen7-pricing']]) {
      await page.goto(`http://localhost:3000/#${anchor}`,{waitUntil:'networkidle'});
      const top=await page.locator(`#${anchor}`).evaluate(el=>el.getBoundingClientRect().top);
      assert.ok(top>=60&&top<=100,`${width} ${locale} #${anchor} refresh offset ${top}`);
      assert.equal(await page.locator(`#${anchor}`).getByTestId(testId).count()+await page.locator(`#${anchor}[data-testid="${testId}"]`).count(),1);
    }
    await page.getByTestId('screen7-pricing').scrollIntoViewIfNeeded();
    const expected='http://localhost:3001/login?mode=register';
    assert.equal(await page.getByTestId('pricing-cta').getAttribute('href'),expected);
    if([1680,768,390].includes(width)) await page.getByTestId('screen7-pricing').screenshot({path:`${out}/screen7-${locale}-${width}.png`});
    await page.getByTestId('pricing-cta').click();await page.waitForURL(expected);await page.locator('#register-email').waitFor();
    assert.deepEqual(errors,[]);results.push({width,height,locale,pricePaise:launch.pricePaise,anchors:'PASS',cta:'PASS',overflow:false});
    await context.close();console.log(`Screen 7 ${width} ${locale} PASS`);
  }
  fs.writeFileSync(`${out}/landing-results.json`,JSON.stringify({screen6Preserved:true,results},null,2));
} finally {await browser.close();}
