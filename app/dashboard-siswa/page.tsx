"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabase/client';
import { getStoredUser, fetchCurrentUser } from '@/supabase/auth';
import { Attendance, User } from '@/supabase/types';
import { getLocalDateString, MAX_REPORT_IMAGE_SIZE, calculateDistanceInMeters } from '@/supabase/helpers';

export default function DashboardBeranda() {
  const [currentTime, setCurrentTime] = useState('00.00.00');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Real stats dari Supabase
  const [statsWfo, setStatsWfo] = useState<number>(0);
  const [statsWfh, setStatsWfh] = useState<number>(0);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Modal Absensi State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [absenType, setAbsenType] = useState<'masuk' | 'pulang'>('masuk');
  const [statusKehadiran, setStatusKehadiran] = useState<'WFO' | 'WFH'>('WFH');
  const [detectingGps, setDetectingGps] = useState(false);
  const [detectedDistance, setDetectedDistance] = useState<number | null>(null);
  const [gpsNotice, setGpsNotice] = useState<string>('');
  const [judulLaporan, setJudulLaporan] = useState('');
  const [deskripsiLaporan, setDeskripsiLaporan] = useState('');
  const [buktiImage, setBuktiImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [absenError, setAbsenError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Efek untuk jam realtime
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.getHours().toString().padStart(2, '0') + '.' +
        now.getMinutes().toString().padStart(2, '0') + '.' +
        now.getSeconds().toString().padStart(2, '0')
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format jam dari ISO timestamp
  const formatTimeOnly = (isoString?: string | null) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return (
      date.getHours().toString().padStart(2, '0') + '.' +
      date.getMinutes().toString().padStart(2, '0')
    );
  };

  // Muat data absensi hari ini & statistik dari Supabase
  const loadDashboardData = useCallback(async (user: User) => {
    setLoadingData(true);
    const today = getLocalDateString();

    try {
      // 1. Ambil absensi hari ini
      const { data: attToday, error: attError } = await supabase
        .from('attendances')
        .select('*, reports(*)')
        .eq('user_id', user.id)
        .eq('tanggal_absen', today)
        .maybeSingle();

      if (attError) console.error('Error fetching today attendance:', attError);
      setTodayAttendance(attToday);

      // Tentukan default tab modal
      if (attToday?.jam_masuk && !attToday?.jam_pulang) {
        setAbsenType('pulang');
      } else {
        setAbsenType('masuk');
      }

      // 2. Hitung jumlah Hadir ke DUDI (WFO)
      const { count: wfoCount } = await supabase
        .from('attendances')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status_kehadiran', 'WFO');

      setStatsWfo(wfoCount || 0);

      // 3. Hitung jumlah Hadir WFH
      const { count: wfhCount } = await supabase
        .from('attendances')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status_kehadiran', 'WFH');

      setStatsWfh(wfhCount || 0);

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    const initializeDashboard = async () => {
      const stored = getStoredUser();
      if (!stored) return;

      const user = (await fetchCurrentUser()) || stored;
      setCurrentUser(user);
      await loadDashboardData(user);
    };

    void initializeDashboard();
  }, [loadDashboardData]);

  // Fungsi deteksi GPS otomatis untuk menentukan status WFO atau WFH
  const detectLocation = useCallback(() => {
    const comp = currentUser?.companies;
    if (!comp || comp.latitude === null || comp.longitude === null) {
      setStatusKehadiran('WFH');
      setGpsNotice('Koordinat DUDI belum diatur. Otomatis tercatat WFH.');
      return;
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatusKehadiran('WFH');
      setGpsNotice('Perangkat tidak mendukung GPS. Otomatis tercatat WFH.');
      return;
    }

    setDetectingGps(true);
    setGpsNotice('Sedang mengukur jarak lokasi GPS ke kantor DUDI...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;
        const dist = calculateDistanceInMeters(
          userLat,
          userLon,
          comp.latitude as number,
          comp.longitude as number
        );

        setDetectedDistance(dist);
        const radius = comp.radius_meters || 100;

        if (dist <= radius) {
          setStatusKehadiran('WFO');
          setGpsNotice(`Di dalam radius DUDI (${dist}m dari kantor, batas: ${radius}m).`);
        } else {
          setStatusKehadiran('WFH');
          const distLabel = dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${dist} m`;
          setGpsNotice(`Di luar radius DUDI (${distLabel} dari kantor, batas: ${radius}m).`);
        }
        setDetectingGps(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setStatusKehadiran('WFH');
        setGpsNotice('Izin lokasi GPS tidak aktif. Otomatis tercatat WFH.');
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [currentUser?.companies]);

  // Handler upload foto bukti laporan (Base64)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAbsenError('Bukti laporan harus berupa file gambar.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_REPORT_IMAGE_SIZE) {
      setAbsenError('Ukuran foto bukti maksimal 5 MB.');
      e.target.value = '';
      return;
    }

    setAbsenError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') setBuktiImage(reader.result);
    };
    reader.onerror = () => setAbsenError('Foto bukti gagal dibaca. Silakan pilih file lain.');
    reader.readAsDataURL(file);
  };

  // Handler Submit Absensi ke Supabase
  const handleSubmitAbsen = async () => {
    if (!currentUser) return;
    setAbsenError('');
    setSubmitting(true);

    const today = getLocalDateString();
    const nowIso = new Date().toISOString();

    try {
      if (absenType === 'masuk') {
        if (todayAttendance?.jam_masuk) {
          setAbsenError('Kamu sudah melakukan absensi masuk hari ini.');
          setSubmitting(false);
          return;
        }

        const { error } = await supabase.from('attendances').insert({
          user_id: currentUser.id,
          tanggal_absen: today,
          jam_masuk: nowIso,
          status_kehadiran: statusKehadiran,
        });

        if (error) {
          console.error('Insert attendance error:', error);
          setAbsenError('Gagal mencatat absensi: ' + error.message);
          setSubmitting(false);
          return;
        }

      } else {
        // Absen Pulang + Laporan
        if (!todayAttendance?.id) {
          setAbsenError('Kamu belum melakukan absensi masuk hari ini!');
          setSubmitting(false);
          return;
        }

        if (todayAttendance.jam_pulang) {
          setAbsenError('Kamu sudah melakukan absensi pulang hari ini.');
          setSubmitting(false);
          return;
        }

        if (!judulLaporan.trim() || !deskripsiLaporan.trim()) {
          setAbsenError('Judul dan Deskripsi laporan wajib diisi sebelum absen pulang.');
          setSubmitting(false);
          return;
        }

        // 1. Update jam pulang di tabel attendances
        const { error: updateAttError } = await supabase
          .from('attendances')
          .update({ jam_pulang: nowIso })
          .eq('id', todayAttendance.id);

        if (updateAttError) {
          setAbsenError('Gagal memperbarui jam pulang: ' + updateAttError.message);
          setSubmitting(false);
          return;
        }

        // 2. Simpan laporan harian ke tabel reports
        const { error: reportError } = await supabase
          .from('reports')
          .insert({
            attendance_id: todayAttendance.id,
            judul_laporan: judulLaporan.trim(),
            deskripsi_laporan: deskripsiLaporan.trim(),
            bukti_laporan: buktiImage,
          });

        if (reportError) {
          console.error('Report insert error:', reportError);
          const { error: rollbackError } = await supabase
            .from('attendances')
            .update({ jam_pulang: null })
            .eq('id', todayAttendance.id)
            .eq('user_id', currentUser.id);

          if (rollbackError) {
            console.error('Rollback jam pulang error:', rollbackError);
            setAbsenError(`Laporan gagal disimpan dan jam pulang tidak dapat dibatalkan: ${reportError.message}`);
          } else {
            setAbsenError(`Laporan gagal disimpan: ${reportError.message}`);
          }
          setSubmitting(false);
          return;
        }
      }

      // Reset form dan refresh data
      setJudulLaporan('');
      setDeskripsiLaporan('');
      setBuktiImage(null);
      setIsModalOpen(false);
      await loadDashboardData(currentUser);

    } catch (err) {
      console.error(err);
      setAbsenError('Terjadi kesalahan saat memproses absensi.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSudahMasuk = Boolean(todayAttendance?.jam_masuk);
  const isSudahPulang = Boolean(todayAttendance?.jam_pulang);
  const todayReport = todayAttendance?.reports && todayAttendance.reports.length > 0 ? todayAttendance.reports[0] : null;

  return (
    <div className="w-full max-w-[940px] mx-auto flex flex-col gap-5 md:gap-8">
      
      {/* Top Stats Row (Gambar 1: Bersebelahan rapi di mobile & desktop) */}
      <div className="flex gap-3.5 md:gap-8">
        <div className="flex-1 bg-white border border-gray-400 md:border-gray-300 rounded-[20px] md:rounded-[24px] p-4 md:p-8 flex flex-col items-center justify-center shadow-xs md:shadow-sm">
          <span className="text-[36px] md:text-[60px] font-bold md:font-medium text-black leading-none mb-1.5 md:mb-2">
            {loadingData ? '-' : statsWfo}
          </span>
          <span className="text-[13px] md:text-[18px] text-black md:text-gray-700 font-normal text-center">Hadir Ke Dudi</span>
        </div>
        <div className="flex-1 bg-white border border-gray-400 md:border-gray-300 rounded-[20px] md:rounded-[24px] p-4 md:p-8 flex flex-col items-center justify-center shadow-xs md:shadow-sm">
          <span className="text-[36px] md:text-[60px] font-bold md:font-medium text-black leading-none mb-1.5 md:mb-2">
            {loadingData ? '-' : statsWfh}
          </span>
          <span className="text-[13px] md:text-[18px] text-black md:text-gray-700 font-normal text-center">Hadir WFH</span>
        </div>
      </div>

      {/* Middle Content Row: Pada mobile Absen Actions berada di atas (order-1), Pratinjau berada di bawah (order-2) */}
      <div className="flex flex-col md:flex-row gap-5 md:gap-8 flex-1 md:min-h-[380px]">
        
        {/* Pratinjau Absensi atau Highlight Laporan Absen Pulang (order-2 on mobile, order-1 on desktop) */}
        <div className="order-2 md:order-1 flex-1 flex flex-col">
          {isSudahPulang ? (
            <div className="flex-1 bg-white border border-gray-400 md:border-gray-300 rounded-[24px] p-6 md:p-8 flex flex-col justify-between shadow-xs md:shadow-sm">
              <div>
                {/* Header Highlight */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#299946]"></span>
                    <span className="text-[14px] font-semibold text-gray-800">
                      Laporan Absensi Pulang
                    </span>
                  </div>
                  <span className="text-[12px] bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-full border border-emerald-200">
                    {todayAttendance?.status_kehadiran} • {formatTimeOnly(todayAttendance?.jam_pulang)}
                  </span>
                </div>

                {/* Judul Kegiatan */}
                <h3 className="text-[18px] font-semibold text-black mb-2 line-clamp-1">
                  {todayReport?.judul_laporan || 'Laporan Harian'}
                </h3>

                {/* Deskripsi Kegiatan */}
                <p className="text-[14px] text-gray-600 leading-relaxed mb-4 line-clamp-3">
                  {todayReport?.deskripsi_laporan || 'Tidak ada deskripsi laporan kegiatan.'}
                </p>
              </div>

              {/* Foto Bukti Kegiatan (jika ada) */}
              {todayReport?.bukti_laporan ? (
                <div className="mt-auto pt-2">
                  <p className="text-[12px] text-gray-500 mb-1.5 font-medium">Foto Bukti Kegiatan :</p>
                  <div className="relative w-full h-[140px] rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={todayReport.bukti_laporan} 
                      alt="Bukti Laporan" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-400">
                  <span>Masuk: {formatTimeOnly(todayAttendance?.jam_masuk)}</span>
                  <span>Pulang: {formatTimeOnly(todayAttendance?.jam_pulang)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 bg-[#EDEDED] md:bg-[#F0F0F0] rounded-[24px] flex flex-col items-center justify-center p-8 md:p-10 text-center min-h-[220px] md:min-h-0">
              <div className={`w-[80px] h-[80px] md:w-[84px] md:h-[84px] rounded-full flex items-center justify-center mb-6 md:mb-8 text-white shadow-md transition-colors ${
                isSudahMasuk ? 'bg-[#299946]' : 'bg-[#CC2929]'
              }`}>
                {isSudahMasuk ? (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                )}
              </div>
              <p className="text-[16px] md:text-[18px] font-medium text-black leading-snug">
                {isSudahMasuk ? (
                  <>
                    Sudah Absensi Masuk<br/>
                    <span className="text-[13px] md:text-[14px] text-gray-600 font-normal">
                      Pukul {formatTimeOnly(todayAttendance?.jam_masuk)} ({todayAttendance?.status_kehadiran})
                    </span>
                  </>
                ) : (
                  <>
                    Pratinjau Absensi<br/>Pada Hari Ini
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Absen Actions (order-1 on mobile, order-2 on desktop) */}
        <div className="order-1 md:order-2 flex-1 bg-white border border-gray-400 md:border-gray-300 rounded-[24px] p-4 sm:p-6 md:p-8 flex flex-col gap-3.5 md:gap-7 shadow-xs md:shadow-sm">
          
          <div className="flex flex-col gap-3 md:gap-4">
            {/* Status Masuk */}
            <button 
              className={`w-full text-white text-[15px] md:text-[16px] font-medium py-3.5 md:py-4 rounded-xl transition-colors ${
                isSudahMasuk ? 'bg-[#299946]' : 'bg-[#CC2929]'
              }`}
            >
              {isSudahMasuk 
                ? `Sudah Absensi Masuk (${formatTimeOnly(todayAttendance?.jam_masuk)})`
                : 'Belum Absensi Masuk'
              }
            </button>

            {/* Status Pulang */}
            <button 
              className={`w-full text-white text-[15px] md:text-[16px] font-medium py-3.5 md:py-4 rounded-xl transition-colors ${
                isSudahPulang ? 'bg-[#299946]' : 'bg-[#CC2929]'
              }`}
            >
              {isSudahPulang 
                ? `Sudah Absensi Pulang (${formatTimeOnly(todayAttendance?.jam_pulang)})`
                : 'Belum Absensi Pulang'
              }
            </button>
          </div>

          <div className="bg-[#EDEDED] md:bg-[#F0F0F0] rounded-[22px] md:rounded-[24px] py-8 px-6 md:p-8 min-h-[190px] md:min-h-0 flex-1 flex flex-col items-center justify-center border border-gray-200/60 md:border-gray-200">
            <div className="text-[48px] sm:text-[50px] md:text-[52px] font-medium text-black tracking-wider md:tracking-widest mb-4 md:mb-5 leading-none">
              {currentTime}
            </div>
            <button 
              disabled={isSudahMasuk && isSudahPulang}
              onClick={() => {
                if (isSudahMasuk && isSudahPulang) return;
                setAbsenError('');
                setIsModalOpen(true);
                if (absenType === 'masuk') {
                  detectLocation();
                }
              }}
              className="w-full max-w-[240px] md:max-w-none bg-white text-black text-[15px] md:text-[16px] font-medium py-3 md:py-4 rounded-xl shadow-xs md:shadow-sm hover:bg-gray-50 transition-colors disabled:cursor-not-allowed cursor-pointer text-center"
            >
              {isSudahMasuk && isSudahPulang ? 'Absensi Lengkap' : 'Absen Sekarang'}
            </button>
          </div>
          
        </div>
      </div>

      {/* Modal Absensi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[#F0F0F0] w-full max-w-[650px] rounded-[24px] p-8 md:p-10 relative flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            
            {/* Header Modal */}
            <div className="flex items-center mb-8 relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute left-0 text-black hover:text-gray-600 transition-colors">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
              <h2 className="text-[24px] font-semibold text-black w-full text-center">Card Absensi</h2>
            </div>

            {/* Form Modal */}
            <div className="flex flex-col gap-6">
              
              {/* Absen Sebagai */}
              <div>
                <label className="block text-[15px] font-medium text-black mb-3">Absen Sebagai :</label>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setAbsenType('masuk');
                      detectLocation();
                    }}
                    className={`flex-1 py-3 rounded-xl font-medium text-[15px] transition-all bg-white border-2 ${
                      absenType === 'masuk' ? 'border-[#000066] text-[#000066]' : 'border-transparent text-gray-500 hover:border-gray-300 shadow-sm'
                    }`}
                  >
                    Masuk
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAbsenType('pulang')}
                    className={`flex-1 py-3 rounded-xl font-medium text-[15px] transition-all bg-white border-2 ${
                      absenType === 'pulang' ? 'border-[#000066] text-[#000066]' : 'border-transparent text-gray-500 hover:border-gray-300 shadow-sm'
                    }`}
                  >
                    Pulang
                  </button>
                </div>
              </div>

              {/* Status Kehadiran (WFO / WFH) - Dihitung Otomatis Berdasarkan Jarak GPS ke DUDI */}
              {absenType === 'masuk' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[15px] font-medium text-black">Tipe Kehadiran (Otomatis GPS) :</label>
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={detectingGps}
                      className="text-xs text-[#000066] font-medium hover:underline flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={detectingGps ? "animate-spin" : ""}>
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                      </svg>
                      {detectingGps ? 'Mendeteksi...' : 'Cek Ulang Lokasi'}
                    </button>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 border border-gray-200 flex flex-col gap-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className={`px-3.5 py-1.5 rounded-lg text-[14px] font-semibold flex items-center gap-2 ${
                        statusKehadiran === 'WFO' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${statusKehadiran === 'WFO' ? 'bg-emerald-600' : 'bg-amber-600'} animate-pulse`}></span>
                        {statusKehadiran === 'WFO' ? 'WFO (Hadir di DUDI)' : 'WFH (Bekerja dari Rumah)'}
                      </div>

                      {detectedDistance !== null && (
                        <span className="text-xs text-gray-500 font-medium">
                          Jarak: <b className="text-black">{detectedDistance >= 1000 ? `${(detectedDistance / 1000).toFixed(1)} km` : `${detectedDistance} m`}</b>
                        </span>
                      )}
                    </div>

                    <p className="text-[12px] text-gray-600 leading-relaxed">
                      {gpsNotice || 'Menyesuaikan status kehadiran berdasarkan jarak GPS saat ini ke titik koordinat DUDI.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Form Laporan Kegiatan - Hanya Muncul Saat Absen Pulang */}
              {absenType === 'pulang' && (
                <>
                  {/* Judul Laporan */}
                  <div>
                    <label className="block text-[15px] font-medium mb-3 text-black">
                      Judul Laporan Kegiatan :
                    </label>
                    <input 
                      type="text" 
                      value={judulLaporan}
                      onChange={(e) => setJudulLaporan(e.target.value)}
                      placeholder="Contoh: Pembuatan modul frontend"
                      className="w-full bg-white rounded-xl px-5 py-4 text-[15px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all shadow-sm"
                    />
                  </div>

                  {/* Deskripsi Laporan */}
                  <div>
                    <label className="block text-[15px] font-medium mb-3 text-black">
                      Deskripsi Laporan :
                    </label>
                    <textarea 
                      value={deskripsiLaporan}
                      onChange={(e) => setDeskripsiLaporan(e.target.value)}
                      placeholder="Jelaskan rincian aktivitas dan capaian magang hari ini..."
                      className="w-full bg-white rounded-xl px-5 py-4 text-[15px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all shadow-sm min-h-[120px] resize-none"
                    ></textarea>
                  </div>

                  {/* Foto Bukti */}
                  <div>
                    <label className="block text-[15px] font-medium mb-3 text-black">
                      Foto Bukti Kegiatan :
                    </label>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="hidden" 
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white rounded-xl px-6 py-4 flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 transition-colors w-max"
                    >
                      <svg className="text-gray-600" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      <span className="text-[15px] font-medium text-gray-700">
                        {buktiImage ? 'Foto Terpilih (Klik untuk Ganti)' : 'Unggah Gambar'}
                      </span>
                    </button>

                    {buktiImage && (
                      <div className="mt-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={buktiImage} alt="Bukti" className="h-28 rounded-lg object-cover border border-gray-300" />
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>

            {absenError && (
              <p className="text-red-500 text-sm mt-4 font-medium text-center">{absenError}</p>
            )}

            {/* Bottom Button */}
            <div className="flex justify-end mt-8">
              <button 
                type="button"
                onClick={handleSubmitAbsen}
                disabled={submitting}
                className="bg-[#000066] text-white rounded-xl px-12 py-[14px] text-[16px] font-medium hover:bg-[#000044] disabled:bg-gray-400 transition-colors shadow-md flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  absenType === 'masuk' ? 'Absen Masuk' : 'Absen Pulang & Kirim Laporan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
