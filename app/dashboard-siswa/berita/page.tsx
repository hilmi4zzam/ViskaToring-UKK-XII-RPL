"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/supabase/client';
import { getStoredUser, fetchCurrentUser } from '@/supabase/auth';
import { NewsItem, User } from '@/supabase/types';

const STORAGE_KEY = 'viskatoring_news_data';

export default function BeritaSiswaPage() {
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
      // 1. Ambil Berita Sekolah (kategori = 'siswa')
      const { data: dataSekolah } = await supabase
        .from('news')
        .select('*')
        .eq('kategori', 'siswa')
        .order('created_at', { ascending: false });

      // 2. Ambil Berita DUDI khusus DUDI tempat siswa magang (kategori = 'dudi' & company_id = user.company_id)
      let dataDudi: NewsItem[] = [];
      if (user?.company_id) {
        const { data: dudiRes } = await supabase
          .from('news')
          .select('*')
          .eq('kategori', 'dudi')
          .eq('company_id', user.company_id)
          .order('created_at', { ascending: false });
        if (dudiRes) dataDudi = dudiRes as NewsItem[];
      }

      if (dataSekolah) {
        setNewsSekolah(dataSekolah as NewsItem[]);
        setNewsDudi(dataDudi);
        return;
      }

      // Fallback LocalStorage jika offline/tabel belum ada
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const all = JSON.parse(saved) as NewsItem[];
          setNewsSekolah(all.filter((b) => b.kategori === 'siswa'));
          if (user?.company_id) {
            setNewsDudi(
              all.filter(
                (b) => b.kategori === 'dudi' && b.company_id === user.company_id
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

      setNewsSekolah([]);
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
      const fresh = await fetchCurrentUser();
      const activeUser = fresh || stored;
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

  return (
    <div className="w-full flex flex-col gap-6 pb-8">
      {/* ======================================================== */}
      {/* CONTAINER 1: Berita dari dudi                            */}
      {/* ======================================================== */}
      <div className="w-full bg-white border border-gray-400 rounded-[24px] p-6 shadow-xs flex flex-col h-[280px]">
        <h3 className="text-[17px] font-medium text-black">
          Berita dari dudi :
        </h3>
        <hr className="border-t border-gray-300 mt-3 mb-4 w-full" />

        <div className="flex-1 overflow-y-auto pr-3 flex flex-col gap-3.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#000066] [&::-webkit-scrollbar-thumb]:rounded-full">
          {newsDudi.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-[14px]">
              Tidak ada berita dari DUDI.
            </div>
          ) : (
            newsDudi.map((item) => (
              <div
                key={item.id}
                className="w-full bg-[#EDEDED] rounded-[22px] p-5 shadow-xs flex items-start justify-between gap-4"
              >
                <div className="flex-1 flex flex-col gap-1 min-w-0 pr-2">
                  <h4 className="text-[16px] font-semibold text-black leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-2">
                    {item.content}
                  </p>
                </div>
                <span className="text-[13px] text-black font-normal shrink-0">
                  {formatTanggal(item.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* CONTAINER 2: Berita dari sekolah                         */}
      {/* ======================================================== */}
      <div className="w-full bg-white border border-gray-400 rounded-[24px] p-6 shadow-xs flex flex-col h-[280px]">
        <h3 className="text-[17px] font-medium text-black">
          Berita dari sekolah :
        </h3>
        <hr className="border-t border-gray-300 mt-3 mb-4 w-full" />

        <div className="flex-1 overflow-y-auto pr-3 flex flex-col gap-3.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#000066] [&::-webkit-scrollbar-thumb]:rounded-full">
          {newsSekolah.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-[14px]">
              Tidak ada berita dari sekolah.
            </div>
          ) : (
            newsSekolah.map((item) => (
              <div
                key={item.id}
                className="w-full bg-[#EDEDED] rounded-[22px] p-5 shadow-xs flex items-start justify-between gap-4"
              >
                <div className="flex-1 flex flex-col gap-1 min-w-0 pr-2">
                  <h4 className="text-[16px] font-semibold text-black leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-2">
                    {item.content}
                  </p>
                </div>
                <span className="text-[13px] text-black font-normal shrink-0">
                  {formatTanggal(item.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
