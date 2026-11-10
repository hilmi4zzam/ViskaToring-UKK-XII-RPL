"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { getStoredUser, setStoredUser, clearStoredUser, fetchCurrentUser } from '@/supabase/auth';
import { Company, User } from '@/supabase/types';

export default function PengaturanPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
  const [showOldPassPassword, setShowOldPassPassword] = useState(false);
  const [showNewPassPassword, setShowNewPassPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  
  const [dudiQuery, setDudiQuery] = useState("");
  const [showDudiDropdown, setShowDudiDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load user dan companies
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push('/');
      return;
    }
    async function loadData() {
      // 1. Ambil fresh user beserta data perusahaan
      const freshUser = await fetchCurrentUser();
      setCurrentUser(freshUser || user);

      // 2. Ambil daftar perusahaan dari Supabase
      const { data: compList, error } = await supabase
        .from('companies')
        .select('*')
        .order('company_name', { ascending: true });

      if (error) {
        console.error('Error fetching companies:', error);
      } else if (compList) {
        setCompanies(compList);
        const compId = freshUser?.company_id || user?.company_id;
        if (compId) {
          const comp = compList.find((c) => c.id === compId);
          if (comp) {
            setSelectedCompany(comp);
            setDudiQuery(comp.company_name);
          }
        }
      }
    }

    loadData();
  }, [router]);

  const filteredDudi = companies.filter((d) => 
    d.company_name.toLowerCase().includes(dudiQuery.toLowerCase())
  );

  const handleSelectDudi = (comp: Company) => {
    setSelectedCompany(comp);
    setDudiQuery(comp.company_name);
    setShowDudiDropdown(false);
  };

  const handleUpdateData = async () => {
    if (!currentUser) return;
    setMessage(null);
    setLoading(true);

    try {
      const updatePayload: { company_id?: number; password?: string } = {};

      if (selectedCompany) {
        updatePayload.company_id = selectedCompany.id;
      }

      if (newPassword.trim()) {
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

        updatePayload.password = newPassword.trim();
      }

      if (Object.keys(updatePayload).length === 0) {
        setMessage({ text: 'Pilih DUDI atau isi kata sandi baru terlebih dahulu.', type: 'error' });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('user_accounts')
        .update(updatePayload)
        .eq('id', currentUser.id);

      if (error) {
        console.error('Update error:', error);
        setMessage({ text: 'Gagal memperbarui data: ' + error.message, type: 'error' });
      } else {
        setMessage({ text: 'Data berhasil diperbarui!', type: 'success' });
        setNewPassword('');
        setOldPassword('');
        if (selectedCompany) {
          setStoredUser({
            ...currentUser,
            company_id: selectedCompany.id,
            companies: selectedCompany,
          });
        }
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
      
      {/* Pesan Notifikasi */}
      {message && (
        <div className={`p-4 rounded-xl text-[14px] font-medium text-center ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
          {message.text}
        </div>
      )}

      {/* Nama Akun */}
      <div className="flex flex-col gap-2">
        <label className="text-[15px] font-medium text-black">Nama Akun :</label>
        <div className="relative">
          <input 
            type="text" 
            value={currentUser?.username || "Memuat akun..."} 
            readOnly 
            className="w-full bg-[#F0F0F0] text-gray-700 text-[15px] py-3.5 pl-4 pr-10 rounded-xl outline-none select-none cursor-not-allowed font-medium"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
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

      {/* Magang di dudi */}
      <div className="flex flex-col gap-2 mt-1">
        <label className="text-[15px] font-medium text-black">Magang di DUDI :</label>
        <div className="relative">
          <input 
            type="text" 
            value={dudiQuery}
            placeholder="Cari nama DUDI / perusahaan..."
            onChange={(e) => {
              setDudiQuery(e.target.value);
              setSelectedCompany(null);
              setShowDudiDropdown(true);
            }}
            onFocus={() => setShowDudiDropdown(true)}
            className="w-full bg-[#F0F0F0] text-black text-[15px] py-3.5 px-4 rounded-xl outline-none"
          />
        </div>
        
        {/* Suggestion dropdown area */}
        {showDudiDropdown && (
          <div className="w-[96%] ml-[2%] mt-1 flex flex-col relative max-h-[140px] z-20">
            <div className="w-full h-full flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar-dudi pb-2 bg-white p-2 rounded-xl border border-gray-200 shadow-md">
              {filteredDudi.length > 0 ? (
                filteredDudi.map((comp) => (
                  <div 
                    key={comp.id}
                    onClick={() => handleSelectDudi(comp)}
                    className={`py-2.5 px-4 rounded-lg text-[13px] w-full cursor-pointer shrink-0 border-r-[3px] transition-colors ${
                      selectedCompany?.id === comp.id
                        ? 'bg-[#000066]/10 text-[#000066] font-semibold border-[#000066]'
                        : 'bg-[#F0F0F0] text-gray-700 hover:bg-gray-200 border-transparent'
                    }`}
                  >
                    {comp.company_name}
                  </div>
                ))
              ) : (
                <div className="bg-[#F0F0F0] py-2.5 px-4 rounded-lg text-[13px] text-gray-500 w-full text-center">
                  Tidak ada DUDI yang cocok
                </div>
              )}
            </div>
          </div>
        )}
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
      
      <style jsx>{`
        .custom-scrollbar-dudi::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar-dudi::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-dudi::-webkit-scrollbar-thumb {
          background: #000066;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
