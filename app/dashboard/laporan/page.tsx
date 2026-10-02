"use client";

import { useState } from 'react';

export default function LaporanPage() {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('Januari');

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Buttons */}
      <div className="flex gap-4">
        <button className="bg-[#CC2929] text-white text-[15px] font-medium py-2.5 px-6 rounded-md hover:bg-[#B32424] transition-colors">
          Belum Absensi Masuk
        </button>
        <button className="bg-[#CC2929] text-white text-[15px] font-medium py-2.5 px-6 rounded-md hover:bg-[#B32424] transition-colors">
          Belum Absensi Pulang
        </button>
        <button className="bg-[#F0F0F0] text-black text-[15px] font-medium py-2.5 px-6 rounded-md hover:bg-gray-200 transition-colors">
          Absen Sekarang
        </button>
      </div>

      <hr className="border-t border-gray-400 my-2" />

      {/* Filter Section */}
      <div className="flex flex-col gap-3">
        <label className="text-[15px] font-medium text-black">Filterisasi :</label>
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="relative">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none bg-[#F0F0F0] text-black text-[15px] font-medium py-2 pl-4 pr-10 rounded-md outline-none cursor-pointer"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
            
            <div className="relative">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-[#F0F0F0] text-black text-[15px] font-medium py-2 pl-4 pr-10 rounded-md outline-none cursor-pointer"
              >
                <option value="Januari">Januari</option>
                <option value="Februari">Februari</option>
                <option value="Maret">Maret</option>
                <option value="April">April</option>
                <option value="Mei">Mei</option>
                <option value="Juni">Juni</option>
                <option value="Juli">Juli</option>
                <option value="Agustus">Agustus</option>
                <option value="September">September</option>
                <option value="Oktober">Oktober</option>
                <option value="November">November</option>
                <option value="Desember">Desember</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>
          
          <button className="text-black hover:text-gray-700 transition-colors p-1" title="Cetak Laporan">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full bg-white mt-4">
        <table className="w-full border-collapse border border-gray-400 text-center">
          <thead>
            <tr className="border-b border-gray-400">
              <th className="py-4 px-4 border-r border-gray-400 font-medium text-[15px] text-black w-[15%]">Tanggal</th>
              <th className="py-4 px-4 border-r border-gray-400 font-medium text-[15px] text-black w-[15%]">Status</th>
              <th className="py-4 px-4 border-r border-gray-400 font-medium text-[15px] text-black w-[25%]">Waktu Masuk</th>
              <th className="py-4 px-4 border-r border-gray-400 font-medium text-[15px] text-black w-[25%]">Waktu Pulang</th>
              <th className="py-4 px-4 font-medium text-[15px] text-black w-[20%]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(4)].map((_, i) => (
              <tr key={i} className="border-b border-gray-400 last:border-b-0">
                <td className="py-4 px-4 border-r border-gray-400 text-[15px] text-black">30/09/26</td>
                <td className="py-4 px-4 border-r border-gray-400 text-[15px] text-black">Masuk</td>
                <td className="py-4 px-4 border-r border-gray-400 text-[15px] text-black">08.25</td>
                <td className="py-4 px-4 border-r border-gray-400 text-[15px] text-black">-</td>
                <td className="py-4 px-4 text-[15px] flex justify-center">
                  <button className="bg-[#000066] text-white px-8 py-2 rounded-md font-medium hover:bg-[#000044] transition-colors">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
