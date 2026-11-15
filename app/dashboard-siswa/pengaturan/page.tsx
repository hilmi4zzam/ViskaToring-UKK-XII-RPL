"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { getStoredUser, setStoredUser, clearStoredUser, fetchCurrentUser } from '@/supabase/auth';
import { Company, User, UserAccountStatus } from '@/supabase/types';

export default function PengaturanPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [pendingCompany, setPendingCompany] = useState<Company | null>(null);
  const [pendingStatus, setPendingStatus] = useState<UserAccountStatus | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
  const [showOldPassPassword, setShowOldPassPassword] = useState(false);
  const [showNewPassPassword, setShowNewPassPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  
  const [dudiQuery, setDudiQuery] = useState("");
  const [showDudiDropdown, setShowDudiDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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
      const u = freshUser || user;
      if (!u) return;
      setCurrentUser(u);
      setPendingStatus(u.pending_company_status ?? null);

      // 2. Ambil daftar perusahaan dari Supabase
      const { data: compList, error } = await supabase
        .from('companies')
        .select('*')
        .order('company_name', { ascending: true });

      if (error) {
        console.error('Error fetching companies:', error);
      } else if (compList) {
        setCompanies(compList);
        const compId = u?.company_id;
        if (compId) {
          const comp = compList.find((c) => c.id === compId);
          if (comp) {
            setSelectedCompany(comp);
            setDudiQuery(comp.company_name);
          }
        }
        if (u?.pending_company_id) {
          const pComp = compList.find((c) => c.id === u.pending_company_id);
          if (pComp) {
            setPendingCompany(pComp);
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

  const handleDismissRejected = async () => {
    if (!currentUser) return;
    try {
      await supabase
        .from('user_accounts')
        .update({ pending_company_status: null, pending_company_id: null })
        .eq('id', currentUser.id);

      setPendingCompany(null);
      setPendingStatus(null);
      setStoredUser({
        ...currentUser,
        pending_company_id: null,
        pending_company_status: null,
      });
    } catch (err) {
      console.error('Failed to dismiss rejected status:', err);
    }
  };

  const handleUpdateData = async () => {
    if (!currentUser) return;
    setMessage(null);
    setLoading(true);

    try {
      const isDudiChanged = selectedCompany && selectedCompany.id !== currentUser.company_id;
      const isPasswordChanged = newPassword.trim().length > 0;

      if (!isDudiChanged && !isPasswordChanged) {
        setMessage({ text: 'Pilih DUDI baru atau isi kata sandi baru terlebih dahulu.', type: 'error' });
        setLoading(false);
        return;
      }

      const updatePayload: Record<string, unknown> = {};

      if (isPasswordChanged) {
        if (!oldPassword) {
          setMessage({ text: 'Masukkan kata sandi lama untuk konfirmasi perubahan sandi.', type: 'error' });
          setLoading(false);
          return;
        }

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

      // Jika memilih DUDI baru (berbeda dari DUDI aktif saat ini), masukkan ke pending approval
      if (isDudiChanged) {
        updatePayload.pending_company_id = selectedCompany.id;
        updatePayload.pending_company_status = 'pending';
      }

      const { error } = await supabase
        .from('user_accounts')
        .update(updatePayload)
        .eq('id', currentUser.id);

      if (error) {
        console.error('Update error:', error);
        setMessage({ text: 'Gagal mengajukan pembaruan data: ' + error.message, type: 'error' });
      } else {
        setNewPassword('');
        setOldPassword('');

        if (isDudiChanged && isPasswordChanged) {
          setMessage({ text: 'Kata sandi berhasil diperbarui dan pengajuan DUDI telah dikirim ke Admin.', type: 'success' });
          setPendingCompany(selectedCompany);
          setPendingStatus('pending');
        } else if (isDudiChanged) {
          setMessage({ text: 'Pengajuan perubahan DUDI berhasil dikirim ke Admin untuk ditinjau.', type: 'success' });
          setPendingCompany(selectedCompany);
          setPendingStatus('pending');
        } else {
          setMessage({ text: 'Kata sandi berhasil diperbarui!', type: 'success' });
        }

        const fresh = await fetchCurrentUser();
        if (fresh) {
          setCurrentUser(fresh);
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

      {/* Notifikasi Status Pengajuan Ditolak */}
      {pendingStatus === 'rejected' && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-[14px] flex items-start justify-between gap-3 shadow-xs">
          <div>
            <p className="font-semibold text-red-800 flex items-center gap-1.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              Pengajuan DUDI Ditolak
            </p>
            <p className="text-[13px] text-red-600 mt-1">
              Pengajuan perubahan DUDI Anda sebelumnya tidak disetujui oleh Admin. Anda dapat memilih kembali DUDI yang baru di bawah.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismissRejected}
            className="text-[12px] bg-red-100 hover:bg-red-200 text-red-800 font-medium px-3 py-1.5 rounded-lg shrink-0 transition-colors cursor-pointer"
          >
            Mengerti
          </button>
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

        {/* Banner Info Menunggu Persetujuan */}
        {pendingStatus === 'pending' && (
          <div className="bg-[#000066]/10 border border-[#000066]/20 p-3.5 rounded-xl text-[13px] text-black shadow-xs">
            <div className="flex items-center gap-1.5 font-semibold text-[#000066]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Menunggu Persetujuan Admin</span>
            </div>
            <p className="text-gray-700 mt-1">
              Pengajuan pindah ke <strong>{pendingCompany?.company_name || 'DUDI Baru'}</strong> sedang ditinjau Admin. DUDI aktif Anda saat ini tetap <strong>{currentUser?.companies?.company_name || '-'}</strong>.
            </p>
          </div>
        )}

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
            <p className="text-[14px] text-black leading-relaxed mb-8 text-center sm:text-left">
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
