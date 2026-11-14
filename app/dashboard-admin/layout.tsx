"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredUser, fetchCurrentUser } from '@/supabase/auth';
import { User } from '@/supabase/types';

export default function DashboardAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const stored = getStoredUser();
      if (!stored) {
        router.push('/admin/login-admin');
        return;
      }

      // Role guard: pastikan hanya admin yang mengakses
      if (stored.role !== 'admin') {
        if (stored.role === 'guru') {
          router.replace('/dashboard-guru');
        } else {
          router.replace('/dashboard-siswa');
        }
        return;
      }

      const fresh = await fetchCurrentUser();
      setUser(fresh || stored);
    };

    void loadUser();
  }, [router]);

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
          <Link 
            href="/dashboard-admin" 
            className={`py-4 px-5 rounded-xl text-[16px] font-medium text-center transition-all ${
              pathname === '/dashboard-admin' 
                ? 'bg-white text-black shadow-sm' 
                : 'bg-white/50 text-gray-700 hover:bg-white'
            }`}
          >
            Beranda
          </Link>
          <Link 
            href="/dashboard-admin/kelola-anggota" 
            className={`py-4 px-5 rounded-xl text-[16px] font-medium text-center transition-all ${
              pathname.startsWith('/dashboard-admin/kelola-anggota') 
                ? 'bg-white text-black shadow-sm' 
                : 'bg-white/50 text-gray-700 hover:bg-white'
            }`}
          >
            Kelola Anggota
          </Link>
          <Link 
            href="/dashboard-admin/berita" 
            className={`py-4 px-5 rounded-xl text-[16px] font-medium text-center transition-all ${
              pathname.startsWith('/dashboard-admin/berita') 
                ? 'bg-white text-black shadow-sm' 
                : 'bg-white/50 text-gray-700 hover:bg-white'
            }`}
          >
            Pengaturan Berita
          </Link>
        </nav>

        {/* User Info & Settings */}
        <div className="flex flex-col mt-auto pt-8 items-center w-full">
          <div className="bg-[#000066] w-[85%] text-white text-[15px] font-medium pt-3 pb-6 rounded-t-xl text-center px-3">
            <div className="truncate font-semibold">{user?.username || 'Admin123'}</div>
            <div className="text-[11px] text-gray-300 font-normal">
              Administrator
            </div>
          </div>
          <Link 
            href="/dashboard-admin/pengaturan" 
            className="w-full bg-white text-black text-[16px] font-medium py-3.5 rounded-xl text-center flex items-center justify-center gap-2.5 shadow-sm hover:bg-gray-50 transition-colors -mt-3 relative z-10"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
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
      </main>
    </div>
  );
}

