"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/supabase/client';
import { Company, UserRole } from '@/supabase/types';
import { hashPassword } from '@/supabase/auth';

interface MemberItem {
  id: string;
  username: string;
  role: UserRole;
  company_id: number | null;
  status: string;
  created_at?: string;
  companies?: Company | null;
}

export default function KelolaAnggotaPage() {
  const currentYear = new Date().getFullYear(); // e.g. 2026

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalSiswa, setTotalSiswa] = useState<number>(0);
  const [totalGuru, setTotalGuru] = useState<number>(0);
  const [totalDudi, setTotalDudi] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Filter Dropdown: 'Semua' | 'Siswa' | 'Guru' | 'Dudi'
  const [filterRole, setFilterRole] = useState<'Semua' | 'Siswa' | 'Guru' | 'Dudi'>('Semua');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Modal States
  const [modalType, setModalType] = useState<'delete_single' | 'delete_all' | 'edit_member' | 'add_member' | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Member Form States
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<'siswa' | 'guru' | 'dudi'>('siswa');
  const [editCompanyId, setEditCompanyId] = useState<number | null>(null);
  const [editDudiQuery, setEditDudiQuery] = useState('');
  const [showEditDudiDropdown, setShowEditDudiDropdown] = useState(false);

  // Add Member Form States
  const [addUsername, setAddUsername] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<'siswa' | 'guru' | 'dudi'>('siswa');
  const [addCompanyId, setAddCompanyId] = useState<number | null>(null);
  const [addDudiQuery, setAddDudiQuery] = useState('');
  const [showAddDudiDropdown, setShowAddDudiDropdown] = useState(false);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      // 3. Total DUDI (status: approved)
      const { count: dCount } = await supabase
        .from('user_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'dudi')
        .eq('status', 'approved');

      setTotalDudi(dCount || 0);

      // 4. Ambil daftar companies
      const { data: compList } = await supabase
        .from('companies')
        .select('*')
        .order('company_name', { ascending: true });

      if (compList) {
        setCompanies(compList);
      }

      // 5. Ambil seluruh anggota (role siswa, guru & dudi, status: approved)
      const { data: memberList, error: mErr } = await supabase
        .from('user_accounts')
        .select('id, username, role, company_id, status, created_at, companies:company_id(*)')
        .in('role', ['siswa', 'guru', 'dudi'])
        .eq('status', 'approved')
        .order('username', { ascending: true });

      if (mErr) {
        console.error('Error fetching members:', mErr);
      } else {
        const mapped: MemberItem[] = (memberList || []).map((item) => ({
          id: item.id,
          username: item.username,
          role: item.role as UserRole,
          company_id: item.company_id,
          status: item.status,
          created_at: item.created_at,
          companies: (Array.isArray(item.companies) ? item.companies[0] : item.companies) as Company | null,
        }));
        setMembers(mapped);
      }
    } catch (err) {
      console.error('Failed to load kelola anggota data:', err);
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

  // Filtered members by dropdown
  const filteredMembers = members.filter((item) => {
    if (filterRole === 'Siswa') return item.role === 'siswa';
    if (filterRole === 'Guru') return item.role === 'guru';
    if (filterRole === 'Dudi') return item.role === 'dudi';
    return true; // 'Semua'
  });

  // Filtered companies for edit modal
  const filteredCompanies = companies.filter((c) =>
    c.company_name.toLowerCase().includes(editDudiQuery.toLowerCase())
  );

  // Filtered companies for add modal
  const filteredAddCompanies = companies.filter((c) =>
    c.company_name.toLowerCase().includes(addDudiQuery.toLowerCase())
  );

  // Modal Handlers
  const handleOpenAdd = () => {
    setAddUsername('');
    setAddPassword('');
    setAddRole('siswa');
    setAddCompanyId(null);
    setAddDudiQuery('');
    setShowAddDudiDropdown(false);
    setModalType('add_member');
  };

  const handleSelectAddDudi = (company: Company) => {
    setAddCompanyId(company.id);
    setAddDudiQuery(company.company_name);
    setShowAddDudiDropdown(false);
  };

  const handleOpenDeleteSingle = (member: MemberItem) => {
    setSelectedMember(member);
    setModalType('delete_single');
  };

  const handleOpenEdit = (member: MemberItem) => {
    setSelectedMember(member);
    setEditUsername(member.username);
    setEditRole(member.role === 'guru' ? 'guru' : member.role === 'dudi' ? 'dudi' : 'siswa');
    setEditCompanyId(member.company_id ?? null);
    setEditDudiQuery(member.companies?.company_name || '');
    setShowEditDudiDropdown(false);
    setModalType('edit_member');
  };

  const handleSelectEditDudi = (company: Company) => {
    setEditCompanyId(company.id);
    setEditDudiQuery(company.company_name);
    setShowEditDudiDropdown(false);
  };

  const handleOpenDeleteAll = () => {
    setModalType('delete_all');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedMember(null);
  };

  // Konfirmasi Hapus Satu Anggota
  const handleConfirmDeleteSingle = async () => {
    if (!selectedMember) return;
    setActionLoading(true);
    try {
      // 1. Ambil ID absensi terkait untuk cascade delete laporan & absensi
      const { data: userAtts } = await supabase
        .from('attendances')
        .select('id')
        .eq('user_id', selectedMember.id);

      if (userAtts && userAtts.length > 0) {
        const attIds = userAtts.map((a) => a.id);
        await supabase.from('reports').delete().in('attendance_id', attIds);
        await supabase.from('attendances').delete().eq('user_id', selectedMember.id);
      }

      // 2. Hapus akun pengguna
      const { error } = await supabase
        .from('user_accounts')
        .delete()
        .eq('id', selectedMember.id);

      if (error) {
        alert('Gagal menghapus anggota: ' + error.message);
      } else {
        handleCloseModal();
        await loadData();
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghapus data.');
    } finally {
      setActionLoading(false);
    }
  };

  // Konfirmasi Simpan Edit Anggota
  const handleConfirmEdit = async () => {
    if (!selectedMember) return;
    if (!editUsername.trim()) {
      alert('Nama anggota tidak boleh kosong.');
      return;
    }

    setActionLoading(true);
    try {
      const updatePayload: Record<string, unknown> = {
        username: editUsername.trim(),
        role: editRole,
        company_id: (editRole === 'siswa' || editRole === 'dudi') ? editCompanyId : null,
      };

      const { error } = await supabase
        .from('user_accounts')
        .update(updatePayload)
        .eq('id', selectedMember.id);

      if (error) {
        alert('Gagal memperbarui data: ' + error.message);
      } else {
        handleCloseModal();
        await loadData();
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memperbarui data.');
    } finally {
      setActionLoading(false);
    }
  };

  // Konfirmasi Simpan Tambah Anggota
  const handleConfirmAdd = async () => {
    if (!addUsername.trim()) {
      alert('Nama anggota tidak boleh kosong.');
      return;
    }
    if (!addPassword) {
      alert('Kata sandi tidak boleh kosong.');
      return;
    }
    if (addPassword.length < 5) {
      alert('Kata sandi minimal 5 karakter.');
      return;
    }

    if ((addRole === 'siswa' || addRole === 'dudi') && !addCompanyId) {
      alert('Silakan pilih DUDI terkait.');
      return;
    }

    setActionLoading(true);
    try {
      const hashedPassword = await hashPassword(addPassword);

      const insertPayload: Record<string, unknown> = {
        username: addUsername.trim(),
        password: hashedPassword,
        role: addRole,
        company_id: (addRole === 'siswa' || addRole === 'dudi') ? addCompanyId : null,
        status: 'approved',
        first_login: true,
      };

      const { error } = await supabase
        .from('user_accounts')
        .insert([insertPayload]);

      if (error) {
        if (error.code === '23505') {
          alert('Nama anggota sudah terdaftar. Silakan gunakan nama lain.');
        } else {
          alert('Gagal menambahkan anggota: ' + error.message);
        }
      } else {
        handleCloseModal();
        await loadData();
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan sistem saat menambahkan anggota.');
    } finally {
      setActionLoading(false);
    }
  };

  // Konfirmasi Hapus Data Seluruh Siswa Tahun Ini (e.g. 2026)
  const handleConfirmDeleteAllYear = async () => {
    setActionLoading(true);
    try {
      const startOfYear = `${currentYear}-01-01T00:00:00.000Z`;
      const endOfYear = `${currentYear}-12-31T23:59:59.999Z`;

      // 1. Cari seluruh siswa yang terdaftar di tahun ini
      const { data: studentsToDelete, error: fErr } = await supabase
        .from('user_accounts')
        .select('id')
        .eq('role', 'siswa')
        .gte('created_at', startOfYear)
        .lte('created_at', endOfYear);

      if (fErr) {
        alert('Gagal memuat data siswa untuk dihapus: ' + fErr.message);
        setActionLoading(false);
        return;
      }

      const studentIds = (studentsToDelete || []).map((s) => s.id);

      if (studentIds.length === 0) {
        alert(`Tidak ada data siswa yang ditambahkan pada tahun ${currentYear}.`);
        handleCloseModal();
        setActionLoading(false);
        return;
      }

      // 2. Cascade delete attendances & reports
      const { data: allAtts } = await supabase
        .from('attendances')
        .select('id')
        .in('user_id', studentIds);

      if (allAtts && allAtts.length > 0) {
        const attIds = allAtts.map((a) => a.id);
        await supabase.from('reports').delete().in('attendance_id', attIds);
        await supabase.from('attendances').delete().in('user_id', studentIds);
      }

      // 3. Hapus seluruh akun siswa terkait
      const { error: dErr } = await supabase
        .from('user_accounts')
        .delete()
        .in('id', studentIds);

      if (dErr) {
        alert('Gagal menghapus seluruh data siswa: ' + dErr.message);
      } else {
        alert(`Berhasil menghapus seluruh data (${studentIds.length}) siswa tahun ${currentYear}!`);
        handleCloseModal();
        await loadData();
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan sistem saat menghapus data.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Top Bar: Filterisasi Anggota (Kiri) & Total Cards (Kanan) */}
      <div className="flex items-center justify-between gap-6 mb-7">
        {/* Kiri: Filterisasi Anggota */}
        <div className="flex flex-col">
          <label className="text-[16px] font-medium text-black mb-2">Filterisasi Anggota :</label>
          <div className="relative" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="bg-[#EDEDED] border border-gray-300 hover:border-gray-400 rounded-xl px-5 py-2.5 flex items-center gap-4 text-[15px] font-normal text-black cursor-pointer shadow-xs transition-colors"
            >
              <span>{filterRole}</span>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${showFilterDropdown ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showFilterDropdown && (
              <div className="absolute top-full left-0 mt-1.5 w-36 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-20">
                {(['Semua', 'Siswa', 'Guru', 'Dudi'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setFilterRole(r);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-[14px] transition-colors cursor-pointer ${
                      filterRole === r 
                        ? 'bg-[#000066]/10 text-[#000066] font-semibold' 
                        : 'text-black hover:bg-gray-100'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kanan: 3 Total Cards */}
        <div className="flex items-center gap-4">
          {/* Card Total Siswa */}
          <div className="bg-white border border-gray-400 rounded-[20px] py-3.5 px-6 min-w-[130px] flex flex-col items-center justify-center shadow-xs">
            <span className="text-[40px] font-bold text-black leading-none mb-1">
              {loading ? '...' : totalSiswa}
            </span>
            <span className="text-[13px] text-black font-normal">Total Siswa</span>
          </div>

          {/* Card Total Guru */}
          <div className="bg-white border border-gray-400 rounded-[20px] py-3.5 px-6 min-w-[130px] flex flex-col items-center justify-center shadow-xs">
            <span className="text-[40px] font-bold text-black leading-none mb-1">
              {loading ? '...' : totalGuru}
            </span>
            <span className="text-[13px] text-black font-normal">Total Guru</span>
          </div>

          {/* Card Total DUDI */}
          <div className="bg-white border border-gray-400 rounded-[20px] py-3.5 px-6 min-w-[130px] flex flex-col items-center justify-center shadow-xs">
            <span className="text-[40px] font-bold text-black leading-none mb-1">
              {loading ? '...' : totalDudi}
            </span>
            <span className="text-[13px] text-black font-normal">Total DUDI</span>
          </div>

          {/* Card Tambah Anggota */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="bg-[#FACC15] hover:bg-[#EAB308] rounded-[20px] py-3.5 px-6 min-w-[130px] flex flex-col items-center justify-center shadow-xs transition-colors cursor-pointer"
          >
            <div className="h-[40px] flex items-center justify-center mb-1 text-black">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <span className="text-[13px] text-black font-normal">Tambah Anggota</span>
          </button>
        </div>
      </div>

      {/* Horizontal Divider */}
      <hr className="border-t border-gray-300 mb-7 w-full" />

      {/* Tabel Kelola Anggota */}
      <div className="w-full bg-white border border-gray-400 rounded-[22px] overflow-hidden shadow-xs mb-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#EDEDED] border-b border-gray-300">
              <th className="w-[30%] text-center font-normal text-[15px] text-black py-3.5 px-4">
                Nama
              </th>
              <th className="w-[20%] text-center font-normal text-[15px] text-black py-3.5 px-4">
                Peran
              </th>
              <th className="w-[25%] text-center font-normal text-[15px] text-black py-3.5 px-4">
                Dudi
              </th>
              <th className="w-[25%] text-center font-normal text-[15px] text-black py-3.5 px-4">
                Kelola Anggota
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-14 text-center text-gray-500 text-[14px]">
                  Memuat data anggota...
                </td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-14 text-center text-black text-[14px] font-normal">
                  Tidak ada anggota yang ditemukan
                </td>
              </tr>
            ) : (
              filteredMembers.map((item) => (
                <tr key={item.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/60 transition-colors">
                  <td className="py-4 px-4 text-center text-[15px] text-black font-normal truncate max-w-[180px]">
                    {item.username}
                  </td>
                  <td className="py-4 px-4 text-center text-[15px] text-black font-normal capitalize">
                    {item.role === 'guru' ? 'Guru' : item.role === 'dudi' ? 'Dudi' : 'Siswa'}
                  </td>
                  <td className="py-4 px-4 text-center text-[15px] text-black font-normal truncate max-w-[180px]">
                    {item.role === 'guru' ? '-' : (item.companies?.company_name || '-')}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      {/* Tombol Edit */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="bg-[#000066] hover:bg-[#000044] text-white text-[13px] font-normal px-5 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer"
                      >
                        Edit
                      </button>
                      {/* Tombol Hapus (Sampah) */}
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteSingle(item)}
                        title="Hapus Anggota"
                        className="w-8 h-8 rounded-lg bg-[#CC2929] hover:bg-[#B32424] text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
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

      {/* Horizontal Divider */}
      <hr className="border-t border-gray-300 mb-6 w-full" />

      {/* Bagian Bawah: Hapus Data Seluruh Siswa Tahun Ini */}
      <div className="w-full flex flex-col mb-6">
        <h3 className="text-[16px] font-medium text-black mb-1">
          Hapus Data Seluruh Siswa Tahun Ini
        </h3>
        <p className="text-[12px] text-gray-500 mb-4 flex items-center gap-1.5">
          <span>ⓘ</span> Navigasi sensitif, pastikan anda meninjau ulang
        </p>

        {/* Tombol Besar Hapus Seluruh Siswa Tahun Ini */}
        <button
          type="button"
          onClick={handleOpenDeleteAll}
          className="w-full bg-[#D31515] hover:bg-[#B71212] text-white text-[16px] font-medium py-3.5 rounded-xl transition-colors shadow-sm text-center cursor-pointer"
        >
          Hapus Data Seluruh Siswa Tahun {currentYear}
        </button>
      </div>

      {/* ======================================================== */}
      {/* POP UP MODAL SECTION                                     */}
      {/* ======================================================== */}

      {/* 1. Modal Hapus Anggota Tunggal */}
      {modalType === 'delete_single' && selectedMember && (
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
              <h2 className="text-[22px] font-semibold text-black">Hapus Anggota</h2>
            </div>

            {/* Konten */}
            <p className="text-[14px] text-black leading-relaxed mb-8 text-center sm:text-left">
              Yakin untuk menghapus akun <strong>{selectedMember.username}</strong> dengan dudi <strong>{selectedMember.companies?.company_name || '-'}</strong>.
            </p>

            {/* Tombol Aksi: Batal & Hapus */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={actionLoading}
                className="bg-white hover:bg-gray-50 text-[#334155] border border-gray-300 px-7 py-2.5 rounded-xl text-[14px] font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingle}
                disabled={actionLoading}
                className="bg-[#CC2929] hover:bg-[#B32424] text-white px-7 py-2.5 rounded-xl text-[14px] font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Konfirmasi Hapus Seluruh Data Siswa Tahun Ini */}
      {modalType === 'delete_all' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4">
          <div className="bg-[#EDEDED] w-full max-w-[480px] rounded-[28px] p-7 relative shadow-2xl flex flex-col border border-gray-300">
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
              <h2 className="text-[22px] font-semibold text-black">Hapus Seluruh Siswa</h2>
            </div>

            {/* Konten */}
            <p className="text-[14px] text-black leading-relaxed mb-8">
              Yakin untuk menghapus seluruh data siswa tahun <strong>{currentYear}</strong>? Tindakan ini akan menghapus akun seluruh siswa yang terdaftar di tahun ini beserta riwayat absensinya secara permanen.
            </p>

            {/* Tombol Aksi: Batal & Hapus */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={actionLoading}
                className="bg-white hover:bg-gray-50 text-[#334155] border border-gray-300 px-7 py-2.5 rounded-xl text-[14px] font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAllYear}
                disabled={actionLoading}
                className="bg-[#CC2929] hover:bg-[#B32424] text-white px-7 py-2.5 rounded-xl text-[14px] font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Menghapus...' : `Hapus Siswa ${currentYear}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Edit Anggota */}
      {modalType === 'edit_member' && selectedMember && (
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
              <h2 className="text-[22px] font-semibold text-black">Edit Anggota</h2>
            </div>

            {/* Field 1: Nama Anggota */}
            <div className="mb-5">
              <label className="block text-[14px] font-medium text-black mb-1.5">
                Nama Anggota :
              </label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Masukkan nama anggota..."
                className="w-full bg-white rounded-xl py-3 px-4 text-[14px] text-black outline-none border border-transparent focus:border-[#000066] shadow-xs"
              />
            </div>

            {/* Field 2: Peran */}
            <div className="mb-5">
              <label className="block text-[14px] font-medium text-black mb-2">
                Peran :
              </label>
              <div className="flex items-center gap-6">
                <label 
                  className="flex items-center gap-3 cursor-pointer select-none text-[14px] text-black"
                  onClick={() => setEditRole('siswa')}
                >
                  <div className="w-5 h-5 rounded-[4px] border-2 border-[#000066] flex items-center justify-center bg-white shrink-0">
                    {editRole === 'siswa' && <div className="w-2.5 h-2.5 bg-[#000066] rounded-[2px]" />}
                  </div>
                  <span>Siswa</span>
                </label>
                <label 
                  className="flex items-center gap-3 cursor-pointer select-none text-[14px] text-black"
                  onClick={() => setEditRole('guru')}
                >
                  <div className="w-5 h-5 rounded-[4px] border-2 border-[#000066] flex items-center justify-center bg-white shrink-0">
                    {editRole === 'guru' && <div className="w-2.5 h-2.5 bg-[#000066] rounded-[2px]" />}
                  </div>
                  <span>Guru Pembimbing</span>
                </label>
                <label 
                  className="flex items-center gap-3 cursor-pointer select-none text-[14px] text-black"
                  onClick={() => setEditRole('dudi')}
                >
                  <div className="w-5 h-5 rounded-[4px] border-2 border-[#000066] flex items-center justify-center bg-white shrink-0">
                    {editRole === 'dudi' && <div className="w-2.5 h-2.5 bg-[#000066] rounded-[2px]" />}
                  </div>
                  <span>Dudi</span>
                </label>
              </div>
            </div>

            {/* Field 3: Dudi (Untuk siswa & dudi) */}
            <div className="mb-8 relative">
              <label className="block text-[14px] font-medium text-black mb-1.5">
                Dudi :
              </label>
              {editRole === 'siswa' || editRole === 'dudi' ? (
                <div className="relative">
                  <input
                    type="text"
                    value={editDudiQuery}
                    placeholder="Cari nama perusahaan/DUDI..."
                    onChange={(e) => {
                      setEditDudiQuery(e.target.value);
                      setEditCompanyId(null);
                      setShowEditDudiDropdown(true);
                    }}
                    onFocus={() => setShowEditDudiDropdown(true)}
                    className="w-full bg-white rounded-xl py-3 px-4 text-[14px] text-black outline-none border border-transparent focus:border-[#000066] shadow-xs relative z-10"
                  />

                  {/* Dropdown Suggestions */}
                  {showEditDudiDropdown && (
                    <div className="absolute top-full left-0 w-full mt-2 z-20 shadow-lg">
                      <div className="flex flex-col gap-[6px] max-h-[160px] overflow-y-auto pr-2 bg-white rounded-xl p-2 border border-gray-200">
                        {filteredCompanies.length > 0 ? (
                          filteredCompanies.map((comp) => (
                            <div
                              key={comp.id}
                              onClick={() => handleSelectEditDudi(comp)}
                              className={`w-full rounded-lg px-4 py-[10px] text-[13px] cursor-pointer transition-colors border-r-4 ${
                                editCompanyId === comp.id
                                  ? 'bg-[#000066]/10 text-[#000066] font-semibold border-[#000066]'
                                  : 'bg-[#EDEDED] text-gray-700 hover:bg-[#e4e4e4] border-transparent'
                              }`}
                            >
                              {comp.company_name}
                            </div>
                          ))
                        ) : (
                          <div className="w-full bg-[#EDEDED] rounded-lg px-4 py-[10px] text-[13px] text-gray-500 text-center">
                            Tidak ada DUDI yang cocok di database
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full bg-white/70 rounded-xl py-3 px-4 text-[14px] text-gray-400 select-none cursor-not-allowed">
                  Guru tidak memerlukan DUDI
                </div>
              )}
            </div>

            {/* Tombol Simpan Edit */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleConfirmEdit}
                disabled={actionLoading}
                className="bg-[#000066] hover:bg-[#000044] text-white px-8 py-2.5 rounded-xl text-[14px] font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Menyimpan...' : 'Edit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Tambah Anggota */}
      {modalType === 'add_member' && (
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
              <h2 className="text-[22px] font-semibold text-black">Tambah Anggota</h2>
            </div>

            {/* Field 1: Nama Anggota */}
            <div className="mb-4">
              <label className="block text-[14px] font-medium text-black mb-1.5">
                Nama Anggota :
              </label>
              <input
                type="text"
                value={addUsername}
                onChange={(e) => setAddUsername(e.target.value)}
                placeholder="Masukkan nama anggota..."
                className="w-full bg-white rounded-xl py-3 px-4 text-[14px] text-black outline-none border border-transparent focus:border-[#000066] shadow-xs"
              />
            </div>

            {/* Field 2: Kata Sandi */}
            <div className="mb-4">
              <label className="block text-[14px] font-medium text-black mb-1.5">
                Kata Sandi :
              </label>
              <input
                type="text"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full bg-white rounded-xl py-3 px-4 text-[14px] text-black outline-none border border-transparent focus:border-[#000066] shadow-xs"
              />
            </div>

            {/* Field 3: Peran */}
            <div className="mb-4">
              <label className="block text-[14px] font-medium text-black mb-2">
                Peran :
              </label>
              <div className="flex items-center gap-6">
                <label 
                  className="flex items-center gap-3 cursor-pointer select-none text-[14px] text-black"
                  onClick={() => setAddRole('siswa')}
                >
                  <div className="w-5 h-5 rounded-[4px] border-2 border-[#000066] flex items-center justify-center bg-white shrink-0">
                    {addRole === 'siswa' && <div className="w-2.5 h-2.5 bg-[#000066] rounded-[2px]" />}
                  </div>
                  <span>Siswa</span>
                </label>
                <label 
                  className="flex items-center gap-3 cursor-pointer select-none text-[14px] text-black"
                  onClick={() => setAddRole('guru')}
                >
                  <div className="w-5 h-5 rounded-[4px] border-2 border-[#000066] flex items-center justify-center bg-white shrink-0">
                    {addRole === 'guru' && <div className="w-2.5 h-2.5 bg-[#000066] rounded-[2px]" />}
                  </div>
                  <span>Guru Pembimbing</span>
                </label>
                <label 
                  className="flex items-center gap-3 cursor-pointer select-none text-[14px] text-black"
                  onClick={() => setAddRole('dudi')}
                >
                  <div className="w-5 h-5 rounded-[4px] border-2 border-[#000066] flex items-center justify-center bg-white shrink-0">
                    {addRole === 'dudi' && <div className="w-2.5 h-2.5 bg-[#000066] rounded-[2px]" />}
                  </div>
                  <span>Dudi</span>
                </label>
              </div>
            </div>

            {/* Field 4: Dudi (Untuk siswa & dudi) */}
            <div className="mb-7 relative">
              <label className="block text-[14px] font-medium text-black mb-1.5">
                Dudi :
              </label>
              {addRole === 'siswa' || addRole === 'dudi' ? (
                <div className="relative">
                  <input
                    type="text"
                    value={addDudiQuery}
                    placeholder="Cari nama perusahaan/DUDI..."
                    onChange={(e) => {
                      setAddDudiQuery(e.target.value);
                      setAddCompanyId(null);
                      setShowAddDudiDropdown(true);
                    }}
                    onFocus={() => setShowAddDudiDropdown(true)}
                    className="w-full bg-white rounded-xl py-3 px-4 text-[14px] text-black outline-none border border-transparent focus:border-[#000066] shadow-xs relative z-10"
                  />

                  {/* Dropdown Suggestions */}
                  {showAddDudiDropdown && (
                    <div className="absolute top-full left-0 w-full mt-2 z-20 shadow-lg">
                      <div className="flex flex-col gap-[6px] max-h-[160px] overflow-y-auto pr-2 bg-white rounded-xl p-2 border border-gray-200">
                        {filteredAddCompanies.length > 0 ? (
                          filteredAddCompanies.map((comp) => (
                            <div
                              key={comp.id}
                              onClick={() => handleSelectAddDudi(comp)}
                              className={`w-full rounded-lg px-4 py-[10px] text-[13px] cursor-pointer transition-colors border-r-4 ${
                                addCompanyId === comp.id
                                  ? 'bg-[#000066]/10 text-[#000066] font-semibold border-[#000066]'
                                  : 'bg-[#EDEDED] text-gray-700 hover:bg-[#e4e4e4] border-transparent'
                              }`}
                            >
                              {comp.company_name}
                            </div>
                          ))
                        ) : (
                          <div className="w-full bg-[#EDEDED] rounded-lg px-4 py-[10px] text-[13px] text-gray-500 text-center">
                            Tidak ada DUDI yang cocok di database
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full bg-white/70 rounded-xl py-3 px-4 text-[14px] text-gray-400 select-none cursor-not-allowed">
                  Guru tidak memerlukan DUDI
                </div>
              )}
            </div>

            {/* Tombol Simpan Tambah */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleConfirmAdd}
                disabled={actionLoading}
                className="bg-[#000066] hover:bg-[#000044] text-white px-8 py-2.5 rounded-xl text-[14px] font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Menambahkan...' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

