"use client";

import { useState, useEffect } from 'react';

export default function DashboardBeranda() {
  const [currentTime, setCurrentTime] = useState('00.00.00');

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

  return (
    <div className="w-full max-w-[940px] mx-auto flex flex-col gap-8">
      
      {/* Top Stats Row */}
      <div className="flex gap-8">
        <div className="flex-1 bg-white border border-gray-300 rounded-[24px] p-8 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[60px] font-medium text-black leading-none mb-2">12</span>
          <span className="text-[18px] text-gray-700">Hadir Ke Dudi</span>
        </div>
        <div className="flex-1 bg-white border border-gray-300 rounded-[24px] p-8 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[60px] font-medium text-black leading-none mb-2">8</span>
          <span className="text-[18px] text-gray-700">Hadir WFH</span>
        </div>
      </div>

      {/* Middle Content Row */}
      <div className="flex gap-8 flex-1 min-h-[380px]">
        
        {/* Left: Pratinjau Absensi */}
        <div className="flex-1 bg-[#F0F0F0] rounded-[24px] flex flex-col items-center justify-center p-10 text-center">
          <div className="w-[84px] h-[84px] bg-[#CC2929] rounded-full flex items-center justify-center mb-8 text-white shadow-md">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
          <p className="text-[18px] font-medium text-black leading-snug">
            Pratinjau Absensi<br/>Pada Hari Ini
          </p>
        </div>

        {/* Right: Absen Actions */}
        <div className="flex-1 bg-white border border-gray-300 rounded-[24px] p-8 flex flex-col gap-7 shadow-sm">
          
          <div className="flex flex-col gap-4">
            <button className="w-full bg-[#CC2929] text-white text-[16px] font-medium py-4 rounded-xl hover:bg-[#B32424] transition-colors">
              Belum Absensi Masuk
            </button>
            <button className="w-full bg-[#CC2929] text-white text-[16px] font-medium py-4 rounded-xl hover:bg-[#B32424] transition-colors">
              Belum Absensi Pulang
            </button>
          </div>

          <div className="bg-[#F0F0F0] rounded-[24px] p-8 flex-1 flex flex-col items-center justify-center border border-gray-200">
            <div className="text-[52px] font-medium text-black tracking-widest mb-5">
              {currentTime}
            </div>
            <button className="w-full bg-white text-black text-[16px] font-medium py-4 rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
              Absen Sekarang
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
