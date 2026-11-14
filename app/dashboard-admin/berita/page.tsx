"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/supabase/client';
import { BeritaItem } from '@/supabase/types';

const STORAGE_KEY = 'viskatoring_berita_data';

const DEFAULT_BERITA: BeritaItem[] = [
  {
    id: '1',
    judul: 'Anak PKL wajib menaati aturan DUDI.',
    deskripsi: 'Setiap anak yang pkl harus menaati aturan selayaknya kalian bekerja secara langsung di industri...',
    target: 'siswa',
    created_at: '2026-09-14T08:00:00.000Z',
  },
  {
    id: '2',
    judul: 'Anak PKL wajib menaati aturan DUDI.',
    deskripsi: 'Setiap anak yang pkl harus menaati aturan selayaknya kalian bekerja secara langsung di industri...',
    target: 'guru',
    created_at: '2026-09-14T08:00:00.000Z',
  },
  {
    id: '3',
    judul: 'Anak PKL wajib menaati aturan DUDI.',
    deskripsi: 'Setiap anak yang pkl harus menaati aturan selayaknya kalian bekerja secara langsung di industri...',
    target: 'guru',
    created_at: '2026-09-14T08:00:00.000Z',
  },
];

export default function KelolaBeritaPage() {
  const [beritaList, setBeritaList] = useState<BeritaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [modalType, setModalType] = useState<'create' | 'delete' | null>(null);
  const [targetType, setTargetType] = useState<'siswa' | 'guru'>('siswa');
  const [selectedBerita, setSelectedBerita] = useState<BeritaItem | null>(null);

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

  const loadData = useCallback(async () => {
    try {
      // 1. Coba ambil dari Supabase
      const { data, error } = await supabase
        .from('berita')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setBeritaList(data as BeritaItem[]);
        return;
      }

      // 2. Fallback ke LocalStorage jika tabel belum dibuat atau kosong
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as BeritaItem[];
          setBeritaList(parsed);
          return;
        } catch {
          // ignore error
        }
      }

      // 3. Inisialisasi data default
      setBeritaList(DEFAULT_BERITA);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BERITA));
    } catch {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setBeritaList(JSON.parse(saved) as BeritaItem[]);
        } catch {
          setBeritaList(DEFAULT_BERITA);
        }
      } else {
        setBeritaList(DEFAULT_BERITA);
      }
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

  // Handler Buka Modal Tambah Berita
  const handleOpenCreateModal = (target: 'siswa' | 'guru') => {
    setTargetType(target);
    setJudulInput('');
    setDeskripsiInput('');
    setModalType('create');
  };

  // Handler Buka Modal Hapus Berita
  const handleOpenDeleteModal = (item: BeritaItem) => {
    setSelectedBerita(item);
    setModalType('delete');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedBerita(null);
  };

  // Simpan Berita Baru
  const handleSaveBerita = async () => {
    if (!judulInput.trim() || !deskripsiInput.trim()) {
      alert('Judul dan isi berita wajib diisi.');
      return;
    }

    setActionLoading(true);
    const newBerita: BeritaItem = {
      id: Date.now().toString(),
      judul: judulInput.trim(),
      deskripsi: deskripsiInput.trim(),
      target: targetType,
      created_at: new Date().toISOString(),
    };

    try {
      // Coba simpan ke Supabase jika ada tabel berita
      const { error } = await supabase.from('berita').insert({
        judul: newBerita.judul,
        deskripsi: newBerita.deskripsi,
        target: newBerita.target,
        created_at: newBerita.created_at,
      });

      if (error) {
        console.warn('Simpan ke Supabase dilewati, menggunakan penyimpanan lokal:', error.message);
      }
    } catch (err) {
      console.warn('Gagal insert ke Supabase, fallback ke lokal:', err);
    }

    // Selalu perbarui state lokal & localStorage
    const updated = [newBerita, ...beritaList];
    setBeritaList(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setActionLoading(false);
    handleCloseModal();
  };

  // Hapus Berita
  const handleConfirmDelete = async () => {
    if (!selectedBerita) return;
    setActionLoading(true);

    try {
      // Coba hapus di Supabase jika ada
      await supabase.from('berita').delete().eq('id', selectedBerita.id);
    } catch (err) {
      console.warn('Gagal hapus di Supabase, fallback ke lokal:', err);
    }

    const updated = beritaList.filter((b) => b.id !== selectedBerita.id);
    setBeritaList(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setActionLoading(false);
    handleCloseModal();
  };

  // Filter per target
  const beritaSiswa = beritaList.filter((b) => b.target === 'siswa' || b.target === 'semua');
  const beritaGuru = beritaList.filter((b) => b.target === 'guru' || b.target === 'semua');

  return (
    <div className="w-full flex flex-col gap-8 pb-10">
      {/* ======================================================== */}
      {/* 1. CONTAINER: Beritakan kepada siswa                     */}
      {/* ======================================================== */}
      <div className="w-full bg-white border border-gray-400 rounded-[24px] p-6 sm:p-7 shadow-xs flex flex-col">
        {/* Header Container */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-300">
          <h3 className="text-[17px] font-medium text-black">
            Beritakan kepada siswa :
          </h3>
          <button
            type="button"
            onClick={() => handleOpenCreateModal('siswa')}
            title="Tambah Berita untuk Siswa"
            className="w-7 h-7 bg-black hover:bg-gray-800 text-white rounded-md flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shadow-xs"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        {/* Content List */}
        <div className="mt-4 flex flex-col gap-3.5 max-h-[260px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#000066]/70 [&::-webkit-scrollbar-thumb]:rounded-full">
          {loading ? (
            <div className="py-10 text-center text-gray-400 text-[14px]">
              Memuat data berita...
            </div>
          ) : beritaSiswa.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-[14px]">
              Belum ada berita untuk siswa.
            </div>
          ) : (
            beritaSiswa.map((item) => (
              <div
                key={item.id}
                className="w-full bg-[#EDEDED] rounded-[20px] py-4 px-5 sm:px-6 flex items-start justify-between gap-4 shadow-xs"
              >
                {/* Bagian Kiri: Judul & Deskripsi */}
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-[15px] font-semibold text-black leading-snug mb-1">
                    {item.judul}
                  </h4>
                  <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-2">
                    {item.deskripsi}
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

      {/* ======================================================== */}
      {/* 2. CONTAINER: Beritakan kepada guru                      */}
      {/* ======================================================== */}
      <div className="w-full bg-white border border-gray-400 rounded-[24px] p-6 sm:p-7 shadow-xs flex flex-col">
        {/* Header Container */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-300">
          <h3 className="text-[17px] font-medium text-black">
            Beritakan kepada guru :
          </h3>
          <button
            type="button"
            onClick={() => handleOpenCreateModal('guru')}
            title="Tambah Berita untuk Guru"
            className="w-7 h-7 bg-black hover:bg-gray-800 text-white rounded-md flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shadow-xs"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        {/* Content List */}
        <div className="mt-4 flex flex-col gap-3.5 max-h-[260px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#000066]/70 [&::-webkit-scrollbar-thumb]:rounded-full">
          {loading ? (
            <div className="py-10 text-center text-gray-400 text-[14px]">
              Memuat data berita...
            </div>
          ) : beritaGuru.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-[14px]">
              Belum ada berita untuk guru.
            </div>
          ) : (
            beritaGuru.map((item) => (
              <div
                key={item.id}
                className="w-full bg-[#EDEDED] rounded-[20px] py-4 px-5 sm:px-6 flex items-start justify-between gap-4 shadow-xs"
              >
                {/* Bagian Kiri: Judul & Deskripsi */}
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-[15px] font-semibold text-black leading-snug mb-1">
                    {item.judul}
                  </h4>
                  <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-2">
                    {item.deskripsi}
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

      {/* ======================================================== */}
      {/* 3. POP UP MODAL: Tambah Berita                           */}
      {/* ======================================================== */}
      {modalType === 'create' && (
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
              <h2 className="text-[22px] font-semibold text-black">
                Tambah Berita {targetType === 'siswa' ? 'Siswa' : 'Guru'}
              </h2>
            </div>

            {/* Form Fields */}
            <div className="mb-4">
              <label className="block text-[14px] font-medium text-black mb-1.5">
                Judul Berita :
              </label>
              <input
                type="text"
                value={judulInput}
                onChange={(e) => setJudulInput(e.target.value)}
                placeholder="Masukkan judul pengumuman/berita..."
                className="w-full bg-white rounded-xl py-3 px-4 text-[14px] text-black outline-none border border-transparent focus:border-[#000066] shadow-xs"
                autoFocus
              />
            </div>

            <div className="mb-8">
              <label className="block text-[14px] font-medium text-black mb-1.5">
                Isi Berita :
              </label>
              <textarea
                value={deskripsiInput}
                onChange={(e) => setDeskripsiInput(e.target.value)}
                placeholder="Tuliskan detail berita lengkap di sini..."
                rows={4}
                className="w-full bg-white rounded-xl py-3 px-4 text-[14px] text-black outline-none border border-transparent focus:border-[#000066] shadow-xs leading-relaxed resize-none"
              />
            </div>

            {/* Tombol Publikasikan */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveBerita}
                disabled={actionLoading}
                className="bg-[#000066] hover:bg-[#000044] text-white px-8 py-2.5 rounded-xl text-[14px] font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Menyimpan...' : 'Publikasikan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. POP UP MODAL: Hapus Berita                            */}
      {/* ======================================================== */}
      {modalType === 'delete' && selectedBerita && (
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
              <h2 className="text-[22px] font-semibold text-black">Hapus Berita</h2>
            </div>

            {/* Konten */}
            <p className="text-[14px] text-black leading-relaxed mb-8 text-center sm:text-left">
              Yakin untuk menghapus berita <strong>&ldquo;{selectedBerita.judul}&rdquo;</strong>?
            </p>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="bg-[#CC2929] hover:bg-[#B32424] text-white px-7 py-2.5 rounded-xl text-[14px] font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Menghapus...' : 'Hapus'}
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={actionLoading}
                className="bg-[#000066] hover:bg-[#000044] text-white px-7 py-2.5 rounded-xl text-[14px] font-medium transition-colors shadow-sm cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
