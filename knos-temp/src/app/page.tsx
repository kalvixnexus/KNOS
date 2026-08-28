import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-blue-500 selection:text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg">
            K
          </div>
          <span className="text-xl font-bold tracking-tight">Kalvix Nexus</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="#features" className="text-gray-300 hover:text-white transition-colors">Features</Link>
          <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link>
          <Link href="/login" className="text-gray-300 hover:text-white transition-colors">Sign in</Link>
          <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 py-24 flex flex-col items-center text-center mt-10">
        <div className="inline-block px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-8">
          The Next-Gen POS & CRM for Restaurants 🚀
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          Supercharge your <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Restaurant Business
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Manage orders, generate instant thermal bills, integrate your own website via API, and track your revenue—all in one powerful platform built by Kalvix Nexus.
        </p>
        
        <div className="flex items-center gap-4">
          <Link href="/signup" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg shadow-blue-500/25">
            Start for Free
          </Link>
          <Link href="/login" className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 px-8 py-4 rounded-full font-semibold text-lg transition-all">
            Owner Login
          </Link>
        </div>

        {/* Dashboard Mockup Image Placeholder */}
        <div className="mt-24 w-full max-w-5xl rounded-xl border border-gray-800 bg-gray-900/50 p-2 shadow-2xl backdrop-blur-sm relative">
           <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent z-10 rounded-xl" />
           <div className="h-[400px] w-full rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center relative overflow-hidden">
             {/* Mock UI Elements */}
             <div className="absolute top-0 left-0 w-64 h-full bg-gray-950 border-r border-gray-800 p-6 flex flex-col gap-4">
                <div className="h-6 w-32 bg-gray-800 rounded-md mb-8"></div>
                <div className="h-4 w-full bg-blue-900/30 border border-blue-800/50 rounded-md"></div>
                <div className="h-4 w-3/4 bg-gray-800 rounded-md"></div>
                <div className="h-4 w-4/5 bg-gray-800 rounded-md"></div>
             </div>
             <div className="ml-64 w-full h-full p-8 flex flex-col gap-6">
                <div className="flex gap-4">
                  <div className="h-24 w-1/3 bg-gray-800 rounded-lg"></div>
                  <div className="h-24 w-1/3 bg-gray-800 rounded-lg"></div>
                  <div className="h-24 w-1/3 bg-gray-800 rounded-lg"></div>
                </div>
                <div className="h-full w-full bg-gray-800 rounded-lg flex items-center justify-center text-gray-700 font-mono text-2xl">
                   Kalvix Nexus Dashboard
                </div>
             </div>
           </div>
        </div>
      </main>
    </div>
  );
}
