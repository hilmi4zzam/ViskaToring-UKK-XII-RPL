"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase/client';
import { getStoredUser } from '@/supabase/auth';
import { Attendance, Company, User } from '@/supabase/types';
import { getLocalDateString } from '@/supabase/helpers';

interface StudentWithAttendance {
  id: string;
  username: string;
  company_id: number | null;
  companies: Company | null;
  attendance?: Attendance | null;
}

export default function DashboardGuruPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Filter State
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[] | null>(null);
  const [tempSelectedStudentIds, setTempSelectedStudentIds] = useState<string[]>([]);

  // Modal Detail Laporan Siswa
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<StudentWithAttendance | null>(null);

  const loadData = useCallback(async (guruUser: User) => {
    setLoading(true);
    const today = getLocalDateString();

    try {
      // 1. Ambil data guru untuk memuat kolom 'selected' tersimpan
      try {
        const { data: guruData } = await supabase
          .from('user_accounts')
          .select('selected')
          .eq('id', guruUser.id)
          .maybeSingle();

        if (guruData && Array.isArray(guruData.selected)) {
          setSelectedStudentIds(guruData.selected);
        }
      } catch (err) {
        console.warn('Kolom selected mungkin belum dibuat di database:', err);
      }

      // 2. Ambil seluruh user account dengan role siswa
      const { data: studentList, error: sErr } = await supabase
        .from('user_accounts')
        .select('id, username, company_id, companies(*)')
        .eq('role', 'siswa')
        .order('username', { ascending: true });

      if (sErr) {
        console.error('Error fetching students:', sErr);
        setLoading(false);
        return;
      }

      if (!studentList || studentList.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // 3. Ambil absensi hari ini beserta laporannya untuk para siswa
      const studentIds = studentList.map((s) => s.id);
      const { data: attList, error: aErr } = await supabase
        .from('attendances')
        .select('*, reports(*)')
        .in('user_id', studentIds)
        .eq('tanggal_absen', today);

      if (aErr) {
        console.error('Error fetching today attendances:', aErr);
      }

      const attMap = new Map<string, Attendance>();
      (attList || []).forEach((att) => {
        attMap.set(att.user_id, att);
      });

      // Gabungkan data siswa dengan absensi hari ini
      const merged: StudentWithAttendance[] = studentList.map((item) => ({
        id: item.id,
        username: item.username,
        company_id: item.company_id,
        companies: (Array.isArray(item.companies) ? item.companies[0] : item.companies) as Company | null,
        attendance: attMap.get(item.id) || null,
      }));

      setStudents(merged);
    } catch (err) {
      console.error('Failed to load guru dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const user = getStoredUser();
      if (user) {
        setCurrentUser(user);
        await loadData(user);
      }
    };

    void init();
  }, [loadData]);

  // Format jam dengan tanda titik (misal: 08.25)
  const formatJam = (isoStr?: string | null) => {
    if (!isoStr) return '-';
    const date = new Date(isoStr);
    return `${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Format tanggal (misal: 12/11/26)
  const formatTanggal = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year.slice(2)}`;
  };

  // Buka modal detail laporan siswa
  const handleOpenReportModal = (student: StudentWithAttendance) => {
    setSelectedStudentForReport(student);
    setShowReportModal(true);
  };

  // Buka modal filter & sinkronisasi siswa yang terpilih
  const handleOpenFilterModal = () => {
    setModalSearch('');
    setTempSelectedStudentIds(selectedStudentIds !== null ? selectedStudentIds : students.map((s) => s.id));
    setShowFilterModal(true);
  };

  // Toggle pilihan siswa di dalam pop up
  const toggleStudentSelection = (id: string) => {
    setTempSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Simpan filter dari pop up dan simpan ke database (kolom selected akun guru)
  const handleSaveFilter = async () => {
    setSelectedStudentIds(tempSelectedStudentIds);
    setShowFilterModal(false);

    const user = currentUser || getStoredUser();
    if (user) {
      try {
        await supabase
          .from('user_accounts')
          .update({ selected: tempSelectedStudentIds })
          .eq('id', user.id);
      } catch (err) {
        console.error('Gagal menyimpan selected students ke database:', err);
      }
    }
  };

  // Siswa yang ditampilkan di dalam modal pop up (berdasarkan modalSearch)
  const modalFilteredStudents = students.filter((item) => {
    const q = modalSearch.toLowerCase().trim();
    if (!q) return true;
    const matchName = item.username.toLowerCase().includes(q);
    const matchDudi = item.companies?.company_name?.toLowerCase().includes(q) ?? false;
    return matchName || matchDudi;
  });

  // Siswa yang ditampilkan di tabel utama (berdasarkan main search bar & filter pilihan siswa)
  const filteredStudents = students.filter((item) => {
    // Filter pilihan dari modal
    if (selectedStudentIds !== null && !selectedStudentIds.includes(item.id)) {
      return false;
    }

    // Filter dari search bar utama
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchName = item.username.toLowerCase().includes(q);
    const matchDudi = item.companies?.company_name?.toLowerCase().includes(q) ?? false;
    return matchName || matchDudi;
  });

  return (
    <div className="w-full flex flex-col">
      {/* Search Input Bar & Filter Button */}
      <div className="w-full flex items-center gap-4 mb-8">
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa yang sedang di bimbing..."
            className="w-full bg-white border border-gray-400 rounded-xl py-3 pl-5 pr-12 text-[15px] text-black outline-none focus:border-[#000066] transition-colors placeholder:text-gray-600 shadow-sm"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>

        {/* Filter Button */}
        <div>
          <button
            type="button"
            onClick={handleOpenFilterModal}
            className="bg-[#000066] text-white rounded-xl px-7 py-3 text-[15px] font-medium hover:bg-[#000044] transition-colors flex items-center gap-2.5 shrink-0 shadow-sm"
          >
            <span>Filter</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"></line>
              <line x1="7" y1="12" x2="17" y2="12"></line>
              <line x1="10" y1="18" x2="14" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Modal Pop Up Filter Siswa */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-[1px]">
          <div className="bg-[#EDEDED] rounded-[28px] p-6 w-[430px] max-w-full h-[540px] flex flex-col shadow-2xl relative border border-gray-300">
            {/* Header: Tombol Kembali */}
            <div className="mb-4 shrink-0">
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="text-black hover:opacity-70 transition-opacity p-1 -ml-1 flex items-center justify-center"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
            </div>

            {/* Input Search di dalam Pop Up */}
            <div className="relative mb-5 shrink-0">
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Cari siswa yang sedang di bimbing..."
                className="w-full bg-[#EDEDED] border border-gray-400 rounded-xl py-2.5 pl-4 pr-11 text-[15px] text-black outline-none focus:border-[#000066] transition-colors placeholder:text-gray-500"
                autoFocus
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </div>

            {/* Daftar Siswa */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#000066]/40 [&::-webkit-scrollbar-thumb]:rounded-full">
              {modalFilteredStudents.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center py-10 text-gray-500 text-[14px]">
                  Siswa tidak ditemukan.
                </div>
              ) : (
                modalFilteredStudents.map((item) => {
                  const isSelected = tempSelectedStudentIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleStudentSelection(item.id)}
                      className="w-full bg-[#EDEDED] border border-gray-400 rounded-xl py-3 px-4 flex items-center justify-between cursor-pointer hover:border-gray-600 transition-colors select-none shadow-xs"
                    >
                      <span className="text-[14px] text-black font-normal truncate mr-3">
                        {item.username} - {item.companies?.company_name || 'Belum ada DUDI'}
                      </span>
                      {/* Checkbox Icon (kiri non selected, kanan selected) */}
                      <div className="w-6 h-6 rounded-md border-2 border-[#000066] bg-white flex items-center justify-center shrink-0">
                        {isSelected && (
                          <div className="w-3 h-3 bg-[#000066] rounded-[2.5px]" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Tombol Simpan */}
            <div className="mt-5 flex justify-end shrink-0">
              <button
                type="button"
                onClick={handleSaveFilter}
                className="bg-[#000066] text-white px-8 py-2.5 rounded-xl text-[14px] font-medium hover:bg-[#000044] transition-colors shadow-sm"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monitoring Table */}
      <div className="w-full bg-white border border-gray-400 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr className="bg-[#EBEBEB] border-b border-gray-400">
                <th className="py-4 px-4 font-normal text-[15px] text-black w-[24%]">Siswa</th>
                <th className="py-4 px-4 font-normal text-[15px] text-black w-[24%]">DUDI</th>
                <th className="py-4 px-4 font-normal text-[15px] text-black w-[16%]">Masuk</th>
                <th className="py-4 px-4 font-normal text-[15px] text-black w-[16%]">Pulang</th>
                <th className="py-4 px-4 font-normal text-[15px] text-black w-[20%]">Laporan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-gray-500 text-[15px]">
                    Memuat data siswa...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-28 text-center text-black text-[14px]">
                    Tidak ada siswa yang sedang dibimbing.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-4 text-center text-[15px] text-black font-normal">
                      {item.username}
                    </td>
                    <td className="py-4 px-4 text-center text-[15px] text-black font-normal">
                      {item.companies?.company_name || '-'}
                    </td>
                    <td className="py-4 px-4 text-center text-[15px] text-black font-normal">
                      {formatJam(item.attendance?.jam_masuk)}
                    </td>
                    <td className="py-4 px-4 text-center text-[15px] text-black font-normal">
                      {formatJam(item.attendance?.jam_pulang)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.attendance?.jam_masuk ? (
                        <button
                          type="button"
                          onClick={() => handleOpenReportModal(item)}
                          className="bg-[#000066] text-white px-5 py-2 rounded-lg font-normal text-[14px] hover:bg-[#000044] transition-colors shadow-xs"
                        >
                          Lihat Laporan
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenReportModal(item)}
                          className="bg-[#CC2929] text-white px-5 py-2 rounded-lg font-normal text-[14px] hover:bg-[#B32424] transition-colors shadow-xs"
                        >
                          Belum Absen
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Laporan Siswa */}
      {showReportModal && selectedStudentForReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4">
          <div className="bg-[#EDEDED] w-full max-w-[440px] rounded-[28px] p-6 sm:p-7 relative shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#000066]/30 [&::-webkit-scrollbar-thumb]:rounded-full border border-gray-300">
            {/* Tombol Kembali (Panah Kiri) */}
            <button 
              type="button"
              onClick={() => setShowReportModal(false)} 
              className="absolute top-6 left-6 text-black hover:opacity-70 transition-opacity p-1 flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>

            {/* Header: Judul & Tanggal/Status */}
            <div className="text-center pt-0.5 mb-5">
              <h2 className="text-[22px] font-semibold text-black">Detail Laporan</h2>
              <p className="text-[13px] text-black font-normal mt-1">
                Tanggal: {formatTanggal(selectedStudentForReport.attendance?.tanggal_absen || getLocalDateString())} | Status: {selectedStudentForReport.attendance?.status_kehadiran || 'Belum Absen'}
              </p>
            </div>

            {/* Konten Laporan */}
            {selectedStudentForReport.attendance?.reports && selectedStudentForReport.attendance.reports.length > 0 ? (
              (() => {
                const rep = selectedStudentForReport.attendance.reports[0];
                return (
                  <div className="flex flex-col gap-4">
                    {/* Judul Laporan */}
                    <div>
                      <label className="block text-[14px] font-medium text-black mb-1.5">
                        Judul Laporan Kegiatan :
                      </label>
                      <div className="w-full bg-white rounded-xl py-3 px-4 text-[14px] text-black shadow-xs">
                        {rep.judul_laporan || '-'}
                      </div>
                    </div>

                    {/* Deskripsi Laporan */}
                    <div>
                      <label className="block text-[14px] font-medium text-black mb-1.5">
                        Deskripsi Laporan :
                      </label>
                      <div className="w-full bg-white rounded-xl p-4 text-[14px] text-black leading-relaxed shadow-xs min-h-[100px] whitespace-pre-wrap">
                        {rep.deskripsi_laporan || 'Tidak ada deskripsi laporan.'}
                      </div>
                    </div>

                    {/* Foto Bukti Kegiatan */}
                    <div>
                      <label className="block text-[14px] font-medium text-black mb-1.5">
                        Foto Bukti Kegiatan :
                      </label>
                      <div className="w-full bg-white rounded-xl p-3 shadow-xs flex items-center justify-center min-h-[140px] overflow-hidden">
                        {rep.bukti_laporan ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img 
                            src={rep.bukti_laporan} 
                            alt="Bukti Laporan" 
                            className="max-h-[180px] w-auto max-w-full object-contain rounded-lg"
                          />
                        ) : (
                          <span className="text-[13px] text-gray-400">Tidak ada foto bukti kegiatan</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="py-12 text-center text-gray-500 text-[14px]">
                Belum ada laporan kegiatan yang dikirim oleh siswa untuk hari ini.
              </div>
            )}

            {/* Tombol Tutup di Kanan Bawah */}
            <div className="mt-5 flex justify-end">
              <button 
                type="button"
                onClick={() => setShowReportModal(false)}
                className="bg-[#000066] text-white px-8 py-2.5 rounded-xl font-medium text-[14px] hover:bg-[#000044] transition-colors shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

