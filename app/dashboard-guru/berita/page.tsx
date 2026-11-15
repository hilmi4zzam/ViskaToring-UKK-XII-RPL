"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';
import { NewsItem } from '@/supabase/types';

const STORAGE_KEY = 'viskatoring_news_data';

export default function BeritaPembimbingPage() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const formatTanggal = (isoStr?: string) => {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchBerita = async () => {
      try {
        // GURU HANYA MENGAMBIL BERITA DENGAN KATEGORI 'guru'
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .eq('kategori', 'guru')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setNewsList(data as NewsItem[]);
          return;
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const all = JSON.parse(saved) as NewsItem[];
            setNewsList(all.filter((b) => b.kategori === 'guru'));
            return;
          } catch {
            // ignore
          }
        }
      } catch {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const all = JSON.parse(saved) as NewsItem[];
            setNewsList(all.filter((b) => b.kategori === 'guru'));
          } catch {
            // ignore
          }
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchBerita();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center w-full h-full min-h-[400px]">
        <p className="text-[14px] text-gray-500 font-normal">Memuat pengumuman...</p>
      </div>
    );
  }

  if (newsList.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center w-full h-full min-h-[400px]">
        <p className="text-[16px] text-black font-medium">
          Tidak ada berita dari sekolah untuk guru pembimbing
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 max-w-[800px] mx-auto py-2">
      <h2 className="text-[20px] font-semibold text-black mb-2">Berita & Pengumuman Pembimbing (Sekolah)</h2>
      <div className="flex flex-col gap-4">
        {newsList.map((item) => (
          <div
            key={item.id}
            className="w-full bg-[#EDEDED] rounded-[22px] p-5 sm:p-6 shadow-xs flex flex-col gap-2 border border-gray-200"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-[16px] font-semibold text-black leading-snug">
                {item.title}
              </h3>
              <span className="text-[13px] text-gray-600 font-normal shrink-0">
                {formatTanggal(item.created_at)}
              </span>
            </div>
            <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap">
              {item.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
