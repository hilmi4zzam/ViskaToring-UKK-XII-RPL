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
          href="/dashboard"
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
      <div className="w-full bg-white mt-4 overflow-x-auto">
        <table className="w-full border-collapse border border-gray-400 text-center">
          <thead>
            <tr className="border-b border-gray-400 bg-gray-50">
              <th className="py-4 px-4 border-r border-gray-400 font-medium text-[15px] text-black w-[15%]">Tanggal</th>
              <th className="py-4 px-4 border-r border-gray-400 font-medium text-[15px] text-black w-[15%]">Status</th>
              <th className="py-4 px-4 border-r border-gray-400 font-medium text-[15px] text-black w-[25%]">Waktu Masuk</th>
              <th className="py-4 px-4 border-r border-gray-400 font-medium text-[15px] text-black w-[25%]">Waktu Pulang</th>
              <th className="py-4 px-4 font-medium text-[15px] text-black w-[20%]">Laporan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500 text-[15px]">
                  Memuat data riwayat absensi dari Supabase...
                </td>
              </tr>
            ) : filteredAttendances.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500 text-[15px]">
                  Tidak ada data absensi pada {selectedMonth} {selectedYear}.
                </td>
              </tr>
            ) : (
              filteredAttendances.map((att) => (
                <tr key={att.id} className="border-b border-gray-400 last:border-b-0 hover:bg-gray-50/50">
                  <td className="py-4 px-4 border-r border-gray-400 text-[15px] text-black font-medium">
                    {formatTanggal(att.tanggal_absen)}
                  </td>
                  <td className="py-4 px-4 border-r border-gray-400 text-[15px]">
                    <span className={`px-2.5 py-1 rounded-md text-[13px] font-semibold ${
                      att.status_kehadiran === 'WFO' 
                        ? 'bg-blue-100 text-[#000066]' 
                        : att.status_kehadiran === 'WFH'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {att.status_kehadiran}
                    </span>
                  </td>
                  <td className="py-4 px-4 border-r border-gray-400 text-[15px] text-black">
                    {formatJam(att.jam_masuk)}
                  </td>
                  <td className="py-4 px-4 border-r border-gray-400 text-[15px] text-black">
                    {formatJam(att.jam_pulang)}
                  </td>
                  <td className="py-4 px-4 text-[15px] flex justify-center">
                    <button 
                      onClick={() => {
                        setSelectedAttendance(att);
                        setModalOpen(true);
                      }}
                      className="bg-[#000066] text-white px-6 py-1.5 rounded-md font-medium text-[14px] hover:bg-[#000044] transition-colors"
                    >
                      {att.reports && att.reports.length > 0 ? 'Lihat Laporan' : 'Belum Ada Laporan'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail Laporan */}
      {modalOpen && selectedAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-[550px] rounded-2xl p-6 md:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setModalOpen(false)} 
              className="absolute top-5 right-5 text-gray-500 hover:text-black transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h3 className="text-[20px] font-semibold text-black mb-1">Detail Laporan Kegiatan</h3>
            <p className="text-[13px] text-gray-500 mb-6">
              Tanggal: {formatTanggal(selectedAttendance.tanggal_absen)} | Status: {selectedAttendance.status_kehadiran}
            </p>

            {selectedAttendance.reports && selectedAttendance.reports.length > 0 ? (
              selectedAttendance.reports.map((rep) => (
                <div key={rep.id} className="flex flex-col gap-4">
                  <div>
                    <label className="text-[13px] font-medium text-gray-500 block mb-1">Judul Laporan</label>
                    <div className="text-[16px] font-semibold text-black bg-[#EDEDED] p-3 rounded-xl">
                      {rep.judul_laporan}
                    </div>
                  </div>

                  <div>
                    <label className="text-[13px] font-medium text-gray-500 block mb-1">Deskripsi Aktivitas</label>
                    <div className="text-[14px] text-black bg-[#EDEDED] p-3 rounded-xl whitespace-pre-wrap leading-relaxed">
                      {rep.deskripsi_laporan}
                    </div>
                  </div>

                  {rep.bukti_laporan && (
                    <div>
                      <label className="text-[13px] font-medium text-gray-500 block mb-1">Foto Bukti Kegiatan</label>
                      <div className="border border-gray-200 rounded-xl overflow-hidden p-2 bg-gray-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={rep.bukti_laporan} 
                          alt="Bukti Laporan" 
                          className="w-full max-h-[250px] object-contain rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-500">
                Belum ada laporan kegiatan yang dikirim untuk absensi ini. Laporan dibuat saat melakukan absensi pulang.
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setModalOpen(false)}
                className="bg-[#000066] text-white px-8 py-2.5 rounded-xl font-medium text-[15px] hover:bg-[#000044] transition-colors"
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
