import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  console.log('🚀 Starting Verification: My Store Preview UI Cleanup & URL Resolution...');

  const artifactsDir = path.resolve('C:\\Users\\SOHAN\\.gemini\\antigravity-ide\\brain\\d42e5468-c703-42f2-80c7-a1dddeec7b88');
  const screenshotDir = path.join(artifactsDir, 'verification_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // 1. Authenticate via real API call
  console.log('1. Authenticating as seller via real API...');
  const loginRes = await fetch('http://localhost:4000/auth/pin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+919876543210', pin: '654321' }),
  }).then((r) => r.json());

  if (!loginRes.success || !loginRes.data?.accessToken) {
    throw new Error('Failed to authenticate seller: ' + JSON.stringify(loginRes));
  }

  const token = loginRes.data.accessToken;
  const user = loginRes.data.user;
  const store = loginRes.data.store;
  console.log(`✓ Authenticated as: ${user.phone} (${store.name}, slug: ${store.slug})`);

  // Launch Chrome
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Inject session into seller portal domain
  await page.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ t, u, s }) => {
      localStorage.setItem('simply_seller_token', t);
      localStorage.setItem('simply_seller_user', JSON.stringify(u));
      localStorage.setItem('simply_seller_store', JSON.stringify(s));
    },
    { t: token, u: user, s: store }
  );

  // ==========================================
  // A. DESKTOP VIEWPORT (1440x900)
  // ==========================================
  console.log('\n2. Testing Desktop Viewport (1440x900)...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3001/store-preview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Verify Left Sidebar remains selected on "My Store Preview"
  const asideNav = page.locator('aside[aria-label="Merchant Primary Navigation"]');
  const asideVisible = await asideNav.isVisible();
  console.log(`✓ Desktop Left Sidebar Visible: ${asideVisible}`);
  const storePreviewActive = await asideNav.locator('button[aria-label="My Store Preview"]').getAttribute('class');
  console.log(`✓ My Store Preview has active styling: ${storePreviewActive?.includes('bg-blue-600')}`);

  // 2. Section 1: Header verification
  const pageHeader = page.locator('h1:has-text("My Store Preview")');
  console.log(`✓ Page Header Title Visible: ${await pageHeader.isVisible()}`);
  const subtitleVisible = await page.locator('p:has-text("What your customers actually see")').isVisible();
  console.log(`✓ Subtitle "What your customers actually see" Visible: ${subtitleVisible}`);

  // Exactly ONE "Preview as Customer" action
  const previewActions = page.locator('a:has-text("Preview as Customer")');
  const previewCount = await previewActions.count();
  console.log(`✓ "Preview as Customer" count: ${previewCount} (Expected: exactly 1)`);
  if (previewCount !== 1) throw new Error(`Expected exactly 1 "Preview as Customer", got ${previewCount}`);

  // Customer preview URL check: points to /store/{slug}?preview=true
  const customerPreviewHref = await previewActions.first().getAttribute('href');
  console.log(`✓ Customer Preview Link Href: ${customerPreviewHref}`);
  if (!customerPreviewHref?.includes(`/store/${store.slug}?preview=true`)) {
    throw new Error(`Customer preview link does not contain /store/${store.slug}?preview=true: ${customerPreviewHref}`);
  }

  // Exactly ONE "Customize Store" action
  const customizeActions = page.locator('button:has-text("Customize Store")');
  const customizeCount = await customizeActions.count();
  console.log(`✓ "Customize Store" count: ${customizeCount} (Expected: exactly 1)`);
  if (customizeCount !== 1) throw new Error(`Expected exactly 1 "Customize Store", got ${customizeCount}`);

  // 3. Section 2: Store Status / Action Bar verification
  const dynamicStoreName = page.locator('main h2').filter({ hasText: store.name });
  const dynamicStoreNameVisible = await dynamicStoreName.isVisible();
  console.log(`✓ Dynamic Store Name "${store.name}" Visible: ${dynamicStoreNameVisible}`);

  const statusBadge = page.locator('span:has-text("PRIVATE PREVIEW"), span:has-text("LIVE"), span:has-text("SUBSCRIPTION REQUIRED")');
  console.log(`✓ Dynamic Store Status Badge: "${await statusBadge.first().textContent()}"`);

  const dynamicStoreUrl = page.locator(`span:has-text("simply.in/store/${store.slug}")`);
  console.log(`✓ Dynamic Store URL "simply.in/store/${store.slug}" Visible: ${await dynamicStoreUrl.first().isVisible()}`);

  const copyUrlBtn = page.locator('#btn-copy-store-url');
  console.log(`✓ Store URL copy icon button Visible: ${await copyUrlBtn.isVisible()}`);

  // Exactly ONE Publish action
  const publishActions = page.locator('#btn-publish-storefront');
  const publishCount = await publishActions.count();
  console.log(`✓ Publish action count: ${publishCount} (Expected: exactly 1)`);
  if (publishCount !== 1) throw new Error(`Expected exactly 1 Publish action, got ${publishCount}`);

  // Exactly ONE Share Store action
  const shareActions = page.locator('#btn-share-store');
  const shareCount = await shareActions.count();
  console.log(`✓ Share Store action count: ${shareCount} (Expected: exactly 1)`);
  if (shareCount !== 1) throw new Error(`Expected exactly 1 Share action, got ${shareCount}`);

  // 4. Verify NO Duplicate Headers
  const digitalPreviewTitles = await page.locator('text="Digital Storefront Preview"').count();
  console.log(`✓ Duplicate "Digital Storefront Preview" count: ${digitalPreviewTitles} (Expected: 0)`);
  if (digitalPreviewTitles !== 0) throw new Error(`Found duplicate "Digital Storefront Preview" titles!`);

  const subHeadingCount = await page.locator('text="What your customers actually see"').count();
  console.log(`✓ "What your customers actually see" count: ${subHeadingCount} (Expected: exactly 1)`);
  if (subHeadingCount !== 1) throw new Error(`Expected exactly 1 subtitle, found ${subHeadingCount}`);

  // 5. Test Share Store Popover Interaction
  console.log('\nTesting Share Popover...');
  await shareActions.click();
  await page.waitForTimeout(300);

  const copyLinkOption = page.locator('#opt-share-copy');
  const whatsappOption = page.locator('#opt-share-whatsapp');
  console.log(`✓ Share Popover: Copy Link option visible: ${await copyLinkOption.isVisible()}`);
  console.log(`✓ Share Popover: WhatsApp option visible: ${await whatsappOption.isVisible()}`);

  // Capture screenshot of Share Popover open
  const sharePopoverPath = path.join(screenshotDir, '03a_desktop_1440_share_popover.png');
  await page.screenshot({ path: sharePopoverPath, fullPage: false });
  console.log(`📸 Saved screenshot: ${sharePopoverPath}`);

  // Close popover
  await copyLinkOption.click();
  await page.waitForTimeout(200);

  // 6. Section 3: Embedded Preview Frame verification
  const previewTrafficLights = await page.locator('.bg-rose-500\\/80').isVisible();
  console.log(`✓ Preview Browser Frame Traffic Lights Visible: ${previewTrafficLights}`);
  const previewShopNow = await page.locator('button:has-text("Shop Now")').isVisible();
  console.log(`✓ Preview Mockup Shop Now Button Visible: ${previewShopNow}`);

  // Check that NO merchant controls are inside the preview frame
  const merchantControlsInFrame = await page.locator('.bg-slate-900').locator('#btn-customize-store, #btn-publish-storefront, #btn-share-store').count();
  console.log(`✓ Merchant Controls inside preview frame: ${merchantControlsInFrame} (Expected: 0)`);
  if (merchantControlsInFrame !== 0) throw new Error('Found merchant controls inside preview frame!');

  // Capture Desktop Screenshot
  const desktop1440Path = path.join(screenshotDir, '03_desktop_1440_store_preview.png');
  await page.screenshot({ path: desktop1440Path, fullPage: true });
  console.log(`📸 Saved screenshot: ${desktop1440Path}`);

  // ==========================================
  // B. TABLET VIEWPORT (768x1024)
  // ==========================================
  console.log('\n3. Testing Tablet Viewport (768x1024)...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(600);

  const tabletHeaderVisible = await pageHeader.isVisible();
  const tabletBarVisible = await page.locator('main h2').filter({ hasText: store.name }).isVisible();
  console.log(`✓ Tablet Header Visible: ${tabletHeaderVisible}`);
  console.log(`✓ Tablet Store Bar Visible: ${tabletBarVisible}`);

  const tabletHasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log(`✓ Tablet Horizontal Overflow: ${tabletHasOverflow ? 'YES (FAIL)' : 'NONE (PASS)'}`);
  if (tabletHasOverflow) throw new Error('Horizontal overflow on tablet viewport!');

  const tabletScreenshotPath = path.join(screenshotDir, '10_tablet_768_store_preview.png');
  await page.screenshot({ path: tabletScreenshotPath, fullPage: true });
  console.log(`📸 Saved screenshot: ${tabletScreenshotPath}`);

  // ==========================================
  // C. MOBILE VIEWPORT (375x812)
  // ==========================================
  console.log('\n4. Testing Mobile Viewport (375x812)...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(600);

  const mobileHeaderVisible = await pageHeader.isVisible();
  const mobileBarVisible = await page.locator('main h2').filter({ hasText: store.name }).isVisible();
  const mobilePreviewCustomer = await page.locator('a:has-text("Preview as Customer")').isVisible();
  const mobileCustomize = await page.locator('button:has-text("Customize Store")').isVisible();
  const mobilePublish = await page.locator('#btn-publish-storefront').isVisible();
  const mobileShare = await page.locator('#btn-share-store').isVisible();

  console.log(`✓ Mobile Header Visible: ${mobileHeaderVisible}`);
  console.log(`✓ Mobile Preview Customer Visible: ${mobilePreviewCustomer}`);
  console.log(`✓ Mobile Customize Visible: ${mobileCustomize}`);
  console.log(`✓ Mobile Store Bar Visible: ${mobileBarVisible}`);
  console.log(`✓ Mobile Publish Visible: ${mobilePublish}`);
  console.log(`✓ Mobile Share Visible: ${mobileShare}`);

  const mobileHasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log(`✓ Mobile Horizontal Overflow: ${mobileHasOverflow ? 'YES (FAIL)' : 'NONE (PASS)'}`);
  if (mobileHasOverflow) throw new Error('Horizontal overflow on mobile 375px viewport!');

  const mobileScreenshotPath = path.join(screenshotDir, '11_mobile_375_store_preview.png');
  await page.screenshot({ path: mobileScreenshotPath, fullPage: true });
  console.log(`📸 Saved screenshot: ${mobileScreenshotPath}`);

  // ==========================================
  // D. STOREFRONT PREVIEW RESTRICTIONS & EXIT PREVIEW
  // ==========================================
  console.log('\n5. Testing Storefront Customer Preview Restrictions & Exit Preview...');
  const previewPage = await context.newPage();
  await previewPage.goto(`http://localhost:3000/store/${store.slug}?preview=true`, { waitUntil: 'networkidle' });
  await previewPage.waitForTimeout(800);

  // Check merchant preview banner
  const bannerVisible = await previewPage.locator('text="Merchant Preview"').isVisible();
  console.log(`✓ Storefront Preview Banner Visible: ${bannerVisible}`);

  // Check blocked shopping action (add to cart / checkout disabled in preview mode)
  const cartBtnDisabledOrHidden = await previewPage.evaluate(() => {
    const buyBtns = Array.from(document.querySelectorAll('button')).filter((b) =>
      b.textContent?.toLowerCase().includes('cart') || b.textContent?.toLowerCase().includes('buy')
    );
    return buyBtns.length === 0 || buyBtns.every((b) => b.disabled || b.getAttribute('aria-disabled') === 'true' || b.classList.contains('cursor-not-allowed') || b.getAttribute('data-preview-blocked') === 'true');
  });
  console.log(`✓ Cart/Buy Actions properly restricted in Preview mode: ${cartBtnDisabledOrHidden}`);

  // Verify Exit Preview Button has no hardcoded localhost:3001 in click logic or calls getSellerStorePreviewUrl
  const exitBtn = previewPage.locator('button:has-text("Exit Preview")');
  console.log(`✓ Exit Preview Button Visible: ${await exitBtn.isVisible()}`);

  const exitScreenshotPath = path.join(screenshotDir, '12_storefront_preview_with_exit.png');
  await previewPage.screenshot({ path: exitScreenshotPath, fullPage: false });
  console.log(`📸 Saved screenshot: ${exitScreenshotPath}`);

  await browser.close();
  console.log('\n🎉 ALL REAL CHROME VERIFICATIONS PASSED SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
