"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoadingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login after 2 seconds
    const timer = setTimeout(() => {
      router.push('/login');
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-white flex-col">
      <div className="flex items-center gap-5 mb-12 animate-pulse">
        {/* SMK Logo */}
        <div className="flex items-center justify-center">
          <Image src="/smk.svg" alt="SMK Logo" width={80} height={100} className="w-[64px] md:w-[80px] h-auto" />
        </div>
        {/* Text */}
        <h1 className="text-[48px] md:text-[64px] font-semibold text-black leading-none">
          ViskaToring
        </h1>
      </div>

      {/* Loading Spinner */}
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-gray-400 border-l-4 border-l-gray-400 border-r-4 border-r-transparent"></div>
    </div>
  );
}
