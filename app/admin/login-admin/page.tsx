"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/supabase/client';
import { getStoredUser, setStoredUser } from '@/supabase/auth';
import { Company, User } from '@/supabase/types';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Jika admin sudah login sebelumnya, langsung arahkan ke dashboard admin
  useEffect(() => {
    const user = getStoredUser();
    if (user && user.role === 'admin') {
      router.replace('/dashboard-admin');
    }
  }, [router]);

  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Nama Akun dan Kata Sandi wajib diisi');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data: user, error: queryError } = await supabase
        .from('user_accounts')
        .select('id, username, password, company_id, role, status, first_login, companies:company_id(*)')
        .eq('username', username.trim())
        .eq('password', password)
        .maybeSingle();

      if (queryError) {
        console.error('Admin login error:', queryError);
        setError('Gagal mengakses data akun dari Supabase (' + queryError.message + ').');
        return;
      }

      if (user) {
        // Role Guard: Pastikan hanya akun dengan role 'admin' yang diizinkan masuk
        if (user.role !== 'admin') {
          setError('Akses ditolak! Halaman ini hanya diperuntukkan bagi Administrator.');
          return;
        }

        const loggedUser: User = {
          id: user.id,
          username: user.username,
          company_id: user.company_id ?? null,
          role: 'admin',
          status: user.status || 'approved',
          first_login: user.first_login ?? false,
          companies: (Array.isArray(user.companies) ? user.companies[0] : user.companies) as Company | null,
        };

        setStoredUser(loggedUser);
        router.push('/dashboard-admin');
      } else {
        setError('Nama Akun atau Kata Sandi salah. Silakan periksa kembali.');
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan koneksi ke server';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-center items-center p-4 relative">
      {/* Tombol Kembali (Panah Kiri di Pojok Kiri Atas Luar Card) */}
      <div className="absolute top-8 left-8 md:top-10 md:left-10">
        <Link 
          href="/" 
          className="text-black hover:text-gray-600 transition-colors p-1 flex items-center justify-center cursor-pointer"
          title="Kembali ke Portal Utama"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </Link>
      </div>

      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        
        {/* Header Logo */}
        <div className="flex justify-center items-center gap-3 mb-6">
          <Image src="/smk.svg" alt="SMK Logo" width={40} height={40} priority className="w-[40px] h-auto" />
          <h1 className="text-[26px] font-bold text-black tracking-tight">ViskaToring</h1>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-xl p-3 mb-5">
            {error}
          </div>
        )}

        {/* Form Login Admin */}
        <form onSubmit={handleAdminLogin}>
          <div className="mb-4">
            <label className="block text-[14px] font-medium text-black mb-1.5">Nama Akun Admin :</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username admin..."
              className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 text-[14px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all"
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block text-[14px] font-medium text-black mb-1.5">Kata Sandi :</label>
            <div className="relative flex items-center">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 pr-12 text-[14px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all"
              />
              <button 
                type="button"
                className="absolute right-4 text-gray-600 hover:text-black transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#000066] text-white rounded-xl py-3 text-[15px] font-medium hover:bg-[#000044] disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Memeriksa Akun...</span>
              </>
            ) : (
              'Masuk sebagai Admin'
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

