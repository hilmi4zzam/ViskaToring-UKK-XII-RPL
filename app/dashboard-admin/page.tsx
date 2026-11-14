"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/supabase/client';
import { UserRole } from '@/supabase/types';

interface PendingUserAccount {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  status: string;
  created_at?: string;
}

interface PendingDudiChange {
  id: string;
  username: string;
  company_id: number | null;
  pending_company_id: number | null;
  dudiLama: string;
  dudiBaru: string;
}

export default function DashboardAdminPage() {
  const [totalSiswa, setTotalSiswa] = useState<number>(0);
  const [totalGuru, setTotalGuru] = useState<number>(0);
  const [pendingUsers, setPendingUsers] = useState<PendingUserAccount[]>([]);
  const [pendingDudiList, setPendingDudiList] = useState<PendingDudiChange[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for New Account Approval / Rejection
  const [modalType, setModalType] = useState<'approve_user' | 'reject_user' | 'approve_dudi' | 'reject_dudi' | null>(null);
  const [selectedUser, setSelectedUser] = useState<PendingUserAccount | null>(null);
  const [selectedDudi, setSelectedDudi] = useState<PendingDudiChange | null>(null);
  const [selectedRole, setSelectedRole] = useState<'siswa' | 'guru'>('siswa');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // 1. Total Siswa (status: approved)
      const { count: sCount } = await supabase
        .from('user_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'siswa')
        .eq('status', 'approved');

      setTotalSiswa(sCount || 0);

      // 2. Total Guru (status: approved)
      const { count: gCount } = await supabase
        .from('user_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'guru')
        .eq('status', 'approved');

      setTotalGuru(gCount || 0);

      // 3. Persetujuan Anggota Baru (status: pending)
      const { data: pUsers, error: pErr } = await supabase
        .from('user_accounts')
        .select('id, username, password, role, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pErr) {
        console.error('Error fetching pending users:', pErr);
      } else {
        setPendingUsers((pUsers || []) as PendingUserAccount[]);
      }

      // 4. Daftar Perusahaan untuk mapping nama DUDI lama & baru
      const { data: compList } = await supabase
        .from('companies')
        .select('id, company_name');

      const compMap = new Map<number, string>();
      (compList || []).forEach((c) => {
        compMap.set(c.id, c.company_name);
      });

      // 5. Persetujuan Perubahan DUDI (pending_company_status: pending)
      const { data: pDudi, error: dErr } = await supabase
        .from('user_accounts')
        .select('id, username, company_id, pending_company_id, pending_company_status')
        .eq('pending_company_status', 'pending');

      if (dErr) {
        console.error('Error fetching pending dudi:', dErr);
      } else {
        const mappedDudi: PendingDudiChange[] = (pDudi || []).map((item) => ({
          id: item.id,
          username: item.username,
          company_id: item.company_id,
          pending_company_id: item.pending_company_id,
          dudiLama: (item.company_id ? compMap.get(item.company_id) : null) || '-',
          dudiBaru: (item.pending_company_id ? compMap.get(item.pending_company_id) : null) || '-',
        }));
        setPendingDudiList(mappedDudi);
      }
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadData();
    };
    void init();
  }, [loadData]);

  // Handler Buka Modal
  const handleOpenApproveUser = (user: PendingUserAccount) => {
    setSelectedUser(user);
    setSelectedRole(user.role === 'guru' ? 'guru' : 'siswa');
    setModalType('approve_user');
  };

  const handleOpenRejectUser = (user: PendingUserAccount) => {
    setSelectedUser(user);
    setModalType('reject_user');
  };

  const handleOpenApproveDudi = (item: PendingDudiChange) => {
    setSelectedDudi(item);
    setModalType('approve_dudi');
  };

  const handleOpenRejectDudi = (item: PendingDudiChange) => {
    setSelectedDudi(item);
    setModalType('reject_dudi');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedUser(null);
    setSelectedDudi(null);
  };

  // Konfirmasi Terima Akun Baru
  const handleConfirmApproveUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('user_accounts')
        .update({
          status: 'approved',
          role: selectedRole,
          first_login: true,
        })
        .eq('id', selectedUser.id);

      if (error) {
        console.error('Failed to approve user:', error);
        alert('Gagal menyetujui akun: ' + error.message);
      } else {
        handleCloseModal();
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Konfirmasi Tolak Akun Baru
  const handleConfirmRejectUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('user_accounts')
        .update({
          status: 'rejected',
        })
        .eq('id', selectedUser.id);

      if (error) {
        console.error('Failed to reject user:', error);
        alert('Gagal menolak akun: ' + error.message);
      } else {
        handleCloseModal();
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Konfirmasi Terima Perubahan DUDI
  const handleConfirmApproveDudi = async () => {
    if (!selectedDudi) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('user_accounts')
        .update({
          company_id: selectedDudi.pending_company_id,
          pending_company_id: null,
          pending_company_status: null,
        })
        .eq('id', selectedDudi.id);

      if (error) {
        console.error('Failed to approve dudi change:', error);
        alert('Gagal menyetujui perubahan DUDI: ' + error.message);
      } else {
        handleCloseModal();
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Konfirmasi Tolak Perubahan DUDI
  const handleConfirmRejectDudi = async () => {
    if (!selectedDudi) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('user_accounts')
        .update({
          pending_company_status: 'rejected',
        })
        .eq('id', selectedDudi.id);

      if (error) {
        console.error('Failed to reject dudi change:', error);
        alert('Gagal menolak perubahan DUDI: ' + error.message);
      } else {
        handleCloseModal();
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* 2 Top Statistics Cards */}
      <div className="flex items-center gap-7 mb-8">
        {/* Card Total Siswa */}
        <div className="bg-white border border-gray-400 rounded-[22px] py-6 flex-1 flex flex-col items-center justify-center shadow-xs">
          <span className="text-[52px] font-bold text-black leading-none mb-1.5">
            {loading ? '...' : totalSiswa}
          </span>
          <span className="text-[15px] font-normal text-black">Total Siswa</span>
        </div>

        {/* Card Total Guru */}
        <div className="bg-white border border-gray-400 rounded-[22px] py-6 flex-1 flex flex-col items-center justify-center shadow-xs">
          <span className="text-[52px] font-bold text-black leading-none mb-1.5">
            {loading ? '...' : totalGuru}
          </span>
          <span className="text-[15px] font-normal text-black">Total Guru</span>
        </div>
      </div>

      {/* Section 1: Persetujuan Anggota Baru */}
      <div className="mb-2">
        <h3 className="text-[16px] font-medium text-black mb-3">Persetujuan Anggota Baru :</h3>
        <div className="w-full bg-white border border-gray-400 rounded-[22px] overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#EDEDED] border-b border-gray-300">
                <th className="w-[40%] text-center font-normal text-[15px] text-black py-3.5 px-4">
                  Nama Pendaftar
                </th>
                <th className="w-[35%] text-center font-normal text-[15px] text-black py-3.5 px-4">
                  Kata Sandi
                </th>
                <th className="w-[25%] text-center font-normal text-[15px] text-black py-3.5 px-4">
                  Persetujuan
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-14 text-center text-gray-500 text-[14px]">
                    Memuat data...
                  </td>
                </tr>
              ) : pendingUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-14 text-center text-black text-[14px] font-normal">
                    Tidak ada akun baru yang diajukan
                  </td>
                </tr>
              ) : (
                pendingUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-4 text-center text-[15px] text-black font-normal">
                      {u.username}
                    </td>
                    <td className="py-4 px-4 text-center text-[15px] text-black font-normal">
                      {u.password || '-'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {/* Tombol Terima (Check) */}
                        <button
                          type="button"
                          onClick={() => handleOpenApproveUser(u)}
                          title="Terima Pengajuan"
                          className="w-7 h-7 rounded-full bg-black hover:bg-gray-800 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-xs cursor-pointer"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </button>
                        {/* Tombol Tolak (Cross) */}
                        <button
                          type="button"
                          onClick={() => handleOpenRejectUser(u)}
                          title="Tolak Pengajuan"
                          className="w-7 h-7 rounded-full bg-black hover:bg-gray-800 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-xs cursor-pointer"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Horizontal Divider */}
      <hr className="border-t border-gray-300 my-8 w-full" />

      {/* Section 2: Persetujuan perubahan DUDI */}
      <div className="mb-6">
        <h3 className="text-[16px] font-medium text-black mb-3">Persetujuan perubahan DUDI :</h3>
        <div className="w-full bg-white border border-gray-400 rounded-[22px] overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#EDEDED] border-b border-gray-300">
                <th className="w-[30%] text-center font-normal text-[15px] text-black py-3.5 px-4">
                  Nama Pendaftar
                </th>
                <th className="w-[25%] text-center font-normal text-[15px] text-black py-3.5 px-4">
                  Dudi Lama
                </th>
                <th className="w-[25%] text-center font-normal text-[15px] text-black py-3.5 px-4">
                  Dudi Baru
                </th>
                <th className="w-[20%] text-center font-normal text-[15px] text-black py-3.5 px-4">
                  Persetujuan
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-14 text-center text-gray-500 text-[14px]">
                    Memuat data...
                  </td>
                </tr>
              ) : pendingDudiList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-14 text-center text-black text-[14px] font-normal">
                    Tidak ada perubahan dudi yang diajukan
                  </td>
                </tr>
              ) : (
                pendingDudiList.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-4 text-center text-[15px] text-black font-normal truncate max-w-[150px]">
                      {item.username}
                    </td>
                    <td className="py-4 px-4 text-center text-[15px] text-black font-normal truncate max-w-[150px]">
                      {item.dudiLama}
                    </td>
                    <td className="py-4 px-4 text-center text-[15px] text-black font-normal truncate max-w-[150px]">
                      {item.dudiBaru}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {/* Tombol Terima (Check) */}
                        <button
                          type="button"
                          onClick={() => handleOpenApproveDudi(item)}
                          title="Terima Perubahan DUDI"
                          className="w-7 h-7 rounded-full bg-black hover:bg-gray-800 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-xs cursor-pointer"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </button>
                        {/* Tombol Tolak (Cross) */}
                        <button
                          type="button"
                          onClick={() => handleOpenRejectDudi(item)}
                          title="Tolak Perubahan DUDI"
                          className="w-7 h-7 rounded-full bg-black hover:bg-gray-800 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-xs cursor-pointer"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* POP UP MODAL SECTION                                     */}
      {/* ======================================================== */}

      {/* 1. Modal Terima Pengajuan Akun Baru */}
      {modalType === 'approve_user' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4">
          <div className="bg-[#EDEDED] w-full max-w-[460px] rounded-[28px] p-7 relative shadow-2xl flex flex-col border border-gray-300">
            {/* Tombol Kembali (Panah Kiri) */}
            <button 
              type="button"
              onClick={handleCloseModal}
              className="absolute top-7 left-7 text-black hover:opacity-70 transition-opacity p-1 flex items-center justify-center cursor-pointer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>

            {/* Header: Judul */}
            <div className="text-center pt-0.5 mb-6">
              <h2 className="text-[22px] font-semibold text-black">Terima Pengajuan</h2>
            </div>

            {/* Konten */}
            <p className="text-[14px] text-black leading-relaxed mb-6">
              Terima pengajuan akun <strong>{selectedUser.username}</strong> dengan kata sandi <strong>{selectedUser.password || '-'}</strong>.
            </p>

            {/* Pilihan Peran */}
            <div className="mb-8">
              <p className="text-[14px] font-medium text-black">
                Tentukan Peran {selectedUser.username} :
              </p>
              <p className="text-[11px] text-gray-500 mb-3 flex items-center gap-1">
                <span>ⓘ</span> Peran hanya dapat dipilih satu opsi
              </p>
              <div className="flex flex-col gap-2.5">
                <label 
                  className="flex items-center gap-3 cursor-pointer select-none text-[14px] text-black"
                  onClick={() => setSelectedRole('siswa')}
                >
                  <div className="w-5 h-5 rounded-[4px] border-2 border-[#000066] flex items-center justify-center bg-white shrink-0">
                    {selectedRole === 'siswa' && <div className="w-2.5 h-2.5 bg-[#000066] rounded-[2px]" />}
                  </div>
                  <span>Siswa</span>
                </label>
                <label 
                  className="flex items-center gap-3 cursor-pointer select-none text-[14px] text-black"
                  onClick={() => setSelectedRole('guru')}
                >
                  <div className="w-5 h-5 rounded-[4px] border-2 border-[#000066] flex items-center justify-center bg-white shrink-0">
                    {selectedRole === 'guru' && <div className="w-2.5 h-2.5 bg-[#000066] rounded-[2px]" />}
                  </div>
                  <span>Guru Pembimbing</span>
                </label>
              </div>
            </div>

            {/* Tombol Terima */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleConfirmApproveUser}
                disabled={actionLoading}
                className="bg-[#000066] text-white px-8 py-2.5 rounded-xl text-[14px] font-medium hover:bg-[#000044] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Memproses...' : 'Terima'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Tolak Pengajuan Akun Baru */}
      {modalType === 'reject_user' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4">
          <div className="bg-[#EDEDED] w-full max-w-[460px] rounded-[28px] p-7 relative shadow-2xl flex flex-col border border-gray-300">
            {/* Tombol Kembali (Panah Kiri) */}
            <button 
              type="button"
              onClick={handleCloseModal}
              className="absolute top-7 left-7 text-black hover:opacity-70 transition-opacity p-1 flex items-center justify-center cursor-pointer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>

            {/* Header: Judul */}
            <div className="text-center pt-0.5 mb-6">
              <h2 className="text-[22px] font-semibold text-black">Tolak Pengajuan</h2>
            </div>

            {/* Konten */}
            <p className="text-[14px] text-black leading-relaxed mb-8">
              Tolak pengajuan akun <strong>{selectedUser.username}</strong> dengan kata sandi <strong>{selectedUser.password || '-'}</strong>.
            </p>

            {/* Tombol Tolak */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleConfirmRejectUser}
                disabled={actionLoading}
                className="bg-[#CC2929] text-white px-8 py-2.5 rounded-xl text-[14px] font-medium hover:bg-[#B32424] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Memproses...' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Terima Perubahan DUDI */}
      {modalType === 'approve_dudi' && selectedDudi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4">
          <div className="bg-[#EDEDED] w-full max-w-[460px] rounded-[28px] p-7 relative shadow-2xl flex flex-col border border-gray-300">
            {/* Tombol Kembali (Panah Kiri) */}
            <button 
              type="button"
              onClick={handleCloseModal}
              className="absolute top-7 left-7 text-black hover:opacity-70 transition-opacity p-1 flex items-center justify-center cursor-pointer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>

            {/* Header: Judul */}
            <div className="text-center pt-0.5 mb-6">
              <h2 className="text-[22px] font-semibold text-black">Terima Pengajuan</h2>
            </div>

            {/* Konten */}
            <p className="text-[14px] text-black leading-relaxed mb-8">
              Terima pengajuan perubahan DUDI akun <strong>{selectedDudi.username}</strong> dari <strong>{selectedDudi.dudiLama}</strong> ke <strong>{selectedDudi.dudiBaru}</strong>.
            </p>

            {/* Tombol Terima */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleConfirmApproveDudi}
                disabled={actionLoading}
                className="bg-[#000066] text-white px-8 py-2.5 rounded-xl text-[14px] font-medium hover:bg-[#000044] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Memproses...' : 'Terima'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Tolak Perubahan DUDI */}
      {modalType === 'reject_dudi' && selectedDudi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4">
          <div className="bg-[#EDEDED] w-full max-w-[460px] rounded-[28px] p-7 relative shadow-2xl flex flex-col border border-gray-300">
            {/* Tombol Kembali (Panah Kiri) */}
            <button 
              type="button"
              onClick={handleCloseModal}
              className="absolute top-7 left-7 text-black hover:opacity-70 transition-opacity p-1 flex items-center justify-center cursor-pointer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>

            {/* Header: Judul */}
            <div className="text-center pt-0.5 mb-6">
              <h2 className="text-[22px] font-semibold text-black">Tolak Pengajuan</h2>
            </div>

            {/* Konten */}
            <p className="text-[14px] text-black leading-relaxed mb-8">
              Tolak pengajuan perubahan DUDI akun <strong>{selectedDudi.username}</strong> dari <strong>{selectedDudi.dudiLama}</strong> ke <strong>{selectedDudi.dudiBaru}</strong>.
            </p>

            {/* Tombol Tolak */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleConfirmRejectDudi}
                disabled={actionLoading}
                className="bg-[#CC2929] text-white px-8 py-2.5 rounded-xl text-[14px] font-medium hover:bg-[#B32424] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Memproses...' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
