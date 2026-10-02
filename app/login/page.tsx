"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import usersData from '@/data/users.json';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    setError('');
    const userExists = usersData.find(
      (user) => user.namaAkun === username && user.kataSandi === password
    );

    if (userExists) {
      router.push('/konfigurasi');
    } else {
      setError('Nama Akun atau Kata Sandi salah');
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      {/* Left Side */}
      <div 
        className="flex-[1.2] relative flex flex-col justify-end p-[48px] text-white"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%), url('/halaman depan.webp') center/cover no-repeat"
        }}
      >
        <h1 className="text-[42px] md:text-[56px] font-semibold leading-[1.1] mb-3">
          Portal Absensi<br />Magang
        </h1>
        <p className="text-[16px] md:text-[20px] font-light max-w-[90%]">
          Situs monitoring online siswa Praktik Kerja Lapangan resmi SMK Negeri 6 Surakarta
        </p>
      </div>

      {/* Right Side */}
      <div className="flex-1 flex justify-center items-center p-6 md:p-10">
        <div className="w-full max-w-[420px]">
          
          {/* Header Logo */}
          <div className="flex items-center gap-3 mb-8">
            <Image src="/smk.svg" alt="SMK Logo" width={36} height={36} className="w-[36px] h-auto" />
            <h2 className="text-[28px] font-semibold text-black">ViskaToring</h2>
          </div>

          <hr className="border-gray-300 mb-8" />

          {/* Form */}
          <div className="mb-5">
            <label className="block text-[16px] text-black mb-2">Nama Akun :</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 text-[14px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all"
            />
          </div>

          <div className="mb-8">
            <label className="block text-[16px] text-black mb-2">Kata Sandi :</label>
            <div className="relative flex items-center">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#EDEDED] rounded-xl px-4 py-3 pr-10 text-[14px] text-black outline-none focus:ring-2 focus:ring-[#000066]/20 transition-all"
              />
              <button 
                type="button"
                className="absolute right-3 text-gray-600 hover:text-black transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {/* Logo Mata Inline SVG */}
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <hr className="border-gray-300 mb-8" />

          {/* Buttons */}
          <div className="flex flex-col gap-3 mb-8">
            <button 
              onClick={handleLogin}
              className="w-full bg-[#000066] text-white rounded-xl py-3 text-[16px] font-medium hover:bg-[#000044] transition-colors"
            >
              Masuk
            </button>
            <button className="w-full bg-[#EFEF5B] text-black rounded-xl py-3 text-[16px] font-medium hover:bg-[#e0e045] transition-colors">
              Pengajuan Akun
            </button>
          </div>
          
          {/* Footer Text */}
          <p className="text-[11px] text-gray-500 leading-relaxed text-center px-2">
            Jadikan situs web ViskaToring sebagai cerminan integritas kamu selama PKL. Absensi menjadi salah satu yang menentukan nilai akhir kamu
          </p>
          
        </div>
      </div>
    </div>
  );
}
