import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

const artifactDir = 'C:\\Users\\SOHAN\\.gemini\\antigravity-ide\\brain\\a08ebfcf-2278-402a-bfb2-1ef61324844f';
const outDir = path.join(artifactDir, 'verification_containment');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1680x900', width: 1680, height: 900 },
  { name: '1680x945', width: 1680, height: 945 },
  { name: '1680x900 (zoom 90%)', width: 1680, height: 900, zoom: 0.9 },
  { name: '1680x900 (zoom 110%)', width: 1680, height: 900, zoom: 1.1 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 }
];

function rectOverlapArea(r1, r2) {
  const xOverlap = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
  const yOverlap = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
  return xOverlap * yOverlap;
}

export async function runContainmentAudit() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const results = {};

  for (const vp of VIEWPORTS) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    if (vp.zoom) {
      await page.evaluate((z) => {
        document.body.style.zoom = String(z);
      }, vp.zoom);
    }
    await new Promise(r => setTimeout(r, 600));

    const audit = await page.evaluate(() => {
      function get(idOrSel) {
        const el = idOrSel.startsWith('#') || idOrSel.startsWith('.') || idOrSel.startsWith('[')
          ? document.querySelector(idOrSel)
          : document.getElementById(idOrSel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          right: r.right,
          width: r.width,
          height: r.height,
          visible: (r.width > 0 && r.height > 0 && window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden')
        };
      }

      const s1 = get('#hero');
      const s1Scene = get('[data-testid="hero-commerce-scene"]');
      const s1Dash = get('[data-testid="hero-dashboard-layer"]');
      const s1Laptop = get('[data-testid="hero-laptop-layer"]');
      const s1StorefrontScreen = get('[data-testid="hero-storefront-screen"]');
      const s1Phone = get('[data-testid="hero-phone-layer"]');
      const s1AnnotDevice = get('[data-testid="hero-annot-device"]');
      const s1AnnotDash = get('[data-testid="hero-annot-dash"]');
      const s1StorefrontNav = get('[data-testid="hero-storefront-nav"]');

      const s2 = get('#merchant-problem');
      const s2Scene = get('[data-testid="merchant-chaos-scene"]');
      const s2Laptop = get('[data-testid="problem-laptop"]');
      const s2LaptopScreen = get('[data-testid="problem-laptop-screen"]');
      const s2CardWhatsapp = get('[data-testid="problem-card-whatsapp"]');
      const s2CardPayment = get('[data-testid="problem-card-payment"]');
      const s2CardStock = get('[data-testid="problem-card-stock"]');
      const s2CardCourier = get('[data-testid="problem-card-courier"]');
      const s3 = get('#features');

      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;

      return {
        scrollWidth,
        clientWidth,
        hasHorizontalOverflow: scrollWidth > clientWidth,
        s1,
        s1Scene,
        s1Dash,
        s1Laptop,
        s1StorefrontScreen,
        s1Phone,
        s1AnnotDevice,
        s1AnnotDash,
        s1StorefrontNav,
        s2,
        s2Scene,
        s2Laptop,
        s2LaptopScreen,
        s2CardWhatsapp,
        s2CardPayment,
        s2CardStock,
        s2CardCourier,
        s3
      };
    });

    // Compute containment & collision metrics
    const report = {
      viewport: vp.name,
      pageOverflow: audit.hasHorizontalOverflow ? 'FAIL' : 'PASS',
      screen1: {
        containedInHero: 'N/A',
        phoneOverlapStorefrontPct: 0,
        annotCollisionNav: 'N/A'
      },
      screen2: {
        containedInProblem: 'N/A',
        cardCollisions: [],
        cardsOverlapLaptopScreenPct: {}
      }
    };

    if (audit.s1 && audit.s1Scene && audit.s2) {
      // Check if hero scene bottom extends past hero section bottom or into s2
      const heroBottomExceeded = audit.s1Scene.bottom > audit.s1.bottom + 1;
      const heroHitsS2 = audit.s1Scene.bottom > audit.s2.top;
      report.screen1.containedInHero = (!heroBottomExceeded && !heroHitsS2) ? 'PASS' : 'FAIL';

      // Check phone overlap with storefront content
      if (audit.s1Phone && audit.s1Phone.visible && audit.s1StorefrontScreen && audit.s1StorefrontScreen.visible) {
        const overlap = rectOverlapArea(audit.s1Phone, audit.s1StorefrontScreen);
        const screenArea = audit.s1StorefrontScreen.width * audit.s1StorefrontScreen.height;
        const pct = screenArea > 0 ? (overlap / screenArea) * 100 : 0;
        report.screen1.phoneOverlapStorefrontPct = Math.round(pct * 10) / 10;
      }

      // Check annotation collision with storefront nav
      if (audit.s1AnnotDevice && audit.s1AnnotDevice.visible && audit.s1StorefrontNav && audit.s1StorefrontNav.visible) {
        const overlap = rectOverlapArea(audit.s1AnnotDevice, audit.s1StorefrontNav);
        report.screen1.annotCollisionNav = overlap > 0 ? 'FAIL' : 'PASS';
      } else {
        report.screen1.annotCollisionNav = 'PASS (NOT_COLLIDING_OR_HIDDEN)';
      }
    }

    if (audit.s2 && audit.s2Scene && audit.s3) {
      const s2BottomExceeded = audit.s2Scene.bottom > audit.s2.bottom + 1;
      const s2HitsS3 = audit.s2Scene.bottom > audit.s3.top;
      report.screen2.containedInProblem = (!s2BottomExceeded && !s2HitsS3) ? 'PASS' : 'FAIL';

      // Check card collisions with each other
      const cards = [
        { name: 'WhatsApp', r: audit.s2CardWhatsapp },
        { name: 'Payment', r: audit.s2CardPayment },
        { name: 'Stock', r: audit.s2CardStock },
        { name: 'Courier', r: audit.s2CardCourier }
      ];

      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          if (cards[i].r && cards[i].r.visible && cards[j].r && cards[j].r.visible) {
            const overlap = rectOverlapArea(cards[i].r, cards[j].r);
            if (overlap > 10) {
              report.screen2.cardCollisions.push(`${cards[i].name} collides with ${cards[j].name} (area: ${Math.round(overlap)}px)`);
            }
          }
        }
      }

      // Check cards overlap with laptop screen
      if (audit.s2LaptopScreen && audit.s2LaptopScreen.visible) {
        const screenArea = audit.s2LaptopScreen.width * audit.s2LaptopScreen.height;
        for (const card of cards) {
          if (card.r && card.r.visible) {
            const overlap = rectOverlapArea(card.r, audit.s2LaptopScreen);
            const pct = screenArea > 0 ? (overlap / screenArea) * 100 : 0;
            report.screen2.cardsOverlapLaptopScreenPct[card.name] = Math.round(pct * 10) / 10;
          }
        }
      }
    }

    results[vp.name] = report;
  }

  await browser.close();
  return results;
}

if (process.argv[1] && process.argv[1].endsWith('verify-containment.mjs')) {
  runContainmentAudit().then(res => {
    console.log(JSON.stringify(res, null, 2));
  });
}
