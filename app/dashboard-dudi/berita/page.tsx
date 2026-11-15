"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/supabase/client';
import { getStoredUser, fetchCurrentUser } from '@/supabase/auth';
import { NewsItem, User } from '@/supabase/types';

export default function KelolaBeritaDudiPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [modalType, setModalType] = useState<'create' | 'delete' | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // Form input state
  const [judulInput, setJudulInput] = useState('');
  const [deskripsiInput, setDeskripsiInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Format tanggal menjadi DD/MM/YY (contoh: 14/09/26)
  const formatTanggal = (isoStr?: string) => {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  const loadData = useCallback(async (user: User | null) => {
    setLoading(true);
    try {
      if (!user?.company_id) {
        setNewsList([]);
        setLoading(false);
        return;
      }

      // Ambil berita khusus DUDI ini
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('kategori', 'dudi')
        .eq('company_id', user.company_id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNewsList(data as NewsItem[]);
      } else {
        setNewsList([]);
      }
    } catch (err) {
      console.error('Failed to load dudi news:', err);
      setNewsList([]);
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

  // Handler Buka Modal Tambah Berita
  const handleOpenCreateModal = () => {
    setJudulInput('');
    setDeskripsiInput('');
    setModalType('create');
  };

  // Handler Buka Modal Hapus Berita
  const handleOpenDeleteModal = (item: NewsItem) => {
    setSelectedNews(item);
    setModalType('delete');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedNews(null);
  };

  // Simpan Berita Baru DUDI
  const handleSaveBerita = async () => {
    if (!judulInput.trim() || !deskripsiInput.trim()) {
      alert('Judul dan isi berita wajib diisi.');
      return;
    }

    if (!currentUser?.company_id) {
      alert('Akun DUDI Anda belum terhubung ke perusahaan.');
      return;
    }

    setActionLoading(true);
    const newItem: NewsItem = {
      id: Date.now(),
      title: judulInput.trim(),
      content: deskripsiInput.trim(),
      kategori: 'dudi',
      company_id: currentUser.company_id,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('news')
        .insert({
          title: newItem.title,
          content: newItem.content,
          kategori: 'dudi',
          company_id: currentUser.company_id,
          created_at: newItem.created_at,
        })
        .select();

      if (!error && data && data[0]) {
        newItem.id = data[0].id;
      }
    } catch (err) {
      console.warn('Gagal insert ke Supabase:', err);
    }

    setNewsList([newItem, ...newsList]);
    setActionLoading(false);
    handleCloseModal();
  };

  // Hapus Berita
  const handleConfirmDelete = async () => {
    if (!selectedNews) return;
    setActionLoading(true);

    try {
      await supabase.from('news').delete().eq('id', selectedNews.id);
    } catch (err) {
      console.warn('Gagal hapus di Supabase:', err);
    }

    setNewsList(newsList.filter((b) => b.id !== selectedNews.id));
    setActionLoading(false);
    handleCloseModal();
  };

  const companyName = currentUser?.companies?.company_name || 'DUDI Tempat Magang';

  return (
    <div className="w-full flex flex-col gap-8 pb-10">
      {/* Header Container */}
      <div className="w-full bg-white border border-gray-400 rounded-[24px] p-6 sm:p-7 shadow-xs flex flex-col">
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-300">
          <h3 className="text-[17px] font-medium text-black">
            Beritakan kepada siswa magang {companyName} :
          </h3>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            title="Tambah Berita untuk Siswa Magang"
            className="w-7 h-7 bg-black hover:bg-gray-800 text-white rounded-md flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shadow-xs shrink-0 ml-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        {/* Content List */}
        <div className="mt-4 flex flex-col gap-3.5 max-h-[500px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#000066]/70 [&::-webkit-scrollbar-thumb]:rounded-full">
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-[14px]">
              Memuat data berita DUDI...
            </div>
          ) : newsList.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-[14px]">
              Belum ada pengumuman yang dibuat oleh {companyName}. Tekan tombol + di kanan atas untuk mempublikasikan berita.
            </div>
          ) : (
            newsList.map((item) => (
              <div
                key={item.id}
                className="w-full bg-[#EDEDED] rounded-[20px] py-4 px-5 sm:px-6 flex items-start justify-between gap-4 shadow-xs"
              >
                {/* Bagian Kiri: Judul & Deskripsi */}
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-[15px] font-semibold text-black leading-snug mb-1">
                    {item.title}
                  </h4>
                  <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>

                {/* Bagian Kanan: Tanggal & Tombol Sampah */}
                <div className="flex flex-col items-end justify-between shrink-0 self-stretch">
                  <span className="text-[13px] text-black font-normal">
                    {formatTanggal(item.created_at)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenDeleteModal(item)}
                    title="Hapus Berita"
                    className="w-7 h-7 rounded-lg bg-[#CC2929] hover:bg-[#B32424] text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer mt-2"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* POP UP MODAL: Tambah Berita DUDI */}
      {modalType === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4">
          <div className="bg-[#EDEDED] w-full max-w-[480px] rounded-[28px] p-7 relative shadow-2xl flex flex-col border border-gray-300">
            {/* Tombol Kembali (Panah Kiri) */}
            <button 
              type="button"
              onClick={handleCloseModal}
              className="absolute top-7 left-7 text-black hover:opacity-70 transition-opacity p-1 flex items-center justify-center cursor-pointer"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>

            {/* Judul Modal */}
            <h3 className="text-[20px] font-bold text-center text-black mb-6">
              Tambah Berita DUDI
            </h3>

            {/* Form Fields */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[14px] font-semibold text-black mb-1.5">
                  Judul Berita :
                </label>
                <input
                  type="text"
                  value={judulInput}
                  onChange={(e) => setJudulInput(e.target.value)}
                  placeholder="Masukkan judul pengumuman DUDI..."
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-[14px] text-black placeholder:text-gray-400 focus:outline-none focus:border-[#000066]"
                />
              </div>

              <div>
                <label className="block text-[14px] font-semibold text-black mb-1.5">
                  Isi Berita :
                </label>
                <textarea
                  value={deskripsiInput}
                  onChange={(e) => setDeskripsiInput(e.target.value)}
                  placeholder="Tuliskan detail pengumuman untuk siswa magang..."
                  rows={4}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-[14px] text-black placeholder:text-gray-400 focus:outline-none focus:border-[#000066] resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-[14px] font-medium text-[#334155] bg-white hover:bg-gray-50 border border-gray-300 transition-colors cursor-pointer shadow-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveBerita}
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-xl text-[14px] font-medium text-white bg-[#000066] hover:bg-[#000050] transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                {actionLoading ? 'Menyimpan...' : 'Publikasikan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP UP MODAL: Hapus Berita */}
      {modalType === 'delete' && selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4">
          <div className="bg-[#EDEDED] w-full max-w-[480px] rounded-[28px] p-7 relative shadow-2xl flex flex-col border border-gray-300">
            {/* Tombol Kembali (Panah Kiri) */}
            <button 
              type="button"
              onClick={handleCloseModal}
              className="absolute top-7 left-7 text-black hover:opacity-70 transition-opacity p-1 flex items-center justify-center cursor-pointer"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>

            {/* Judul Modal */}
            <h3 className="text-[20px] font-bold text-center text-black mb-6">
              Hapus Berita
            </h3>

            {/* Konfirmasi Teks */}
            <p className="text-[14px] text-gray-700 text-center leading-relaxed px-4 mb-6">
              Yakin untuk menghapus pengumuman <strong className="text-black">&quot;{selectedNews.title}&quot;</strong>?
            </p>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={actionLoading}
                className="w-[120px] py-2.5 rounded-[18px] text-[14px] font-medium text-[#334155] bg-white hover:bg-gray-50 border border-gray-300 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="w-[120px] py-2.5 rounded-[18px] text-[14px] font-medium text-white bg-[#CC2929] hover:bg-[#B32424] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {actionLoading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
