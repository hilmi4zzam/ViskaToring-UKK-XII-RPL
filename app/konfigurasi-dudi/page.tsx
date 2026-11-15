"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { getStoredUser, setStoredUser, clearStoredUser } from '@/supabase/auth';
import { User } from '@/supabase/types';

export default function KonfigurasiDudiPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showExitModal, setShowExitModal] = useState(false);

  // Cek user login
  useEffect(() => {
    const loadUser = async () => {
      const user = getStoredUser();
      if (!user) {
        router.push('/');
        return;
      }
      if (user.role === 'siswa') {
        router.replace('/konfigurasi-siswa');
        return;
      }
      if (user.role === 'guru') {
        router.replace('/konfigurasi-guru');
        return;
      }
      setCurrentUser(user);
    };

    void loadUser();
  }, [router]);

  const handleMasuk = async () => {
    if (!currentUser) return;
    setErrorMsg('');

    // Validasi 1: Password minimal 5 karakter
    if (!password || password.length < 5) {
      setErrorMsg('Kata sandi baru minimal harus 5 karakter.');
      return;
    }

    // Validasi 2: Password konfirmasi harus cocok
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      // Update akun DUDI di Supabase: simpan password baru dan ubah first_login = false
      const { data: savedUser, error: updateError } = await supabase
        .from('user_accounts')
        .update({
          password: password,
          first_login: false,
        })
        .eq('id', currentUser.id)
        .select('id, username, company_id, role')
        .single();

      if (updateError) {
        console.error('Update password DUDI error:', updateError);
        setErrorMsg('Gagal memperbarui kata sandi: ' + updateError.message);
        return;
      }

      // Perbarui session user di localStorage dengan first_login = false
      const updatedUserSession: User = {
        ...currentUser,
        id: savedUser.id,
        username: savedUser.username,
        role: savedUser.role || currentUser.role || 'dudi',
        first_login: false,
      };

      setStoredUser(updatedUserSession);

      // Redirect otomatis ke Dashboard DUDI
      router.push('/dashboard-dudi');
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data ke Supabase';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmExit = () => {
    clearStoredUser();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center relative pt-12 md:pt-16 pb-12">
      
      {/* Back Button */}
      <div className="absolute top-8 left-8 md:top-12 md:left-12">
        <button 
          type="button" 
          onClick={() => setShowExitModal(true)} 
          className="text-black hover:text-gray-600 transition-colors cursor-pointer" 
          title="Kembali ke halaman login"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
      </div>

      <div className="w-full max-w-[440px] px-6">
        
        {/* Header Logo */}
        <div className="flex justify-center items-center gap-3 mb-6">
          <Image src="/smk.svg" alt="SMK Logo" width={36} height={36} className="w-[36px] h-auto" />
          <h2 className="text-[28px] font-semibold text-black">ViskaToring</h2>
        </div>

        {/* Form Fields */}
        <div className="w-full">
          
          {/* Nama Akun (Read-only dari Supabase User) */}
          <div className="mb-5">
            <label className="block text-[14px] font-medium text-black mb-1.5">Nama Akun :</label>
            <div className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 flex justify-between items-center cursor-not-allowed select-none">
              <span className="text-[14px] text-gray-800 font-medium">
                {currentUser?.username || 'Memuat akun...'}
              </span>
              {/* Lock Icon */}
              <svg className="text-gray-600" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm-3 5c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm9 13H6v-8h12v8z" />
                <circle cx="12" cy="16" r="1.5" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* Perbarui Kata Sandi : */}
          <div className="mb-5">
            <label className="block text-[14px] font-medium text-black mb-1.5">
              Perbarui Kata Sandi :
            </label>
            <div className="relative flex items-center">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 5 karakter..."
                className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 pr-10 text-[14px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all"
              />
              <button 
                type="button"
                className="absolute right-3 text-gray-600 hover:text-black transition-colors cursor-pointer"
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
            <div className="flex items-center gap-1.5 mt-2 text-gray-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span className="text-[12px] text-gray-600">Perbarui kata sandi kamu untuk keamanan yang lebih terjaga</span>
            </div>
          </div>

          {/* Konfirmasi Kata Sandi Baru : */}
          <div className="mb-6">
            <label className="block text-[14px] font-medium text-black mb-1.5">
              Konfirmasi Kata Sandi Baru :
            </label>
            <div className="relative flex items-center">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru..."
                className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 pr-10 text-[14px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all"
              />
              <button 
                type="button"
                className="absolute right-3 text-gray-600 hover:text-black transition-colors cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
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
          
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3 mb-5">
              {errorMsg}
            </div>
          )}

          <hr className="border-gray-300 mb-6" />

          {/* Button Masuk */}
          <button 
            type="button"
            onClick={handleMasuk}
            disabled={loading}
            className="w-full bg-[#000066] text-white rounded-xl py-3.5 text-[16px] font-medium hover:bg-[#000044] disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan & Menyiapkan Akun...</span>
              </>
            ) : (
              'Masuk'
            )}
          </button>
        </div>
      </div>

      {/* Modal Konfirmasi Tinggalkan Halaman */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-3.5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 className="text-[17px] font-semibold text-gray-900 mb-1.5">
              Yakin untuk meninggalkan page ini?
            </h3>
            <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
              Perubahan kata sandi tidak akan disimpan. Anda akan kembali ke halaman login.
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 text-[14px] font-medium hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Tidak
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#000066] text-white text-[14px] font-medium hover:bg-[#000044] transition-colors cursor-pointer"
              >
                Ya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
