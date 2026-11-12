"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { getStoredUser, clearStoredUser, fetchCurrentUser } from '@/supabase/auth';
import { User } from '@/supabase/types';

export default function PengaturanGuruPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
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

    if (newPassword.trim().length < 6) {
      setMessage({ text: 'Kata sandi baru minimal harus 6 karakter.', type: 'error' });
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
    router.push('/');
  };
  
  const showOldPassword = isNewPasswordFocused || newPassword.length > 0;

  return (
    <div className="w-full max-w-[480px] mx-auto flex flex-col gap-5 pt-8 pb-10">
      
      {/* Feedback Message */}
      {message && (
        <div className={`p-4 rounded-xl text-[14px] font-medium border ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-red-50 text-red-600 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Nama Akun (Read-only) */}
      <div className="flex flex-col gap-2">
        <label className="text-[15px] font-medium text-black">Nama Akun :</label>
        <div className="w-full bg-[#EDEDED] text-black text-[15px] py-3.5 px-4 rounded-xl flex justify-between items-center cursor-not-allowed select-none">
          <span className="font-medium text-gray-800">{currentUser?.username || "Memuat..."}</span>
          <svg className="text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm-3 5c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm9 13H6v-8h12v8z"/>
            <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* Kata Sandi Lama (Hanya muncul jika input kata sandi baru diisi / difokuskan) */}
      {showOldPassword && (
        <div className="flex flex-col gap-2">
          <label className="text-[15px] font-medium text-black">Kata Sandi Lama :</label>
          <div className="relative flex items-center">
            <input 
              type={showOldPassPassword ? "text" : "password"} 
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Masukkan kata sandi lama..."
              className="w-full bg-[#F0F0F0] text-black text-[15px] py-3.5 pl-4 pr-12 rounded-xl outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all"
            />
            <button 
              type="button" 
              onClick={() => setShowOldPassPassword(!showOldPassPassword)}
              className="absolute right-4 text-gray-500 hover:text-black transition-colors"
            >
              {showOldPassPassword ? (
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
        </div>
      )}

      {/* Kata Sandi Baru */}
      <div className="flex flex-col gap-2">
        <label className="text-[15px] font-medium text-black">Perbarui Kata Sandi :</label>
        <div className="relative flex items-center">
          <input 
            type={showNewPassPassword ? "text" : "password"} 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onFocus={() => setIsNewPasswordFocused(true)}
            placeholder="Minimal 6 karakter..."
            className="w-full bg-[#F0F0F0] text-black text-[15px] py-3.5 pl-4 pr-12 rounded-xl outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all"
          />
          <button 
            type="button" 
            onClick={() => setShowNewPassPassword(!showNewPassPassword)}
            className="absolute right-4 text-gray-500 hover:text-black transition-colors"
          >
            {showNewPassPassword ? (
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
      </div>

      <hr className="border-t border-gray-300 mt-2 mb-1 w-[98%] mx-auto" />

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button 
          type="button"
          onClick={handleUpdateData}
          disabled={loading}
          className="w-full bg-[#000066] text-white text-[15px] font-medium py-3.5 rounded-xl hover:bg-[#000044] disabled:bg-gray-400 transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            'Ajukan Pembaruan Data'
          )}
        </button>
        <button 
          type="button"
          onClick={handleLogout}
          className="w-full bg-[#CC2929] text-white text-[15px] font-medium py-3.5 rounded-xl hover:bg-[#B32424] transition-colors shadow-sm"
        >
          Keluar
        </button>
      </div>
    </div>
  );
}

