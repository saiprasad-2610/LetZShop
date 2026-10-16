import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import fs from 'node:fs';
import assert from 'node:assert/strict';

process.loadEnvFile('.env');
if(process.env.NODE_ENV==='production'||!['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname))throw new Error('This test requires a local development database.');
const require=createRequire(import.meta.url),{PrismaClient}=require('../packages/db/node_modules/@prisma/client');
const db=new PrismaClient(),run=crypto.randomBytes(5).toString('hex'),out='artifacts/admin-completion/e2e';fs.mkdirSync(out,{recursive:true});
const report={run,security:[],workflow:[],responsive:[],pageErrors:[]},users=[],tenants=[],orders=[];let browser,adminPage;
const hash=secret=>{const salt=crypto.randomBytes(16).toString('hex');return salt+':'+crypto.scryptSync(secret,salt,64).toString('hex');};
const phone=()=>'+919'+String(crypto.randomInt(100000000,999999999));
const progress=message=>{console.log(message);fs.writeFileSync(out+'/progress.json',JSON.stringify(report,null,2));};
const request=async(path,{token,method='GET',body,headers={}}={})=>{
 const res=await fetch('http://localhost:4000/'+path,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});const json=await res.json();return{status:res.status,data:json.data??json};
};
const login=async(user,secret,admin=false)=>{const r=await request(admin?'auth/admin/login':'auth/pin/login',{method:'POST',body:admin?{identifier:user.email,secret}:{phone:user.phone,pin:secret}});assert.equal(r.status,200,JSON.stringify(r.data));return r.data;};
const makeUser=async(role,password)=>{const u=await db.user.create({data:{phone:phone(),email:role.toLowerCase()+'-'+run+'-'+users.length+'@example.invalid',fullName:'Admin workflow '+role,role,isSuperAdmin:role==='PLATFORM_ADMIN',credentials:{create:{credentialType:'PIN',pinHash:hash(password)}}}});users.push(u.id);return u;};
const makeTenant=async(user,plan,live=true)=>{
 const t=await db.tenant.create({data:{name:'Moderation QA '+run+' '+tenants.length,slug:'admin-qa-'+run+'-'+tenants.length,memberships:{create:{userId:user.id,role:'SELLER_OWNER'}},stores:{create:{name:'Review QA Store '+run,slug:'review-qa-'+run+'-'+tenants.length,status:live?'LIVE':'PRIVATE_PREVIEW',isPubliclyAccessible:live}}},include:{stores:true}});tenants.push(t.id);
 const sub=await db.subscription.create({data:{tenantId:t.id,planId:plan.id,status:'ACTIVE',currentPeriodStart:new Date(),currentPeriodEnd:new Date(Date.now()+30*86400000)}});return{tenant:t,store:t.stores[0],sub};
};
const track=page=>{page.on('pageerror',e=>report.pageErrors.push(e.message));return page;};
try{
 const password=crypto.randomBytes(18).toString('base64url')+'aA1!',pin=String(crypto.randomInt(100000,999999));
 const admin=await makeUser('PLATFORM_ADMIN',password),merchant=await makeUser('SELLER_OWNER',pin),otherMerchant=await makeUser('SELLER_OWNER',pin);
 const launch=await db.plan.findUniqueOrThrow({where:{code:'STARTER_MONTHLY'}}),growth=await db.plan.findUniqueOrThrow({where:{code:'GROWTH_MONTHLY'}});
 assert.equal(launch.pricePaise,99900);assert.equal(growth.pricePaise,299900);
 const fixture=await makeTenant(merchant,launch),foreign=await makeTenant(otherMerchant,launch,false),{store,tenant}=fixture;
 const product=await db.product.create({data:{tenantId:tenant.id,storeId:store.id,name:'Moderation Test Product '+run,slug:'moderation-product-'+run,status:'PUBLISHED',variants:{create:{tenantId:tenant.id,storeId:store.id,sku:'ADMINQA-'+run,pricePaise:10000,inventory:{create:{tenantId:tenant.id,storeId:store.id,stockOnHand:10}}}}},include:{variants:true}});
 const customer=await db.customer.create({data:{tenantId:tenant.id,storeId:store.id,phone:phone(),email:'review-customer-'+run+'@example.invalid',fullName:'Verified QA Buyer'}});
 const reviewOrders=[];
 for(let i=0;i<2;i++){const order=await db.order.create({data:{tenantId:tenant.id,storeId:store.id,customerId:customer.id,orderNumber:'ADMINQA-'+run+'-'+i,status:'COMPLETED',paymentStatus:'PAID',subtotalPaise:10000,totalPaise:10000,deliveryAddress:{fullName:'Verified QA Buyer',city:'Test City'},reviewToken:crypto.randomBytes(24).toString('hex'),items:{create:{productId:product.id,variantId:product.variants[0].id,productName:product.name,variantTitle:'Standard',sku:'ADMINQA-'+run,selectedOptions:{},quantity:1,unitPricePaise:10000,totalPaise:10000}}},include:{items:true}});orders.push(order.id);reviewOrders.push(order);}
 const invoice=await db.subscriptionInvoice.create({data:{tenantId:tenant.id,subscriptionId:fixture.sub.id,invoiceNumber:'ADMINQA-'+run,amountPaise:99900,status:'PAID',payments:{create:{amountPaise:99900,paymentMethod:'RAZORPAY',providerPaymentId:'qa_'+run,status:'SUCCESS',metadata:{testOnly:true}}}}});
 const merchantAuth=await login(merchant,pin),foreignAuth=await login(otherMerchant,pin),adminAuth=await login(admin,password,true);
 const paths=['admin/session','admin/overview','admin/merchants','admin/merchants/'+tenant.id,'admin/reviews','admin/reviews/filters','admin/subscriptions','admin/plans','admin/payments','admin/users','admin/settings','admin/audit-logs'];
 for(const path of paths){assert.equal((await request(path)).status,401,path);assert.equal((await request(path,{token:merchantAuth.accessToken})).status,403,path);assert.equal((await request(path,{token:adminAuth.accessToken})).status,200,path);}
 report.security.push('All 12 admin read endpoints: anonymous 401, merchant 403, platform admin 200.');
 assert.equal((await request('auth/admin/login',{method:'POST',body:{identifier:merchant.phone,secret:pin}})).status,401);
 assert.equal((await request('auth/admin/login',{method:'POST',body:{identifier:'unknown-'+run+'@example.invalid',secret:password}})).status,401);
 for(const secret of ['Admin@ShopOnGo2026!','123456','ShopOnGoAdmin'])assert.equal((await request('auth/admin/login',{method:'POST',body:{identifier:admin.email,secret}})).status,401);
 report.security.push('Merchant login, unknown identifier, and all former master credentials rejected.');
 assert.equal((await request('subscriptions/create-order',{token:merchantAuth.accessToken,method:'POST',body:{planId:growth.id}})).status,400);
 report.security.push('Growth checkout remains disabled on the backend.');
 const baseline=(await request('admin/overview',{token:adminAuth.accessToken})).data.kpis.pendingReviewReports;
 browser=await chromium.launch({channel:'chrome',headless:true});
 const adminContext=await browser.newContext({viewport:{width:1440,height:1000}});adminContext.setDefaultTimeout(30000);adminContext.setDefaultNavigationTimeout(60000);adminPage=track(await adminContext.newPage());
 await adminPage.goto('http://localhost:3002/reviews',{waitUntil:'domcontentloaded'});await adminPage.waitForURL('**/login');await adminPage.getByRole('heading',{name:'LetzShop Admin',exact:true}).waitFor();
 assert.equal(await adminPage.getByLabel('Email / Phone').inputValue(),'');assert.equal(await adminPage.getByLabel('Password',{exact:true}).inputValue(),'');
 await adminPage.getByLabel('Email / Phone').fill(admin.email);await adminPage.getByLabel('Password',{exact:true}).fill('invalid-credential');await adminPage.getByRole('button',{name:'Login',exact:true}).click();await adminPage.getByRole('alert').waitFor();
 await adminPage.getByLabel('Password',{exact:true}).fill(password);await adminPage.getByRole('button',{name:'Login',exact:true}).click();await adminPage.waitForURL('http://localhost:3002/');await adminPage.locator('[data-kpi="Total Merchants"]').waitFor();
 const cookie=(await adminContext.cookies()).find(c=>c.name==='letzshop_admin_session');assert(cookie?.httpOnly);assert.equal(cookie.sameSite,'Lax');
 await adminPage.reload({waitUntil:'domcontentloaded'});await adminPage.getByRole('heading',{name:'Dashboard',exact:true}).waitFor();report.security.push('Dedicated blank login, error/loading flow, HttpOnly SameSite cookie, page redirect and refresh persistence passed.');
 await adminPage.screenshot({path:out+'/admin-dashboard-before.png'});progress('PASS admin HTTP authorization and browser session');
 // Submit both verified reviews using the real customer form and authorization tokens.
 const customerContext=await browser.newContext();const buyer=track(await customerContext.newPage());
 const reviewIds=[];
 for(const[i,order]of reviewOrders.entries()){
  await buyer.goto('http://localhost:3000/store/'+store.slug+'/review/'+order.orderNumber+'?token='+order.reviewToken,{waitUntil:'domcontentloaded'});
  await buyer.getByTitle(i===0?'1 Star':'5 Stars',{exact:true}).click();await buyer.getByPlaceholder('e.g. Great quality and fast delivery!').fill('QA review '+run+' '+i);await buyer.getByPlaceholder('Share your genuine experience with this product...').fill('Verified moderation workflow '+run+' review '+i);
  await buyer.getByRole('button',{name:'Submit Verified Review',exact:true}).click();await buyer.getByText('Review submitted successfully ✓',{exact:true}).waitFor();
  const review=await db.productReview.findUniqueOrThrow({where:{orderItemId_productId:{orderItemId:order.items[0].id,productId:product.id}}});assert(review.verifiedPurchase);reviewIds.push(review.id);
 }
 let publicData=(await request('storefront/'+store.slug+'/products/'+product.id+'/reviews')).data;assert.equal(publicData.totalReviews,2);assert.equal(publicData.averageRating,3);
 report.workflow.push('Customer form submitted two verified purchase reviews (1 and 5 stars), visible average 3.0.');progress('PASS customer verified review submission');
 const sellerContext=await browser.newContext({viewport:{width:1440,height:1000}});sellerContext.setDefaultTimeout(20000);
 await sellerContext.addInitScript(data=>{localStorage.setItem('simply_seller_token',data.accessToken);localStorage.setItem('simply_seller_user',JSON.stringify(data.user));localStorage.setItem('simply_seller_store',JSON.stringify(data.store));},merchantAuth);
 const seller=track(await sellerContext.newPage());
 const sellerCard=id=>seller.locator('[data-review-id="'+id+'"]');
 await seller.goto('http://localhost:3001/reviews',{waitUntil:'domcontentloaded'});await sellerCard(reviewIds[0]).waitFor();
 const reportReview=async(id,note)=>{
  await sellerCard(id).getByRole('button',{name:'Report Review',exact:true}).click();await seller.locator('select').filter({has:seller.locator('option[value="Spam or promotional"]')}).selectOption('Spam or promotional');await seller.getByPlaceholder(/context/i).fill(note);
  const response=seller.waitForResponse(r=>r.url().endsWith('/seller/reviews/'+id+'/report')&&r.request().method()==='POST');await seller.getByRole('button',{name:'Submit Report',exact:true}).click();assert.equal((await response).status(),201);await sellerCard(id).locator('[data-report-status="PENDING"]').waitFor();assert.equal(await sellerCard(id).getByRole('button',{name:'Report Review',exact:true}).count(),0);
 };
 await reportReview(reviewIds[0],'Merchant context '+run);
 assert.equal((await request('seller/reviews/'+reviewIds[0]+'/report',{token:merchantAuth.accessToken,method:'POST',body:{reason:'Spam'}})).status,409);
 assert.equal((await request('seller/reviews/'+reviewIds[0]+'/report',{token:foreignAuth.accessToken,method:'POST',body:{reason:'Spam'}})).status,404);
 const isolated=await request('seller/reviews',{token:foreignAuth.accessToken,headers:{'x-tenant-id':tenant.id}});assert(!JSON.stringify(isolated.data).includes(reviewIds[0]));
 publicData=(await request('storefront/'+store.slug+'/products/'+product.id+'/reviews')).data;assert.equal(publicData.totalReviews,2);
 await adminPage.goto('http://localhost:3002/',{waitUntil:'domcontentloaded'});await adminPage.locator('[data-kpi="Pending Review Reports"]').waitFor();assert.equal(Number(await adminPage.locator('[data-kpi="Pending Review Reports"]').innerText()),baseline+1);
 await adminPage.goto('http://localhost:3002/reviews',{waitUntil:'domcontentloaded'});const adminCard=id=>adminPage.locator('[data-review-id="'+id+'"]');await adminCard(reviewIds[0]).waitFor();assert((await adminCard(reviewIds[0]).innerText()).includes('Merchant context '+run));
 const adminResult=(await request('admin/reviews',{token:adminAuth.accessToken})).data;assert(!JSON.stringify(adminResult).includes(customer.phone));assert(!JSON.stringify(adminResult).includes(customer.email));
 assert.equal((await request('admin/reviews/'+reviewIds[0]+'/moderate',{token:merchantAuth.accessToken,method:'PATCH',body:{action:'REMOVE',reason:'invalid access'}})).status,403);
 report.security.push('Duplicate active report 409; foreign report 404; spoofed tenant header remains isolated; merchant moderation 403; moderation list excludes customer contact.');
 await adminCard(reviewIds[0]).getByRole('button',{name:'Start Review',exact:true}).click();await adminPage.getByRole('dialog').getByRole('button',{name:'Confirm',exact:true}).click();await adminCard(reviewIds[0]).getByText('Report: UNDER REVIEW',{exact:true}).waitFor();
 await seller.reload({waitUntil:'domcontentloaded'});await sellerCard(reviewIds[0]).locator('[data-report-status="UNDER_REVIEW"]').waitFor();
 await adminCard(reviewIds[0]).getByRole('button',{name:'Remove Review',exact:true}).click();const dialog=adminPage.getByRole('dialog');await dialog.getByLabel('Removal reason').selectOption('Spam');await dialog.getByLabel('Internal moderation note').fill('Investigated QA report '+run);await dialog.getByRole('button',{name:'Confirm',exact:true}).click();await adminCard(reviewIds[0]).waitFor({state:'detached'});
 const removed=await db.productReview.findUniqueOrThrow({where:{id:reviewIds[0]}});assert.equal(removed.status,'REMOVED');const resolved=await db.reviewReport.findFirstOrThrow({where:{reviewId:reviewIds[0]}});assert.equal(resolved.status,'RESOLVED');
 publicData=(await request('storefront/'+store.slug+'/products/'+product.id+'/reviews')).data;assert.equal(publicData.totalReviews,1);assert.equal(publicData.averageRating,5);
 await buyer.goto('http://localhost:3000/store/'+store.slug+'/product/'+product.id,{waitUntil:'domcontentloaded'});await buyer.getByText('Verified moderation workflow '+run+' review 1',{exact:true}).waitFor();assert.equal(await buyer.getByText('Verified moderation workflow '+run+' review 0',{exact:true}).count(),0);await buyer.screenshot({path:out+'/storefront-removed-rating.png'});
 await seller.reload({waitUntil:'domcontentloaded'});await seller.locator('select').filter({has:seller.locator('option[value="REMOVED"]')}).selectOption('REMOVED');await sellerCard(reviewIds[0]).locator('[data-report-status="RESOLVED"]').waitFor();await seller.screenshot({path:out+'/merchant-resolved.png'});
 await adminPage.getByLabel('Report status',{exact:true}).selectOption('RESOLVED');await adminCard(reviewIds[0]).waitFor();await adminCard(reviewIds[0]).getByRole('button',{name:'Restore Review',exact:true}).click();await adminPage.getByRole('dialog').getByRole('button',{name:'Confirm',exact:true}).click();await adminCard(reviewIds[0]).getByText('Review: ACTIVE',{exact:true}).waitFor();
 publicData=(await request('storefront/'+store.slug+'/products/'+product.id+'/reviews')).data;assert.equal(publicData.totalReviews,2);assert.equal(publicData.averageRating,3);await buyer.reload({waitUntil:'domcontentloaded'});await buyer.getByText('Verified moderation workflow '+run+' review 0',{exact:true}).waitFor();
 report.workflow.push('Merchant report → dashboard +1 → admin queue → UNDER_REVIEW → REMOVE → report RESOLVED; review hidden, average 5.0, merchant updated; RESTORE returns review and average 3.0 with history retained.');progress('PASS remove/restore end-to-end');
 await seller.locator('select').filter({has:seller.locator('option[value="REMOVED"]')}).selectOption('ACTIVE');await sellerCard(reviewIds[1]).waitFor();await reportReview(reviewIds[1],'Dismissal QA '+run);
 await adminPage.getByLabel('Report status',{exact:true}).selectOption('PENDING');await adminCard(reviewIds[1]).waitFor();await adminCard(reviewIds[1]).getByRole('button',{name:'Dismiss Report',exact:true}).click();await adminPage.getByRole('dialog').getByLabel('Dismissal reason').fill('Valid product feedback; no policy violation.');await adminPage.getByRole('dialog').getByRole('button',{name:'Confirm',exact:true}).click();await adminCard(reviewIds[1]).waitFor({state:'detached'});
 assert.equal((await db.reviewReport.findFirstOrThrow({where:{reviewId:reviewIds[1]}})).status,'DISMISSED');assert.equal((await db.productReview.findUniqueOrThrow({where:{id:reviewIds[1]}})).status,'ACTIVE');await seller.reload({waitUntil:'domcontentloaded'});await sellerCard(reviewIds[1]).locator('[data-report-status="DISMISSED"]').waitFor();assert.equal((await request('storefront/'+store.slug+'/products/'+product.id+'/reviews')).data.totalReviews,2);
 report.workflow.push('Dismissed second report; review remained ACTIVE/visible and merchant saw DISMISSED.');
 const audits=await db.auditLog.findMany({where:{actorId:admin.id},select:{action:true,metadata:true}});for(const action of ['REVIEW_REMOVED','REVIEW_RESTORED','REVIEW_REPORT_DISMISSED','REVIEW_REPORT_UNDER_REVIEW'])assert(audits.some(a=>a.action===action));report.auditActions=audits.map(a=>a.action);
 // Filters, safe data pages, pagination, and all core tabs across requested viewports.
 const routes=[['/','Dashboard'],['/merchants','Merchant Governance'],['/reviews','Reviews & Reports'],['/billing','SaaS Subscription Plans'],['/payments','Subscription Payments'],['/users','Platform Users & Governance'],['/settings','Platform Settings'],['/audit-logs','Audit Logs']];
 for(const width of [1440,1280,768,390]){
  await adminPage.setViewportSize({width,height:1000});
  for(const[path]of routes){await adminPage.goto('http://localhost:3002'+path,{waitUntil:'domcontentloaded'});await adminPage.locator('main h1').waitFor();await adminPage.locator('main [role=status]').first().waitFor({state:'hidden'});const overflow=await adminPage.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));assert(overflow.width<=width+1,path+' overflow '+JSON.stringify(overflow));await adminPage.screenshot({path:out+'/admin-'+width+'-'+(path==='/'?'dashboard':path.slice(1))+'.png'});report.responsive.push({width,path,...overflow});}
  if(width===390){await adminPage.getByLabel('Toggle admin navigation').click();await adminPage.getByRole('navigation').getByRole('link',{name:'Reviews & Reports',exact:true}).click();await adminPage.waitForURL('**/reviews');}
 }
 await adminPage.setViewportSize({width:1440,height:1000});await adminPage.goto('http://localhost:3002/merchants/'+tenant.id,{waitUntil:'domcontentloaded'});await adminPage.getByRole('heading',{name:tenant.name,exact:true}).waitFor();await adminPage.getByRole('button',{name:'Suspend Store',exact:true}).click();await adminPage.getByRole('dialog').getByLabel('Audit reason').fill('QA suspension '+run);await adminPage.getByRole('dialog').getByRole('button',{name:'Confirm',exact:true}).click();await adminPage.getByRole('button',{name:'Reactivate Store',exact:true}).waitFor();assert.equal((await db.store.findUniqueOrThrow({where:{id:store.id}})).status,'SUSPENDED');
 await adminPage.getByRole('button',{name:'Reactivate Store',exact:true}).click();await adminPage.getByRole('dialog').getByLabel('Audit reason').fill('QA reactivation '+run);await adminPage.getByRole('dialog').getByRole('button',{name:'Confirm',exact:true}).click();await adminPage.getByRole('button',{name:'Suspend Store',exact:true}).waitFor();assert.equal((await db.store.findUniqueOrThrow({where:{id:store.id}})).status,'LIVE');
 // Private and expired stores must not be published by reactivation.
 for(const expired of [false,true]){if(expired)await db.subscription.update({where:{id:foreign.sub.id},data:{currentPeriodEnd:new Date(Date.now()-86400000)}});assert.equal((await request('admin/merchants/'+foreign.tenant.id+'/suspend',{token:adminAuth.accessToken,method:'POST',body:{reason:'QA private store'}})).status,201);assert.equal((await request('admin/merchants/'+foreign.tenant.id+'/reactivate',{token:adminAuth.accessToken,method:'POST',body:{reason:'QA preserve privacy'}})).status,201);const actual=await db.store.findUniqueOrThrow({where:{id:foreign.store.id}});assert.equal(actual.status,'PRIVATE_PREVIEW');assert.equal(actual.isPubliclyAccessible,false);}
 report.workflow.push('Merchant detail and confirmed suspension/reactivation passed; private and expired stores remain private.');
 // Logout revokes the actual server session, not just the browser display.
 const authenticatedToken=(await adminContext.cookies()).find(c=>c.name==='letzshop_admin_session').value;
 await adminPage.getByLabel('Logout',{exact:true}).click();await adminPage.waitForURL('**/login');assert.equal((await request('admin/overview',{token:authenticatedToken})).status,401);await adminPage.goto('http://localhost:3002/',{waitUntil:'domcontentloaded'});await adminPage.waitForURL('**/login');report.security.push('Logout clears cookie and revokes server session.');
 const blocked=await browser.newContext();await blocked.addCookies([{name:'letzshop_admin_session',value:merchantAuth.accessToken,domain:'localhost',path:'/',httpOnly:true,sameSite:'Lax'}]);const badPage=await blocked.newPage();await badPage.goto('http://localhost:3002/reviews',{waitUntil:'domcontentloaded'});await badPage.waitForURL('**/login');assert.equal((await blocked.request.get('http://localhost:3002/api/platform/admin/overview')).status(),401);
 const parts=adminAuth.accessToken.split('.'),payload=JSON.parse(Buffer.from(parts[1],'base64url'));payload.exp=Math.floor(Date.now()/1000)-60;parts[1]=Buffer.from(JSON.stringify(payload)).toString('base64url');parts[2]=crypto.createHmac('sha256',process.env.JWT_ACCESS_SECRET||'default-dev-secret-change-me').update(parts[0]+'.'+parts[1]).digest('base64url');const expiredToken=parts.join('.');assert.equal((await request('admin/session',{token:expiredToken})).status,401);
 await blocked.addCookies([{name:'letzshop_admin_session',value:expiredToken,domain:'localhost',path:'/',httpOnly:true,sameSite:'Lax'}]);await badPage.goto('http://localhost:3002/',{waitUntil:'domcontentloaded'});await badPage.waitForURL('**/login');
 await db.user.update({where:{id:admin.id},data:{isSuperAdmin:false,role:'SELLER_OWNER'}});assert.equal((await request('admin/session',{token:adminAuth.accessToken})).status,403);report.security.push('Merchant cookie and expired signed token redirect to login; existing token loses admin access immediately after permission revocation.');
 assert.deepEqual(report.pageErrors,[]);report.passed=true;progress('PASS complete Admin auth, moderation, responsive and privacy checks');
}catch(error){report.failure=error.stack;if(adminPage)await adminPage.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error;}
finally{
 if(browser)await browser.close();
 await db.$transaction(async tx=>{
  await tx.auditLog.deleteMany({where:{OR:[{actorId:{in:users}},{tenantId:{in:tenants}}]}});
  await tx.productReview.deleteMany({where:{orderId:{in:orders}}});
  await tx.order.deleteMany({where:{id:{in:orders}}});
  await tx.tenant.deleteMany({where:{id:{in:tenants}}});
  await tx.user.deleteMany({where:{id:{in:users}}});
 });
 report.fixturesRemoved=(await db.tenant.count({where:{id:{in:tenants}}}))===0&&(await db.user.count({where:{id:{in:users}}}))===0;
 fs.writeFileSync(out+'/results.json',JSON.stringify(report,null,2));await db.$disconnect();console.log(JSON.stringify({passed:report.passed,failure:report.failure,fixturesRemoved:report.fixturesRemoved},null,2));
}


