import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { FOUNDATIONAL_THEMES } from '../packages/ui/dist/index.js';

// Capture the production /store/[slug] renderer, ThemeWrapper, StoreHeader and
// product cards with isolated demo API responses. No renderer/style substitutions.
// Needs the local storefront on :3000 and Python/Pillow for optimized WebP export.
const base = process.env.STOREFRONT_URL || 'http://localhost:3000';
const output = path.resolve('apps/storefront/public/images/landing/themes');
const artifacts = path.resolve('artifacts/catalog-theme-polish/theme-sources');
fs.mkdirSync(output, { recursive: true });
fs.mkdirSync(artifacts, { recursive: true });

function art(type, color, index = 0) {
  const drawing =
    type === 'bottle'
      ? '<rect x="174" y="65" width="52" height="40" rx="8" fill="#3f342e"/><rect x="150" y="103" width="100" height="174" rx="20" fill="' +
        color +
        '"/><rect x="162" y="155" width="76" height="70" rx="3" fill="#fffaf5"/><path d="M179 171h42m-36 13h30m-24 14h18" stroke="' +
        color +
        '" stroke-width="3"/>'
      : type === 'jewellery'
        ? '<ellipse cx="200" cy="178" rx="70" ry="82" fill="none" stroke="' +
          color +
          '" stroke-width="9"/><path d="m200 242 20 22-20 29-20-29z" fill="' +
          color +
          '"/><circle cx="200" cy="264" r="6" fill="#fff3bc"/>'
        : type === 'jar'
          ? '<rect x="140" y="86" width="120" height="32" rx="8" fill="#8c6a45"/><rect x="146" y="114" width="108" height="164" rx="20" fill="' +
            color +
            '"/><rect x="157" y="162" width="86" height="66" rx="6" fill="#fff9e9"/><path d="M177 178h46m-39 14h32m-27 14h22" stroke="' +
            color +
            '" stroke-width="3"/>'
          : type === 'home'
            ? '<path d="M158 112h84v44c0 22 43 49 43 78 0 49-170 49-170 0 0-29 43-56 43-78z" fill="' +
              color +
              '"/><path d="M200 114V45m0 26 40-19m-40 32-36-22" stroke="#66826b" stroke-width="5"/><path d="M135 220h130m-121 19h112" stroke="#ffffff" stroke-opacity=".4" stroke-width="4"/>'
            : type === 'tech' && index === 1
              ? '<path d="M200 90c-43 0-66 35-66 86v38c0 49 132 49 132 0v-38c0-51-23-86-66-86z" fill="' +
                color +
                '"/><path d="M200 92v79m-64 5h128" stroke="#d6e7f0" stroke-width="4"/><rect x="194" y="114" width="12" height="30" rx="6" fill="#e8f0f3"/>'
              : type === 'tech' && index === 2
                ? '<rect x="119" y="104" width="46" height="152" rx="15" fill="' +
                  color +
                  '"/><rect x="172" y="104" width="110" height="152" rx="12" fill="#263c4c"/><path d="M132 138h20m-10-10v20m53 64h62" stroke="#e8f0f3" stroke-width="5"/><circle cx="142" cy="213" r="9" fill="#c3d9e6"/><circle cx="259" cy="130" r="5" fill="#79b4d1"/>'
                : '<rect x="110" y="115" width="180" height="110" rx="12" fill="' +
                  color +
                  '"/><rect x="120" y="125" width="160" height="90" rx="5" fill="#e8f0f3"/><path d="M200 225v30m-40 0h80" stroke="' +
                  color +
                  '" stroke-width="9"/><path d="m172 169 18 18 39-39" stroke="' +
                  color +
                  '" stroke-width="8" fill="none"/>';
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="340" viewBox="0 0 400 340"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#f7f3ec"/><stop offset="1" stop-color="#e3e7df"/></linearGradient></defs><rect width="400" height="340" fill="url(#bg)"/><ellipse cx="200" cy="292" rx="108" ry="12" fill="#27332c" opacity=".09"/><g transform="rotate(' +
        (index - 1) * 3 +
        ' 200 170)">' +
        drawing +
        '</g></svg>',
    )
  );
}

const demos = [
  {
    id: 'aura',
    store: 'Pure & Co.',
    badge: 'Everyday wellbeing',
    title: 'A little care. A daily ritual.',
    subtitle: 'Thoughtful essentials for a brighter everyday.',
    type: 'bottle',
    color: '#ad6b6f',
    names: [
      'Botanical Serum',
      'Daily Moisturiser',
      'Gentle Cleanser',
      'Essential Oil',
    ],
  },
  {
    id: 'harvest',
    store: 'The Good Pantry',
    title: 'Good ingredients. Simple pleasures.',
    subtitle: 'Small-batch pantry favourites, made with care.',
    type: 'jar',
    color: '#849765',
    names: ['Raw Honey', 'Rolled Oats', 'Roasted Coffee', 'Organic Millet'],
  },
  {
    id: 'feast',
    store: 'Daily Bakehouse',
    title: 'Fresh from our kitchen.',
    subtitle: 'Slow-baked bread, buttery pastries and everyday celebrations.',
    hero: '/images/landing/bakery/hero-spread.jpg',
    photos: [
      'croissant.jpg',
      'artisanal-bread.jpg',
      'chocolate-cake.jpg',
      'chocolate-cookies.jpg',
    ],
    names: [
      'Butter Croissant',
      'Artisanal Bread',
      'Chocolate Cake',
      'Chocolate Cookies',
    ],
  },
  {
    id: 'horizon',
    store: 'Horizon Works',
    badge: 'Craft meets innovation',
    title: 'High-tech solutions.',
    subtitle: 'Precision, heritage and useful products for a changing world.',
    type: 'tech',
    color: '#426986',
    names: [
      'Studio Display',
      'Precision Mouse',
      'Connected Console',
      'Desktop Monitor',
    ],
  },
  {
    id: 'canvas',
    store: 'Form & Living',
    badge: 'Considered spaces',
    title: 'Room for possibility.',
    subtitle: 'Objects, textures and details that make a space your own.',
    type: 'home',
    color: '#aa8060',
    names: [
      'Studio Vase',
      'Sculpted Vessel',
      'Terracotta Pot',
      'Everyday Ceramic',
    ],
  },
  {
    id: 'atelier',
    store: 'Sona Studio',
    badge: 'Jewellery, thoughtfully made',
    title: 'Small details. Lasting beauty.',
    subtitle:
      'Carefully crafted pieces for everyday moments and special occasions.',
    type: 'jewellery',
    color: '#b99349',
    names: [
      'Everyday Pendant',
      'Classic Gold Chain',
      'Heritage Necklace',
      'Signature Pendant',
    ],
  },
];
const requestedIds = new Set(process.argv.slice(2));
for (const id of requestedIds)
  assert.ok(
    demos.some((demo) => demo.id === id),
    'Unknown demo theme: ' + id,
  );
const selectedDemos = demos.filter(
  (demo) => !requestedIds.size || requestedIds.has(demo.id),
);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const manifest = [];
try {
  for (const demo of selectedDemos) {
    const theme = FOUNDATIONAL_THEMES[demo.id];
    assert.ok(theme, 'active production theme');
    const context = await browser.newContext({
      viewport: { width: 1680, height: 1280 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const images = demo.names.map((_, i) =>
      demo.photos
        ? base + '/images/landing/bakery/' + demo.photos[i]
        : art(demo.type, demo.color, i),
    );
    const hero = demo.hero
      ? base + demo.hero
      : ['horizon', 'canvas'].includes(demo.id)
        ? base + '/themes/' + demo.id + '-hero.jpg'
        : images[0];
    const fixture = {
      store: {
        id: 'theme-demo-' + demo.id,
        name: demo.store,
        slug: 'theme-demo',
        status: 'LIVE',
        branding: {},
        storefrontDefaultLocale: 'en-IN',
        enabledStorefrontLocales: ['en-IN'],
      },
      themeConfig: {
        themeId: demo.id,
        palette: theme.palette,
        typography: { preset: theme.typography.heading },
        headerStyle: theme.headerStyle,
        cardStyle: theme.cardStyle,
        buttonStyle: theme.buttonStyle,
        imageRatio: theme.imageRatio,
        announcement: {
          enabled: true,
          text: 'Thoughtfully selected · Shop the collection',
        },
        pages: {
          home: {
            heroBadge: demo.badge,
            heroTitle: demo.title,
            heroSubtitle: demo.subtitle,
            heroBannerUrl: hero,
            heroCtaText: 'Shop the collection',
            heroSecondaryCtaText: 'Our story',
          },
        },
      },
      categories: [],
      products: demo.names.map((name, i) => ({
        id: 'demo-' + i,
        name,
        slug: 'demo-' + i,
        mode: 'SELL_ONLINE',
        status: 'PUBLISHED',
        basePricePaise: [89900, 129900, 159900, 79900][i],
        description: 'Thoughtfully selected for everyday life.',
        media: [
          { id: 'demo-image-' + i, publicUrl: images[i], isPrimary: true },
        ],
        variants: [
          {
            id: 'demo-variant-' + i,
            pricePaise: [89900, 129900, 159900, 79900][i],
            inventory: { stockOnHand: 10 },
          },
        ],
      })),
    };
    await context.route('**/storefront/theme-demo*', (route) =>
      route.fulfill({ json: { success: true, data: fixture } }),
    );
    // Keep generation read-only: no cart records or real merchant data are fetched.
    await context.route('**/cart/init', (route) =>
      route.fulfill({
        json: { success: true, data: { id: 'demo-cart', items: [] } },
      }),
    );
    const page = await context.newPage();
    await page.goto(base + '/store/theme-demo', { waitUntil: 'networkidle' });
    await page.locator('.theme-' + demo.id + ' .store-product-grid').waitFor();
    assert.ok(
      await page
        .locator('[data-theme-hero] h1')
        .textContent()
        .then((text) => text.includes(demo.title)),
      'authored demo headline uses the real hero renderer',
    );
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (const image of document.images) {
        image.loading = 'eager';
        await image.decode().catch(() => {});
      }
    });
    assert.equal(
      await page.locator('[data-theme-hero]').count(),
      1,
      'real theme hero',
    );
    assert.equal(
      await page.locator('.store-product-grid > div').count(),
      4,
      'real theme product cards',
    );
    const source = path.join(artifacts, demo.id + '.png');
    await page.screenshot({ path: source, animations: 'disabled' });
    const target = path.join(output, demo.id + '.webp');
    const exported = spawnSync(
      'python',
      [
        '-c',
        'from PIL import Image; import sys; im=Image.open(sys.argv[1]).convert("RGB"); im.resize((1008,768),Image.Resampling.LANCZOS).save(sys.argv[2],"WEBP",quality=88,method=6)',
        source,
        target,
      ],
      { encoding: 'utf8' },
    );
    assert.equal(exported.status, 0, exported.stderr);
    manifest.push({
      id: demo.id,
      name: theme.name,
      renderer: 'apps/storefront/src/pages/store/[slug]/index.tsx',
      source: [1680, 1280],
      output: [1008, 768],
      bytes: fs.statSync(target).size,
    });
    await context.close();
    console.log(theme.name + ': real storefront snapshot exported.');
  }
  fs.writeFileSync(
    path.join(artifacts, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  );
} finally {
  await browser.close();
}
