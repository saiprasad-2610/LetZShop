export interface BakeryProduct {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviewsCount: number;
  image: string;
  badge?: string;
}

export interface BakeryDemoData {
  storeName: string;
  storeTagline: string;
  navLinks: string[];
  heroTitle: string;
  heroHighlight: string;
  heroDescription: string;
  heroCta: string;
  heroBannerImage: string;
  bestSellersTitle: string;
  products: BakeryProduct[];
}

export const bakeryDemoData: BakeryDemoData = {
  storeName: 'Daily Bakehouse',
  storeTagline: 'Freshly Baked Happiness',
  navLinks: ['Home', 'Shop', 'Cakes', 'Cookies', 'Breads', 'About'],
  heroTitle: 'Freshly Baked',
  heroHighlight: 'Everyday Happiness',
  heroDescription: 'Artisanal breads, cakes, cookies and more, made with the finest ingredients.',
  heroCta: 'Shop Now',
  heroBannerImage: '/images/landing/bakery/hero-spread.jpg',
  bestSellersTitle: 'Best Sellers',
  products: [
    {
      id: 'butter-croissant',
      name: 'Butter Croissant',
      price: 120,
      rating: 4.8,
      reviewsCount: 124,
      image: '/images/landing/bakery/croissant.jpg',
    },
    {
      id: 'chocolate-cake',
      name: 'Chocolate Cake',
      price: 699,
      rating: 4.9,
      reviewsCount: 96,
      image: '/images/landing/bakery/chocolate-cake.jpg',
    },
    {
      id: 'artisanal-bread',
      name: 'Artisanal Bread',
      price: 180,
      rating: 4.7,
      reviewsCount: 92,
      image: '/images/landing/bakery/artisanal-bread.jpg',
    },
    {
      id: 'chocolate-cookies',
      name: 'Chocolate Cookies',
      price: 220,
      rating: 4.8,
      reviewsCount: 156,
      image: '/images/landing/bakery/chocolate-cookies.jpg',
    },
  ],
};
