-- ==============================================================================
-- VISKATORING DATABASE SCHEMA & SEED DATA (SUPABASE)
-- ==============================================================================
-- Skema tabel untuk Sistem Monitoring dan Presensi PKL SMK Negeri 6 Surakarta.
-- Jalankan skrip ini langsung di menu SQL Editor pada Dashboard Supabase Anda.
-- ==============================================================================

-- 1. Aktifkan ekstensi pgcrypto untuk fungsi gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABEL: companies (DUDI / Tempat Magang)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
    id BIGSERIAL PRIMARY KEY,
    company_name TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    radius_meters INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. TABEL: user_accounts (Akun Pengguna / Siswa & Admin)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL,
    company TEXT,
    role TEXT NOT NULL DEFAULT 'siswa',
    first_login BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pencarian cepat username & login
CREATE INDEX IF NOT EXISTS idx_user_accounts_username ON public.user_accounts(username);

-- ==============================================================================
-- 4. TABEL: attendances (Data Presensi Harian)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendances (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_accounts(id) ON DELETE CASCADE,
    tanggal_absen DATE NOT NULL DEFAULT CURRENT_DATE,
    jam_masuk TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    jam_pulang TIMESTAMPTZ,
    status_kehadiran TEXT NOT NULL CHECK (status_kehadiran IN ('WFO', 'WFH', 'ALPA')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_attendance_per_day UNIQUE (user_id, tanggal_absen)
);

CREATE INDEX IF NOT EXISTS idx_attendances_user_date ON public.attendances(user_id, tanggal_absen);

-- ==============================================================================
-- 5. TABEL: reports (Laporan Kegiatan Harian PKL)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id BIGSERIAL PRIMARY KEY,
    attendance_id BIGINT NOT NULL REFERENCES public.attendances(id) ON DELETE CASCADE,
    judul_laporan TEXT NOT NULL,
    deskripsi_laporan TEXT NOT NULL,
    bukti_laporan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_attendance_id ON public.reports(attendance_id);

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Mengaktifkan RLS dan memberi izin role anon & authenticated
-- agar aplikasi klien dapat mengakses dan memodifikasi data.

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policy untuk companies (Baca untuk semua pengguna)
DROP POLICY IF EXISTS "Allow anon read companies" ON public.companies;
CREATE POLICY "Allow anon read companies" ON public.companies
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon manage companies" ON public.companies;
CREATE POLICY "Allow anon manage companies" ON public.companies
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Policy untuk user_accounts
DROP POLICY IF EXISTS "Allow anon select user_accounts" ON public.user_accounts;
CREATE POLICY "Allow anon select user_accounts" ON public.user_accounts
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon insert user_accounts" ON public.user_accounts;
CREATE POLICY "Allow anon insert user_accounts" ON public.user_accounts
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update user_accounts" ON public.user_accounts;
CREATE POLICY "Allow anon update user_accounts" ON public.user_accounts
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Policy untuk attendances
DROP POLICY IF EXISTS "Allow anon manage attendances" ON public.attendances;
CREATE POLICY "Allow anon manage attendances" ON public.attendances
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Policy untuk reports
DROP POLICY IF EXISTS "Allow anon manage reports" ON public.reports;
CREATE POLICY "Allow anon manage reports" ON public.reports
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 7. SEED DATA (DATA AWAL CONTOH)
-- ==============================================================================

-- Masukkan contoh DUDI (Tempat Magang)
INSERT INTO public.companies (id, company_name, latitude, longitude, radius_meters)
VALUES 
    (1, 'PT Telkom Indonesia (Witel Solo)', -7.568432, 110.825123, 100),
    (2, 'Dinas Komunikasi & Informatika Surakarta', -7.556214, 110.831542, 120),
    (3, 'Solo Technopark', -7.557451, 110.854215, 150),
    (4, 'SMK Negeri 6 Surakarta', -7.551821, 110.817290, 80)
ON CONFLICT (id) DO UPDATE 
SET company_name = EXCLUDED.company_name,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    radius_meters = EXCLUDED.radius_meters;

-- Reset sequence id companies agar auto-increment tetap aman
SELECT setval('companies_id_seq', (SELECT MAX(id) FROM public.companies));

-- Masukkan contoh User yang dibuat oleh Admin:
-- 1. Akun siswa baru dengan first_login = true (password default: 'password123', company belum diatur)
INSERT INTO public.user_accounts (username, password, company_id, company, role, first_login)
VALUES 
    ('budi_santoso', 'password123', NULL, NULL, 'siswa', true),
    ('siti_rahma', 'password123', NULL, NULL, 'siswa', true),
    ('admin_viska', 'admin123', 4, 'SMK Negeri 6 Surakarta', 'admin', false)
ON CONFLICT (username) DO NOTHING;
