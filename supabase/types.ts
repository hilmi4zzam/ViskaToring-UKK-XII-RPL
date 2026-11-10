export type StatusKehadiran = 'WFO' | 'WFH' | 'ALPA';

export interface Company {
  id: number;
  company_name: string;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number;
}

export interface User {
  id: string; // UUID
  username: string;
  password?: string;
  company_id: number | null;
  companies?: Company | null;
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
