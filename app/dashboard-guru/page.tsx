"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase/client';
import { getStoredUser } from '@/supabase/auth';
import { Attendance, Company, User } from '@/supabase/types';
import { getLocalDateString } from '@/supabase/helpers';

interface StudentWithAttendance {
  id: string;
  username: string;
  company_id: number | null;
  companies: Company | null;
  attendance?: Attendance | null;
}

export default function DashboardGuruPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WFO' | 'WFH' | 'ALPA' | 'BELUM'>('ALL');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const loadData = useCallback(async (guruUser: User) => {
    setLoading(true);
    const today = getLocalDateString();

    try {
      // 1. Ambil seluruh siswa magang yang berstatus approved
      let studentQuery = supabase
        .from('user_accounts')
        .select('id, username, company_id, companies(*)')
        .eq('role', 'siswa')
        .eq('status', 'approved')
        .order('username', { ascending: true });

      // Jika guru terikat ke company_id tertentu, filter berdasarkan company
      if (guruUser.company_id) {
        studentQuery = studentQuery.eq('company_id', guruUser.company_id);
      }

      const { data: studentList, error: sErr } = await studentQuery;

      if (sErr) {
        console.error('Error fetching students:', sErr);
        setLoading(false);
        return;
      }

      if (!studentList || studentList.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // 2. Ambil absensi hari ini untuk para siswa
      const studentIds = studentList.map((s) => s.id);
      const { data: attList, error: aErr } = await supabase
        .from('attendances')
        .select('*')
        .in('user_id', studentIds)
        .eq('tanggal_absen', today);

      if (aErr) {
        console.error('Error fetching today attendances:', aErr);
      }

      const attMap = new Map<string, Attendance>();
      (attList || []).forEach((att) => {
        attMap.set(att.user_id, att);
      });

      // Gabungkan data siswa dengan absensi hari ini
      const merged: StudentWithAttendance[] = studentList.map((item) => ({
        id: item.id,
        username: item.username,
        company_id: item.company_id,
        companies: (Array.isArray(item.companies) ? item.companies[0] : item.companies) as Company | null,
        attendance: attMap.get(item.id) || null,
      }));

      setStudents(merged);
    } catch (err) {
      console.error('Failed to load guru dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const user = getStoredUser();
      if (user) {
        await loadData(user);
      }
    };

    void init();
  }, [loadData]);

  // Format jam dengan tanda titik (misal: 08.25)
  const formatJam = (isoStr?: string | null) => {
    if (!isoStr) return '-';
    const date = new Date(isoStr);
    return `${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Filter pencarian berdasarkan nama siswa, DUDI, dan status kehadiran
  const filteredStudents = students.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchName = !q || item.username.toLowerCase().includes(q);
    const matchDudi = !q || (item.companies?.company_name.toLowerCase().includes(q) ?? false);
    const textMatch = matchName || matchDudi;

    if (!textMatch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'BELUM') return !item.attendance?.status_kehadiran;
    return item.attendance?.status_kehadiran === statusFilter;
  });

  return (
    <div className="w-full flex flex-col">
      {/* Search Input Bar & Filter Button */}
      <div className="w-full flex items-center gap-4 mb-8">
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa yang sedang di bimbing..."
            className="w-full bg-white border border-gray-400 rounded-xl py-3 pl-5 pr-12 text-[15px] text-black outline-none focus:border-[#000066] transition-colors placeholder:text-gray-600 shadow-sm"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>

        {/* Filter Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="bg-[#000066] text-white rounded-xl px-7 py-3 text-[15px] font-medium hover:bg-[#000044] transition-colors flex items-center gap-2.5 shrink-0 shadow-sm"
          >
            <span>Filter</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"></line>
              <line x1="7" y1="12" x2="17" y2="12"></line>
              <line x1="10" y1="18" x2="14" y2="18"></line>
            </svg>
          </button>

          {/* Filter Dropdown */}
          {showFilterDropdown && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-30 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => { setStatusFilter('ALL'); setShowFilterDropdown(false); }}
                className={`w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors ${
                  statusFilter === 'ALL' ? 'bg-[#000066]/10 text-[#000066] font-semibold' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Semua Status
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('WFO'); setShowFilterDropdown(false); }}
                className={`w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors ${
                  statusFilter === 'WFO' ? 'bg-[#000066]/10 text-[#000066] font-semibold' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                WFO (Hadir di DUDI)
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('WFH'); setShowFilterDropdown(false); }}
                className={`w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors ${
                  statusFilter === 'WFH' ? 'bg-[#000066]/10 text-[#000066] font-semibold' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                WFH (Dari Rumah)
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('BELUM'); setShowFilterDropdown(false); }}
                className={`w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors ${
                  statusFilter === 'BELUM' ? 'bg-[#000066]/10 text-[#000066] font-semibold' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Belum Absen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Monitoring Table */}
      <div className="w-full bg-white border border-gray-400 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr className="bg-[#EBEBEB] border-b border-gray-400">
                <th className="py-4 px-4 font-normal text-[15px] text-black w-[28%]">Siswa</th>
                <th className="py-4 px-4 font-normal text-[15px] text-black w-[24%]">DUDI</th>
                <th className="py-4 px-4 font-normal text-[15px] text-black w-[16%]">Status</th>
                <th className="py-4 px-4 font-normal text-[15px] text-black w-[16%]">Masuk</th>
                <th className="py-4 px-4 font-normal text-[15px] text-black w-[16%]">Pulang</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-gray-500 text-[15px]">
                    Memuat data siswa...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-28 text-center text-black text-[14px]">
                    Tidak ada siswa yang sedang dibimbing.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-4 text-center text-[15px] text-black font-normal">
                      {item.username}
                    </td>
                    <td className="py-4 px-4 text-center text-[15px] text-black font-normal">
                      {item.companies?.company_name || '-'}
                    </td>
                    <td className="py-4 px-4 text-center text-[15px] text-black font-normal">
                      {item.attendance?.status_kehadiran || '-'}
                    </td>
                    <td className="py-4 px-4 text-center text-[15px] text-black font-normal">
                      {formatJam(item.attendance?.jam_masuk)}
                    </td>
                    <td className="py-4 px-4 text-center text-[15px] text-black font-normal">
                      {formatJam(item.attendance?.jam_pulang)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

