"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dudiData from '../../data/dudi.json';
import usersData from '../../data/users.json';

export default function KonfigurasiPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [dudiQuery, setDudiQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Mengambil nama akun dummy dari JSON (atau fallback jika kosong)
  const user = usersData[0] || { namaAkun: 'Mohamad Hilmi Azzam' };

  // Filter list dudi berdasarkan ketikan
  const filteredDudi = dudiData.filter(d => 
    d.nama.toLowerCase().includes(dudiQuery.toLowerCase())
  );

  const handleSelectDudi = (nama: string) => {
    setDudiQuery(nama);
    setShowDropdown(false);
  };

  const handleMasuk = () => {
    // Navigasi ke beranda setelah klik Masuk
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:justify-center items-center relative py-12 md:py-0">
      
      {/* Back Button */}
      <div className="absolute top-8 left-8 md:top-12 md:left-12">
        <Link href="/login" className="text-black hover:text-gray-600 transition-colors">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </Link>
      </div>

      <div className="w-full max-w-[420px] px-6">
        
        {/* Header Logo */}
        <div className="flex justify-center items-center gap-3 mb-12">
          <Image src="/smk.svg" alt="SMK Logo" width={36} height={36} className="w-[36px] h-auto" />
          <h2 className="text-[28px] font-semibold text-black">ViskaToring</h2>
        </div>

        {/* Form Fields */}
        <div className="w-full">
          
          {/* Nama Akun (Disabled / Read-only) */}
          <div className="mb-6">
            <label className="block text-[15px] font-medium text-black mb-2">Nama Akun :</label>
            <div className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 flex justify-between items-center cursor-not-allowed select-none">
              <span className="text-[14px] text-gray-700">{user.namaAkun}</span>
              {/* Lock Icon */}
              <svg className="text-gray-600" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0">
                <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm-3 5c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm9 13H6v-8h12v8z" />
                <circle cx="12" cy="16" r="1.5" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* Perbarui Kata Sandi */}
          <div className="mb-6">
            <label className="block text-[15px] font-medium text-black mb-2">Perbarui Kata Sandi :</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 text-[14px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all"
            />
            {/* Info Text */}
            <div className="flex items-start gap-[6px] mt-2">
              <svg className="text-gray-500 mt-[2px] flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <p className="text-[11px] text-gray-500 leading-snug">
                Perbarui kata sandi kamu untuk keamanan yang<br className="hidden sm:block" />lebih terjaga
              </p>
            </div>
          </div>

          {/* Magang di dudi */}
          <div className="mb-8 relative">
            <label className="block text-[15px] font-medium text-black mb-2">Magang di dudi :</label>
            <div className="relative">
              <input 
                type="text"
                value={dudiQuery}
                onChange={(e) => {
                  setDudiQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 text-[14px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all relative z-10"
              />
              
              {/* Dropdown Suggestions */}
              {showDropdown && dudiQuery && (
                <div className="absolute top-full left-0 w-full mt-2 z-20">
                  <div className="flex flex-col gap-[6px] max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredDudi.length > 0 ? (
                      filteredDudi.map((dudi) => (
                        <div 
                          key={dudi.id}
                          onClick={() => handleSelectDudi(dudi.nama)}
                          className="w-full bg-[#EDEDED] rounded-xl px-4 py-[10px] text-[13px] text-gray-700 hover:bg-[#e4e4e4] cursor-pointer transition-colors border-r-4 border-transparent hover:border-[#000066]"
                        >
                          {dudi.nama}
                        </div>
                      ))
                    ) : (
                      <div className="w-full bg-[#EDEDED] rounded-xl px-4 py-[10px] text-[13px] text-gray-500 text-center border border-gray-200">
                        Tidak ada dudi yang cocok
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <hr className="border-gray-300 mb-6" />

          {/* Button Masuk */}
          <button 
            onClick={handleMasuk}
            className="w-full bg-[#000066] text-white rounded-xl py-3 text-[16px] font-medium hover:bg-[#000044] transition-colors"
          >
            Masuk
          </button>
        </div>
      </div>

      {/* Global CSS for Custom Scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #000066;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
