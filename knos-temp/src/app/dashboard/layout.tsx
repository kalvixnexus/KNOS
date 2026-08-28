import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-gray-800 tracking-tight flex items-center gap-2">
          <img src="/logo.png" alt="Kalvix Nexus Logo" className="w-6 h-6 object-contain" />
          Kalvix Nexus
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link href="/dashboard" className="p-3 rounded hover:bg-gray-800 transition-colors">Overview & API</Link>
          <Link href="/dashboard/menu" className="p-3 rounded hover:bg-gray-800 transition-colors">Upload Menu</Link>
          <Link href="/dashboard/billing" className="p-3 rounded hover:bg-gray-800 transition-colors">Manual Billing</Link>
          <div className="border-t border-gray-800 my-2"></div>
          <Link href="/dashboard/history" className="p-3 rounded hover:bg-gray-800 transition-colors">Bill History</Link>
          <Link href="/dashboard/payments" className="p-3 rounded hover:bg-gray-800 transition-colors">Payment History</Link>
          <Link href="/dashboard/settings" className="p-3 rounded hover:bg-gray-800 transition-colors">Settings</Link>
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
