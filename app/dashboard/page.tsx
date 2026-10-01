"use client";

import { useState, useEffect } from 'react';

export default function DashboardBeranda() {
  const [currentTime, setCurrentTime] = useState('00.00.00');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [absenType, setAbsenType] = useState('masuk');

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
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-white text-black text-[16px] font-medium py-4 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
            >
              Absen Sekarang
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
                    onClick={() => setAbsenType('masuk')}
                    className={`flex-1 py-3 rounded-xl font-medium text-[15px] transition-all bg-white border-2 ${absenType === 'masuk' ? 'border-[#000066] text-[#000066]' : 'border-transparent text-gray-500 hover:border-gray-300 shadow-sm'}`}
                  >
                    Masuk
                  </button>
                  <button 
                    onClick={() => setAbsenType('pulang')}
                    className={`flex-1 py-3 rounded-xl font-medium text-[15px] transition-all bg-white border-2 ${absenType === 'pulang' ? 'border-[#000066] text-[#000066]' : 'border-transparent text-gray-500 hover:border-gray-300 shadow-sm'}`}
                  >
                    Pulang
                  </button>
                </div>
              </div>

              {/* Judul */}
              <div>
                <label className={`block text-[15px] font-medium mb-3 ${absenType === 'masuk' ? 'text-gray-400' : 'text-black'}`}>Judul :</label>
                <input 
                  type="text" 
                  disabled={absenType === 'masuk'}
                  className="w-full bg-white rounded-xl px-5 py-4 text-[15px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all shadow-sm disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className={`block text-[15px] font-medium mb-3 ${absenType === 'masuk' ? 'text-gray-400' : 'text-black'}`}>Deskripsi :</label>
                <textarea 
                  disabled={absenType === 'masuk'}
                  className="w-full bg-white rounded-xl px-5 py-4 text-[15px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all shadow-sm min-h-[140px] resize-none disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                ></textarea>
              </div>

              {/* Foto Bukti */}
              <div>
                <label className={`block text-[15px] font-medium mb-3 ${absenType === 'masuk' ? 'text-gray-400' : 'text-black'}`}>Foto Bukti :</label>
                <button 
                  disabled={absenType === 'masuk'}
                  className="bg-white rounded-xl px-6 py-4 flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 transition-colors w-max disabled:bg-gray-200 disabled:shadow-none disabled:cursor-not-allowed disabled:hover:bg-gray-200"
                >
                  <svg className={`${absenType === 'masuk' ? 'text-gray-400' : 'text-gray-600'}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span className={`text-[15px] font-medium ${absenType === 'masuk' ? 'text-gray-400' : 'text-gray-700'}`}>Unggah Gambar</span>
                </button>
              </div>

            </div>

            {/* Bottom Button */}
            <div className="flex justify-end mt-10">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-[#000066] text-white rounded-xl px-12 py-[14px] text-[16px] font-medium hover:bg-[#000044] transition-colors shadow-md"
              >
                Absen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
