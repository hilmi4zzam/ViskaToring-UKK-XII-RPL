"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { getStoredUser, setStoredUser, isFirstLogin } from '@/supabase/auth';
import { Company, User } from '@/supabase/types';

export default function KonfigurasiPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      router.push('/');
      return;
    }

    setCurrentUser(user);

    async function loadCompanies() {
      setFetchingCompanies(true);
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('company_name', { ascending: true });

        if (error) {
          console.error('Error fetching companies:', error);
          setErrorMsg('Gagal memuat daftar DUDI dari Supabase: ' + error.message);
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
      } catch (err: unknown) {
        console.error('Failed to load companies:', err);
      } finally {
        setFetchingCompanies(false);
      }
    }

    void loadCompanies();
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

    // Validasi 1: Perusahaan DUDI wajib dipilih
    if (!selectedCompany) {
      setErrorMsg('Silakan pilih tempat magang (DUDI) terlebih dahulu.');
      return;
    }

    // Validasi 2: Password baru wajib diisi untuk onboarding/keamanan
    if (!password.trim()) {
      setErrorMsg('Kata sandi baru wajib diisi demi keamanan akun Anda.');
      return;
    }

    if (password.trim().length < 6) {
      setErrorMsg('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (confirmPassword && password.trim() !== confirmPassword.trim()) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      // Siapkan payload update: set company, password baru, dan first_login = false
      const updatePayload: {
        company_id: number;
        company?: string;
        password: string;
        first_login: boolean;
      } = {
        company_id: selectedCompany.id,
        company: selectedCompany.company_name,
        password: password.trim(),
        first_login: false,
      };

      // Coba update dengan company_id & company
      let { error: updateError } = await supabase
        .from('user_accounts')
        .update(updatePayload)
        .eq('id', currentUser.id);

      // Jika kolom 'company' (teks) tidak ada di tabel, coba fallback hanya dengan company_id
      if (updateError && updateError.message.includes('company')) {
        const fallbackPayload = {
          company_id: selectedCompany.id,
          password: password.trim(),
          first_login: false,
        };
        const retry = await supabase
          .from('user_accounts')
          .update(fallbackPayload)
          .eq('id', currentUser.id);
        updateError = retry.error;
      }

      if (updateError) {
        console.error('Update user error:', updateError);
        setErrorMsg('Gagal menyimpan konfigurasi akun: ' + updateError.message);
        setLoading(false);
        return;
      }

      // Verifikasi pembaharuan data dari Supabase
      const { data: savedUser, error: verifyError } = await supabase
        .from('user_accounts')
        .select('id, username, company_id, role, first_login')
        .eq('id', currentUser.id)
        .single();

      if (verifyError || !savedUser) {
        console.error('Verify user update error:', verifyError);
        setErrorMsg('Data tersimpan tetapi gagal diverifikasi dari Supabase. Silakan muat ulang halaman.');
        setLoading(false);
        return;
      }

      // Perbarui session user di localStorage dengan first_login = false
      const updatedUserSession: User = {
        ...currentUser,
        id: savedUser.id,
        username: savedUser.username,
        company_id: savedUser.company_id,
        role: savedUser.role || currentUser.role || 'siswa',
        first_login: false,
        companies: selectedCompany,
      };

      setStoredUser(updatedUserSession);

      // Redirect otomatis ke Dashboard utama
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data ke Supabase';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:justify-center items-center relative py-12 md:py-0">
      
      {/* Back Button */}
      <div className="absolute top-8 left-8 md:top-12 md:left-12">
        <Link href="/" className="text-black hover:text-gray-600 transition-colors" title="Kembali ke halaman login">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </Link>
      </div>

      <div className="w-full max-w-[440px] px-6">
        
        {/* Header Logo */}
        <div className="flex justify-center items-center gap-3 mb-6">
          <Image src="/smk.svg" alt="SMK Logo" width={36} height={36} className="w-[36px] h-auto" />
          <h2 className="text-[28px] font-semibold text-black">ViskaToring</h2>
        </div>

        {/* Informasi Onboarding */}
        <div className="bg-[#000066]/5 border border-[#000066]/15 rounded-xl p-4 mb-6">
          <h3 className="text-[15px] font-semibold text-[#000066] mb-1">
            Konfigurasi Akun Awal
          </h3>
          <p className="text-[12px] text-gray-600 leading-relaxed">
            Demi keamanan, silakan pilih tempat penugasan DUDI Anda dan buat kata sandi baru untuk menggantikan kata sandi default.
          </p>
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

          {/* Tempat Magang di DUDI */}
          <div className="mb-5 relative">
            <label className="block text-[14px] font-medium text-black mb-1.5">
              Pilih Tempat Magang (DUDI) <span className="text-red-500">*</span> :
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={dudiQuery}
                placeholder={fetchingCompanies ? "Memuat data DUDI dari database..." : "Cari nama perusahaan / DUDI..."}
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

          {/* Buat Kata Sandi Baru */}
          <div className="mb-5">
            <label className="block text-[14px] font-medium text-black mb-1.5">
              Buat Kata Sandi Baru <span className="text-red-500">*</span> :
            </label>
            <div className="relative flex items-center">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter..."
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
          </div>

          {/* Konfirmasi Kata Sandi Baru */}
          <div className="mb-6">
            <label className="block text-[14px] font-medium text-black mb-1.5">
              Konfirmasi Kata Sandi Baru :
            </label>
            <input 
              type={showPassword ? "text" : "password"} 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru..."
              className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 text-[14px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all"
            />
          </div>
          
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3 mb-5">
              {errorMsg}
            </div>
          )}

          <hr className="border-gray-300 mb-6" />

          {/* Button Simpan & Masuk ke Dashboard */}
          <button 
            type="button"
            onClick={handleMasuk}
            disabled={loading}
            className="w-full bg-[#000066] text-white rounded-xl py-3.5 text-[16px] font-medium hover:bg-[#000044] disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan & Menyiapkan Akun...</span>
              </>
            ) : (
              'Simpan & Lanjut ke Dashboard'
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
