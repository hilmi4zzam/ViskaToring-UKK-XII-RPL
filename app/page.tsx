"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/supabase/client';
import { getStoredUser, setStoredUser, isFirstLogin, hashPassword, verifyPassword } from '@/supabase/auth';
import { Company, User } from '@/supabase/types';

export default function HomePage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // State khusus modal Pengajuan Akun Baru
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // Easter egg: 7x klik logo untuk masuk ke login Admin
  const [logoClickCount, setLogoClickCount] = useState(0);
  const logoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();

  const handleLogoClick = () => {
    if (logoTimerRef.current) {
      clearTimeout(logoTimerRef.current);
    }

    const nextCount = logoClickCount + 1;
    if (nextCount >= 7) {
      setLogoClickCount(0);
      router.push('/login-admin');
    } else {
      setLogoClickCount(nextCount);
      logoTimerRef.current = setTimeout(() => {
        setLogoClickCount(0);
      }, 3000);
    }
  };

  // Otomatis arahkan jika pengguna sudah login sebelumnya
  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      if (user.role === 'admin') {
        router.replace('/dashboard-admin');
      } else if (isFirstLogin(user)) {
        if (user.role === 'guru') {
          router.replace('/konfigurasi-guru');
        } else if (user.role === 'dudi') {
          router.replace('/konfigurasi-dudi');
        } else {
          router.replace('/konfigurasi-siswa');
        }
      } else {
        if (user.role === 'guru') {
          router.replace('/dashboard-guru');
        } else if (user.role === 'dudi') {
          router.replace('/dashboard-dudi');
        } else {
          router.replace('/dashboard-siswa');
        }
      }
    }
  }, [router]);

  const handleLogin = async (e?: React.FormEvent) => {
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
        .maybeSingle();

      if (queryError) {
        console.error('Login error:', {
          message: queryError.message,
          code: queryError.code,
          details: queryError.details,
          hint: queryError.hint,
        });
        setError('Gagal mengakses data akun dari Supabase (' + queryError.message + '). Pastikan tabel dan policy RLS sudah sesuai.');
        return;
      }

      if (!user) {
        setError('Nama Akun atau Kata Sandi salah. Silakan periksa kembali.');
        return;
      }

      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        setError('Nama Akun atau Kata Sandi salah. Silakan periksa kembali.');
        return;
      }

      // Auto-upgrade password ke hash jika masih berupa plain text
      if (user.password && !user.password.startsWith('$2')) {
        const hashed = await hashPassword(password);
        await supabase
          .from('user_accounts')
          .update({ password: hashed })
          .eq('id', user.id);
      }

      if (user) {
        // Role Guard: Tolak akun Admin dari portal login utama siswa & guru
        if (user.role === 'admin') {
          setError('Nama Akun atau Kata Sandi salah. Silakan periksa kembali.');
          return;
        }

        // Cek status persetujuan dari Admin
        if (user.status === 'pending') {
          setError('Akun Anda masih dalam proses peninjauan oleh Admin. Anda dapat masuk setelah pengajuan disetujui.');
          return;
        }

        if (user.status === 'rejected') {
          setError('Pengajuan akun ini tidak disetujui oleh Admin. Silakan hubungi pihak sekolah.');
          return;
        }

        const loggedUser: User = {
          id: user.id,
          username: user.username,
          company_id: user.company_id ?? null,
          role: user.role || 'siswa',
          status: user.status || 'approved',
          first_login: user.first_login ?? true,
          companies: (Array.isArray(user.companies) ? user.companies[0] : user.companies) as Company | null,
        };

        setStoredUser(loggedUser);

        // Jika terdeteksi sebagai login pertama kali (first_login = true atau company belum ditentukan bagi siswa)
        if (isFirstLogin(loggedUser)) {
          if (loggedUser.role === 'guru') {
            router.push('/konfigurasi-guru');
          } else if (loggedUser.role === 'dudi') {
            router.push('/konfigurasi-dudi');
          } else {
            router.push('/konfigurasi-siswa');
          }
        } else {
          if (loggedUser.role === 'guru') {
            router.push('/dashboard-guru');
          } else if (loggedUser.role === 'dudi') {
            router.push('/dashboard-dudi');
          } else {
            router.push('/dashboard-siswa');
          }
        }
      } else {
        setError('Nama Akun atau Kata Sandi salah. Silakan periksa kembali.');
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan koneksi ke Supabase';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!regUsername.trim() || !regPassword.trim()) {
      setRegError('Semua kolom wajib diisi');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Kata Sandi minimal 6 karakter');
      return;
    }

    setRegError('');
    setRegLoading(true);

    try {
      // Hash kata sandi pendaftar baru
      const hashedPassword = await hashPassword(regPassword);

      // Pengajuan akun baru: status = 'pending', role default = 'siswa' (akan ditinjau admin)
      const { data: newUser, error: regErr } = await supabase
        .from('user_accounts')
        .insert({
          username: regUsername.trim(),
          password: hashedPassword,
          role: 'siswa',
          status: 'pending',
          first_login: true,
        })
        .select('id, username, role, status')
        .single();

      if (regErr) {
        console.error('Register error:', {
          message: regErr.message,
          code: regErr.code,
          details: regErr.details,
          hint: regErr.hint,
        });
        if (regErr.code === '23505') {
          setRegError('Nama Akun ini sudah terdaftar. Silakan gunakan nama lain.');
        } else {
          setRegError(regErr.message || regErr.details || 'Gagal mengajukan akun baru');
        }
        return;
      }

      if (newUser) {
        // Tampilkan pesan sukses peninjauan, JANGAN langsung login
        setRegSuccess(true);
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan koneksi ke Supabase';
      setRegError(errMsg);
    } finally {
      setRegLoading(false);
    }
  };

  const closeRegisterModal = () => {
    setIsRegisterOpen(false);
    setRegSuccess(false);
    setRegUsername('');
    setRegPassword('');
    setShowRegPassword(false);
    setRegError('');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      {/* Mobile Navbar: Putih cerah model navbar standar dengan logo & ViskaToring */}
      <nav className="flex md:hidden items-center gap-3 w-full bg-white border-b border-gray-200 px-6 py-4 shadow-xs sticky top-0 z-30">
        <div
          onClick={handleLogoClick}
          className="select-none cursor-default"
        >
          <Image src="/smk.svg" alt="SMK Logo" width={32} height={32} priority className="w-[32px] h-auto pointer-events-none" />
        </div>
        <h2 className="text-[22px] font-semibold text-black tracking-tight select-none">ViskaToring</h2>
      </nav>

      {/* Left / Hero Side */}
      <div 
        className="w-full md:flex-[1.2] relative flex flex-col justify-end p-6 md:p-[48px] text-white min-h-[300px] md:min-h-screen"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 100%), url('/halaman depan.webp') center/cover no-repeat"
        }}
      >
        {/* Hero Title & Subtitle */}
        <div>
          <h1 className="text-[38px] sm:text-[44px] md:text-[56px] font-bold md:font-semibold leading-[1.12] mb-2.5 md:mb-3">
            Portal Absensi<br />Magang
          </h1>
          <p className="text-[14px] sm:text-[16px] md:text-[20px] font-normal md:font-light max-w-[95%] md:max-w-[90%] leading-relaxed text-white/95">
            Situs monitoring online siswa Praktik Kerja Lapangan resmi SMK Negeri 6 Surakarta
          </p>
        </div>
      </div>

      {/* Right / Form Side */}
      <div className="w-full md:flex-1 flex justify-center items-start md:items-center p-6 md:p-10">
        <div className="w-full max-w-[420px]">
          
          {/* Header Logo (Desktop only) */}
          <div className="hidden md:flex items-center gap-3 mb-8">
            <div
              onClick={handleLogoClick}
              className="select-none cursor-default"
            >
              <Image src="/smk.svg" alt="SMK Logo" width={36} height={36} priority className="w-[36px] h-auto pointer-events-none" />
            </div>
            <h2 className="text-[28px] font-semibold text-black select-none">ViskaToring</h2>
          </div>

          {/* Top Divider */}
          <hr className="border-gray-300 mb-6 md:mb-8" />

          {/* Form Login */}
          <form onSubmit={handleLogin}>
            <div className="mb-4 md:mb-5">
              <label className="block text-[15px] md:text-[16px] font-normal text-black mb-2">Nama Akun :</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan nama akun..."
                className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 text-[15px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all placeholder:text-transparent md:placeholder:text-gray-400"
              />
            </div>

            <div className="mb-6 md:mb-8">
              <label className="block text-[15px] md:text-[16px] font-normal text-black mb-2">Kata Sandi :</label>
              <div className="relative flex items-center">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 pr-12 text-[15px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all placeholder:text-transparent md:placeholder:text-gray-400"
                />
                <button 
                  type="button"
                  className="absolute right-4 text-gray-600 hover:text-black transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                    </svg>
                  )}
                </button>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-[14px] rounded-xl p-3 mt-3">
                  {error}
                </div>
              )}
            </div>

            {/* Divider between password & buttons */}
            <hr className="border-gray-300 mb-6 md:mb-8" />

            {/* Buttons */}
            <div className="flex flex-col gap-3.5 mb-6 md:mb-8">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#000066] text-white rounded-xl py-3.5 text-[15px] md:text-[16px] font-medium hover:bg-[#000044] disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memeriksa Akun...</span>
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
              <button 
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="w-full bg-[#EFEF5B] text-black rounded-xl py-3.5 text-[15px] md:text-[16px] font-medium hover:bg-[#e0e045] transition-colors"
              >
                Pengajuan Akun
              </button>
            </div>
          </form>
          
          {/* Footer Text */}
          <p className="text-[12px] sm:text-[13px] text-gray-600 leading-relaxed text-center px-2 max-w-[340px] mx-auto pb-4 md:pb-0">
            Jadikan situs web ViskaToring sebagai cerminan integritas kamu selama PKL. Absensi menjadi salah satu yang menentukan nilai akhir kamu
          </p>
          
        </div>
      </div>

      {/* Modal Pengajuan Akun Baru */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-[420px] shadow-2xl relative">
            <button 
              type="button"
              onClick={closeRegisterModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {regSuccess ? (
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <b className="text-[20px] font-semibold text-black mb-2">Pengajuan Akun Terkirim!</b>
                <p className="text-[13px] text-gray-600 leading-relaxed mb-6">
                  Akun <b className="text-black">{regUsername}</b> berhasil diajukan dan sedang <b>menunggu peninjauan & persetujuan dari Admin</b>.
                </p>
                <button 
                  type="button"
                  onClick={closeRegisterModal}
                  className="w-full bg-[#000066] text-white rounded-xl py-3 text-[15px] font-medium hover:bg-[#000044] transition-colors"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-[22px] font-semibold text-black mb-1">Pengajuan Akun Baru</h3>
                <p className="text-[13px] text-gray-500 mb-6">
                  Daftarkan nama akun Anda.
                </p>

                <form onSubmit={handleAccountRequest} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[14px] font-medium text-black mb-1.5">Nama Akun / Nama Lengkap :</label>
                    <input 
                      type="text" 
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="Contoh: Mohamad Hilmi Azzam"
                      className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 text-[14px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium text-black mb-1.5">Kata Sandi :</label>
                    <div className="relative flex items-center">
                      <input 
                        type={showRegPassword ? "text" : "password"} 
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimal 6 karakter..."
                        className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 pr-12 text-[14px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all"
                      />
                      <button 
                        type="button"
                        className="absolute right-4 text-gray-600 hover:text-black transition-colors"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                      >
                        {showRegPassword ? (
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

                  {regError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-xl p-2.5">
                      {regError}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={regLoading}
                    className="w-full bg-[#000066] text-white rounded-xl py-3 text-[15px] font-medium hover:bg-[#000044] disabled:bg-gray-400 transition-colors mt-2 flex items-center justify-center gap-2"
                  >
                    {regLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mengirim Pengajuan...</span>
                      </>
                    ) : (
                      'Kirim Pengajuan Akun'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
