'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function LandingPage() {
  const [cmsData, setCmsData] = useState({
    heroTitle: 'Supercharge your Restaurant Business',
    heroSubtitle: 'Manage orders, generate instant thermal bills, integrate your own website via API, and track your revenue—all in one powerful platform built by Kalvix Nexus.',
    starterPrice: '49',
    starterDesc: 'Perfect for small cafes and food stalls.',
    proPrice: '99',
    proDesc: 'Advanced POS & API features for large restaurants.'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCMS() {
      try {
        const docRef = doc(db, 'cms', 'landing');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCmsData(docSnap.data() as any);
        }
      } catch (error) {
        console.error("Error fetching CMS", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCMS();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center text-white">Loading Kalvix Nexus...</div>;

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-yellow-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Kalvix Nexus Logo" className="w-10 h-10 object-contain" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
              <span className="font-black text-lg tracking-[0.12em] text-white leading-none">KALVIX</span>
              <span className="font-black text-lg tracking-[0.12em] text-yellow-500 leading-none">NEXUS</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="text-gray-400 hover:text-yellow-500 transition-colors uppercase tracking-widest text-xs">Features</Link>
            <Link href="#pricing" className="text-gray-400 hover:text-yellow-500 transition-colors uppercase tracking-widest text-xs">Pricing</Link>
            <Link href="/admin-login" className="text-gray-400 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span> Super Admin</Link>
            <Link href="/login" className="text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/10 px-5 py-2 rounded-lg transition-all uppercase tracking-widest text-xs">Sign in</Link>
            <Link href="/signup" className="bg-gradient-to-r from-yellow-600 to-yellow-400 hover:scale-105 text-black px-6 py-2.5 rounded-lg transition-all font-bold uppercase tracking-widest text-xs shadow-[0_4px_20px_rgba(212,175,55,0.4)]">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 pt-40 pb-24 flex flex-col items-center text-center relative">
        {/* Glow Effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-semibold tracking-wide uppercase mb-8 backdrop-blur-sm">
          ✦ The Next-Gen POS System
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-500">
          {cmsData.heroTitle}
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed relative z-10">
          {cmsData.heroSubtitle}
        </p>
        
        <div className="flex items-center gap-4 relative z-10">
          <Link href="/signup" className="bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-300 text-black px-8 py-4 rounded font-bold text-lg transition-all shadow-[0_4px_20px_rgba(212,175,55,0.4)] border border-yellow-500/50 uppercase tracking-widest text-sm">
            Start Free Trial
          </Link>
          <Link href="/login" className="bg-black hover:bg-gray-900 text-white border border-gray-700 px-8 py-4 rounded font-bold text-lg transition-all backdrop-blur-sm uppercase tracking-widest text-sm">
            Owner Login
          </Link>
        </div>
      </main>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5 relative bg-[#0a0a0b]">
         <div className="text-center mb-20">
            <h2 className="text-lg md:text-xl font-bold text-yellow-500 tracking-widest uppercase mb-4">Pricing</h2>
            <h3 className="text-4xl md:text-5xl font-bold mb-4 text-white">Simple, Transparent Pricing.</h3>
            <p className="text-gray-400">Choose the plan that fits your restaurant size.</p>
         </div>

         <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto relative z-10">
            {/* Starter Plan */}
            <div className="bg-black border border-white/10 rounded-xl p-8 hover:border-yellow-500/50 transition-colors">
              <h3 className="text-2xl font-bold mb-2 text-white">Starter</h3>
              <p className="text-gray-400 mb-6 h-12">{cmsData.starterDesc}</p>
              <div className="mb-8">
                <span className="text-5xl font-extrabold text-white">₹{cmsData.starterPrice}</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-4 mb-8 text-gray-300">
                <li className="flex items-center gap-3">✓ Unlimited Manual Bills</li>
                <li className="flex items-center gap-3">✓ Thermal Receipt Printing</li>
                <li className="flex items-center gap-3 text-gray-600">✕ API Integration</li>
              </ul>
              <Link href="/signup" className="block w-full text-center bg-black hover:bg-gray-900 border border-white/20 text-white py-3 rounded font-semibold transition-colors uppercase tracking-widest text-sm">
                Choose Starter
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-b from-gray-900 to-black border border-yellow-500/40 rounded-xl p-8 relative shadow-[0_0_30px_rgba(212,175,55,0.1)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Pro (API)</h3>
              <p className="text-gray-400 mb-6 h-12">{cmsData.proDesc}</p>
              <div className="mb-8">
                <span className="text-5xl font-extrabold text-white">₹{cmsData.proPrice}</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-4 mb-8 text-gray-300">
                <li className="flex items-center gap-3">✓ Unlimited Manual Bills</li>
                <li className="flex items-center gap-3">✓ Thermal Receipt Printing</li>
                <li className="flex items-center gap-3 text-yellow-500">✓ Developer API Access</li>
                <li className="flex items-center gap-3 text-yellow-500">✓ External Website Sync</li>
              </ul>
              <Link href="/signup" className="block w-full text-center bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-300 text-black py-3 rounded font-bold transition-colors shadow-lg uppercase tracking-widest text-sm">
                Choose Pro
              </Link>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Kalvix Nexus Logo" className="w-8 h-8 object-contain opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 opacity-50 hover:opacity-100 transition-all">
              <span className="font-black text-sm tracking-[0.12em] text-white leading-none">KALVIX</span>
              <span className="font-black text-sm tracking-[0.12em] text-yellow-500 leading-none">NEXUS</span>
            </div>
          </div>
          
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="#" className="hover:text-yellow-500 transition-colors uppercase tracking-widest text-xs">Privacy Policy</Link>
            <Link href="#" className="hover:text-yellow-500 transition-colors uppercase tracking-widest text-xs">Terms of Service</Link>
            <Link href="#" className="hover:text-yellow-500 transition-colors uppercase tracking-widest text-xs">Contact Support</Link>
          </div>
          
          <div className="text-sm text-gray-600 tracking-widest">
            &copy; {new Date().getFullYear()} Kalvix Nexus. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
