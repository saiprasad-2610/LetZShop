import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Megaphone, 
  Share2, 
  Copy, 
  Check, 
  MessageSquare, 
  QrCode, 
  Sparkles,
  ExternalLink,
  Instagram,
  Facebook
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function MarketingPage() {
  const { api } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.stores.getMyStore().then(setStore).catch(console.error);
  }, []);

  const storeUrl = store ? `http://localhost:3000/store/${store.slug}` : 'http://localhost:3000/store/preview';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Exciting news! Check out our new online store: ${store?.name || 'Our Store'}! Shop our exclusive collection directly with fast pan-India delivery: ${storeUrl}`
    );
    return `https://wa.me/?text=${text}`;
  };

  return (
    <Layout>
      <Head>
        <title>Marketing & Growth | Simply Seller</title>
      </Head>

      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Marketing & Sharing</h1>
          <p className="text-sm text-gray-500">
            Reach your customers on WhatsApp, Instagram, and social channels with direct store links
          </p>
        </div>

        {/* Share Store Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-600" /> Shareable Store Link
          </h2>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={storeUrl}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-700"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <a
              href={getWhatsAppShare()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              <MessageSquare className="w-4 h-4" /> Share on WhatsApp
            </a>

            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition"
            >
              <ExternalLink className="w-4 h-4" /> Open Storefront
            </a>
          </div>
        </div>

        {/* Promotional Banner Ideas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-6 rounded-2xl shadow-sm space-y-3">
            <Sparkles className="w-6 h-6 text-emerald-200" />
            <h3 className="font-bold text-lg">Festival Special Promotion</h3>
            <p className="text-xs text-emerald-100">
              Announce a limited-time festival offer or clearance discount. Customize the announcement bar in the Brand Studio!
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-800 text-white p-6 rounded-2xl shadow-sm space-y-3">
            <QrCode className="w-6 h-6 text-indigo-200" />
            <h3 className="font-bold text-lg">In-Store QR Standee</h3>
            <p className="text-xs text-indigo-100">
              Print a QR code of your store link on your packaging or billing counter for repeat orders!
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
