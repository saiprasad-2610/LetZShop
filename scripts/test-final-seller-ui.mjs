import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createTranslator } from '../packages/i18n/dist/index.js';
const out='artifacts/final-hardening';
export async function testSellerWorkflow({token,user,store,request,db,subscription,limitPlan}) {
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const results=[];
  try {
    for(const width of [1440,1280,768]) for(const locale of ['en-IN','mr-IN','hi-IN']) for(const theme of ['light','dark']) {
      const context=await browser.newContext({viewport:{width,height:900}});
      await context.addInitScript(({token,user,store,locale,theme})=>{
        localStorage.setItem('simply_seller_token',token);localStorage.setItem('simply_seller_user',JSON.stringify({...user,preferredLocale:locale,userId:user.id,tenantId:store.tenantId,storeId:store.id}));localStorage.setItem('simply_seller_store',JSON.stringify(store));localStorage.setItem('letzshop_seller_preferred_locale',locale);localStorage.setItem('simply_merchant_theme',theme);
      },{token,user,store,locale,theme});
      const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
      const t=createTranslator(locale);
      await page.goto('http://localhost:3001/products',{waitUntil:'networkidle'});
      await page.getByRole('button',{name:t('products.addProduct'),exact:true}).first().waitFor();
      assert.equal(await page.locator('html').getAttribute('data-merchant-theme'),theme);
      for(let cycle=0;cycle<3;cycle++) {
        if(cycle===1) await page.getByRole('button',{name:t('products.categoriesTab'),exact:true}).click();
        if(cycle===2) await page.getByRole('button',{name:t('products.inventoryTab'),exact:true}).click();
        await page.getByRole('button',{name:t('products.addProduct'),exact:true}).first().click();
        const dialog=page.getByRole('dialog');await dialog.waitFor();
        assert.equal(await page.getByRole('dialog').count(),1);
        await page.waitForFunction(()=>document.querySelector('[aria-labelledby="product-drawer-title"]')?.contains(document.activeElement));
        assert.equal(await page.evaluate(()=>document.querySelector('[aria-labelledby="product-drawer-title"]').contains(document.activeElement)),true);
        assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');
        if(cycle===1) await page.getByRole('button',{name:'Close product editor'}).click();
        else await page.keyboard.press('Escape');
        await dialog.waitFor({state:'detached'});
      }
      await page.reload({waitUntil:'networkidle'});
      await page.getByRole('button',{name:t('products.productsTab'),exact:true}).first().click();
      await page.getByRole('button',{name:t('products.addProduct'),exact:true}).first().click();await page.getByRole('dialog').waitFor();
      if(width===1440&&locale==='en-IN'&&theme==='light') {
        await page.screenshot({path:`${out}/add-product-modal.png`,fullPage:true});
        const name=page.locator('input[placeholder="e.g. Classic Cotton Shirt"]');
        // Preserve typed values on both validation and backend failures.
        await name.fill('Browser Variant Shirt');
        await page.getByTestId('product-form-body').evaluate(el => { el.scrollTop = el.scrollHeight; });
        await page.getByRole('button',{name:'Create Product',exact:true}).click();
        await page.getByRole('alert').filter({hasText:'Every product needs at least one image.'}).waitFor();
        assert.equal(await name.inputValue(),'Browser Variant Shirt');
        await page.locator('input[type="file"]').first().setInputFiles('apps/storefront/public/images/letzshop-icon.png');
        await page.waitForFunction(()=>!document.body.innerText.includes('Uploading image'));
        await db.subscription.update({where:{id:subscription.id},data:{planId:limitPlan.id}});
        await page.getByRole('button',{name:'Create Product',exact:true}).click();
        await page.getByRole('alert').filter({hasText:'Product limit reached.'}).waitFor();
        assert.equal(await name.inputValue(),'Browser Variant Shirt');
        await db.subscription.update({where:{id:subscription.id},data:{planId:subscription.planId}});
        await page.locator('input[placeholder="e.g. SHIRT-001"]').fill('MERCHANT-SKU');
        await page.getByRole('button',{name:'Create Product',exact:true}).click();
        await page.getByRole('alert').filter({hasText:'SKU already exists'}).waitFor();
        assert.equal(await name.inputValue(),'Browser Variant Shirt');
        await page.locator('input[placeholder="e.g. SHIRT-001"]').fill('');
        await page.getByLabel('Enable product variants').check({force:true});
        await page.getByRole('cell',{name:'Black / S',exact:true}).waitFor();
        let posts=0;
        page.on('request',r=>{if(r.method()==='POST'&&new URL(r.url()).pathname==='/catalog/products')posts++;});
        const button=page.getByRole('button',{name:'Create Product',exact:true});
        await button.evaluate(el => { el.click(); el.click(); });
        await page.getByRole('dialog').waitFor({state:'detached'});
        assert.equal(posts,1);
        await page.getByText('Browser Variant Shirt',{exact:true}).first().waitFor();
        await page.screenshot({path:`${out}/created-variant-product.png`,fullPage:true});
        const created=(await request('catalog/products?search=Browser%20Variant%20Shirt')).items[0];
        assert.equal(created.variants.length,6);
        const row=page.locator('tr').filter({has:page.getByText('Browser Variant Shirt',{exact:true})});
        await row.getByRole('button',{name:t('products.duplicateAsDraft'),exact:true}).click();
        await page.getByRole('status').filter({hasText:t('products.duplicatedAsDraft')}).waitFor();
        await page.getByText('Browser Variant Shirt (Copy)',{exact:true}).waitFor();
        await page.screenshot({path:`${out}/duplicate-as-draft.png`,fullPage:true});
        await page.screenshot({path:`${out}/store-public.png`,fullPage:true});
        await db.subscription.update({where:{id:subscription.id},data:{status:'EXPIRED'}});
        await page.reload({waitUntil:'networkidle'});
        assert.equal(await page.getByTestId('store-visibility').first().getAttribute('data-public'),'false');
        await page.screenshot({path:`${out}/store-private.png`,fullPage:true});
        await db.subscription.update({where:{id:subscription.id},data:{status:'ACTIVE'}});
      } else await page.keyboard.press('Escape');
      assert.deepEqual(errors,[]);
      results.push({width,locale,theme,openCloseCycles:4,result:'PASS'});
      await context.close();console.log(`Seller ${width} ${locale} ${theme} PASS`);
    }
    const login=await browser.newContext({viewport:{width:390,height:844}});
    await login.route('http://localhost:4000/auth/register/request-otp',route=>route.fulfill({status:503,headers:{'access-control-allow-origin':'http://localhost:3001','access-control-allow-credentials':'true'},json:{success:false,error:{message:'Unable to send verification code. Please try again later.'}}}));
    const page=await login.newPage();await page.goto('http://localhost:3001/login?mode=register',{waitUntil:'networkidle'});
    assert.equal(await page.getByRole('link',{name:'Back to LetzShop home'}).getAttribute('href'),'http://localhost:3000/');
    assert.equal(await page.locator('img[alt="LetzShop"]').evaluate(img=>img.complete&&img.naturalWidth>0),true);
    await page.screenshot({path:`${out}/login-home-logo.png`,fullPage:true});
    await page.locator('#register-phone').fill('9876543210');await page.locator('#register-email').fill('fixture@example.test');
    await page.getByRole('button',{name:'Send Verification OTP',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'Unable to send verification code.'}).waitFor();
    assert.equal(await page.getByTestId('otp-sent-destination').count(),0);
    await page.getByRole('link',{name:'Back to LetzShop home'}).click();await page.waitForURL('http://localhost:3000/');
    await login.close();return results;
  } finally {await browser.close();}
}
