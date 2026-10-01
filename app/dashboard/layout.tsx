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
      <aside className="w-[250px] bg-[#F0F0F0] flex flex-col pt-8 pb-6 px-5 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 px-2">
          <Image src="/smk.svg" alt="SMK Logo" width={28} height={28} className="w-[28px] h-auto" />
          <h2 className="text-[22px] font-semibold text-black">ViskaToring</h2>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-3 flex-1">
          <Link href="/dashboard" className={`py-3 px-4 rounded-xl text-[13px] font-medium text-center transition-all ${pathname === '/dashboard' ? 'bg-white text-black shadow-sm' : 'bg-white/50 text-gray-700 hover:bg-white'}`}>
            Beranda
          </Link>
          <Link href="/dashboard/laporan" className={`py-3 px-4 rounded-xl text-[13px] font-medium text-center transition-all ${pathname.startsWith('/dashboard/laporan') ? 'bg-white text-black shadow-sm' : 'bg-white/50 text-gray-700 hover:bg-white'}`}>
            Lihat Laporan
          </Link>
          <Link href="/dashboard/berita" className={`py-3 px-4 rounded-xl text-[13px] font-medium text-center transition-all ${pathname.startsWith('/dashboard/berita') ? 'bg-white text-black shadow-sm' : 'bg-white/50 text-gray-700 hover:bg-white'}`}>
            Berita Anak PKL
          </Link>
        </nav>

        {/* User Info & Settings */}
        <div className="flex flex-col gap-3 mt-auto pt-6">
          <div className="bg-[#000066] text-white text-[13px] font-medium py-[10px] rounded-xl text-center">
            {user.namaAkun}
          </div>
          <Link href="/dashboard/pengaturan" className="bg-white text-black text-[13px] font-medium py-[10px] rounded-xl text-center flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Pengaturan Akun
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        <div className="flex-1 overflow-y-auto p-8 flex flex-col">
          {children}
        </div>
        
        {/* Yellow Footer Banner */}
        <div className="bg-[#EFEF5B] h-[44px] w-full flex items-center justify-around px-6 flex-shrink-0">
          {/* Logo Placeholders */}
          <div className="h-6 w-24 bg-blue-900/30 rounded flex items-center justify-center text-[10px] font-bold text-black/50">ASTRA</div>
          <div className="h-6 w-32 bg-red-600/30 rounded flex items-center justify-center text-[10px] font-bold text-black/50">Sinarmas Land</div>
          <div className="h-6 w-24 bg-green-600/30 rounded flex items-center justify-center text-[10px] font-bold text-black/50">Pegadaian</div>
          <div className="h-6 w-24 bg-blue-600/30 rounded flex items-center justify-center text-[10px] font-bold text-black/50">Indomaret</div>
        </div>
      </main>
    </div>
  );
}
