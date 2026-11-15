"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { getStoredUser, clearStoredUser, fetchCurrentUser } from '@/supabase/auth';
import { User } from '@/supabase/types';

export default function PengaturanDudiPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
  const [isOldPasswordFocused, setIsOldPasswordFocused] = useState(false);
  const [showOldPassPassword, setShowOldPassPassword] = useState(false);
  const [showNewPassPassword, setShowNewPassPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push('/');
      return;
    }
    async function loadData() {
      const freshUser = await fetchCurrentUser();
      setCurrentUser(freshUser || user);
    }

    void loadData();
  }, [router]);

  const handleUpdateData = async () => {
    if (!currentUser) return;
    setMessage(null);

    if (!newPassword.trim()) {
      setMessage({ text: 'Masukkan kata sandi baru terlebih dahulu.', type: 'error' });
      return;
    }

    if (newPassword.trim().length < 5) {
      setMessage({ text: 'Kata sandi baru minimal harus 5 karakter.', type: 'error' });
      return;
    }

    if (!oldPassword) {
      setMessage({ text: 'Masukkan kata sandi lama Anda untuk konfirmasi.', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      // Validasi kata sandi lama
      const { data: userCheck, error: userCheckError } = await supabase
        .from('user_accounts')
        .select('password')
        .eq('id', currentUser.id)
        .single();

      if (userCheckError) {
        console.error('Password check error:', userCheckError);
        setMessage({ text: 'Gagal memeriksa kata sandi lama: ' + userCheckError.message, type: 'error' });
        setLoading(false);
        return;
      }

      if (userCheck?.password && userCheck.password !== oldPassword) {
        setMessage({ text: 'Kata sandi lama salah!', type: 'error' });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('user_accounts')
        .update({ password: newPassword.trim() })
        .eq('id', currentUser.id);

      if (error) {
        console.error('Update error:', error);
        setMessage({ text: 'Gagal memperbarui kata sandi: ' + error.message, type: 'error' });
      } else {
        setMessage({ text: 'Kata sandi berhasil diperbarui!', type: 'success' });
        setNewPassword('');
        setOldPassword('');
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Terjadi kesalahan saat menyimpan pembaruan', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearStoredUser();
    router.replace('/');
  };

  const companyName = currentUser?.companies?.company_name || 'Mitra Industri / DUDI';

  return (
    <div className="w-full max-w-[680px] mx-auto flex flex-col gap-8 pb-10">
      <div>
        <h2 className="text-[26px] font-bold text-black leading-tight">Pengaturan Akun DUDI</h2>
        <p className="text-[14px] text-gray-500 mt-1">
          Kelola profil dan keamanan akun industri Anda.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-[14px] font-medium ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profil DUDI Card */}
      <div className="bg-white border border-gray-300 rounded-[22px] p-6 shadow-xs flex flex-col gap-4">
        <h3 className="text-[16px] font-semibold text-black border-b border-gray-200 pb-3">
          Informasi Akun
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-medium text-gray-500 mb-1">Nama Akun (Username)</label>
            <div className="bg-gray-100 rounded-xl px-4 py-3 text-[14px] font-medium text-black">
              {currentUser?.username || '-'}
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-500 mb-1">Perusahaan / DUDI</label>
            <div className="bg-gray-100 rounded-xl px-4 py-3 text-[14px] font-medium text-black truncate">
              {companyName}
            </div>
          </div>
        </div>
      </div>

      {/* Ganti Kata Sandi Card */}
      <div className="bg-white border border-gray-300 rounded-[22px] p-6 shadow-xs flex flex-col gap-4">
        <h3 className="text-[16px] font-semibold text-black border-b border-gray-200 pb-3">
          Ubah Kata Sandi
        </h3>

        {/* Input Kata Sandi Lama */}
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
            Kata Sandi Lama :
          </label>
          <div className="relative">
            <input
              type={showOldPassPassword ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              onFocus={() => setIsOldPasswordFocused(true)}
              onBlur={() => setIsOldPasswordFocused(false)}
              placeholder={isOldPasswordFocused ? "" : "Masukkan kata sandi lama"}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-[14px] text-black placeholder:text-gray-400 focus:outline-none focus:border-[#000066]"
            />
            <button
              type="button"
              onClick={() => setShowOldPassPassword(!showOldPassPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black cursor-pointer"
            >
              {showOldPassPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Input Kata Sandi Baru */}
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
            Kata Sandi Baru :
          </label>
          <div className="relative">
            <input
              type={showNewPassPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={() => setIsNewPasswordFocused(true)}
              onBlur={() => setIsNewPasswordFocused(false)}
              placeholder={isNewPasswordFocused ? "" : "Masukkan kata sandi baru"}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-[14px] text-black placeholder:text-gray-400 focus:outline-none focus:border-[#000066]"
            />
            <button
              type="button"
              onClick={() => setShowNewPassPassword(!showNewPassPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black cursor-pointer"
            >
              {showNewPassPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleUpdateData}
            disabled={loading}
            className="bg-[#000066] hover:bg-[#000044] text-white px-7 py-3 rounded-xl text-[14px] font-medium transition-colors cursor-pointer shadow-md disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan Kata Sandi'}
          </button>
        </div>
      </div>

      {/* Tombol Logout */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full bg-[#CC2929] hover:bg-[#B32424] text-white py-3.5 rounded-xl text-[15px] font-medium transition-colors shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Keluar dari Akun DUDI
        </button>
      </div>
    </div>
  );
}
