"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { getStoredUser, setStoredUser } from '@/supabase/auth';
import { Company, User } from '@/supabase/types';

export default function KonfigurasiPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [dudiQuery, setDudiQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingCompanies, setFetchingCompanies] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Cek user login dan ambil daftar companies dari Supabase
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }
    async function loadCompanies() {
      setCurrentUser(user);
      setFetchingCompanies(true);
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('company_name', { ascending: true });

        if (error) {
          console.error('Error fetching companies:', error);
        } else if (data) {
          setCompanies(data);
          // Jika user sudah memiliki company_id sebelumnya
          if (user?.company_id) {
            const existing = data.find((c) => c.id === user.company_id);
            if (existing) {
              setSelectedCompany(existing);
              setDudiQuery(existing.company_name);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load companies:', err);
      } finally {
        setFetchingCompanies(false);
      }
    }

    loadCompanies();
  }, [router]);

  // Filter list perusahaan berdasarkan input pencarian
  const filteredDudi = companies.filter((c) =>
    c.company_name.toLowerCase().includes(dudiQuery.toLowerCase())
  );

  const handleSelectDudi = (company: Company) => {
    setSelectedCompany(company);
    setDudiQuery(company.company_name);
    setShowDropdown(false);
  };

  const handleMasuk = async () => {
    if (!currentUser) return;
    setErrorMsg('');

    if (!selectedCompany) {
      setErrorMsg('Silakan pilih tempat magang (DUDI) terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const updatePayload: { company_id: number; password?: string } = {
        company_id: selectedCompany.id,
      };

      if (password.trim()) {
        updatePayload.password = password.trim();
      }

      const { error } = await supabase
        .from('user_accounts')
        .update(updatePayload)
        .eq('id', currentUser.id);

      if (error) {
        console.error('Update user error:', error);
        setErrorMsg('Gagal menyimpan konfigurasi akun: ' + error.message);
        setLoading(false);
        return;
      }

      const { data: savedUser, error: verifyError } = await supabase
        .from('user_accounts')
        .select('id, username, company_id')
        .eq('id', currentUser.id)
        .single();

      if (verifyError || !savedUser) {
        console.error('Verify user update error:', verifyError);
        setErrorMsg('Data tersimpan tetapi gagal diverifikasi dari Supabase. Silakan muat ulang halaman.');
        setLoading(false);
        return;
      }

      // Perbarui session user di localStorage
      setStoredUser({
        ...currentUser,
        id: savedUser.id,
        username: savedUser.username,
        company_id: savedUser.company_id,
        companies: selectedCompany,
      });

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan saat menyimpan data ke Supabase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:justify-center items-center relative py-12 md:py-0">
      
      {/* Back Button */}
      <div className="absolute top-8 left-8 md:top-12 md:left-12">
        <Link href="/login" className="text-black hover:text-gray-600 transition-colors">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </Link>
      </div>

      <div className="w-full max-w-[420px] px-6">
        
        {/* Header Logo */}
        <div className="flex justify-center items-center gap-3 mb-10">
          <Image src="/smk.svg" alt="SMK Logo" width={36} height={36} className="w-[36px] h-auto" />
          <h2 className="text-[28px] font-semibold text-black">ViskaToring</h2>
        </div>

        {/* Form Fields */}
        <div className="w-full">
          
          {/* Nama Akun (Disabled / Read-only dari Supabase User) */}
          <div className="mb-6">
            <label className="block text-[15px] font-medium text-black mb-2">Nama Akun :</label>
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

          {/* Perbarui Kata Sandi */}
          <div className="mb-6">
            <label className="block text-[15px] font-medium text-black mb-2">Perbarui Kata Sandi (Opsional) :</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi baru jika ingin mengubah..."
              className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 text-[14px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all"
            />
            {/* Info Text */}
            <div className="flex items-start gap-[6px] mt-2">
              <svg className="text-gray-500 mt-[2px] flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <p className="text-[11px] text-gray-500 leading-snug">
                Perbarui kata sandi kamu untuk keamanan yang lebih terjaga
              </p>
            </div>
          </div>

          {/* Magang di DUDI */}
          <div className="mb-8 relative">
            <label className="block text-[15px] font-medium text-black mb-2">Magang di DUDI :</label>
            <div className="relative">
              <input 
                type="text" 
                value={dudiQuery}
                placeholder={fetchingCompanies ? "Memuat data DUDI dari database..." : "Ketik nama perusahaan / DUDI..."}
                onChange={(e) => {
                  setDudiQuery(e.target.value);
                  setSelectedCompany(null);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 text-[14px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all relative z-10"
              />
              
              {/* Dropdown Suggestions */}
              {showDropdown && dudiQuery && (
                <div className="absolute top-full left-0 w-full mt-2 z-20 shadow-lg">
                  <div className="flex flex-col gap-[6px] max-h-[160px] overflow-y-auto pr-2 bg-white rounded-xl p-2 border border-gray-200 custom-scrollbar">
                    {filteredDudi.length > 0 ? (
                      filteredDudi.map((comp) => (
                        <div 
                          key={comp.id}
                          onClick={() => handleSelectDudi(comp)}
                          className={`w-full rounded-lg px-4 py-[10px] text-[13px] cursor-pointer transition-colors border-r-4 ${
                            selectedCompany?.id === comp.id 
                              ? 'bg-[#000066]/10 text-[#000066] font-semibold border-[#000066]' 
                              : 'bg-[#EDEDED] text-gray-700 hover:bg-[#e4e4e4] border-transparent'
                          }`}
                        >
                          {comp.company_name}
                        </div>
                      ))
                    ) : (
                      <div className="w-full bg-[#EDEDED] rounded-lg px-4 py-[10px] text-[13px] text-gray-500 text-center">
                        {fetchingCompanies ? 'Memuat DUDI...' : 'Tidak ada DUDI yang cocok di database'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}

          <hr className="border-gray-300 mb-6" />

          {/* Button Masuk */}
          <button 
            type="button"
            onClick={handleMasuk}
            disabled={loading}
            className="w-full bg-[#000066] text-white rounded-xl py-3 text-[16px] font-medium hover:bg-[#000044] disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              'Masuk'
            )}
          </button>
        </div>
      </div>

      {/* Global CSS for Custom Scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #000066;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
