export type StatusKehadiran = 'WFO' | 'WFH' | 'ALPA';

export type UserRole = 'admin' | 'guru' | 'siswa' | 'dudi';

export type UserAccountStatus = 'pending' | 'approved' | 'rejected';

export interface Company {
  id: number;
  company_name: string;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number;
}

export interface User {
  id: string; // UUID / ID
  username: string;
  password?: string;
  company_id: number | null;
  role: UserRole;
  status: UserAccountStatus;
  first_login: boolean;
  selected?: string[] | null;
  companies?: Company | null;
  pending_company_id?: number | null;
  pending_company_status?: UserAccountStatus | null;
  pending_companies?: Company | null;
}

export interface Attendance {
  id: number;
  user_id: string;
  tanggal_absen: string; // DATE (YYYY-MM-DD)
  jam_masuk: string;     // TIMESTAMPTZ
  jam_pulang: string | null; // TIMESTAMPTZ
  status_kehadiran: StatusKehadiran;
  reports?: Report[];
}

export interface Report {
  id: number;
  attendance_id: number;
  judul_laporan: string;
  deskripsi_laporan: string;
  bukti_laporan: string | null;
}

export interface NewsItem {
  id: string | number;
  title: string;
  content: string;
  kategori: 'siswa' | 'guru' | 'dudi';
  company_id?: number | null;
  created_at: string;
  companies?: Company | null;
}

export interface BeritaItem {
  id: string | number;
  judul: string;
  deskripsi: string;
  target: 'siswa' | 'guru' | 'semua';
  created_at: string;
}
