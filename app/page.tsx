"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/supabase/client';
import { getStoredUser, setStoredUser, isFirstLogin } from '@/supabase/auth';
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
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const router = useRouter();

  // Otomatis arahkan jika pengguna sudah login sebelumnya
  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      if (isFirstLogin(user)) {
        if (user.role === 'guru') {
          router.replace('/konfigurasi-guru');
        } else {
          router.replace('/konfigurasi-siswa');
        }
      } else {
        router.replace('/dashboard-siswa');
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
        .select('id, username, password, company_id, role, status, first_login, companies(*)')
        .eq('username', username.trim())
        .eq('password', password)
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

      if (user) {
        // Cek status persetujuan dari Admin
        if (user.status === 'pending') {
          setError('Akun Anda masih dalam proses peninjauan oleh Admin. Anda baru dapat masuk setelah pengajuan disetujui.');
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
          } else {
            router.push('/konfigurasi-siswa');
          }
        } else {
          router.push('/dashboard-siswa');
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
      // Pengajuan akun baru: status = 'pending', role default = 'siswa' (akan ditinjau admin)
      const { data: newUser, error: regErr } = await supabase
        .from('user_accounts')
        .insert({
          username: regUsername.trim(),
          password: regPassword,
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
    setRegError('');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      {/* Left Side */}
      <div 
        className="flex-[1.2] relative flex flex-col justify-end p-[48px] text-white"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%), url('/halaman depan.webp') center/cover no-repeat"
        }}
      >
        <h1 className="text-[42px] md:text-[56px] font-semibold leading-[1.1] mb-3">
          Portal Absensi<br />Magang
        </h1>
        <p className="text-[16px] md:text-[20px] font-light max-w-[90%]">
          Situs monitoring online siswa Praktik Kerja Lapangan resmi SMK Negeri 6 Surakarta
        </p>
      </div>

      {/* Right Side */}
      <div className="flex-1 flex justify-center items-center p-6 md:p-10">
        <div className="w-full max-w-[420px]">
          
          {/* Header Logo */}
          <div className="flex items-center gap-3 mb-8">
            <Image src="/smk.svg" alt="SMK Logo" width={36} height={36} priority className="w-[36px] h-auto" />
            <h2 className="text-[28px] font-semibold text-black">ViskaToring</h2>
          </div>

          <hr className="border-gray-300 mb-8" />

          {/* Form Login */}
          <form onSubmit={handleLogin}>
            <div className="mb-5">
              <label className="block text-[16px] text-black mb-2">Nama Akun :</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan nama akun..."
                className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 text-[14px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all"
              />
            </div>

            <div className="mb-8">
              <label className="block text-[16px] text-black mb-2">Kata Sandi :</label>
              <div className="relative flex items-center">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 pr-10 text-[14px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all"
                />
                <button 
                  type="button"
                  className="absolute right-3 text-gray-600 hover:text-black transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3 mt-3">
                  {error}
                </div>
              )}
            </div>

            <hr className="border-gray-300 mb-8" />

            {/* Buttons */}
            <div className="flex flex-col gap-3 mb-8">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#000066] text-white rounded-xl py-3 text-[16px] font-medium hover:bg-[#000044] disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
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
                className="w-full bg-[#EFEF5B] text-black rounded-xl py-3 text-[16px] font-medium hover:bg-[#e0e045] transition-colors"
              >
                Pengajuan Akun
              </button>
            </div>
          </form>
          
          {/* Footer Text */}
          <p className="text-[11px] text-gray-500 leading-relaxed text-center px-2">
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
                <h3 className="text-[20px] font-semibold text-black mb-2">Pengajuan Akun Terkirim!</h3>
                <p className="text-[13px] text-gray-600 leading-relaxed mb-6">
                  Akun <b className="text-black">{regUsername}</b> berhasil diajukan dan sedang <b>menunggu peninjauan & persetujuan dari Admin</b>. Role Anda akan ditentukan oleh Admin sebelum Anda dapat masuk ke sistem.
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
                  Daftarkan nama akun Anda. Pengajuan ini akan ditinjau dan role akan ditentukan oleh Admin.
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
                    <input 
                      type="password" 
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 6 karakter..."
                      className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 text-[14px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all"
                    />
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
