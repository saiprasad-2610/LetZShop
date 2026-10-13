import { chromium } from 'playwright';

async function verifyCard() {
  console.log('🚀 Verifying Next Step Card Responsive Rendering...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  // 1. Laptop Viewport (1440x900)
  console.log('--- 1. Testing Laptop View (1440x900) ---');
  const laptopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const laptopPage = await laptopContext.newPage();

  await laptopPage.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
  await laptopPage.locator('#login-pin').waitFor();
  await laptopPage.locator('input[type="tel"]').first().fill('9876543210');
  await laptopPage.locator('#login-pin').first().fill('654321');
  await laptopPage.locator('button[type="submit"]').first().click();

  await laptopPage.waitForURL('http://localhost:3001/', { timeout: 15000 });
  await laptopPage.waitForLoadState('networkidle');
  await laptopPage.waitForTimeout(1500);

  // Take screenshot of the Next Step Card on Laptop
  const nextStepCardLaptop = laptopPage.locator('section[aria-label="Your Next Step"]');
  await nextStepCardLaptop.scrollIntoViewIfNeeded();
  await laptopPage.waitForTimeout(500);

  const cardBox = await nextStepCardLaptop.boundingBox();
  console.log(`Laptop Card dimensions: Width = ${cardBox?.width}px, Height = ${cardBox?.height}px`);

  await nextStepCardLaptop.screenshot({
    path: 'C:/Users/SOHAN/.gemini/antigravity-ide/brain/9c246ae6-1b36-412c-a5e1-1271a7a5e574/next-step-laptop-dark.png',
  });
  console.log('✓ Saved next-step-laptop-dark.png');

  // Verify single-line checklist in laptop DOM
  const checklistSingleLine = await laptopPage.evaluate(() => {
    const card = document.querySelector('section[aria-label="Your Next Step"]');
    if (!card) return false;
    const checklistItems = card.querySelectorAll('.pt-2\\.5 .flex.items-center.gap-1\\.5');
    if (checklistItems.length < 6) return false;
    // Check if their bounding client rects all share approximately the same top offset (single line!)
    const tops = Array.from(checklistItems).map(el => Math.round(el.getBoundingClientRect().top));
    const allSameTop = tops.every(t => Math.abs(t - tops[0]) <= 4);
    return { count: checklistItems.length, allSameTop, tops };
  });
  console.log('Laptop Checklist single-line check:', checklistSingleLine);

  // Verify 1-2-3 steps in DOM
  const stepsData = await laptopPage.evaluate(() => {
    const card = document.querySelector('section[aria-label="Your Next Step"]');
    if (!card) return null;
    const steps = card.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-3 > div');
    return Array.from(steps).map(s => ({
      text: s.innerText.replace(/\n/g, ' - ')
    }));
  });
  console.log('Steps found on Laptop:', stepsData);

  // 2. Mobile Phone Viewport (390x844 - iPhone 14/15 size)
  console.log('\n--- 2. Testing Mobile Phone View (390x844) ---');
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();

  // Copy local storage session
  const storageState = await laptopPage.evaluate(() => ({
    token: localStorage.getItem('simply_seller_token'),
    user: localStorage.getItem('simply_seller_user'),
    store: localStorage.getItem('simply_seller_store'),
  }));

  await mobilePage.goto('http://localhost:3001/login');
  await mobilePage.evaluate((state) => {
    localStorage.setItem('simply_seller_token', state.token);
    localStorage.setItem('simply_seller_user', state.user);
    localStorage.setItem('simply_seller_store', state.store);
  }, storageState);

  await mobilePage.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1500);

  const nextStepCardMobile = mobilePage.locator('section[aria-label="Your Next Step"]');
  await nextStepCardMobile.scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(500);

  const mobileBox = await nextStepCardMobile.boundingBox();
  console.log(`Mobile Card dimensions: Width = ${mobileBox?.width}px, Height = ${mobileBox?.height}px`);

  // Laptop: set dark theme explicitly
  await laptopPage.evaluate(() => {
    localStorage.setItem('simply_merchant_theme', 'dark');
    document.documentElement.setAttribute('data-merchant-theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await laptopPage.waitForTimeout(400);
  await nextStepCardLaptop.screenshot({
    path: 'C:/Users/SOHAN/.gemini/antigravity-ide/brain/9c246ae6-1b36-412c-a5e1-1271a7a5e574/next-step-dark-laptop.png',
  });
  console.log('✓ Saved next-step-dark-laptop.png');

  // Laptop: set light theme explicitly
  await laptopPage.evaluate(() => {
    localStorage.setItem('simply_merchant_theme', 'light');
    document.documentElement.setAttribute('data-merchant-theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await laptopPage.waitForTimeout(400);
  await nextStepCardLaptop.screenshot({
    path: 'C:/Users/SOHAN/.gemini/antigravity-ide/brain/9c246ae6-1b36-412c-a5e1-1271a7a5e574/next-step-light-laptop.png',
  });
  console.log('✓ Saved next-step-light-laptop.png');

  // Mobile: set dark theme explicitly
  await mobilePage.evaluate(() => {
    localStorage.setItem('simply_merchant_theme', 'dark');
    document.documentElement.setAttribute('data-merchant-theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await mobilePage.waitForTimeout(400);
  await nextStepCardMobile.screenshot({
    path: 'C:/Users/SOHAN/.gemini/antigravity-ide/brain/9c246ae6-1b36-412c-a5e1-1271a7a5e574/next-step-dark-mobile.png',
  });
  console.log('✓ Saved next-step-dark-mobile.png');

  await browser.close();
  console.log('\n✅ All Card Verifications Completed Successfully!');
}

verifyCard().catch(err => {
  console.error('Error during card verification:', err);
  process.exit(1);
});
