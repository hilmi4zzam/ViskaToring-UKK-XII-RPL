"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/supabase/client';
import { getStoredUser, fetchCurrentUser } from '@/supabase/auth';
import { NewsItem, User } from '@/supabase/types';

const STORAGE_KEY = 'viskatoring_news_data';

export default function BeritaSiswaPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newsSekolah, setNewsSekolah] = useState<NewsItem[]>([]);
  const [newsDudi, setNewsDudi] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const formatTanggal = (isoStr?: string) => {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  const loadData = useCallback(async (user: User | null) => {
    try {
      // 1. Ambil Berita Sekolah (source_type = 'sekolah' & target_role IN ('siswa', 'semua'))
      const { data: dataSekolah } = await supabase
        .from('news')
        .select('*')
        .eq('source_type', 'sekolah')
        .in('target_role', ['siswa', 'semua'])
        .order('created_at', { ascending: false });

      // 2. Ambil Berita DUDI khusus DUDI tempat siswa magang (source_type = 'dudi' & company_id = user.company_id)
      let dataDudi: NewsItem[] = [];
      if (user?.company_id) {
        const { data: dudiRes } = await supabase
          .from('news')
          .select('*')
          .eq('source_type', 'dudi')
          .eq('company_id', user.company_id)
          .order('created_at', { ascending: false });
        if (dudiRes) dataDudi = dudiRes as NewsItem[];
      }

      if (dataSekolah && dataSekolah.length > 0) {
        setNewsSekolah(dataSekolah as NewsItem[]);
        setNewsDudi(dataDudi);
        return;
      }

      // Fallback LocalStorage jika offline/tabel belum ada
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const all = JSON.parse(saved) as NewsItem[];
          setNewsSekolah(
            all.filter(
              (b) => b.source_type === 'sekolah' && (b.target_role === 'siswa' || b.target_role === 'semua')
            )
          );
          if (user?.company_id) {
            setNewsDudi(
              all.filter(
                (b) => b.source_type === 'dudi' && b.company_id === user.company_id
              )
            );
          } else {
            setNewsDudi([]);
          }
          return;
        } catch {
          // ignore error
        }
      }

      // Data Default Sekolah
      setNewsSekolah([
        {
          id: 1,
          title: 'Anak PKL wajib menaati aturan DUDI.',
          content: 'Setiap anak yang pkl harus menaati aturan selayaknya kalian bekerja secara langsung di industri...',
          source_type: 'sekolah',
          company_id: null,
          target_role: 'siswa',
          created_at: '2026-09-14T08:00:00.000Z',
        },
      ]);
      setNewsDudi([]);
    } catch {
      // Fallback aman
      setNewsSekolah([]);
      setNewsDudi([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const stored = getStoredUser();
      setCurrentUser(stored);

      const fresh = await fetchCurrentUser();
      const activeUser = fresh || stored;
      if (fresh) setCurrentUser(fresh);

      await loadData(activeUser);
    };

    void init();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center w-full h-full min-h-[400px]">
        <p className="text-[14px] text-gray-500 font-normal">Memuat pengumuman...</p>
      </div>
    );
  }

  const dudiName = currentUser?.companies?.company_name || 'DUDI Tempat Magang';

  return (
    <div className="w-full flex flex-col gap-6 pb-10">
      {/* Header Halaman */}
      <div>
        <h2 className="text-[24px] font-bold text-black leading-tight">
          Pusat Informasi & Pengumuman
        </h2>
        <p className="text-[14px] text-gray-500 mt-1">
          Pantau instruksi penting resmi dari pihak sekolah dan pengumuman internal dari tempat magang Anda.
        </p>
      </div>

      {/* Grid 2 Kolom: Kolom 1 Sekolah, Kolom 2 DUDI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* ======================================================== */}
        {/* KOLOM 1: Berita dari Sekolah                             */}
        {/* ======================================================== */}
        <div className="bg-white border border-gray-400 rounded-[24px] p-6 shadow-xs flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-300">
            <h3 className="text-[17px] font-semibold text-black flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#000066]"></span>
              Berita dari Sekolah :
            </h3>
            <span className="text-[12px] bg-[#000066]/10 text-[#000066] font-medium px-2.5 py-1 rounded-full">
              Pihak Sekolah
            </span>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto pr-2 flex flex-col gap-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#000066]/70 [&::-webkit-scrollbar-thumb]:rounded-full">
            {newsSekolah.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-[14px]">
                Belum ada pengumuman dari sekolah untuk siswa.
              </div>
            ) : (
              newsSekolah.map((item) => (
                <div
                  key={item.id}
                  className="w-full bg-[#EDEDED] rounded-[20px] p-5 shadow-xs flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-[15px] font-semibold text-black leading-snug">
                      {item.title}
                    </h4>
                    <span className="text-[12px] text-gray-600 font-normal shrink-0">
                      {formatTanggal(item.created_at)}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* KOLOM 2: Berita dari DUDI                                */}
        {/* ======================================================== */}
        <div className="bg-white border border-gray-400 rounded-[24px] p-6 shadow-xs flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-300">
            <h3 className="text-[17px] font-semibold text-black flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              Berita dari DUDI :
            </h3>
            <span className="text-[12px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium px-2.5 py-1 rounded-full truncate max-w-[180px]">
              {dudiName}
            </span>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto pr-2 flex flex-col gap-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-emerald-600/70 [&::-webkit-scrollbar-thumb]:rounded-full">
            {!currentUser?.company_id ? (
              <div className="py-16 text-center text-gray-400 text-[14px]">
                Anda belum memilih tempat magang (DUDI).
              </div>
            ) : newsDudi.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-[14px]">
                Belum ada berita khusus dari {dudiName}.
              </div>
            ) : (
              newsDudi.map((item) => (
                <div
                  key={item.id}
                  className="w-full bg-[#EDEDED] rounded-[20px] p-5 shadow-xs flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-[15px] font-semibold text-black leading-snug">
                      {item.title}
                    </h4>
                    <span className="text-[12px] text-gray-600 font-normal shrink-0">
                      {formatTanggal(item.created_at)}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
