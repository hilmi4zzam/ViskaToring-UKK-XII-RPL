"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { getStoredUser, clearStoredUser, fetchCurrentUser, verifyPassword, hashPassword } from '@/supabase/auth';
import { User } from '@/supabase/types';

export default function PengaturanGuruPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
  const [isOldPasswordFocused, setIsOldPasswordFocused] = useState(false);
  const [showOldPassPassword, setShowOldPassPassword] = useState(false);
  const [showNewPassPassword, setShowNewPassPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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

      const isOldValid = await verifyPassword(oldPassword, userCheck?.password);
      if (!isOldValid) {
        setMessage({ text: 'Kata sandi lama salah!', type: 'error' });
        setLoading(false);
        return;
      }

      const hashedPassword = await hashPassword(newPassword.trim());
      const { error } = await supabase
        .from('user_accounts')
        .update({ password: hashedPassword })
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

  const showOldPassword = isNewPasswordFocused || isOldPasswordFocused || newPassword.length > 0 || oldPassword.length > 0;

  return (
    <div className="w-full max-w-[480px] mx-auto flex flex-col gap-5 pt-8 pb-10">

      {/* Feedback Message */}
      {message && (
        <div className={`p-4 rounded-xl text-[14px] font-medium border ${message.type === 'success'
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-red-50 text-red-600 border-red-200'
          }`}>
          {message.text}
        </div>
      )}

      {/* Nama Akun */}
      <div className="flex flex-col gap-2">
        <label className="text-[15px] font-medium text-black">Nama Akun :</label>
        <div className="relative cursor-not-allowed">
          <input
            type="text"
            value={currentUser?.username || "Memuat akun..."}
            disabled
            tabIndex={-1}
            readOnly
            className="w-full bg-[#F0F0F0] text-gray-700 text-[15px] py-3.5 pl-4 pr-10 rounded-xl outline-none select-none cursor-not-allowed font-medium pointer-events-none"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Perbarui Kata Sandi */}
      <div className="flex flex-col gap-2">
        <label className="text-[15px] font-medium text-black">Perbarui Kata Sandi :</label>
        <div className="relative">
          <input
            type={showNewPassPassword ? "text" : "password"}
            value={newPassword}
            placeholder="Ketik kata sandi baru..."
            onChange={(e) => setNewPassword(e.target.value)}
            onFocus={() => setIsNewPasswordFocused(true)}
            onBlur={() => setIsNewPasswordFocused(false)}
            className="w-full bg-[#F0F0F0] text-black text-[15px] py-3.5 pl-4 pr-10 rounded-xl outline-none"
          />
          <button
            type="button"
            onClick={() => setShowNewPassPassword(!showNewPassPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-black cursor-pointer"
          >
            {showNewPassPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Kata Sandi Lama (Tampil jika input kata sandi baru diisi) */}
      <div className={`flex flex-col gap-1.5 transition-all duration-300 overflow-hidden ${showOldPassword ? 'max-h-[100px] opacity-100 mt-1' : 'max-h-0 opacity-0 m-0'}`}>
        <label className="text-[13px] font-medium text-black px-2">Kata Sandi Lama (Konfirmasi) :</label>
        <div className="relative w-[96%] ml-[2%]">
          <input
            type={showOldPassPassword ? "text" : "password"}
            value={oldPassword}
            placeholder="Masukkan kata sandi saat ini..."
            onChange={(e) => setOldPassword(e.target.value)}
            onFocus={() => setIsOldPasswordFocused(true)}
            onBlur={() => setIsOldPasswordFocused(false)}
            className="w-full bg-[#F0F0F0] text-black text-[15px] py-2.5 pl-4 pr-10 rounded-xl outline-none"
          />
          <button
            type="button"
            onClick={() => setShowOldPassPassword(!showOldPassPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-black cursor-pointer"
          >
            {showOldPassPassword ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
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
          onClick={() => setShowLogoutModal(true)}
          className="w-full bg-[#CC2929] text-white text-[15px] font-medium py-3.5 rounded-xl hover:bg-[#B32424] transition-colors shadow-sm cursor-pointer"
        >
          Keluar
        </button>
      </div>

      {/* Modal Konfirmasi Keluar */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4">
          <div className="bg-[#EDEDED] w-full max-w-[440px] rounded-[28px] p-7 relative shadow-2xl flex flex-col border border-gray-300">
            {/* Tombol Kembali (Panah Kiri) */}
            <button 
              type="button"
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-7 left-7 text-black hover:opacity-70 transition-opacity p-1 flex items-center justify-center cursor-pointer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>

            {/* Header: Judul */}
            <div className="text-center pt-0.5 mb-6">
              <h2 className="text-[22px] font-semibold text-black">Keluar Akun</h2>
            </div>

            {/* Konten */}
            <p className="text-[14px] text-black leading-relaxed mb-8 text-left">
              Yakin untuk keluar dari akun ini?
            </p>

            {/* Tombol Aksi: Batal & Keluar */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="bg-white hover:bg-gray-50 text-[#334155] border border-gray-300 px-7 py-2.5 rounded-xl text-[14px] font-medium transition-colors shadow-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="bg-[#CC2929] hover:bg-[#B32424] text-white px-7 py-2.5 rounded-xl text-[14px] font-medium transition-colors shadow-sm cursor-pointer"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

