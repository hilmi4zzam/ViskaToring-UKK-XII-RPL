"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import usersData from '../../data/users.json';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = usersData[0] || { namaAkun: 'Mohamad Hilmi Azzam' };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-[300px] bg-[#F0F0F0] flex flex-col pt-12 pb-10 px-7 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-4 mb-14 px-2">
          <Image src="/smk.svg" alt="SMK Logo" width={36} height={36} className="w-[36px] h-auto" />
          <h2 className="text-[26px] font-semibold text-black">ViskaToring</h2>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-5 flex-1">
          <Link href="/dashboard" className={`py-4 px-5 rounded-xl text-[16px] font-medium text-center transition-all ${pathname === '/dashboard' ? 'bg-white text-black shadow-sm' : 'bg-white/50 text-gray-700 hover:bg-white'}`}>
            Beranda
          </Link>
          <Link href="/dashboard/laporan" className={`py-4 px-5 rounded-xl text-[16px] font-medium text-center transition-all ${pathname.startsWith('/dashboard/laporan') ? 'bg-white text-black shadow-sm' : 'bg-white/50 text-gray-700 hover:bg-white'}`}>
            Lihat Laporan
          </Link>
          <Link href="/dashboard/berita" className={`py-4 px-5 rounded-xl text-[16px] font-medium text-center transition-all ${pathname.startsWith('/dashboard/berita') ? 'bg-white text-black shadow-sm' : 'bg-white/50 text-gray-700 hover:bg-white'}`}>
            Berita Anak PKL
          </Link>
        </nav>

        {/* User Info & Settings */}
        <div className="flex flex-col gap-4 mt-auto pt-8">
          <div className="bg-[#000066] text-white text-[15px] font-medium py-3 rounded-xl text-center">
            {user.namaAkun}
          </div>
          <Link href="/dashboard/pengaturan" className="bg-white text-black text-[15px] font-medium py-3 rounded-xl text-center flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Pengaturan Akun
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        <div className="flex-1 overflow-y-auto p-12 flex flex-col">
          {children}
        </div>
        
        {/* Yellow Footer Banner with Marquee */}
        <div className="bg-[#EFEF5B] h-[44px] w-full overflow-hidden flex items-center flex-shrink-0">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(3)].map((_, setIndex) => (
              <div key={setIndex} className="flex items-center">
                {['/pngegg.png', '/pngegg (1).png', '/pngegg (2).png', '/pngegg (3).png'].map((src, idx) => (
                  <div key={idx} className="mx-8 flex items-center justify-center">
                    <img src={src} alt={`Sponsor ${idx}`} className="h-[32px] w-auto object-contain max-w-[180px]" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Global CSS for Marquee Animation */}
      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333333%);
          }
        }
        .animate-marquee {
          animation: marquee 15s linear infinite;
          width: max-content;
        }
      `}</style>
    </div>
  );
}
