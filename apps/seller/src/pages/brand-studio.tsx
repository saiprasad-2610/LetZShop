import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import {
  Palette,
  Wand2,
  Sparkles,
  LayoutTemplate,
  Eye,
  Save,
  Check,
  Smartphone,
  Monitor,
  Type,
  Layers,
  ArrowUp,
  ArrowDown,
  UploadCloud,
  AlertTriangle,
  Building,
  MapPin,
  Clock,
  Sliders,
  X,
  ExternalLink,
  ShoppingBag,
  BookOpen,
  Home,
  CheckCircle2,
  Info,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  MessageCircle,
  Share2,
  Globe,
  Link2,
  Trash2,
  Image as ImageIcon,
  Minus,
  Plus,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { MiniStorePreview } from '../components/MiniStorePreview';
import { useAuth } from '../context/AuthContext';
import {
  FOUNDATIONAL_THEMES,
  QuickDesigner,
  getContrastRatio,
  isContrastAccessible,
  getSuggestedTextColor,
  getWordmark,
} from '@simply/ui';
import { SafeImage } from '../components/ui/SafeImage';

export default function BrandStudioPage() {
  const { api } = useAuth();
  const [activeTab, setActiveTab] = useState<'THEME' | 'HOME' | 'PRODUCTS' | 'ABOUT' | 'FOOTER'>('THEME');
  const [activePreviewPage, setActivePreviewPage] = useState<'home' | 'products' | 'about'>('home');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [store, setStore] = useState<any>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const homeBannerInputRef = useRef<HTMLInputElement>(null);
  const aboutBannerInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Global Theme & Styling State
  const [selectedThemeId, setSelectedThemeId] = useState('atelier');
  const [primaryColor, setPrimaryColor] = useState('#1C1917');
  const [accentColor, setAccentColor] = useState('#D4AF37');
  const [backgroundColor, setBackgroundColor] = useState('#FAFAF9');
  const [typographyPreset, setTypographyPreset] = useState('Playfair Display');
  const [announcementText, setAnnouncementText] = useState(
    'Complimentary pan-India insured shipping on all orders'
  );
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);
  const [announcementFloating, setAnnouncementFloating] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoSize, setLogoSize] = useState<number>(40);
  const [storeNameSize, setStoreNameSize] = useState<number>(18);
  const [heroBannerUrl, setHeroBannerUrl] = useState('');
  const [aboutBannerUrl, setAboutBannerUrl] = useState('');
  const [uploadingHomeBanner, setUploadingHomeBanner] = useState(false);
  const [uploadingAboutBanner, setUploadingAboutBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadStepMessage, setUploadStepMessage] = useState('');
  const [homeBannerMeta, setHomeBannerMeta] = useState<{
    width: number;
    height: number;
    origWidth: number;
    origHeight: number;
    sizeKb: number;
    status: 'valid' | 'warning';
    message: string;
  } | null>(null);
  const [aboutBannerMeta, setAboutBannerMeta] = useState<{
    width: number;
    height: number;
    origWidth: number;
    origHeight: number;
    sizeKb: number;
    status: 'valid' | 'warning';
    message: string;
  } | null>(null);
  const [logoMeta, setLogoMeta] = useState<{
    width: number;
    height: number;
    origWidth: number;
    origHeight: number;
    sizeKb: number;
    status: 'valid' | 'warning';
    message: string;
  } | null>(null);

  // Extended Customization
  const [headerStyle, setHeaderStyle] = useState('minimal-center');
  const [heroStyle, setHeroStyle] = useState('split-editorial');
  const [cardStyle, setCardStyle] = useState('framed-luxury');
  const [buttonStyle, setButtonStyle] = useState('sharp-pill');
  const [imageRatio, setImageRatio] = useState('3/4');

  // HOME PAGE Specific Customization
  const [homeHeroBadge, setHomeHeroBadge] = useState('ARTISANAL ATELIER • HALLMARKED & CERTIFIED');
  const [homeHeroTitle, setHomeHeroTitle] = useState('Timeless Elegance & Handcrafted Luxury');
  const [homeHeroSubtitle, setHomeHeroSubtitle] = useState(
    'Every creation embodies heritage craftsmanship, hand-selected materials, and immaculate proportion. Designed for collectors of fine distinction.'
  );
  const [homeCtaText, setHomeCtaText] = useState('Explore Collection');
  const [homeCtaLink, setHomeCtaLink] = useState('#products');
  const [homeSecondaryCtaText, setHomeSecondaryCtaText] = useState('Our Heritage');
  const [homeSecondaryCtaLink, setHomeSecondaryCtaLink] = useState('#story');

  // PRODUCTS PAGE Specific Customization
  const [productsPageTitle, setProductsPageTitle] = useState('Our Collection');
  const [productsPageSubtitle, setProductsPageSubtitle] = useState(
    'Explore our complete selection of handcrafted offerings sourced with care and delivered directly to your doorstep.'
  );
  const [productsBadgeText, setProductsBadgeText] = useState('Direct from Merchant');

  // ABOUT US PAGE Specific Customization
  const [aboutPageTitle, setAboutPageTitle] = useState('');
  const [aboutTagline, setAboutTagline] = useState(
    'Rooted in authentic tradition, crafted for everyday distinction.'
  );
  const [aboutStoryP1, setAboutStoryP1] = useState(
    'Founded with a steadfast commitment to purity and heritage, our boutique brings you exceptional goods meticulously selected from trusted origins.'
  );
  const [aboutStoryP2, setAboutStoryP2] = useState(
    'Every offering is curated by experienced master specialists who value genuine craftsmanship, ethical supply chains, and transparent customer service.'
  );
  const [aboutMissionTitle, setAboutMissionTitle] = useState('Our Mission');
  const [aboutMissionText, setAboutMissionText] = useState(
    'To deliver genuine, authentic quality directly to discerning customers with zero compromise on integrity and craftsmanship.'
  );
  const [aboutVisionTitle, setAboutVisionTitle] = useState('Our Vision');
  const [aboutVisionText, setAboutVisionText] = useState(
    'Preserving authentic Indian heritage while making premium craftsmanship accessible across the country.'
  );
  const [pillar1Title, setPillar1Title] = useState('100% Authentic Quality');
  const [pillar1Desc, setPillar1Desc] = useState(
    'Directly sourced and inspected for absolute purity and highest benchmark standards.'
  );
  const [pillar2Title, setPillar2Title] = useState('Direct Merchant Care');
  const [pillar2Desc, setPillar2Desc] = useState(
    'Hand-packed with care by our dedicated team with direct support for every customer.'
  );
  const [pillar3Title, setPillar3Title] = useState('Secure Pan-India Delivery');
  const [pillar3Desc, setPillar3Desc] = useState(
    'Reliable express shipping with real-time tracking and verified protective packaging.'
  );
  const [physicalStoreAddress, setPhysicalStoreAddress] = useState(
    'Heritage Arcade, MG Road, Pune, Maharashtra 411001'
  );
  const [physicalStoreTimings, setPhysicalStoreTimings] = useState(
    'Monday – Saturday: 10:30 AM to 8:30 PM (IST)'
  );
  const [aboutPhone, setAboutPhone] = useState('+91 98220 12345');
  const [aboutEmail, setAboutEmail] = useState('contact@sairamteacompany.com');

  // FOOTER & SOCIAL MEDIA Specific Customization
  const [footerDescription, setFooterDescription] = useState(
    'Official digital storefront. Order genuine products online directly with transparent pricing and doorstep delivery.'
  );
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialWhatsapp, setSocialWhatsapp] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialLinkedin, setSocialLinkedin] = useState('');
  const [showTrustBadges, setShowTrustBadges] = useState(true);
  const [trustBadge1Title, setTrustBadge1Title] = useState('Secure Indian Payments');
  const [trustBadge1Subtitle, setTrustBadge1Subtitle] = useState('UPI, Netbanking & Cards via Razorpay');
  const [trustBadge2Title, setTrustBadge2Title] = useState('Reliable Pan-India Delivery');
  const [trustBadge2Subtitle, setTrustBadge2Subtitle] = useState('Doorstep tracking via premier couriers');
  const [trustBadge3Title, setTrustBadge3Title] = useState('Verified Authentic Goods');
  const [trustBadge3Subtitle, setTrustBadge3Subtitle] = useState('Direct from certified merchant business');
  const [footerCopyright, setFooterCopyright] = useState('');

  // Sections flow for Home Page
  const [sections, setSections] = useState<
    Array<{ id: string; name: string; enabled: boolean }>
  >([
    { id: 'announcement', name: 'Top Announcement Bar', enabled: true },
    { id: 'hero', name: 'Hero Showcase Banner', enabled: true },
    { id: 'categories', name: 'Category Showcase', enabled: true },
    { id: 'featured_products', name: 'Curated Products Grid', enabled: true },
    { id: 'brand_story', name: 'Brand Story & Heritage', enabled: true },
    { id: 'physical_store', name: 'Visit Physical Store & Map', enabled: true },
    { id: 'testimonials', name: 'Customer Testimonials', enabled: true },
    { id: 'contact', name: 'Contact & Inquiry Section', enabled: true },
  ]);

  useEffect(() => {
    loadStudioData();
  }, []);

  const loadStudioData = async () => {
    setLoading(true);
    try {
      const [storeRes, configRes] = await Promise.all([
        api.stores.getMyStore(),
        api.themes.getThemeConfig().catch(() => null),
      ]);
      setStore(storeRes);

      if (storeRes) {
        if (!aboutPageTitle) setAboutPageTitle(`About ${storeRes.name || 'Our Boutique'}`);
        if (storeRes.supportPhone) {
          setAboutPhone(storeRes.supportPhone);
        }
        if (storeRes.supportEmail) setAboutEmail(storeRes.supportEmail);
        if (storeRes.businessAddress) setPhysicalStoreAddress(storeRes.businessAddress);
        if (storeRes.socialLinks) {
          setSocialInstagram(storeRes.socialLinks.instagram || '');
          setSocialWhatsapp(storeRes.socialLinks.whatsapp || '');
          setSocialFacebook(storeRes.socialLinks.facebook || '');
          setSocialYoutube(storeRes.socialLinks.youtube || '');
          setSocialTwitter(storeRes.socialLinks.twitter || '');
          setSocialLinkedin(storeRes.socialLinks.linkedin || '');
        }
      }

      if (storeRes?.branding) {
        if (storeRes.branding.logoUrl) setLogoUrl(storeRes.branding.logoUrl);
        if (storeRes.branding.bannerUrl) setHeroBannerUrl(storeRes.branding.bannerUrl);
        if (storeRes.branding.primaryColor) setPrimaryColor(storeRes.branding.primaryColor);
        if (storeRes.branding.accentColor) setAccentColor(storeRes.branding.accentColor);
        if (storeRes.branding.logoSize) setLogoSize(Number(storeRes.branding.logoSize));
        if (storeRes.branding.storeNameSize) setStoreNameSize(Number(storeRes.branding.storeNameSize));
      }

      if (configRes) {
        const cfg = configRes.configJson || configRes;
        const activeThemeCode =
          configRes.activeTheme?.code?.toLowerCase() || cfg.themeId || selectedThemeId;
        if (activeThemeCode) setSelectedThemeId(activeThemeCode);

        if (cfg.logoSize) setLogoSize(Number(cfg.logoSize));
        if (cfg.storeNameSize) setStoreNameSize(Number(cfg.storeNameSize));

        if (cfg.palette?.primary) setPrimaryColor(cfg.palette.primary);
        if (cfg.palette?.accent) setAccentColor(cfg.palette.accent);
        if (cfg.palette?.background) setBackgroundColor(cfg.palette.background);
        if (cfg.typography?.preset) setTypographyPreset(cfg.typography.preset);

        if (cfg.announcement) {
          setAnnouncementText(cfg.announcement.text ?? 'Complimentary pan-India insured shipping on all orders');
          setAnnouncementEnabled(cfg.announcement.enabled ?? true);
          setAnnouncementFloating(cfg.announcement.floating ?? false);
        }

        if (cfg.headerStyle) setHeaderStyle(cfg.headerStyle);
        if (cfg.heroStyle) setHeroStyle(cfg.heroStyle);
        if (cfg.cardStyle) setCardStyle(cfg.cardStyle);
        if (cfg.buttonStyle) setButtonStyle(cfg.buttonStyle);
        if (cfg.imageRatio) setImageRatio(cfg.imageRatio);
        if (cfg.physicalStoreAddress) setPhysicalStoreAddress(cfg.physicalStoreAddress);
        if (cfg.physicalStoreTimings) setPhysicalStoreTimings(cfg.physicalStoreTimings);

        // Load custom home page fields
        if (cfg.pages?.home) {
          const h = cfg.pages.home;
          if (h.heroBadge) setHomeHeroBadge(h.heroBadge);
          if (h.heroTitle) setHomeHeroTitle(h.heroTitle);
          if (h.heroSubtitle) setHomeHeroSubtitle(h.heroSubtitle);
          if (h.heroCtaText) setHomeCtaText(h.heroCtaText);
          if (h.heroCtaLink) setHomeCtaLink(h.heroCtaLink);
          if (h.heroSecondaryCtaText) setHomeSecondaryCtaText(h.heroSecondaryCtaText);
          if (h.heroSecondaryCtaLink) setHomeSecondaryCtaLink(h.heroSecondaryCtaLink);
          if (h.heroBannerUrl) setHeroBannerUrl(h.heroBannerUrl);
        }

        // Load custom products page fields
        if (cfg.pages?.products) {
          const p = cfg.pages.products;
          if (p.pageTitle) setProductsPageTitle(p.pageTitle);
          if (p.pageSubtitle) setProductsPageSubtitle(p.pageSubtitle);
          if (p.badgeText) setProductsBadgeText(p.badgeText);
        }

        // Load custom about us page fields
        if (cfg.pages?.about) {
          const a = cfg.pages.about;
          if (a.pageTitle) setAboutPageTitle(a.pageTitle);
          if (a.tagline) setAboutTagline(a.tagline);
          if (a.storyParagraph1) setAboutStoryP1(a.storyParagraph1);
          if (a.storyParagraph2) setAboutStoryP2(a.storyParagraph2);
          if (a.missionTitle) setAboutMissionTitle(a.missionTitle);
          if (a.missionText) setAboutMissionText(a.missionText);
          if (a.visionTitle) setAboutVisionTitle(a.visionTitle);
          if (a.visionText) setAboutVisionText(a.visionText);
          if (Array.isArray(a.values) && a.values.length >= 3) {
            setPillar1Title(a.values[0]?.title || pillar1Title);
            setPillar1Desc(a.values[0]?.desc || pillar1Desc);
            setPillar2Title(a.values[1]?.title || pillar2Title);
            setPillar2Desc(a.values[1]?.desc || pillar2Desc);
            setPillar3Title(a.values[2]?.title || pillar3Title);
            setPillar3Desc(a.values[2]?.desc || pillar3Desc);
          }
          if (a.storeAddress) setPhysicalStoreAddress(a.storeAddress);
          if (a.storeHours) setPhysicalStoreTimings(a.storeHours);
          if (a.contactPhone) setAboutPhone(a.contactPhone);
          if (a.contactEmail) setAboutEmail(a.contactEmail);
          if (a.bannerUrl) setAboutBannerUrl(a.bannerUrl);
          else if (a.imageUrl) setAboutBannerUrl(a.imageUrl);
        } else if (cfg.storeStory) {
          setAboutStoryP1(cfg.storeStory);
        }

        // Load custom footer & social settings
        const f = cfg.footer || cfg.pages?.footer;
        if (f) {
          if (f.description) setFooterDescription(f.description);
          if (f.socialLinks) {
            if (f.socialLinks.instagram) setSocialInstagram(f.socialLinks.instagram);
            if (f.socialLinks.whatsapp) setSocialWhatsapp(f.socialLinks.whatsapp);
            if (f.socialLinks.facebook) setSocialFacebook(f.socialLinks.facebook);
            if (f.socialLinks.youtube) setSocialYoutube(f.socialLinks.youtube);
            if (f.socialLinks.twitter) setSocialTwitter(f.socialLinks.twitter);
            if (f.socialLinks.linkedin) setSocialLinkedin(f.socialLinks.linkedin);
          }
          if (f.showTrustBadges !== undefined) setShowTrustBadges(f.showTrustBadges);
          if (f.trustBadge1Title) setTrustBadge1Title(f.trustBadge1Title);
          if (f.trustBadge1Subtitle) setTrustBadge1Subtitle(f.trustBadge1Subtitle);
          if (f.trustBadge2Title) setTrustBadge2Title(f.trustBadge2Title);
          if (f.trustBadge2Subtitle) setTrustBadge2Subtitle(f.trustBadge2Subtitle);
          if (f.trustBadge3Title) setTrustBadge3Title(f.trustBadge3Title);
          if (f.trustBadge3Subtitle) setTrustBadge3Subtitle(f.trustBadge3Subtitle);
          if (f.copyrightText) setFooterCopyright(f.copyrightText.replace(/\.?\s*DPDPA\s*2023\s*Compliant\.?/gi, '').trim());
        }
      }
    } catch (err) {
      console.error('Failed to load theme studio data', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync state in real time with the live iframe preview
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'UPDATE_THEME_PREVIEW',
          themeConfig: {
            themeId: selectedThemeId,
            logoSize,
            storeNameSize,
            palette: {
              primary: primaryColor,
              accent: accentColor,
              background: backgroundColor,
            },
            typography: {
              preset: typographyPreset,
            },
            announcement: {
              enabled: announcementEnabled,
              text: announcementText,
              floating: announcementFloating,
            },
            headerStyle,
            heroStyle,
            cardStyle,
            buttonStyle,
            imageRatio,
            storeStory: aboutStoryP1,
            physicalStoreAddress,
            physicalStoreTimings,
            footer: {
              description: footerDescription,
              socialLinks: {
                instagram: socialInstagram,
                whatsapp: socialWhatsapp,
                facebook: socialFacebook,
                youtube: socialYoutube,
                twitter: socialTwitter,
                linkedin: socialLinkedin,
              },
              showTrustBadges,
              trustBadge1Title,
              trustBadge1Subtitle,
              trustBadge2Title,
              trustBadge2Subtitle,
              trustBadge3Title,
              trustBadge3Subtitle,
              copyrightText: (footerCopyright || `© ${new Date().getFullYear()} ${store?.name || 'Our Store'}. All rights reserved.`).replace(/\.?\s*DPDPA\s*2023\s*Compliant\.?/gi, '').trim(),
              contactPhone: aboutPhone,
              contactEmail: aboutEmail,
              address: physicalStoreAddress,
            },
            pages: {
              home: {
                heroBadge: homeHeroBadge,
                heroTitle: homeHeroTitle,
                heroSubtitle: homeHeroSubtitle,
                heroCtaText: homeCtaText,
                heroCtaLink: homeCtaLink,
                heroSecondaryCtaText: homeSecondaryCtaText,
                heroSecondaryCtaLink: homeSecondaryCtaLink,
                heroBannerUrl: heroBannerUrl,
              },
              products: {
                badgeText: productsBadgeText,
                pageTitle: productsPageTitle,
                pageSubtitle: productsPageSubtitle,
              },
              about: {
                pageTitle: aboutPageTitle || `About ${store?.name || 'Our Boutique'}`,
                tagline: aboutTagline,
                storyParagraph1: aboutStoryP1,
                storyParagraph2: aboutStoryP2,
                missionTitle: aboutMissionTitle,
                missionText: aboutMissionText,
                visionTitle: aboutVisionTitle,
                visionText: aboutVisionText,
                values: [
                  { title: pillar1Title, desc: pillar1Desc },
                  { title: pillar2Title, desc: pillar2Desc },
                  { title: pillar3Title, desc: pillar3Desc },
                ],
                storeAddress: physicalStoreAddress,
                storeHours: physicalStoreTimings,
                contactPhone: aboutPhone,
                contactEmail: aboutEmail,
                bannerUrl: aboutBannerUrl || heroBannerUrl,
              },
              footer: {
                description: footerDescription,
                socialLinks: {
                  instagram: socialInstagram,
                  whatsapp: socialWhatsapp,
                  facebook: socialFacebook,
                  youtube: socialYoutube,
                  twitter: socialTwitter,
                  linkedin: socialLinkedin,
                },
              },
            },
          },
          branding: {
            logoUrl,
            bannerUrl: heroBannerUrl,
            primaryColor,
            accentColor,
            logoSize,
            storeNameSize,
          },
        },
        '*'
      );
    }
  }, [
    selectedThemeId,
    primaryColor,
    accentColor,
    backgroundColor,
    typographyPreset,
    announcementEnabled,
    announcementText,
    announcementFloating,
    headerStyle,
    heroStyle,
    cardStyle,
    buttonStyle,
    imageRatio,
    homeHeroBadge,
    homeHeroTitle,
    homeHeroSubtitle,
    homeCtaText,
    homeCtaLink,
    homeSecondaryCtaText,
    homeSecondaryCtaLink,
    productsPageTitle,
    productsPageSubtitle,
    productsBadgeText,
    aboutPageTitle,
    aboutTagline,
    aboutStoryP1,
    aboutStoryP2,
    aboutMissionTitle,
    aboutMissionText,
    aboutVisionTitle,
    aboutVisionText,
    pillar1Title,
    pillar1Desc,
    pillar2Title,
    pillar2Desc,
    pillar3Title,
    pillar3Desc,
    physicalStoreAddress,
    physicalStoreTimings,
    aboutPhone,
    aboutEmail,
    footerDescription,
    socialInstagram,
    socialWhatsapp,
    socialFacebook,
    socialYoutube,
    socialTwitter,
    socialLinkedin,
    showTrustBadges,
    trustBadge1Title,
    trustBadge1Subtitle,
    trustBadge2Title,
    trustBadge2Subtitle,
    trustBadge3Title,
    trustBadge3Subtitle,
    footerCopyright,
    logoUrl,
    logoSize,
    storeNameSize,
    heroBannerUrl,
    aboutBannerUrl,
  ]);

  const handleTabSwitch = (tab: 'THEME' | 'HOME' | 'PRODUCTS' | 'ABOUT' | 'FOOTER') => {
    setActiveTab(tab);
    if (tab === 'HOME') setActivePreviewPage('home');
    else if (tab === 'PRODUCTS') setActivePreviewPage('products');
    else if (tab === 'ABOUT') setActivePreviewPage('about');
  };

  const handleApplyQuickPreset = (categoryName: string) => {
    const output = QuickDesigner.designForCategory(categoryName, store?.name || 'Our Store');
    setSelectedThemeId(output.themeCode);
    setPrimaryColor(output.primaryColor);
    setAccentColor(output.accentColor);
    setBackgroundColor(output.theme.palette.background);
    setTypographyPreset(output.theme.typography.heading);
    setHeaderStyle(output.theme.headerStyle);
    setHeroStyle(output.theme.heroStyle);
    setCardStyle(output.theme.cardStyle);
    setButtonStyle(output.theme.buttonStyle);
    setImageRatio(output.theme.imageRatio);
  };

  // Image Size Validation & Layout Normalizer
  const processAndUploadImage = async (
    file: File,
    targetType: 'hero' | 'about' | 'logo',
    onProgress?: (message: string) => void
  ): Promise<{
    url: string;
    meta: {
      width: number;
      height: number;
      origWidth: number;
      origHeight: number;
      sizeKb: number;
      status: 'valid' | 'warning';
      message: string;
    };
  }> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file (PNG, JPG, or WebP).');
    }

    const maxSizeBytes = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSizeBytes) {
      throw new Error('Image size exceeds 15MB limit. Please choose an image under 15MB.');
    }

    onProgress?.('Step 1/3: Checking image resolution & default specifications...');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.onload = (e) => {
        const rawDataUrl = e.target?.result as string;
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to load image file.'));
        img.onload = async () => {
          const origWidth = img.naturalWidth || img.width;
          const origHeight = img.naturalHeight || img.height;

          // High-Definition Responsive Specifications:
          // Hero Showcase Layout: 1920 × 1080 px up to 2560 × 1440 px (16:9 Widescreen Panorama)
          // About Us Story Layout: 1600 × 1200 px (4:3 Standard Story)
          // Store Logo: 512 × 512 px (1:1 High-Res Square)
          let targetW = 1920;
          let targetH = 1080;
          let minRecommendedWidth = 1440;

          if (targetType === 'hero') {
            minRecommendedWidth = 1440;
            // Never crush high-resolution images! Preserve up to 2560px (2K Ultra-HD)
            if (origWidth >= 2560) {
              targetW = 2560;
              targetH = 1440;
            } else if (origWidth >= 1920) {
              targetW = origWidth;
              targetH = Math.round((origWidth * 9) / 16);
            } else if (origWidth >= 1440) {
              targetW = origWidth;
              targetH = Math.round((origWidth * 9) / 16);
            } else {
              targetW = Math.max(1280, origWidth);
              targetH = Math.round((targetW * 9) / 16);
            }
          } else if (targetType === 'about') {
            minRecommendedWidth = 800;
            targetW = Math.min(1600, Math.max(800, origWidth));
            targetH = Math.round((targetW * 3) / 4);
          } else if (targetType === 'logo') {
            minRecommendedWidth = 200;
            targetW = 512;
            targetH = 512;
          }

          onProgress?.(
            `Step 2/3: Conforming image from ${origWidth}×${origHeight}px to Ultra-HD clarity layout (${targetW}×${targetH}px)...`
          );

          // Center-cover crop algorithm: scales and centers the image into the exact target dimensions
          // without distortion, stretching, or black letterbox borders.
          const scale = Math.max(targetW / origWidth, targetH / origHeight);
          const cropW = targetW / scale;
          const cropH = targetH / scale;
          const cropX = Math.max(0, (origWidth - cropW) / 2);
          const cropY = Math.max(0, (origHeight - cropH) / 2);

          let finalDataUrl = rawDataUrl;
          try {
            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);

              const exportMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
              // 0.96 high quality prevents compression degradation
              const quality = exportMime === 'image/png' ? undefined : 0.96;
              finalDataUrl = canvas.toDataURL(exportMime, quality);
            }
          } catch (canvasErr) {
            console.warn('Canvas resizing skipped, using raw data', canvasErr);
          }

          const commaIdx = finalDataUrl.indexOf(',');
          const base64Payload = commaIdx !== -1 ? finalDataUrl.slice(commaIdx + 1) : finalDataUrl;
          const approxKb = Math.round((base64Payload.length * 3) / 4 / 1024);

          onProgress?.(`Step 3/3: Uploading Ultra-HD verified image (${targetW} × ${targetH} px)...`);

          let status: 'valid' | 'warning' = 'valid';
          let message = `Ultra-HD resolution verified: ${targetW} × ${targetH} px (${approxKb} KB). Sharp, crystal-clear quality across all desktop, retina, and mobile displays.`;

          if (origWidth < minRecommendedWidth) {
            status = 'warning';
            message = `⚠️ Low Resolution Alert: Original image is only ${origWidth} × ${origHeight} px. Full-screen banners stretch across the page and will appear blurry. Recommended: 1920 × 1080 px or higher for crystal-clear clarity.`;
          }

          let uploadedUrl = finalDataUrl;
          try {
            const res = await api.media.uploadMediaAsset({
              filename: file.name.replace(/\.[^/.]+$/, '') + `-${targetW}x${targetH}` + (file.type === 'image/png' ? '.png' : '.jpg'),
              mimeType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
              base64Data: base64Payload,
              altText: file.name,
            });
            if (res && res.publicUrl) {
              uploadedUrl = res.publicUrl;
            }
          } catch (uploadErr) {
            console.warn('API upload fallback to data URL', uploadErr);
          }

          resolve({
            url: uploadedUrl,
            meta: {
              width: targetW,
              height: targetH,
              origWidth,
              origHeight,
              sizeKb: approxKb,
              status,
              message,
            },
          });
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingLogo(true);
    setUploadStepMessage('Checking logo size & conforming to 400 × 400 px...');
    try {
      const { url, meta } = await processAndUploadImage(files[0], 'logo', (msg) => setUploadStepMessage(msg));
      setLogoUrl(url);
      setLogoMeta(meta);
    } catch (err: any) {
      alert(err.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      setUploadStepMessage('');
    }
  };

  const handleBannerUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingHomeBanner(true);
    setUploadStepMessage('Checking image resolution & conforming to default layout (1200 × 800 px)...');
    try {
      const { url, meta } = await processAndUploadImage(files[0], 'hero', (msg) => setUploadStepMessage(msg));
      setHeroBannerUrl(url);
      setHomeBannerMeta(meta);
    } catch (err: any) {
      alert(err.message || 'Failed to upload banner');
    } finally {
      setUploadingHomeBanner(false);
      setUploadStepMessage('');
    }
  };

  const handleHomeBannerUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingHomeBanner(true);
    setUploadStepMessage('Checking image resolution & conforming to default layout (1200 × 800 px)...');
    try {
      const { url, meta } = await processAndUploadImage(files[0], 'hero', (msg) => setUploadStepMessage(msg));
      setHeroBannerUrl(url);
      setHomeBannerMeta(meta);
    } catch (err: any) {
      alert(err.message || 'Failed to upload hero showcase image');
    } finally {
      setUploadingHomeBanner(false);
      setUploadStepMessage('');
    }
  };

  const handleAboutBannerUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingAboutBanner(true);
    setUploadStepMessage('Checking image resolution & conforming to default layout (800 × 600 px)...');
    try {
      const { url, meta } = await processAndUploadImage(files[0], 'about', (msg) => setUploadStepMessage(msg));
      setAboutBannerUrl(url);
      setAboutBannerMeta(meta);
    } catch (err: any) {
      alert(err.message || 'Failed to upload about story image');
    } finally {
      setUploadingAboutBanner(false);
      setUploadStepMessage('');
    }
  };

  // Contrast Safety Checks
  const contrastRatio = getContrastRatio(backgroundColor, primaryColor);
  const isAccessible = contrastRatio >= 4.5;

  const fixContrastAutomatically = () => {
    const suggested = getSuggestedTextColor(backgroundColor);
    setPrimaryColor(suggested === '#0F172A' ? '#0F172A' : '#FFFFFF');
  };

  const handleSaveThemeConfig = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.themes.updateThemeConfig({
        themeCode: selectedThemeId,
        configJson: {
          themeId: selectedThemeId,
          logoSize,
          storeNameSize,
          palette: {
            primary: primaryColor,
            accent: accentColor,
            background: backgroundColor,
          },
          typography: {
            preset: typographyPreset,
          },
          announcement: {
            enabled: announcementEnabled,
            text: announcementText,
            floating: announcementFloating,
          },
          headerStyle,
          heroStyle,
          cardStyle,
          buttonStyle,
          imageRatio,
          storeStory: aboutStoryP1,
          physicalStoreAddress,
          physicalStoreTimings,
          footer: {
            description: footerDescription,
            socialLinks: {
              instagram: socialInstagram,
              whatsapp: socialWhatsapp,
              facebook: socialFacebook,
              youtube: socialYoutube,
              twitter: socialTwitter,
              linkedin: socialLinkedin,
            },
            showTrustBadges,
            trustBadge1Title,
            trustBadge1Subtitle,
            trustBadge2Title,
            trustBadge2Subtitle,
            trustBadge3Title,
            trustBadge3Subtitle,
            copyrightText: footerCopyright ? footerCopyright.replace(/\.?\s*DPDPA\s*2023\s*Compliant\.?/gi, '').trim() : undefined,
            contactPhone: aboutPhone,
            contactEmail: aboutEmail,
            address: physicalStoreAddress,
          },
          pages: {
            home: {
              heroBadge: homeHeroBadge,
              heroTitle: homeHeroTitle,
              heroSubtitle: homeHeroSubtitle,
              heroCtaText: homeCtaText,
              heroCtaLink: homeCtaLink,
              heroSecondaryCtaText: homeSecondaryCtaText,
              heroSecondaryCtaLink: homeSecondaryCtaLink,
              heroBannerUrl: heroBannerUrl,
            },
            products: {
              badgeText: productsBadgeText,
              pageTitle: productsPageTitle,
              pageSubtitle: productsPageSubtitle,
            },
            about: {
              pageTitle: aboutPageTitle || `About ${store?.name || 'Our Boutique'}`,
              tagline: aboutTagline,
              storyParagraph1: aboutStoryP1,
              storyParagraph2: aboutStoryP2,
              missionTitle: aboutMissionTitle,
              missionText: aboutMissionText,
              visionTitle: aboutVisionTitle,
              visionText: aboutVisionText,
              values: [
                { title: pillar1Title, desc: pillar1Desc },
                { title: pillar2Title, desc: pillar2Desc },
                { title: pillar3Title, desc: pillar3Desc },
              ],
              storeAddress: physicalStoreAddress,
              storeHours: physicalStoreTimings,
              contactPhone: aboutPhone,
              contactEmail: aboutEmail,
              bannerUrl: aboutBannerUrl || heroBannerUrl,
            },
            footer: {
              description: footerDescription,
              socialLinks: {
                instagram: socialInstagram,
                whatsapp: socialWhatsapp,
                facebook: socialFacebook,
                youtube: socialYoutube,
                twitter: socialTwitter,
                linkedin: socialLinkedin,
              },
            },
          },
        },
        sections: sections.map((s, idx) => ({
          sectionType: s.id,
          title: (s as any).title || s.name,
          isEnabled: s.enabled,
          sortOrder: idx,
          configJson: {},
        })),
      });

      // Update store branding (logo and colors)
      await api.themes.updateBranding({
        primaryColor,
        accentColor,
        logoUrl: logoUrl || undefined,
        logoSize,
        storeNameSize,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to save theme configuration');
    } finally {
      setSaving(false);
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const updated = [...sections];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setSections(updated);
  };

  const toggleSection = (id: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const currentThemeObj = FOUNDATIONAL_THEMES[selectedThemeId] || FOUNDATIONAL_THEMES.atelier;

  // Render controls content
  const renderControls = () => (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* TAB 1: THEME & GLOBAL STYLING */}
      {/* ======================================================== */}
      {activeTab === 'THEME' && (
        <div className="space-y-6">
          {/* Foundational Theme Selection */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Foundational Storefront Theme
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                Each theme features unique layout architecture, typography hierarchy, and visual personality.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Object.values(FOUNDATIONAL_THEMES).map((th) => {
                const isNew = ['aura', 'noir', 'vista', 'horizon', 'canvas'].includes(th.code);
                const isSelected = selectedThemeId === th.code;
                return (
                  <button
                    key={th.code}
                    type="button"
                    onClick={() => {
                      setSelectedThemeId(th.code);
                      setPrimaryColor(th.palette.primary);
                      setAccentColor(th.palette.accent);
                      setBackgroundColor(th.palette.background);
                      setTypographyPreset(th.typography.heading);
                      setHeaderStyle(th.headerStyle);
                      setHeroStyle(th.heroStyle);
                      setCardStyle(th.cardStyle);
                      setButtonStyle(th.buttonStyle);
                      setImageRatio(th.imageRatio);
                    }}
                    className={`text-left p-3.5 rounded-xl border transition space-y-1.5 relative cursor-pointer group ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/30 shadow-xs'
                        : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{th.name}</span>
                        {isNew && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-2xs">
                            New
                          </span>
                        )}
                      </div>
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-600">
                          {th.typography.heading}
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-500 line-clamp-1 leading-normal font-medium">
                      {th.tagline}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 shadow-2xs"
                          style={{ backgroundColor: th.palette.background }}
                          title="Background"
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 shadow-2xs"
                          style={{ backgroundColor: th.palette.primary }}
                          title="Primary"
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 shadow-2xs"
                          style={{ backgroundColor: th.palette.accent }}
                          title="Accent"
                        />
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                        {th.imageRatio}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logo & Banner Upload */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Store Brand Assets (Logo & Banner)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo Upload Box */}
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">Brand Logo</span>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e.target.files)}
                  className="hidden"
                />
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="border border-dashed border-slate-300 rounded-xl p-3 text-center cursor-pointer hover:border-blue-500 hover:bg-slate-50 transition flex items-center gap-3"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded" />
                  ) : (
                    <div className="h-10 w-10 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                      <Building className="w-5 h-5" />
                    </div>
                  )}
                  <div className="text-left text-xs min-w-0">
                    <span className="font-semibold text-slate-800 block truncate">
                      {logoUrl ? 'Change Logo' : 'Upload Logo'}
                    </span>
                    <span className="text-[10px] text-slate-400">PNG or SVG with transparency</span>
                  </div>
                </div>
              </div>

              {/* Banner Upload Box */}
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Hero Showcase Banner
                </span>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleBannerUpload(e.target.files)}
                  className="hidden"
                />
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  className="border border-dashed border-slate-300 rounded-xl p-3 text-center cursor-pointer hover:border-blue-500 hover:bg-slate-50 transition flex items-center gap-3"
                >
                  {heroBannerUrl ? (
                    <img
                      src={heroBannerUrl}
                      alt="Banner"
                      className="h-10 w-16 object-cover rounded"
                    />
                  ) : (
                    <div className="h-10 w-16 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                  )}
                  <div className="text-left text-xs min-w-0">
                    <span className="font-semibold text-slate-800 block truncate">
                      {heroBannerUrl ? 'Change Banner' : 'Upload Banner'}
                    </span>
                    <span className="text-[10px] text-slate-400">Ultra-HD: 1920 × 1080 px (16:9)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Logo & Store Name Size Adjustment Controls */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Header Brand Sizing</span>
                  <span className="text-[11px] text-slate-400">Scale your logo and store name independently for the header</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  Logo: <span className="font-bold text-blue-600">{logoSize}px</span> • Name: <span className="font-bold text-blue-600">{storeNameSize}px</span>
                </div>
              </div>

              {/* Live Mini Preview Box */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Brand Logo"
                      style={{
                        width: `${logoSize}px`,
                        height: `${logoSize}px`,
                        maxHeight: `${logoSize}px`,
                        maxWidth: `${logoSize}px`,
                      }}
                      className="rounded-full object-contain p-0.5 bg-white border border-slate-200 shadow-xs shrink-0 transition-all"
                    />
                  ) : (
                    <div
                      style={{
                        width: `${logoSize}px`,
                        height: `${logoSize}px`,
                        fontSize: `${Math.max(10, Math.round(logoSize * 0.4))}px`,
                        backgroundColor: primaryColor || '#0f172a',
                      }}
                      className="rounded-lg flex items-center justify-center font-black text-white shadow-xs shrink-0 transition-all"
                    >
                      {getWordmark(store?.name || 'Store').monogram}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span
                      style={{
                        fontSize: `${storeNameSize}px`,
                        lineHeight: '1.2',
                        color: primaryColor || '#0f172a',
                      }}
                      className="font-bold block truncate transition-all"
                    >
                      {store?.name || 'SaiRam Tea Company'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                      Live Header Preview
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  Responsive
                </span>
              </div>

              {/* 1. Logo Size Control */}
              <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-200/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Logo Dimension (Size)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLogoSize((prev) => Math.max(24, prev - 4))}
                      disabled={logoSize <= 24}
                      className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      title="Decrease logo size"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-800 w-12 text-center bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {logoSize} px
                    </span>
                    <button
                      type="button"
                      onClick={() => setLogoSize((prev) => Math.min(80, prev + 4))}
                      disabled={logoSize >= 80}
                      className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      title="Increase logo size"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="24"
                  max="80"
                  step="2"
                  value={logoSize}
                  onChange={(e) => setLogoSize(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">Presets:</span>
                  {[
                    { label: 'Compact', size: 32 },
                    { label: 'Default', size: 40 },
                    { label: 'Medium', size: 48 },
                    { label: 'Large', size: 56 },
                    { label: 'Heroic', size: 68 },
                  ].map((p) => (
                    <button
                      key={p.size}
                      type="button"
                      onClick={() => setLogoSize(p.size)}
                      className={`px-2 py-0.5 text-[10px] rounded-md transition font-medium ${
                        logoSize === p.size
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {p.label} ({p.size}px)
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Store Name Font Size Control */}
              <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-200/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Store Name Text Size</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStoreNameSize((prev) => Math.max(14, prev - 1))}
                      disabled={storeNameSize <= 14}
                      className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      title="Decrease store name size"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-800 w-12 text-center bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {storeNameSize} px
                    </span>
                    <button
                      type="button"
                      onClick={() => setStoreNameSize((prev) => Math.min(36, prev + 1))}
                      disabled={storeNameSize >= 36}
                      className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      title="Increase store name size"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="14"
                  max="36"
                  step="1"
                  value={storeNameSize}
                  onChange={(e) => setStoreNameSize(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">Presets:</span>
                  {[
                    { label: 'Small', size: 15 },
                    { label: 'Default', size: 18 },
                    { label: 'Prominent', size: 22 },
                    { label: 'Bold', size: 26 },
                    { label: 'Header', size: 30 },
                  ].map((p) => (
                    <button
                      key={p.size}
                      type="button"
                      onClick={() => setStoreNameSize(p.size)}
                      className={`px-2 py-0.5 text-[10px] rounded-md transition font-medium ${
                        storeNameSize === p.size
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {p.label} ({p.size}px)
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Color Palette & Contrast Validation */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Color Palette & Contrast Safety
              </label>
              {!isAccessible && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Contrast
                </span>
              )}
            </div>

            {!isAccessible && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center justify-between gap-2">
                <span>
                  Primary color has low contrast against the background ({contrastRatio.toFixed(1)}:1 vs 4.5:1 required).
                </span>
                <button
                  type="button"
                  onClick={fixContrastAutomatically}
                  className="px-2.5 py-1 bg-amber-600 text-white font-bold rounded-lg text-[10px] shrink-0"
                >
                  Auto-Fix
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Primary Brand Color
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="text-xs font-mono uppercase px-2 py-1.5 border border-slate-300 rounded-lg w-24"
                  />
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Accent Color
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="text-xs font-mono uppercase px-2 py-1.5 border border-slate-300 rounded-lg w-24"
                  />
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Canvas Background
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="text-xs font-mono uppercase px-2 py-1.5 border border-slate-300 rounded-lg w-24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography Preset Selection */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Curated Typography Pairing
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'Playfair Display', name: 'Playfair Display', desc: 'Editorial Serif & Luxury' },
                { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans', desc: 'Modern High-Tech Sans' },
                { id: 'Inter', name: 'Inter Minimal', desc: 'Clean, Ultra-Legible' },
                { id: 'Space Grotesk', name: 'Space Grotesk', desc: 'Industrial Technical' },
                { id: 'DM Serif Display', name: 'DM Serif Display', desc: 'Vogue & High-Fashion' },
                { id: 'Cinzel', name: 'Cinzel Heritage', desc: 'Regal Royal Craft' },
                { id: 'Outfit', name: 'Outfit Contemporary', desc: 'Friendly Lifestyle' },
                { id: 'Montserrat', name: 'Montserrat Bold', desc: 'Impactful Streetwear' },
                { id: 'Cabinet Grotesk', name: 'Cabinet Grotesk', desc: 'Punchy Geometric' },
              ].map((ty) => (
                <button
                  key={ty.id}
                  type="button"
                  onClick={() => setTypographyPreset(ty.id)}
                  className={`text-left p-3 rounded-xl border text-xs transition ${
                    typographyPreset === ty.id
                      ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-slate-900">{ty.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{ty.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Layout Composition Fine-Tuning */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Layout Styling & Component Shapes
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Header Style</label>
                <select
                  value={headerStyle}
                  onChange={(e) => setHeaderStyle(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                >
                  <option value="minimal-center">Minimal Centered (Atelier)</option>
                  <option value="sticky-action">Sticky Action (Pulse)</option>
                  <option value="warm-friendly">Warm Friendly (Harvest)</option>
                  <option value="industrial-meta">Industrial Meta (Foundry)</option>
                  <option value="spacious-lifestyle">Spacious Lifestyle (Habitat)</option>
                  <option value="quick-search-bar">Quick Search Bar (Local)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Card Style</label>
                <select
                  value={cardStyle}
                  onChange={(e) => setCardStyle(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                >
                  <option value="framed-luxury">Framed Luxury</option>
                  <option value="elevated-modern">Elevated Modern</option>
                  <option value="rounded-soft">Rounded Soft</option>
                  <option value="spec-sheet-card">Spec Sheet Card</option>
                  <option value="minimal-bleed">Minimal Bleed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Button Shape</label>
                <select
                  value={buttonStyle}
                  onChange={(e) => setButtonStyle(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                >
                  <option value="sharp-pill">Sharp Pill</option>
                  <option value="rounded-heavy">Rounded Heavy</option>
                  <option value="pill-friendly">Pill Friendly</option>
                  <option value="square-solid">Square Solid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Category Presets */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Instant Category Presets</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                One-click setup: Automatically configures the optimal theme, palette, and typography for your business.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { name: 'Jewellery & Watches', desc: 'Atelier / Gold & Charcoal', code: 'atelier' },
                { name: 'Streetwear & Apparel', desc: 'Pulse / Electric Pink & Bold', code: 'pulse' },
                { name: 'Tea, Sweets & Gourmet', desc: 'Harvest / Forest & Amber', code: 'harvest' },
                { name: 'Manufacturing & Tools', desc: 'Foundry / Industrial Slate', code: 'foundry' },
                { name: 'Furniture & Living', desc: 'Habitat / Terracotta & Linen', code: 'habitat' },
                { name: 'Retail & Superstore', desc: 'Local / Royal Blue & Green', code: 'local' },
              ].map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleApplyQuickPreset(cat.name)}
                  className="text-left p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition group space-y-1"
                >
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 block">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-slate-500 block leading-tight">
                    {cat.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: HOME PAGE CUSTOMIZATION */}
      {/* ======================================================== */}
      {activeTab === 'HOME' && (
        <div className="space-y-6">
          {/* Top Announcement Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 block">
                  Top Announcement Bar
                </label>
                <p className="text-[11px] text-slate-500">
                  Prominent promotional strip displayed at the very top of your storefront.
                </p>
              </div>
              <input
                type="checkbox"
                checked={announcementEnabled}
                onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
            </div>
            {announcementEnabled && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Announcement Message
                  </label>
                  <input
                    type="text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="e.g. Complimentary pan-India insured shipping on all orders"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Floating Marquee Button / Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg transition ${announcementFloating ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Floating / Scrolling Marquee Animation
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Make the announcement text continuously float across the screen
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAnnouncementFloating(!announcementFloating)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      announcementFloating ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                    role="switch"
                    aria-checked={announcementFloating}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        announcementFloating ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hero Showcase Texts */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Hero Showcase Section
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                The primary banner greeting visitors when they land on your homepage.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Eyebrow Badge Tag
              </label>
              <input
                type="text"
                value={homeHeroBadge}
                onChange={(e) => setHomeHeroBadge(e.target.value)}
                placeholder="e.g. ARTISANAL ATELIER • HALLMARKED & CERTIFIED"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hero Main Headline
              </label>
              <input
                type="text"
                value={homeHeroTitle}
                onChange={(e) => setHomeHeroTitle(e.target.value)}
                placeholder="e.g. Timeless Elegance & Handcrafted Luxury"
                className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hero Subtitle Description
              </label>
              <textarea
                rows={3}
                value={homeHeroSubtitle}
                onChange={(e) => setHomeHeroSubtitle(e.target.value)}
                placeholder="Describe your boutique's offering in 2-3 engaging sentences..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Action Button Text
                </label>
                <input
                  type="text"
                  value={homeCtaText}
                  onChange={(e) => setHomeCtaText(e.target.value)}
                  placeholder="e.g. Explore Collection"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Secondary Button Text
                </label>
                <input
                  type="text"
                  value={homeSecondaryCtaText}
                  onChange={(e) => setHomeSecondaryCtaText(e.target.value)}
                  placeholder="e.g. Our Heritage"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Hero Showcase Image Upload & URL */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>Homepage Hero Showcase Image</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  High-definition photography or product showcase featured prominently on your homepage hero.
                </p>
              </div>
              {heroBannerUrl && (
                <button
                  type="button"
                  onClick={() => setHeroBannerUrl('')}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition cursor-pointer"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Image</span>
                </button>
              )}
            </div>

            {/* Thumbnail Preview & Upload Dropzone */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-52 aspect-[3/2] rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center relative shrink-0 shadow-xs">
                {heroBannerUrl ? (
                  <>
                    <img
                      src={heroBannerUrl}
                      alt="Hero Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[9px] font-mono font-bold text-amber-300">
                      Default 1200 × 800 px
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3 text-slate-400 space-y-1">
                    <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
                    <span className="text-[10px] font-medium block">No Hero Image Set</span>
                    <span className="text-[9px] font-mono text-slate-400 block">Default: 1200 × 800 px</span>
                  </div>
                )}
                {uploadingHomeBanner && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white text-[11px] font-semibold p-2 text-center z-10">
                    <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-1.5" />
                    <span>{uploadStepMessage || 'Checking size & conforming to default layout...'}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full space-y-3">
                <input
                  ref={homeBannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleHomeBannerUpload(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => homeBannerInputRef.current?.click()}
                  disabled={uploadingHomeBanner}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4 text-amber-400" />
                  <span>{heroBannerUrl ? 'Upload / Replace Image' : 'Upload Hero Image'}</span>
                </button>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Or Enter Direct Image URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={heroBannerUrl}
                      onChange={(e) => setHeroBannerUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... or CDN link"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl pr-8 font-mono"
                    />
                    <Globe className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Ultra-HD Layout Sizing Verification */}
            <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ultra-HD Standard: <strong>1920 × 1080 px</strong> (16:9 Widescreen Panorama)</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <Check className="w-3 h-3 text-emerald-600" /> Ultra-HD Quality Active
                </span>
              </div>
              
              {homeBannerMeta ? (
                <div className={`p-3 rounded-xl border space-y-1.5 text-xs ${
                  homeBannerMeta.status === 'valid'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    {homeBannerMeta.status === 'valid' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>{homeBannerMeta.status === 'valid' ? 'Ultra-HD Clarity Verified' : 'Resolution Warning'}</span>
                    <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      homeBannerMeta.status === 'valid'
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                        : 'bg-amber-100 border-amber-300 text-amber-900'
                    }`}>
                      {homeBannerMeta.width} × {homeBannerMeta.height} px ({homeBannerMeta.sizeKb} KB)
                    </span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${homeBannerMeta.status === 'valid' ? 'text-emerald-700' : 'text-amber-800'}`}>
                    {homeBannerMeta.message}
                  </p>
                  <div className={`flex items-center gap-3 pt-1 text-[10px] border-t font-mono ${
                    homeBannerMeta.status === 'valid' ? 'border-emerald-200/80 text-emerald-800' : 'border-amber-200 text-amber-800'
                  }`}>
                    <span>Uploaded: {homeBannerMeta.origWidth} × {homeBannerMeta.origHeight} px</span>
                    <span>→</span>
                    <span className="font-bold">Display Output: {homeBannerMeta.width} × {homeBannerMeta.height} px</span>
                  </div>
                </div>
              ) : heroBannerUrl ? (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1 text-xs">
                  <div className="flex items-center gap-2 font-bold text-blue-800">
                    <Sliders className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Widescreen Panorama Active</span>
                    <span className="ml-auto text-[10px] font-mono bg-blue-100 px-2 py-0.5 rounded-full border border-blue-300">
                      1920 × 1080 px Widescreen
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-700">
                    The storefront hero displays this image with edge-to-edge Ultra-HD coverage and crystal-clear clarity across all desktop and mobile displays.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <Sliders className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>Optimal Clarity Spec: 1920 × 1080 px or 2560 × 1440 px (16:9)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    To prevent blurriness and pixelation on large desktop screens, upload an image with at least 1920 × 1080 px resolution. Images are conformed without losing sharpness. Max 15 MB.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section Visibility & Reordering */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Homepage Section Flow & Order
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                Enable, disable, and rearrange the sections visible on your homepage.
              </p>
            </div>
            <div className="space-y-2">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={sec.enabled}
                      onChange={() => toggleSection(sec.id)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span
                      className={`font-semibold ${
                        sec.enabled ? 'text-slate-900' : 'text-slate-400 line-through'
                      }`}
                    >
                      {sec.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSection(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 rounded"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(idx, 'down')}
                      disabled={idx === sections.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 rounded"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PRODUCTS PAGE CUSTOMIZATION */}
      {/* ======================================================== */}
      {activeTab === 'PRODUCTS' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Products Catalog Header
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize the banner and headlines displayed at the top of your catalog page (/products).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Eyebrow Badge Tag
              </label>
              <input
                type="text"
                value={productsBadgeText}
                onChange={(e) => setProductsBadgeText(e.target.value)}
                placeholder="e.g. Direct from Merchant"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catalog Page Title
              </label>
              <input
                type="text"
                value={productsPageTitle}
                onChange={(e) => setProductsPageTitle(e.target.value)}
                placeholder="e.g. Our Collection"
                className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catalog Subtitle / Description
              </label>
              <textarea
                rows={2}
                value={productsPageSubtitle}
                onChange={(e) => setProductsPageSubtitle(e.target.value)}
                placeholder="e.g. Explore our complete selection of handcrafted offerings..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl leading-relaxed"
              />
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-xs text-emerald-900 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Dynamic Store Inventory Integration</span>
            </div>
            <p className="leading-relaxed text-emerald-800">
              The Products Catalog page automatically synchronizes with your store inventory: category filtering pills, real-time keyword search, sorting (featured, price low/high, newest), and Quick-Add cart buttons work right out of the box.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: ABOUT US PAGE CUSTOMIZATION */}
      {/* ======================================================== */}
      {activeTab === 'ABOUT' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                About Us Page Header
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                The top headline and brand tagline welcoming visitors to your store story.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Page Title
              </label>
              <input
                type="text"
                value={aboutPageTitle}
                onChange={(e) => setAboutPageTitle(e.target.value)}
                placeholder={`About ${store?.name || 'Our Boutique'}`}
                className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tagline & Subtitle
              </label>
              <input
                type="text"
                value={aboutTagline}
                onChange={(e) => setAboutTagline(e.target.value)}
                placeholder="e.g. Rooted in authentic tradition, crafted for everyday distinction."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {/* Heritage Story Narrative */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Store Origin & Heritage Story
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                Tell your customers how your brand started and what sets your quality apart.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Origin Paragraph 1
              </label>
              <textarea
                rows={3}
                value={aboutStoryP1}
                onChange={(e) => setAboutStoryP1(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Craftsmanship & Expansion Paragraph 2
              </label>
              <textarea
                rows={3}
                value={aboutStoryP2}
                onChange={(e) => setAboutStoryP2(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl leading-relaxed"
              />
            </div>
          </div>

          {/* About Us Feature & Story Image */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>About Us Feature / Story Image</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Visual photo displayed alongside your brand heritage and origins story.
                </p>
              </div>
              {aboutBannerUrl && (
                <button
                  type="button"
                  onClick={() => setAboutBannerUrl('')}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition cursor-pointer"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Image</span>
                </button>
              )}
            </div>

            {/* Thumbnail Preview & Upload Dropzone */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-48 aspect-[4/3] rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center relative shrink-0 shadow-xs">
                {aboutBannerUrl ? (
                  <>
                    <img
                      src={aboutBannerUrl}
                      alt="About Story Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[9px] font-mono font-bold text-emerald-300">
                      Default 800 × 600 px
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3 text-slate-400 space-y-1">
                    <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
                    <span className="text-[10px] font-medium block">No Story Image Set</span>
                    <span className="text-[9px] font-mono text-slate-400 block">Default: 800 × 600 px</span>
                  </div>
                )}
                {uploadingAboutBanner && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white text-[11px] font-semibold p-2 text-center z-10">
                    <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-1.5" />
                    <span>{uploadStepMessage || 'Checking size & conforming to default layout...'}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full space-y-3">
                <input
                  ref={aboutBannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAboutBannerUpload(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => aboutBannerInputRef.current?.click()}
                  disabled={uploadingAboutBanner}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4 text-emerald-400" />
                  <span>{aboutBannerUrl ? 'Upload / Replace Story Image' : 'Upload Story Image'}</span>
                </button>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Or Enter Direct Image URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={aboutBannerUrl}
                      onChange={(e) => setAboutBannerUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... or CDN link"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl pr-8 font-mono"
                    />
                    <Globe className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Default Layout Sizing Verification */}
            <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Default Layout Size: <strong>800 × 600 px</strong> (4:3 Story Frame)</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <Check className="w-3 h-3 text-emerald-600" /> Auto-Fit Default Layout Enabled
                </span>
              </div>
              
              {aboutBannerMeta ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Default Layout Size Checked & Verified</span>
                    <span className="ml-auto text-[10px] font-mono bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      {aboutBannerMeta.width} × {aboutBannerMeta.height} px ({aboutBannerMeta.sizeKb} KB)
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    {aboutBannerMeta.message}
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[10px] text-emerald-800 border-t border-emerald-200/80 font-mono">
                    <span>Original: {aboutBannerMeta.origWidth} × {aboutBannerMeta.origHeight} px</span>
                    <span>→</span>
                    <span className="font-bold">Default Layout Output: 800 × 600 px</span>
                  </div>
                </div>
              ) : aboutBannerUrl ? (
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 space-y-1 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <Sliders className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Default Layout Container Active</span>
                    <span className="ml-auto text-[10px] font-mono bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      800 × 600 px Story Frame
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    The About Us page encloses this image in the standard 4:3 default frame with responsive edge-to-edge coverage.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <Sliders className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>Pre-Upload Dimension Check: Default Layout 800 × 600 px</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    When an image is uploaded, its dimensions are checked and automatically conformed to the default 800 × 600 px story layout size. Max 15 MB (PNG, JPG, WebP).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Mission & Vision Statements
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Mission Title</label>
                <input
                  type="text"
                  value={aboutMissionTitle}
                  onChange={(e) => setAboutMissionTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
                <label className="block text-[11px] text-slate-500">Mission Description</label>
                <textarea
                  rows={2}
                  value={aboutMissionText}
                  onChange={(e) => setAboutMissionText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Vision Title</label>
                <input
                  type="text"
                  value={aboutVisionTitle}
                  onChange={(e) => setAboutVisionTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
                <label className="block text-[11px] text-slate-500">Vision Description</label>
                <textarea
                  rows={2}
                  value={aboutVisionText}
                  onChange={(e) => setAboutVisionText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* 3 Core Trust Pillars */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                3 Core Trust / Value Pillars
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                The 3 foundational reasons why buyers choose and trust your store.
              </p>
            </div>

            <div className="space-y-3">
              {/* Pillar 1 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  Pillar 1
                </span>
                <input
                  type="text"
                  value={pillar1Title}
                  onChange={(e) => setPillar1Title(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  value={pillar1Desc}
                  onChange={(e) => setPillar1Desc(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600"
                />
              </div>

              {/* Pillar 2 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  Pillar 2
                </span>
                <input
                  type="text"
                  value={pillar2Title}
                  onChange={(e) => setPillar2Title(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  value={pillar2Desc}
                  onChange={(e) => setPillar2Desc(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600"
                />
              </div>

              {/* Pillar 3 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  Pillar 3
                </span>
                <input
                  type="text"
                  value={pillar3Title}
                  onChange={(e) => setPillar3Title(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  value={pillar3Desc}
                  onChange={(e) => setPillar3Desc(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Physical Address & Contact Support */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Physical Location & Customer Support
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store / Workshop Address
                </label>
                <input
                  type="text"
                  value={physicalStoreAddress}
                  onChange={(e) => setPhysicalStoreAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={physicalStoreTimings}
                  onChange={(e) => setPhysicalStoreTimings(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone / WhatsApp Support
                </label>
                <input
                  type="text"
                  value={aboutPhone}
                  onChange={(e) => setAboutPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Support Email
                </label>
                <input
                  type="email"
                  value={aboutEmail}
                  onChange={(e) => setAboutEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: FOOTER & SOCIAL MEDIA SETTINGS */}
      {/* ======================================================== */}
      {activeTab === 'FOOTER' && (
        <div className="space-y-6">
          {/* Social Media Accounts & Links Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-pink-600" />
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Social Media Accounts & Links
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Add your social media profile URLs or handles. Interactive branded buttons will appear prominently in your storefront footer!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Instagram */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Instagram className="w-4 h-4 text-pink-500" />
                  <span>Instagram</span>
                </label>
                <input
                  type="text"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  placeholder="https://instagram.com/yourbrand or @yourbrand"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
                />
              </div>

              {/* WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  <span>WhatsApp Business</span>
                </label>
                <input
                  type="text"
                  value={socialWhatsapp}
                  onChange={(e) => setSocialWhatsapp(e.target.value)}
                  placeholder="+91 98765 43210 or wa.me/..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono"
                />
              </div>

              {/* Facebook */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <span>Facebook Page</span>
                </label>
                <input
                  type="text"
                  value={socialFacebook}
                  onChange={(e) => setSocialFacebook(e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>

              {/* YouTube */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-rose-600" />
                  <span>YouTube Channel</span>
                </label>
                <input
                  type="text"
                  value={socialYoutube}
                  onChange={(e) => setSocialYoutube(e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                />
              </div>

              {/* Twitter / X */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Twitter className="w-4 h-4 text-sky-500" />
                  <span>Twitter / X</span>
                </label>
                <input
                  type="text"
                  value={socialTwitter}
                  onChange={(e) => setSocialTwitter(e.target.value)}
                  placeholder="https://x.com/yourhandle or @yourhandle"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>

              {/* LinkedIn */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Linkedin className="w-4 h-4 text-blue-700" />
                  <span>LinkedIn Company Page</span>
                </label>
                <input
                  type="text"
                  value={socialLinkedin}
                  onChange={(e) => setSocialLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/company/yourbrand"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition"
                />
              </div>
            </div>
          </div>

          {/* Footer Brand Bio & Tagline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Footer Brand Description
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                Brief summary displayed beneath your store monogram in the footer.
              </p>
            </div>
            <textarea
              rows={3}
              value={footerDescription}
              onChange={(e) => setFooterDescription(e.target.value)}
              placeholder="Official digital storefront. Order genuine products online directly with transparent pricing and doorstep delivery."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl leading-relaxed"
            />
          </div>

          {/* Value Props & Trust Badges Strip */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 block">
                  Footer Trust Badges Strip
                </label>
                <p className="text-[11px] text-slate-500">
                  Three reassurance badges displayed above the footer columns.
                </p>
              </div>
              <input
                type="checkbox"
                checked={showTrustBadges}
                onChange={(e) => setShowTrustBadges(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
            </div>

            {showTrustBadges && (
              <div className="space-y-3 pt-2">
                {/* Badge 1 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Trust Badge 1</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={trustBadge1Title}
                      onChange={(e) => setTrustBadge1Title(e.target.value)}
                      placeholder="Title (e.g. Secure Indian Payments)"
                      className="px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={trustBadge1Subtitle}
                      onChange={(e) => setTrustBadge1Subtitle(e.target.value)}
                      placeholder="Subtitle (e.g. UPI, Netbanking & Cards via Razorpay)"
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600"
                    />
                  </div>
                </div>

                {/* Badge 2 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Trust Badge 2</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={trustBadge2Title}
                      onChange={(e) => setTrustBadge2Title(e.target.value)}
                      placeholder="Title (e.g. Reliable Pan-India Delivery)"
                      className="px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={trustBadge2Subtitle}
                      onChange={(e) => setTrustBadge2Subtitle(e.target.value)}
                      placeholder="Subtitle (e.g. Doorstep tracking via premier couriers)"
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600"
                    />
                  </div>
                </div>

                {/* Badge 3 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Trust Badge 3</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={trustBadge3Title}
                      onChange={(e) => setTrustBadge3Title(e.target.value)}
                      placeholder="Title (e.g. Verified Authentic Goods)"
                      className="px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={trustBadge3Subtitle}
                      onChange={(e) => setTrustBadge3Subtitle(e.target.value)}
                      placeholder="Subtitle (e.g. Direct from certified merchant business)"
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Copyright Text */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Bottom Copyright Notice
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                Custom statement for the very bottom of every page. Leave blank to use platform default.
              </p>
            </div>
            <input
              type="text"
              value={footerCopyright}
              onChange={(e) => setFooterCopyright(e.target.value)}
              placeholder={`© ${new Date().getFullYear()} ${store?.name || 'Our Store'}. All rights reserved.`}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Layout title="Brand Studio">
      <Head>
        <title>Brand Studio & Store Customization | Simply Seller</title>
      </Head>

      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Brand Studio & Store Customizer
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Customize colors, fonts, layouts, pages, and footer with social media accounts
            </p>
          </div>

          <div className="flex items-center gap-3">
            {store?.slug && (
              <a
                href={`http://localhost:3000/store/${store.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs"
              >
                <span>View Live Store</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={handleSaveThemeConfig}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Publishing Design...' : 'Publish Design'}
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold block">Storefront Published Successfully!</span>
                <span>Your dynamic design, custom texts, colors, footer, and social media links are now live for customers across all pages.</span>
              </div>
            </div>
            {store?.slug && (
              <a
                href={`http://localhost:3000/store/${store.slug}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-500 transition shrink-0"
              >
                Open Storefront
              </a>
            )}
          </div>
        )}

        {/* 5 Page / Module Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 bg-slate-200/80 p-1 rounded-xl max-w-3xl gap-1">
          <button
            onClick={() => handleTabSwitch('THEME')}
            className={`py-2 px-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'THEME'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-blue-600" />
            <span className="truncate">Theme & Colors</span>
          </button>

          <button
            onClick={() => handleTabSwitch('HOME')}
            className={`py-2 px-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'HOME'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-amber-500" />
            <span className="truncate">Home Page</span>
          </button>

          <button
            onClick={() => handleTabSwitch('PRODUCTS')}
            className={`py-2 px-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'PRODUCTS'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate">Products Page</span>
          </button>

          <button
            onClick={() => handleTabSwitch('ABOUT')}
            className={`py-2 px-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'ABOUT'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span className="truncate">About Us</span>
          </button>

          <button
            onClick={() => handleTabSwitch('FOOTER')}
            className={`py-2 px-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'FOOTER'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-pink-600" />
            <span className="truncate">Footer & Socials</span>
          </button>
        </div>

        {/* Desktop Split View: Controls Left, Live Interactive Preview Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-6 hidden lg:block">
            {loading ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500">Loading customizer settings...</p>
              </div>
            ) : (
              renderControls()
            )}
          </div>

          {/* Live Storefront Interactive Preview Column */}
          <div className="lg:col-span-6 sticky top-20">
            <div className="bg-slate-950 rounded-2xl p-4 shadow-xl text-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Live Storefront Preview ({currentThemeObj.name})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mobile Controls Drawer Trigger for < 1024px */}
                  <button
                    onClick={() => setMobileDrawerOpen(true)}
                    className="lg:hidden px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Sliders className="w-3 h-3" /> Edit Fields
                  </button>
                </div>
              </div>

              {/* Rendered Preview Mockup Frame */}
              <div className="mx-auto rounded-xl overflow-hidden shadow-2xl transition-all duration-300">
                {store && (
                  <MiniStorePreview
                    store={store}
                    iframeRef={iframeRef}
                    activePage={activePreviewPage}
                    onPageChange={(page) => {
                      setActivePreviewPage(page);
                      if (page === 'home') setActiveTab('HOME');
                      else if (page === 'products') setActiveTab('PRODUCTS');
                      else if (page === 'about') setActiveTab('ABOUT');
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer for Controls (on screens < 1024px) */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl max-h-[85vh] h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <span className="text-sm font-bold text-slate-900">Customizer Controls</span>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{renderControls()}</div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2">
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close & View Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
