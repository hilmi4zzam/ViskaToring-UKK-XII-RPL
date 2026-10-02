"use client";

import { useState } from 'react';
import dudiData from '@/data/dudi.json';

export default function PengaturanPage() {
  const [newPassword, setNewPassword] = useState("");
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
  const [showOldPassPassword, setShowOldPassPassword] = useState(false);
  const [showNewPassPassword, setShowNewPassPassword] = useState(false);
  
  const [dudiQuery, setDudiQuery] = useState("CV. Enuma Te");
  const [showDudiDropdown, setShowDudiDropdown] = useState(false);

  const filteredDudi = dudiData.filter(d => 
    d.nama.toLowerCase().includes(dudiQuery.toLowerCase())
  );

  const handleSelectDudi = (nama: string) => {
    setDudiQuery(nama);
    setShowDudiDropdown(false);
  };
  
  // Menampilkan input kata sandi lama jika field kata sandi baru sedang difokuskan atau memiliki teks
  const showOldPassword = isNewPasswordFocused || newPassword.length > 0;

  return (
    <div className="w-full max-w-[480px] mx-auto flex flex-col gap-5 pt-8 pb-10">
      
      {/* Nama Akun */}
      <div className="flex flex-col gap-2">
        <label className="text-[15px] font-medium text-black">Nama Akun :</label>
        <div className="relative">
          <input 
            type="text" 
            value="Mohamad Hilmi Azzam" 
            readOnly 
            className="w-full bg-[#F0F0F0] text-black text-[15px] py-3.5 pl-4 pr-10 rounded-xl outline-none"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-black">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Perbarui Kata Sandi */}
      <div className="flex flex-col gap-2">
        <label className="text-[15px] font-medium text-black">Perbarui Kata Sandi :</label>
        <div className="relative">
          <input 
            type={showNewPassPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onFocus={() => setIsNewPasswordFocused(true)}
            onBlur={() => setIsNewPasswordFocused(false)}
            className="w-full bg-[#F0F0F0] text-black text-[15px] py-3.5 pl-4 pr-10 rounded-xl outline-none"
          />
          <button 
            type="button"
            onClick={() => setShowNewPassPassword(!showNewPassPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-black cursor-pointer"
          >
            {showNewPassPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Kata Sandi Lama */}
      <div className={`flex flex-col gap-1.5 transition-all duration-300 overflow-hidden ${showOldPassword ? 'max-h-[100px] opacity-100 mt-1' : 'max-h-0 opacity-0 m-0'}`}>
        <label className="text-[13px] font-medium text-black px-2">Kata Sandi Lama :</label>
        <div className="relative w-[96%] ml-[2%]">
          <input 
            type={showOldPassPassword ? "text" : "password"}
            className="w-full bg-[#F0F0F0] text-black text-[15px] py-2.5 pl-4 pr-10 rounded-xl outline-none"
          />
          <button 
            type="button"
            onClick={() => setShowOldPassPassword(!showOldPassPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-black cursor-pointer"
          >
            {showOldPassPassword ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Magang di dudi */}
      <div className="flex flex-col gap-2 mt-1">
        <label className="text-[15px] font-medium text-black">Magang di dudi :</label>
        <div className="relative">
          <input 
            type="text" 
            value={dudiQuery}
            onChange={(e) => {
              setDudiQuery(e.target.value);
              setShowDudiDropdown(true);
            }}
            onFocus={() => setShowDudiDropdown(true)}
            onBlur={() => setTimeout(() => setShowDudiDropdown(false), 200)}
            className="w-full bg-[#F0F0F0] text-black text-[15px] py-3.5 px-4 rounded-xl outline-none"
          />
        </div>
        
        {/* Suggestion dropdown area */}
        {showDudiDropdown && (
          <div className="w-[96%] ml-[2%] mt-1 flex flex-col relative max-h-[140px] z-20">
            <div className="w-full h-full flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar-dudi pb-2">
              {filteredDudi.length > 0 ? (
                filteredDudi.map((dudi) => (
                  <div 
                    key={dudi.id}
                    onClick={() => handleSelectDudi(dudi.nama)}
                    className="bg-[#F0F0F0] py-2.5 px-4 rounded-lg text-[13px] text-gray-700 w-full cursor-pointer hover:bg-gray-200 shrink-0 border-r-[3px] border-transparent hover:border-[#000066] transition-colors"
                  >
                    {dudi.nama}
                  </div>
                ))
              ) : (
                <div className="bg-[#F0F0F0] py-2.5 px-4 rounded-lg text-[13px] text-gray-500 w-full text-center">
                  Tidak ada dudi yang cocok
                </div>
              )}
            </div>
            
            <style jsx>{`
              .custom-scrollbar-dudi::-webkit-scrollbar {
                width: 3px;
              }
              .custom-scrollbar-dudi::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar-dudi::-webkit-scrollbar-thumb {
                background: #000066;
                border-radius: 10px;
              }
            `}</style>
          </div>
        )}
      </div>

      <hr className="border-t border-gray-300 mt-2 mb-1 w-[98%] mx-auto" />

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button className="w-full bg-[#000066] text-white text-[15px] font-medium py-3.5 rounded-xl hover:bg-[#000044] transition-colors shadow-sm">
          Ajukan Pembaruan Data
        </button>
        <button className="w-full bg-[#CC2929] text-white text-[15px] font-medium py-3.5 rounded-xl hover:bg-[#B32424] transition-colors shadow-sm">
          Keluar
        </button>
      </div>
      
    </div>
  );
}
