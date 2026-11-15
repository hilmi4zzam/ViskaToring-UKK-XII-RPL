"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase/client';
import { getStoredUser, fetchCurrentUser } from '@/supabase/auth';
import { Attendance, Company, User } from '@/supabase/types';
import { getLocalDateString } from '@/supabase/helpers';

interface StudentWithAttendance {
  id: string;
  username: string;
  company_id: number | null;
  status?: string;
  companies: Company | null;
  attendance?: Attendance | null;
}

export default function DashboardDudiPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Detail Laporan Siswa
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<StudentWithAttendance | null>(null);

  // Format jam e.g. "08.25"
  const formatJam = (isoString?: string | null) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${hours}.${minutes}`;
    } catch {
      return '-';
    }
  };

  // Format tanggal e.g. "14 September 2026"
  const formatTanggal = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const loadData = useCallback(async (dudiUser: User) => {
    setLoading(true);
    const today = getLocalDateString();

    try {
      if (!dudiUser.company_id) {
        console.warn('Akun DUDI tidak memiliki company_id terkait.');
        setStudents([]);
        setLoading(false);
        return;
      }

      // 1. Ambil data siswa yang magang di DUDI ini (role = 'siswa', status = 'approved', company_id = dudiUser.company_id)
      const { data: studentList, error: sErr } = await supabase
        .from('user_accounts')
        .select('id, username, company_id, status, companies:company_id(*)')
        .eq('role', 'siswa')
        .eq('status', 'approved')
        .eq('company_id', dudiUser.company_id)
        .order('username', { ascending: true });

      if (sErr) {
        console.error('Error fetching dudi students:', sErr);
        setStudents([]);
        setLoading(false);
        return;
      }

      if (!studentList || studentList.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // 2. Ambil data absensi hari ini untuk siswa-siswa DUDI ini
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

      // 3. Gabungkan siswa dengan absensinya
      const merged: StudentWithAttendance[] = studentList.map((item) => ({
        id: item.id,
        username: item.username,
        company_id: item.company_id,
        status: item.status,
        companies: (Array.isArray(item.companies) ? item.companies[0] : item.companies) as Company | null,
        attendance: attMap.get(item.id) || null,
      }));

      setStudents(merged);
    } catch (err) {
      console.error('Failed to load dudi dashboard data:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const stored = getStoredUser();
      if (stored) {
        const fresh = await fetchCurrentUser();
        const activeUser = fresh || stored;
        await loadData(activeUser);
      }
    };

    void init();
  }, [loadData]);

  // Hitung Statistik
  const totalSiswaMagang = students.length;
  const belumAbsensiCount = students.filter((s) => !s.attendance).length;

  // Filter Pencarian
  const filteredStudents = students.filter((s) =>
    s.username.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleOpenReport = (student: StudentWithAttendance) => {
    setSelectedStudentForReport(student);
    setShowReportModal(true);
  };

  return (
    <div className="w-full flex flex-col gap-7 pb-10">
      {/* ======================================================== */}
      {/* 1. KARTU STATISTIK ATAS (2 Cards)                       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7 w-full">
        {/* Card 1: Jumlah Siswa Magang */}
        <div className="bg-white border border-gray-400 rounded-[20px] py-6 px-4 flex flex-col items-center justify-center text-center shadow-xs min-h-[145px]">
          <span className="text-[48px] font-bold text-black leading-none mb-2.5">
            {loading ? '-' : totalSiswaMagang}
          </span>
          <span className="text-[16px] text-black font-medium">
            Jumlah Siswa Magang
          </span>
        </div>

        {/* Card 2: Belum Absensi */}
        <div className="bg-white border border-gray-400 rounded-[20px] py-6 px-4 flex flex-col items-center justify-center text-center shadow-xs min-h-[145px]">
          <span className="text-[48px] font-bold text-black leading-none mb-2.5">
            {loading ? '-' : belumAbsensiCount}
          </span>
          <span className="text-[16px] text-black font-medium">
            Belum Absensi
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SEARCH BAR                                            */}
      {/* ======================================================== */}
      <div className="relative w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari anak SMKN 6 di dudi anda"
          className="w-full bg-white border border-gray-400 rounded-2xl py-3.5 pl-6 pr-14 text-[15px] text-black placeholder:text-black font-normal focus:outline-none focus:border-[#000066] shadow-xs"
        />
        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-black">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. TABEL DATA SISWA & ABSENSI                            */}
      {/* ======================================================== */}
      <div className="w-full bg-white border border-gray-400 rounded-[20px] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#EDEDED] border-b border-gray-300">
                <th className="py-4 pl-7 text-[15px] font-normal text-black w-[40%]">
                  Siswa
                </th>
                <th className="py-4 text-center text-[15px] font-normal text-black w-[20%]">
                  Waktu Masuk
                </th>
                <th className="py-4 text-center text-[15px] font-normal text-black w-[20%]">
                  Waktu Pulang
                </th>
                <th className="py-4 pr-7 text-center text-[15px] font-normal text-black w-[20%]">
                  Laporan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[14px] text-gray-500">
                    Memuat data siswa magang...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[14px] text-gray-500">
                    {searchQuery
                      ? 'Tidak ada siswa yang sesuai dengan kata kunci pencarian.'
                      : 'Belum ada siswa yang terdaftar magang di perusahaan ini.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Nama Siswa */}
                    <td className="py-4 pl-7 text-[15px] font-normal text-black">
                      <span className="truncate block max-w-[280px]" title={item.username}>
                        {item.username}
                      </span>
                    </td>

                    {/* Waktu Masuk */}
                    <td className="py-4 text-center text-[15px] font-normal text-black">
                      {formatJam(item.attendance?.jam_masuk)}
                    </td>

                    {/* Waktu Pulang */}
                    <td className="py-4 text-center text-[15px] font-normal text-black">
                      {formatJam(item.attendance?.jam_pulang)}
                    </td>

                    {/* Tombol Laporan */}
                    <td className="py-4 pr-7 text-center">
                      {item.attendance ? (
                        <button
                          type="button"
                          onClick={() => handleOpenReport(item)}
                          className="bg-[#000066] hover:bg-[#000050] text-white px-5 py-2 rounded-xl text-[14px] font-medium transition-colors shadow-xs cursor-pointer inline-flex items-center justify-center min-w-[125px]"
                        >
                          Lihat Laporan
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="bg-[#CC2929] text-white px-5 py-2 rounded-xl text-[14px] font-medium shadow-xs cursor-default inline-flex items-center justify-center min-w-[125px]"
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

      {/* ======================================================== */}
      {/* 4. MODAL DETAIL LAPORAN KEGIATAN                         */}
      {/* ======================================================== */}
      {showReportModal && selectedStudentForReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4">
          <div className="bg-[#EDEDED] w-full max-w-[460px] rounded-[28px] p-6 sm:p-7 relative shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#000066]/30 [&::-webkit-scrollbar-thumb]:rounded-full border border-gray-300">
            {/* Tombol Kembali (Panah Kiri) */}
            <button 
              type="button"
              onClick={() => setShowReportModal(false)} 
              className="absolute top-6 left-6 text-black hover:opacity-70 transition-opacity p-1 flex items-center justify-center cursor-pointer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>

            {/* Header: Judul & Tanggal/Status */}
            <div className="text-center pt-0.5 mb-5">
              <h2 className="text-[22px] font-semibold text-black">Detail Laporan</h2>
              <p className="text-[13px] text-gray-700 font-normal mt-1">
                Siswa: <strong>{selectedStudentForReport.username}</strong>
              </p>
              <p className="text-[12px] text-gray-500 font-normal mt-0.5">
                Tanggal: {formatTanggal(selectedStudentForReport.attendance?.tanggal_absen || getLocalDateString())} | Kehadiran: {selectedStudentForReport.attendance?.status_kehadiran || 'WFO'}
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
                      <label className="block text-[14px] font-semibold text-black mb-1.5">
                        Judul Laporan Kegiatan :
                      </label>
                      <div className="w-full bg-white rounded-xl py-3 px-4 text-[14px] text-black shadow-xs">
                        {rep.judul_laporan || '-'}
                      </div>
                    </div>

                    {/* Deskripsi Laporan */}
                    <div>
                      <label className="block text-[14px] font-semibold text-black mb-1.5">
                        Deskripsi Laporan :
                      </label>
                      <div className="w-full bg-white rounded-xl p-4 text-[14px] text-black leading-relaxed shadow-xs min-h-[100px] whitespace-pre-wrap">
                        {rep.deskripsi_laporan || 'Tidak ada deskripsi laporan.'}
                      </div>
                    </div>

                    {/* Foto Bukti Kegiatan */}
                    <div>
                      <label className="block text-[14px] font-semibold text-black mb-1.5">
                        Foto Bukti Kegiatan :
                      </label>
                      <div className="w-full bg-white rounded-xl p-3 shadow-xs flex items-center justify-center min-h-[140px] overflow-hidden">
                        {rep.bukti_laporan ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img 
                            src={rep.bukti_laporan} 
                            alt="Bukti Laporan" 
                            className="max-h-[220px] w-auto max-w-full object-contain rounded-lg"
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
              <div className="py-10 text-center text-gray-500 text-[14px]">
                Belum ada laporan kegiatan yang dikirim oleh siswa untuk hari ini.
              </div>
            )}

            {/* Tombol Tutup di Kanan Bawah */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="bg-[#000066] hover:bg-[#000044] text-white px-7 py-2.5 rounded-xl text-[14px] font-medium transition-colors cursor-pointer shadow-md"
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
