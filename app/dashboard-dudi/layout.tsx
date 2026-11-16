"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredUser, fetchCurrentUser, isFirstLogin } from '@/supabase/auth';
import { User } from '@/supabase/types';

export default function DashboardDudiLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const loadUser = async () => {
      const stored = getStoredUser();
      if (!stored) {
        router.push('/');
        return;
      }

      // Role guard: pastikan hanya role dudi yang mengakses
      if (stored.role !== 'dudi') {
        if (stored.role === 'admin') {
          router.replace('/dashboard-admin');
        } else if (stored.role === 'guru') {
          router.replace('/dashboard-guru');
        } else {
          router.replace('/dashboard-siswa');
        }
        return;
      }

      if (isFirstLogin(stored)) {
        router.push('/konfigurasi-dudi');
        return;
      }

      const fresh = await fetchCurrentUser();
      setUser(fresh || stored);
    };

    void loadUser();
  }, [router]);

  // Tutup dropdown menu jika klik di luar area navbar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  const companyTitle = user?.companies?.company_name
    ? `Dudi ${user.companies.company_name}`
    : 'Dudi';

  return (
    <div className="flex min-h-screen bg-white flex-col md:flex-row">
      {/* Mobile Top Navbar */}
      <header 
        ref={menuRef} 
        className="md:hidden w-full bg-[#EDEDED] rounded-b-[24px] px-6 py-4 flex flex-col relative z-40 shadow-xs"
      >
        {/* Bar: Logo & Hamburger */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/smk.svg" alt="SMK Logo" width={32} height={32} className="w-[32px] h-auto" />
            <h2 className="text-[22px] font-semibold text-black tracking-tight select-none">ViskaToring</h2>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-black hover:opacity-70 transition-opacity cursor-pointer"
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="7" x2="20" y2="7"></line>
              <line x1="8" y1="12" x2="20" y2="12"></line>
              <line x1="13" y1="17" x2="20" y2="17"></line>
            </svg>
          </button>
        </div>

        {/* Dropdown Menu Saat Hamburger Ditekan */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-6 right-6 bg-[#EDEDED] rounded-b-[24px] px-5 pt-3 pb-6 shadow-xl flex flex-col gap-3 border-t border-gray-200/40">
            {/* Nav Links */}
            <Link 
              href="/dashboard-dudi" 
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-white text-black font-medium py-3 rounded-xl text-center text-[15px] shadow-xs hover:bg-gray-50 transition-all"
            >
              Beranda
            </Link>
            <Link 
              href="/dashboard-dudi/berita" 
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-white text-black font-medium py-3 rounded-xl text-center text-[15px] shadow-xs hover:bg-gray-50 transition-all"
            >
              Kelola berita
            </Link>

            {/* User Info & Settings Box */}
            <div className="flex flex-col mt-2 items-center w-full">
              <div className="bg-[#000066] w-[85%] text-white text-[14px] font-medium pt-3 pb-6 rounded-t-xl text-center px-3">
                <div className="truncate font-semibold">{user?.username || 'Dudi Mitra'}</div>
                <div className="text-[11px] text-gray-300 font-normal truncate">
                  {companyTitle}
                </div>
              </div>
              <Link 
                href="/dashboard-dudi/pengaturan" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full bg-white text-black text-[15px] font-medium py-3 rounded-xl text-center flex items-center justify-center gap-2.5 shadow-xs hover:bg-gray-50 transition-colors -mt-3 relative z-10"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                </svg>
                Pengaturan Akun
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-[300px] bg-[#F0F0F0] flex-col pt-12 pb-10 px-7 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-4 mb-14 px-2">
          <Image src="/smk.svg" alt="SMK Logo" width={36} height={36} className="w-[36px] h-auto" />
          <h2 className="text-[26px] font-semibold text-black">ViskaToring</h2>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-5 flex-1">
          <Link 
            href="/dashboard-dudi" 
            className={`py-4 px-5 rounded-xl text-[16px] font-medium text-center transition-all ${
              pathname === '/dashboard-dudi' 
                ? 'bg-white text-black shadow-sm' 
                : 'bg-white/50 text-gray-700 hover:bg-white'
            }`}
          >
            Beranda
          </Link>
          <Link 
            href="/dashboard-dudi/berita" 
            className={`py-4 px-5 rounded-xl text-[16px] font-medium text-center transition-all ${
              pathname.startsWith('/dashboard-dudi/berita') 
                ? 'bg-white text-black shadow-sm' 
                : 'bg-white/50 text-gray-700 hover:bg-white'
            }`}
          >
            Kelola berita
          </Link>
        </nav>

        {/* User Info & Settings */}
        <div className="flex flex-col mt-auto pt-8 items-center w-full">
          <div className="bg-[#000066] w-[85%] text-white text-[15px] font-medium pt-3 pb-6 rounded-t-xl text-center px-3">
            <div className="truncate font-semibold">{user?.username || 'Dudi Mitra'}</div>
            <div className="text-[11px] text-gray-300 font-normal truncate">
              {companyTitle}
            </div>
          </div>
          <Link 
            href="/dashboard-dudi/pengaturan" 
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-12 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
