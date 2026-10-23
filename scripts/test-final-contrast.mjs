import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, firefox, webkit } from 'playwright';
import { product, fixture as original } from './test-production-browsers.mjs';
const out = 'artifacts/final-hardening';
fs.mkdirSync(out, { recursive: true });
const themes = ['atelier','aura','canvas','feast','foundry','habitat','harvest','horizon','local','noir','pulse','vista'];
const results = [], failures = [];
const engines = [['Chrome',chromium,{channel:'chrome'}],['Edge',chromium,{channel:'msedge'}],['Firefox',firefox,{}],['WebKit',webkit,{}]];
const paletteName=process.env.CONTRAST_PALETTE || '';
const productOnly=process.env.CONTRAST_PRODUCT_ONLY==='1';
const resultFile=`${out}/contrast-${process.env.CONTRAST_BROWSER||'all'}${paletteName?'-'+paletteName:''}${productOnly?'-product':''}${process.env.CONTRAST_ZERO_STOCK==='1'?'-out':''}.json`;
const paths = productOnly ? [`/product/${product.id}`] : paletteName ? [`/product/${product.id}`, '/checkout'] : ['', '/products', `/product/${product.id}`, '/cart', '/checkout', '/about', '/order/TEST?t=test'];
// Runs inside the browser. Composite real computed colors, including ancestor opacity.
function inspectContrast() {
  const rgba = s => { const v = s.match(/[\d.]+/g)?.map(Number) || [0,0,0]; return [v[0],v[1],v[2],v[3] ?? 1]; };
  const blend = (fg,bg) => fg.slice(0,3).map((c,i) => c*fg[3]+bg[i]*(1-fg[3]));
  const lum = a => a.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const ratio = (a,b) => { const x=lum(a), y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
  const nodes = [...document.querySelectorAll('[data-store-theme] main :is(h1,h2,h3,p,label,input,button:enabled,a[class*="line-clamp"],[data-store-price],[data-testid="product-price"],[data-testid="product-quantity"],[data-testid="product-breadcrumb"],[data-store-stock],span.line-through), [data-storefront-header] nav a, [data-store-name], footer p')];
  return nodes.filter(el => el.getClientRects().length && !['radio','checkbox','hidden','color'].includes(el.type) && (el.innerText?.trim() || el.value || el.placeholder) && getComputedStyle(el).visibility!=='hidden').map(el => {
    const ancestors=[]; for(let node=el;node;node=node.parentElement) ancestors.unshift(node);
    let bg=[255,255,255]; for(const node of ancestors) bg=blend(rgba(getComputedStyle(node).backgroundColor),bg);
    const style=getComputedStyle(el), fg=blend(rgba(style.color),bg);
    const threshold=parseFloat(style.fontSize)>=24 || (parseFloat(style.fontSize)>=18.66 && parseInt(style.fontWeight)>=700) ? 3 : 4.5;
    return { tag:el.tagName,text:(el.innerText||el.value||el.placeholder).slice(0,80),className:el.className,color:style.color,bg,ratio:ratio(fg,bg),threshold };
  });
}
for (const [name, engine, options] of engines) {
  if (process.env.CONTRAST_BROWSER && process.env.CONTRAST_BROWSER!==name) continue;
  const browser=await engine.launch({headless:true,...options});
  try {
    for(const theme of themes) for(const locale of ['en-IN','mr-IN','hi-IN']) for(const width of [1440,390]) {
      if(paletteName && locale!=='en-IN') continue;
      if(process.env.CONTRAST_QUICK==='1' && (locale!=='en-IN'||width!==1440)) continue;
      const context=await browser.newContext({viewport:{width,height:width===390?844:900}});
      const fixture={...original,store:{...original.store,storefrontDefaultLocale:locale},themeConfig:{themeId:theme,...(paletteName ? {palette:paletteName==='dark'?{background:'#0A0A0C',primary:'#121212',accent:'#111111',text:'#101010',muted:'#151515'}:{background:'#FFFFFF',primary:'#FFFFCC',accent:'#FFFF00',text:'#FFFFFE',muted:'#EEEEEE'}} : {})},product:{...product,description:'A clear product description.',compareAtPricePaise:159900}};
      if(productOnly) fixture.product.variants=fixture.product.variants.map(v=>({...v,inventory:{stockOnHand:process.env.CONTRAST_ZERO_STOCK==='1'?0:width===390?2:100,availableQuantity:process.env.CONTRAST_ZERO_STOCK==='1'?0:width===390?2:100}}));
      fixture.products=[fixture.product];
      const line={id:'line',variantId:product.variants[0].id,quantity:1,unitPricePaise:129900,variant:{...product.variants[0],product:fixture.product}};
      const cart={id:'test-cart',storeId:fixture.store.id,items:[line],subtotalPaise:129900};
      await context.route('http://localhost:4000/**', route => {
        const url=new URL(route.request().url());
        const data=url.pathname.startsWith('/storefront/')?{...fixture,items:fixture.products,total:1,page:1,limit:20}:url.pathname.startsWith('/cart')?{...cart,guestToken:'contrast-test'}:url.pathname.startsWith('/orders/track')?{id:'order',orderNumber:'TEST',status:'CONFIRMED',paymentStatus:'PENDING',totalPaise:129900,subtotalPaise:129900,shippingPaise:0,items:[line],createdAt:new Date().toISOString(),customer:{fullName:'Test Buyer'},fulfillmentMode:'PICKUP'}:{reviews:[],totalReviews:0,averageRating:0,distribution:{}};
        return route.fulfill({status:route.request().method()==='OPTIONS'?204:200,headers:{'access-control-allow-origin':'http://localhost:3000','access-control-allow-credentials':'true','access-control-allow-headers':route.request().headers()['access-control-request-headers']||'content-type,authorization','access-control-allow-methods':'GET,POST,OPTIONS'},json:route.request().method()==='OPTIONS'?undefined:{success:true,data}});
      });
      const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
      for(const path of paths) {
        await page.goto(`http://localhost:3000/store/${fixture.store.slug}${path}`,{waitUntil:'domcontentloaded'});
        await page.locator(`[data-store-theme="${theme}"]`).waitFor();
        // A visible cart count proves the init response was consumed before navigation.
        await page.locator('[aria-label="Shopping Cart with 1 items"]').waitFor({state:'attached'});
        if(name==='WebKit') await page.waitForLoadState('networkidle');
        await page.evaluate(() => new Promise(requestAnimationFrame));
        const measurements=await page.evaluate(inspectContrast);
        const bad=measurements.filter(m=>m.ratio+.01<m.threshold);
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
        results.push({browser:name,theme,locale,width,path,measurements:measurements.length,failures:bad.length,overflow});
        if(bad.length||overflow||errors.length) failures.push({browser:name,theme,locale,width,path,bad,overflow,errors:[...errors]});
        if(locale==='en-IN'&&width===1440&&['canvas','aura'].includes(theme)&&path.includes('/product/')) await page.screenshot({path:`${out}/${name}-${theme}${paletteName?'-'+paletteName:''}-product.png`,fullPage:true});
      }
      await context.close();
      console.log(`${name} ${theme} ${locale} ${width}: ${results.length} pages, ${failures.length} failing`);
    }
  } finally {await browser.close();}
}
fs.writeFileSync(resultFile,JSON.stringify({results,failures},null,2));
assert.equal(failures.length,0,`Contrast failures: see ${resultFile}`);
