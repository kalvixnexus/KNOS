'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Overview & API', href: '/dashboard' },
    { name: 'Upload Menu', href: '/dashboard/menu' },
    { name: 'Manual Billing', href: '/dashboard/billing' },
    { name: 'Dine-In Orders', href: '/dashboard/dine-in', isNew: true },
    { name: 'API Billing', href: '/dashboard/api-billing' },
    { name: 'QR Menu', href: '/dashboard/qr-menu', isPro: true },
    { type: 'divider' },
    { name: 'Bill History', href: '/dashboard/history' },
    { name: 'Payment History', href: '/dashboard/payments' },
    { name: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 border-r border-gray-900 flex flex-col">
        <div className="p-6 border-b border-gray-900 flex items-center gap-3">
          <img src="/logo.png" alt="Kalvix Nexus Logo" className="w-8 h-8 object-contain" />
          <h2 className="text-lg font-black tracking-widest uppercase text-white">Owner Panel</h2>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          {navLinks.map((link, idx) => {
            if (link.type === 'divider') {
              return <div key={idx} className="border-t border-gray-900 my-2"></div>;
            }
            
            const isActive = pathname === link.href;
            
            return (
              <Link 
                key={link.href} 
                href={link.href!} 
                className={`p-3 rounded-lg transition-all font-bold tracking-wide text-sm flex justify-between items-center ${
                  isActive 
                    ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-900 border border-transparent'
                }`}
              >
                {link.name}
                {link.isNew && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-red-500 text-white animate-pulse">New</span>
                )}
                {link.isPro && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-yellow-500 text-black">Pro</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800 text-sm text-gray-500">
          Logged in as Owner
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
