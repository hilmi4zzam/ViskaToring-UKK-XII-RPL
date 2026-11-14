"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabase/client';
import { getStoredUser } from '@/supabase/auth';
import { Attendance, User } from '@/supabase/types';
import { getLocalDateString } from '@/supabase/helpers';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function LaporanPage() {
  const currentYearStr = new Date().getFullYear().toString();
  const currentMonthIdx = new Date().getMonth();

  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState(MONTH_NAMES[currentMonthIdx]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);

  // Modal Detail / Edit Laporan
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async (user: User) => {
    setLoading(true);
    const today = getLocalDateString();

    try {
      // 1. Ambil absensi hari ini untuk tombol status di atas
      const { data: todayAtt } = await supabase
        .from('attendances')
        .select('*')
        .eq('user_id', user.id)
        .eq('tanggal_absen', today)
        .maybeSingle();

      setTodayAttendance(todayAtt);

      // 2. Ambil semua riwayat absensi + laporan user
      const { data, error } = await supabase
        .from('attendances')
        .select('*, reports(*)')
        .eq('user_id', user.id)
        .order('tanggal_absen', { ascending: false });

      if (error) {
        console.error('Error fetching attendances:', error);
      } else if (data) {
        setAttendances(data);
      }
    } catch (err) {
      console.error('Failed to fetch attendances:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeReports = async () => {
      const user = getStoredUser();
      if (user) await loadData(user);
    };

    void initializeReports();
  }, [loadData]);

  // Filter absensi berdasarkan bulan & tahun yang dipilih
  const filteredAttendances = attendances.filter((att) => {
    if (!att.tanggal_absen) return false;
    const [year, month] = att.tanggal_absen.split('-');
    const yearMatch = year === selectedYear;
    const monthMatch = MONTH_NAMES[Number(month) - 1] === selectedMonth;
    return yearMatch && monthMatch;
  });

  const formatTanggal = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year.slice(2)}`;
  };

  const formatJam = (isoStr?: string | null) => {
    if (!isoStr) return '-';
    const date = new Date(isoStr);
    return `${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const isSudahMasuk = Boolean(todayAttendance?.jam_masuk);
  const isSudahPulang = Boolean(todayAttendance?.jam_pulang);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Buttons Status */}
      <div className="flex flex-wrap gap-4 items-center">
        <button 
          className={`text-white text-[15px] font-medium py-2.5 px-6 rounded-md transition-colors ${
            isSudahMasuk ? 'bg-[#299946]' : 'bg-[#CC2929]'
          }`}
        >
          {isSudahMasuk ? `Sudah Absen Masuk (${formatJam(todayAttendance?.jam_masuk)})` : 'Belum Absensi Masuk'}
        </button>
        <button 
          className={`text-white text-[15px] font-medium py-2.5 px-6 rounded-md transition-colors ${
            isSudahPulang ? 'bg-[#299946]' : 'bg-[#CC2929]'
          }`}
        >
          {isSudahPulang ? `Sudah Absen Pulang (${formatJam(todayAttendance?.jam_pulang)})` : 'Belum Absensi Pulang'}
        </button>
        <Link 
          href="/dashboard-siswa"
          className="bg-[#F0F0F0] text-black text-[15px] font-medium py-2.5 px-6 rounded-md hover:bg-gray-200 transition-colors inline-block"
        >
          Absen Sekarang
        </Link>
      </div>

      <hr className="border-t border-gray-400 my-2" />

      {/* Filter Section */}
      <div className="flex flex-col gap-3">
        <label className="text-[15px] font-medium text-black">Filterisasi :</label>
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="relative">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none bg-[#F0F0F0] text-black text-[15px] font-medium py-2 pl-4 pr-10 rounded-md outline-none cursor-pointer"
              >
                <option value="2027">2027</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
            
            <div className="relative">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-[#F0F0F0] text-black text-[15px] font-medium py-2 pl-4 pr-10 rounded-md outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => window.print()}
            className="text-black hover:text-gray-700 transition-colors p-1" 
            title="Cetak Laporan"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full bg-white mt-4 border border-gray-400 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr className="bg-[#EBEBEB] border-b border-gray-400">
                <th className="py-3.5 px-4 font-normal text-[15px] text-black w-[20%]">Tanggal</th>
                <th className="py-3.5 px-4 font-normal text-[15px] text-black w-[15%]">Status</th>
                <th className="py-3.5 px-4 font-normal text-[15px] text-black w-[20%]">Waktu Masuk</th>
                <th className="py-3.5 px-4 font-normal text-[15px] text-black w-[20%]">Waktu Pulang</th>
                <th className="py-3.5 px-4 font-normal text-[15px] text-black w-[25%]">Laporan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500 text-[15px]">
                    Memuat data riwayat absensi dari Supabase...
                  </td>
                </tr>
              ) : filteredAttendances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500 text-[15px]">
                    Tidak ada data absensi pada {selectedMonth} {selectedYear}.
                  </td>
                </tr>
              ) : (
                filteredAttendances.map((att) => (
                  <tr key={att.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-[15px] text-black font-normal">
                      {formatTanggal(att.tanggal_absen)}
                    </td>
                    <td className="py-3.5 px-4 text-[15px] text-black font-normal">
                      {att.status_kehadiran || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-[15px] text-black font-normal">
                      {formatJam(att.jam_masuk)}
                    </td>
                    <td className="py-3.5 px-4 text-[15px] text-black font-normal">
                      {formatJam(att.jam_pulang)}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex justify-center items-center">
                        <button 
                          onClick={() => {
                            setSelectedAttendance(att);
                            setModalOpen(true);
                          }}
                          className="bg-[#000066] text-white px-5 py-2 rounded-lg font-normal text-[14px] hover:bg-[#000044] transition-colors"
                        >
                          Lihat Laporan
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

      {/* Modal Detail Laporan */}
      {modalOpen && selectedAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4">
          <div className="bg-[#EDEDED] w-full max-w-[440px] rounded-[28px] p-6 sm:p-7 relative shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#000066]/30 [&::-webkit-scrollbar-thumb]:rounded-full border border-gray-300">
            {/* Tombol Kembali (Panah Kiri) */}
            <button 
              type="button"
              onClick={() => setModalOpen(false)} 
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
                Tanggal: {formatTanggal(selectedAttendance.tanggal_absen)} | Status: {selectedAttendance.status_kehadiran || '-'}
              </p>
            </div>

            {/* Konten Laporan */}
            {selectedAttendance.reports && selectedAttendance.reports.length > 0 ? (
              (() => {
                const rep = selectedAttendance.reports[0];
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
                Belum ada laporan kegiatan yang dikirim untuk absensi ini.
              </div>
            )}

            {/* Tombol Tutup di Kanan Bawah */}
            <div className="mt-5 flex justify-end">
              <button 
                type="button"
                onClick={() => setModalOpen(false)}
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
