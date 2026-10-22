import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createTranslator } from '../packages/i18n/dist/index.js';

const out=path.resolve('artifacts/production-screen4');
fs.mkdirSync(out,{recursive:true});
const base=process.env.STOREFRONT_URL || 'http://localhost:3000';
const sizes=[[1680,945],[1440,900],[1280,800],[768,1024],[390,844]];
const categories=[
  ['fashion','Urban Loom','Everyday Shirt','urbanloom'],
  ['beauty','Pure & Co.','Face Serum','pureandco'],
  ['jewellery','Aura Jewellery','Pendant','aurajewellery'],
  ['food','Daily Bakehouse','Croissant','dailybakehouse'],
  ['handicrafts','Crafted India','Ceramic Vase','craftedindia'],
  ['groceries','Daily Basket','Rice','dailybasket'],
];
const frozenPath=path.join(out,'frozen-before.json');
const frozen=fs.existsSync(frozenPath)?JSON.parse(fs.readFileSync(frozenPath)):null;
const results=[],errors=[];
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const context=await browser.newContext();
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  for(const locale of ['en-IN','mr-IN','hi-IN']){
    const t=createTranslator(locale);
    await page.setViewportSize({width:1680,height:945});
    await page.getByRole('button',{name:locale==='en-IN'?'English':locale==='mr-IN'?'मराठी':'हिंदी',exact:true}).first().click();
    for(const [width,height]of sizes){
      await page.setViewportSize({width,height});
      for(const [id,store,firstProduct,slug]of categories){
        await page.locator('[data-category="'+id+'"]').click();
        await page.waitForTimeout(150);
        assert.equal(await page.locator('[data-category="'+id+'"]').getAttribute('aria-pressed'),'true');
        for(const preview of ['showcase-desktop','showcase-mobile']){
          const target=page.getByTestId(preview);
          assert.equal(await target.getAttribute('data-active-category'),id);
          assert.equal(await target.locator('[data-store-name]').textContent(),store);
          assert.match(await target.textContent(),new RegExp(firstProduct.replace(/[.*+?^$()|[\]\\]/g,'\\$&')));
        }
        assert.equal(await page.getByTestId('showcase-store-link').textContent(),slug+'.letzshop.store');
        assert.equal(await page.getByTestId('screen4-showcase').locator('img').count(),0,'preview is HTML/SVG');
        const geometry=await page.getByTestId('screen4-showcase').evaluate(section=>{
          const visible=e=>!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length);
          const bad=[...section.querySelectorAll('h2,h3,h4,p,code')].filter(visible).filter(e=>!e.classList.contains('sr-only')&&e.scrollWidth>e.clientWidth+2).map(e=>e.textContent);
          const selector=section.querySelector('[data-category]').parentElement.getBoundingClientRect();
          const preview=section.querySelector('#business-store-preview').getBoundingClientRect();
          const benefits=section.querySelector('[data-testid="showcase-benefits"]').getBoundingClientRect();
          return{overflow:document.documentElement.scrollWidth>innerWidth,bad,selectorBottom:selector.bottom,previewTop:preview.top,previewBottom:preview.bottom,benefitTop:benefits.top};
        });
        assert.equal(geometry.overflow,false,locale+' '+width+' '+id+' document overflow');
        assert.deepEqual(geometry.bad,[],locale+' '+width+' '+id+' text clipping');
        assert.ok(geometry.selectorBottom<=geometry.previewTop+1,'controls clear of preview');
        assert.ok(geometry.previewBottom<=geometry.benefitTop+1,'benefits clear of preview');
        results.push({locale,width,height,category:id,result:'PASS'});
      }
      await page.locator('[data-category="fashion"]').click();
      await page.waitForTimeout(250);
      await page.evaluate(()=>document.fonts.ready);
      if(locale==='en-IN'&&frozen?.[width]){
        const current=await page.evaluate(()=>[...document.querySelectorAll('main > section')].slice(0,3).map(e=>{const r=e.getBoundingClientRect();return{id:e.id,x:r.x,y:r.y+scrollY,width:r.width,height:r.height,text:e.textContent}}));
        for(let i=0;i<3;i++){assert.equal(current[i].id,frozen[width][i].id);assert.equal(current[i].text,frozen[width][i].text,'frozen section text');for(const key of ['x','y','width','height'])assert.ok(Math.abs(current[i][key]-frozen[width][i][key])<.05,'Screen '+(i+1)+' '+key+' unchanged');}
      }
      assert.match(await page.getByTestId('screen4-showcase').textContent(),new RegExp(t('landing.businessShowcase.eyebrow')));
      await page.getByTestId('screen4-showcase').screenshot({path:path.join(out,'screen4-'+locale+'-'+width+'.png')});
      if(locale==='en-IN'){
        await page.evaluate(()=>scrollTo({top:document.querySelector('#categories').getBoundingClientRect().top+scrollY-68,behavior:'instant'}));
        await page.waitForTimeout(150);
        await page.screenshot({path:path.join(out,'screen4-viewport-'+width+'x'+height+'.png')});
      }
    }
    await page.setViewportSize({width:1680,height:945});
    await page.locator('[data-category="fashion"]').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('[data-category="beauty"]').getAttribute('aria-pressed'),'true');
    assert.ok(await page.locator('[data-category="beauty"]').evaluate(e=>document.activeElement===e),'keyboard focus follows selection');
    await page.getByRole('button',{name:t('landing.businessShowcase.next'),exact:true}).click();
    assert.equal(await page.locator('[data-category="jewellery"]').getAttribute('aria-pressed'),'true');
    await page.getByRole('button',{name:t('landing.businessShowcase.previous'),exact:true}).click();
    assert.equal(await page.locator('[data-category="beauty"]').getAttribute('aria-pressed'),'true');
  }
  await page.getByRole('button',{name:'English',exact:true}).first().click();
  const register=page.locator('header a[href$="/login?mode=register"]').first();
  const registerHref=await register.getAttribute('href');
  await register.click();
  await page.locator('#register-phone').waitFor();
  assert.ok(page.url().includes('/login?mode=register'),'Create Store route');
  await page.goto(base);
  const login=page.locator('header a[href$="/login"]').first();
  const loginHref=await login.getAttribute('href');
  await login.click();
  await page.locator('#login-phone').waitFor();
  assert.ok(page.url().endsWith('/login'),'Merchant Login route');
  assert.deepEqual(errors,[],'no browser runtime errors');
  fs.writeFileSync(path.join(out,'screen4-results.json'),JSON.stringify({cases:results.length,results,keyboard:'PASS',createStore:registerHref,merchantLogin:loginHref,frozenScreens:frozen?'PASS':'not supplied',runtimeErrors:errors},null,2));
  console.log(JSON.stringify({cases:results.length,keyboard:'PASS',createStore:'PASS',merchantLogin:'PASS',frozenScreens:frozen?'PASS':'not supplied',runtimeErrors:errors}));
  await context.close();
}finally{await browser.close();}
