<img width="421" height="391" alt="image" src="https://github.com/user-attachments/assets/b1f3df50-64b7-4f44-967e-51be1b5ab93a" />


***ViskaToring — Portal Absensi Magang Siswa SMK***

**ViskaToring** adalah aplikasi web portal absensi digital untuk siswa yang sedang menjalani Praktik Kerja Lapangan (PKL/Magang). Sistem ini dirancang untuk mempermudah pencatatan kehadiran siswa, pembuatan laporan harian, serta pemantauan aktivitas oleh guru pembimbing dan pihak industri (DUDI).

>  **Live Demo:** [https://viskatoring.web.id](https://viskatoring.web.id)

---

## Fitur Utama

- **Multi-role:** Siswa, Guru Pembimbing, Instruktur DUDI, dan Admin.
- **Absensi Berbasis GPS:** Deteksi lokasi otomatis untuk menentukan status WFO (di kantor) atau WFH.
- **Laporan Harian:** Siswa wajib mengisi judul, deskripsi, dan foto bukti kegiatan saat absen pulang.
- **Rekapitulasi & Cetak:** Siswa dapat mencetak rekap absensi per bulan dalam format A4 yang rapi.
- **Manajemen Anggota:** Admin dapat mengelola seluruh akun, menyetujui pengajuan, dan mengatur DUDI.
- **Berita & Pengumuman:** Admin dan DUDI dapat menyebarkan informasi kepada siswa.
- **Isolasi Data Per DUDI:** Setiap data absensi terikat ke DUDI aktif siswa saat itu, sehingga jika siswa pindah DUDI, historis data lama tetap tersimpan dan terpisah.

---

## Teknologi yang Digunakan

| Kategori | Teknologi |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Bahasa | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Autentikasi | Custom bcryptjs (tanpa Supabase Auth) |
| Deployment | [Vercel](https://vercel.com) |
| Font | Host Grotesk (Google Fonts) |

---

## Akun Demo & Hak Akses


###  Siswa
| Field | Value |
|---|---|
| **Nama Akun** | `Abryan Yoga Pratama` |
| **Kata Sandi** | `17077` |

**Hak Akses Siswa:**
- Melihat dashboard beranda dengan jam realtime, statistik kehadiran WFO & WFH khusus DUDI-nya saat ini, dan pratinjau absensi hari ini.
- Melakukan **Absen Masuk** dengan deteksi GPS otomatis (WFO jika berada dalam radius DUDI, WFH jika di luar).
- Melakukan **Absen Pulang** disertai pengisian laporan kegiatan harian (judul, deskripsi, dan foto bukti dari kamera atau galeri).
- Melihat dan mencetak **Rekapitulasi Absensi** per bulan & tahun dalam format dokumen A4.
- Membaca **Berita & Pengumuman** dari sekolah dan DUDI-nya.
- Mengubah kata sandi dan mengajukan **permohonan pindah DUDI** melalui halaman Pengaturan (menunggu persetujuan Admin).

---

###  Guru Pembimbing
| Field | Value |
|---|---|
| **Nama Akun** | `Binar Aris Purwaka S.Kom` |
| **Kata Sandi** | `akubinar` |

**Hak Akses Guru:**
- Melihat **dashboard pemantauan absensi harian** seluruh siswa secara real-time (reset otomatis setiap hari).
- Memilih dan menyimpan **daftar siswa bimbingan** yang dipantau secara spesifik.
- Melihat **status kehadiran** (Sudah Masuk / Belum Absen / Sudah Pulang) beserta laporan harian, deskripsi, dan foto bukti kegiatan setiap siswa.
- Membaca berita & pengumuman dari sekolah.
- Mengubah kata sandi melalui halaman Pengaturan.

---

###  Instruktur DUDI (Enuma Technology)
| Field | Value |
|---|---|
| **Nama Akun** | `Enuma Technology` |
| **Kata Sandi** | `12345` |

**Hak Akses DUDI:**
- Melihat **dashboard kehadiran harian** seluruh siswa yang sedang magang di perusahaannya (reset otomatis setiap hari).
- Memantau status absensi siswa beserta laporan kegiatan, deskripsi, dan foto bukti.
- Memposting **Berita & Pengumuman** khusus untuk siswa magang di perusahaan tersebut.
- Mengubah kata sandi dan memperbarui data profil perusahaan melalui halaman Pengaturan.

---

###  Admin
| Field | Value |
|---|---|
| **Nama Akun** | `admin123` |
| **Kata Sandi** | `admin123` |
| **Cara Akses** | Klik logo SMK **7 kali** di halaman utama |

**Hak Akses Admin:**
- Melihat **dashboard statistik** (total siswa, guru, dan DUDI aktif) serta daftar pengajuan akun baru yang menunggu persetujuan.
- **Menyetujui atau menolak** pengajuan akun baru dari calon siswa/guru/DUDI.
- **Menyetujui atau menolak** pengajuan pindah DUDI dari siswa yang sudah aktif.
- Mengelola seluruh anggota: tambah, edit, hapus akun (termasuk fitur hapus massal siswa per tahun).
- Memposting **Berita & Pengumuman** sekolah untuk seluruh role (siswa, guru).
- Mengubah kata sandi Admin melalui halaman Pengaturan.

---

## Rancangan Database (Entity Relationship Diagram - ERD)

Aplikasi menggunakan database relasional PostgreSQL (Supabase) yang terdiri dari **5 tabel utama** yang saling berelasi:

```mermaid
erDiagram
    COMPANIES ||--o{ USER_ACCOUNTS : "memiliki siswa / dudi"
    COMPANIES ||--o{ ATTENDANCES : "lokasi presensi"
    COMPANIES ||--o{ NEWS : "menerbitkan (opsional)"
    USER_ACCOUNTS ||--o{ ATTENDANCES : "melakukan presensi"
    ATTENDANCES ||--o| REPORTS : "memuat laporan kegiatan"

    COMPANIES {
        bigint id PK "ID unik DUDI (Identity)"
        text company_name "Nama perusahaan / tempat PKL"
        float8 latitude "Koordinat lintang kantor"
        float8 longitude "Koordinat bujur kantor"
        int4 radius_meters "Radius toleransi WFO (meter)"
        timestamptz created_at "Waktu data dibuat"
    }

    USER_ACCOUNTS {
        uuid id PK "ID unik akun (gen_random_uuid)"
        text username UK "Nama lengkap / nama akun login"
        text password "Kata sandi terenkripsi (bcrypt hash)"
        text role "Peran: siswa / guru / dudi / admin"
        text status "Status akun: pending / approved / rejected"
        bool first_login "Status onboarding / ganti sandi awal"
        bigint company_id FK "DUDI aktif siswa / akun DUDI"
        bigint pending_company_id FK "DUDI tujuan mutasi yang diajukan"
        text pending_company_status "Status mutasi: pending / approved / rejected"
        jsonb selected "Daftar ID siswa binaan terpilih (Guru)"
        timestamptz created_at "Waktu akun didaftarkan"
    }

    ATTENDANCES {
        bigint id PK "ID unik presensi harian (Identity)"
        uuid user_id FK "Relasi ke ID siswa pemilik presensi"
        bigint company_id FK "Relasi ke DUDI saat presensi dilakukan"
        date tanggal_absen "Tanggal kehadiran (YYYY-MM-DD)"
        timestamptz jam_masuk "Waktu rekam absen masuk"
        timestamptz jam_pulang "Waktu rekam absen pulang"
        text status_kehadiran "Status: WFO / WFH / ALPA"
        timestamptz created_at "Waktu baris dibuat"
    }

    REPORTS {
        bigint id PK "ID unik laporan kegiatan (Identity)"
        bigint attendance_id FK "Relasi ke presensi terkait"
        text judul_laporan "Judul pekerjaan / kegiatan harian"
        text deskripsi_laporan "Uraian detail aktivitas magang"
        text bukti_laporan "Foto bukti kegiatan (Base64 string)"
        timestamptz created_at "Waktu laporan dikirimkan"
    }

    NEWS {
        bigint id PK "ID unik berita (Identity)"
        text title "Judul berita / pengumuman"
        text content "Isi teks pengumuman"
        text kategori "Target pembaca: siswa / guru / dudi"
        bigint company_id FK "Opsional DUDI spesifik penerbit berita"
        timestamptz created_at "Waktu berita dipublikasikan"
    }
```

---

### Penjelasan Relasi Antar Tabel:
1. **`companies` → `user_accounts` (One-to-Many):** Satu DUDI dapat memiliki banyak akun siswa magang dan satu akun pembimbing industri.
2. **`user_accounts` → `attendances` (One-to-Many):** Satu siswa memiliki banyak baris riwayat presensi harian.
3. **`companies` → `attendances` (One-to-Many):** Setiap baris absensi mengunci `company_id` tempat siswa magang pada hari tersebut. Hal ini menjamin bahwa jika siswa berpindah DUDI, seluruh arsip presensi DUDI lama tetap terisolasi dan tidak tercampur.
4. **`attendances` → `reports` (One-to-One):** Setiap sesi kehadiran pada hari tersebut memiliki satu laporan kegiatan harian dan foto bukti saat absen pulang.
5. **`companies` → `news` (One-to-Many, Opsional):** Berita pengumuman dapat ditujukan secara global oleh admin atau khusus siswa pada DUDI tertentu.

---

## Flowchart Alur ViskaToring

Berikut adalah diagram alir (*flowchart*) operasional sistem ViskaToring yang dibagi khusus berdasarkan 3 peran pengguna utama (**Siswa**, **Guru**, dan **DUDI**):

---

### 1. Siswa

```mermaid
flowchart TD
    StartSiswa([Mulai: Siswa Buka Portal]) --> InputLogin[Input Nama Akun & Kata Sandi NIS]
    InputLogin --> CekAuth{Verifikasi Kredensial Siswa}
    
    CekAuth -->|Kredensial Salah| ErrLogin[Tampilkan Pesan Error Login] --> InputLogin
    CekAuth -->|Kredensial Valid| CekStatus{Cek Status Persetujuan Akun}
    
    CekStatus -->|pending| StatusPending[Peringatan: Akun Masih Menunggu Persetujuan Admin] --> StartSiswa
    CekStatus -->|rejected| StatusRejected[Peringatan: Pengajuan Akun Ditolak Sekolah] --> StartSiswa
    CekStatus -->|approved| CekFirstLogin{first_login == true ATAU Belum Memilih DUDI?}
    
    CekFirstLogin -->|Ya| KonfigAwal[Halaman Konfigurasi: Ganti Kata Sandi & Pilih DUDI Tempat Magang]
    KonfigAwal --> MasukDashboard[Masuk ke Beranda Siswa]
    CekFirstLogin -->|Tidak| MasukDashboard
    
    MasukDashboard --> FiturSiswa{Pilih Aktivitas Siswa}
    
    %% Aktivitas 1: Absensi Masuk
    FiturSiswa -->|Absen Masuk Pagi| CekMasuk{Sudah Absen Masuk Hari Ini?}
    CekMasuk -->|Sudah| InfoSudahMasuk[Tombol Hijau: Sudah Absen Masuk]
    CekMasuk -->|Belum| KlikAbsenMasuk[Tekan Tombol 'Absen Sekarang']
    KlikAbsenMasuk --> DeteksiGPS[Browser Mendeteksi Titik Koordinat GPS Siswa]
    DeteksiGPS --> HitungJarak[Hitung Jarak ke Kantor DUDI via Rumus Haversine]
    HitungJarak --> CekRadius{Jarak <= Radius Toleransi Kantor DUDI?}
    CekRadius -->|Ya, Dalam Radius| SetWFO[Status Kehadiran Otomatis: WFO]
    CekRadius -->|Tidak / Luar Radius / GPS Mati| SetWFH[Status Kehadiran Otomatis: WFH]
    SetWFO --> SimpanMasuk[Insert ke Tabel attendances: user_id, company_id, jam_masuk, status]
    SetWFH --> SimpanMasuk
    SimpanMasuk --> SuksesMasuk[Status Beranda Berubah: 'Sudah Absen Masuk']
    
    %% Aktivitas 2: Absen Pulang & Laporan
    FiturSiswa -->|Absen Pulang Sore| CekPulang{Sudah Absen Pulang?}
    CekPulang -->|Sudah| InfoSudahPulang[Tombol Hijau: Sudah Absen Pulang]
    CekPulang -->|Belum| KlikAbsenPulang[Tekan Tombol 'Absen Sekarang' Tab Pulang]
    KlikAbsenPulang --> IsiLaporan[Isi Form: Judul & Deskripsi Kegiatan Hari Ini]
    IsiLaporan --> PilihKamera{Pilih Metode Foto Bukti}
    PilihKamera -->|Kamera HP Langsung| KameraWebRTC[Buka Kamera Perangkat via WebRTC Canvas]
    PilihKamera -->|Galeri Foto| UnggahGaleri[Pilih File Gambar via FileReader]
    KameraWebRTC --> KonversiBase64[Konversi Gambar Otomatis ke Base64 Data URL JPEG]
    UnggahGaleri --> KonversiBase64
    KonversiBase64 --> SubmitPulang[Kirim Form Absen Pulang]
    SubmitPulang --> SimpanPulang[Update jam_pulang di attendances & Insert ke tabel reports]
    SimpanPulang --> PratinjauTampil[Pratinjau Foto & Laporan Langsung Tampil di Beranda]
    
    %% Aktivitas 3: Laporan & Cetak
    FiturSiswa -->|Menu Lihat Laporan| BukaMenuLaporan[Buka Halaman Laporan]
    BukaMenuLaporan --> FilterBulanTahun[Pilih Filter Bulan & Tahun]
    FilterBulanTahun --> QueryLaporan[Query attendances Terfilter user_id & company_id Aktif]
    QueryLaporan --> TampilTabelLaporan[Tampilkan Tabel Rekapitulasi Kehadiran Siswa]
    TampilTabelLaporan --> TombolPrint[Klik Tombol 'Cetak Rekapitulasi']
    TombolPrint --> CetakA4([Cetak Dokumen Resmi Format Standar A4 Bersih])
    
    %% Aktivitas 4: Pengaturan & Mutasi
    FiturSiswa -->|Menu Pengaturan| MenuPengaturan[Ganti Kata Sandi / Ajukan Pindah DUDI]
    MenuPengaturan --> AjukanPindah[Pilih DUDI Baru -> Kirim Permohonan Mutasi ke Admin]
    AjukanPindah --> TungguApproval([Status Mutasi Pending Menunggu Persetujuan Admin])
```

---

### 2. Guru

```mermaid
flowchart TD
    StartGuru([Mulai: Guru Pembimbing Buka Portal]) --> InputLoginGuru[Input Nama Akun & Kata Sandi Guru]
    InputLoginGuru --> CekAuthGuru{Verifikasi Kredensial Akun Guru}
    
    CekAuthGuru -->|Kredensial Salah| ErrLoginGuru[Tampilkan Pesan Error Login] --> InputLoginGuru
    CekAuthGuru -->|Kredensial Valid| CekStatusGuru{Cek Status Persetujuan Akun}
    
    CekStatusGuru -->|pending / rejected| TolakAksesGuru[Akses Ditolak / Menunggu Persetujuan Admin] --> StartGuru
    CekStatusGuru -->|approved| CekFirstLoginGuru{first_login == true?}
    
    CekFirstLoginGuru -->|Ya| KonfigGuru[Halaman Konfigurasi: Ganti Kata Sandi Awal Guru]
    KonfigGuru --> DashboardGuru[Masuk ke Dashboard Guru]
    CekFirstLoginGuru -->|Tidak| DashboardGuru
    
    DashboardGuru --> FiturGuru{Aktivitas Guru Pembimbing}
    
    %% Pemantauan Harian
    FiturGuru -->|Monitoring Absensi Harian| LoadDataSiswa[Sistem Memuat Seluruh Siswa Berstatus Approved]
    LoadDataSiswa --> LoadAbsenHariIni[Query Tabel attendances Khusus Tanggal Hari Ini]
    LoadAbsenHariIni --> TampilTabelMonitoring[Tampilkan Tabel Pemantauan Real-Time: Status Masuk/Pulang Siswa]
    TampilTabelMonitoring --> ResetHarian([Sistem Otomatis Mereset Status Menjadi Belum Absen Setiap Hari Baru])
    
    %% Filter Siswa Bimbingan
    FiturGuru -->|Filter Siswa Bimbingan| KlikTombolFilter[Klik Tombol 'Pilih Siswa Binaan']
    KlikTombolFilter --> BukaModalPilih[Buka Modal Checklist Siswa Bimbingan]
    BukaModalPilih --> PilihSiswaBinaan[Centang Nama Siswa yang Dibimbing Guru Ini]
    PilihSiswaBinaan --> SimpanPilihan[Simpan Pilihan ke Kolom user_accounts.selected Database]
    SimpanPilihan --> FilterAktif[Dashboard Guru Otomatis Hanya Menampilkan Siswa Binaan Terpilih]
    
    %% Periksa Laporan Harian
    FiturGuru -->|Periksa Hasil Kegiatan Siswa| KlikDetailLaporan[Klik Siswa yang Sudah Mengirim Laporan]
    KlikDetailLaporan --> ModalDetailLaporan[Buka Modal Detail Laporan Harian Siswa]
    ModalDetailLaporan --> TinjauLaporan[Tinjau Jam Masuk/Pulang, Judul, Deskripsi, dan Foto Bukti Kegiatan]
    TinjauLaporan --> TutupModal[Tutup Modal Pemeriksaan]
    
    %% Berita & Pengaturan
    FiturGuru -->|Informasi & Akun| MenuLainGuru[Menu Berita Sekolah & Pengaturan Kata Sandi]
```

---

### 3. DUDI

```mermaid
flowchart TD
    StartDudi([Mulai: Instruktur DUDI Buka Portal]) --> InputLoginDudi[Input Nama Akun Perusahaan & Kata Sandi]
    InputLoginDudi --> CekAuthDudi{Verifikasi Kredensial Akun DUDI}
    
    CekAuthDudi -->|Kredensial Salah| ErrLoginDudi[Tampilkan Pesan Error Login] --> InputLoginDudi
    CekAuthDudi -->|Kredensial Valid| CekStatusDudi{Cek Status Persetujuan Akun}
    
    CekStatusDudi -->|pending / rejected| TolakAksesDudi[Akses Ditolak / Menunggu Persetujuan Admin] --> StartDudi
    CekStatusDudi -->|approved| CekFirstLoginDudi{first_login == true?}
    
    CekFirstLoginDudi -->|Ya| KonfigDudi[Halaman Konfigurasi: Lengkapi Profil Perusahaan & Kata Sandi]
    KonfigDudi --> DashboardDudi[Masuk ke Dashboard DUDI]
    CekFirstLoginDudi -->|Tidak| DashboardDudi
    
    DashboardDudi --> FiturDudi{Aktivitas Instruktur DUDI}
    
    %% Pemantauan Siswa Magang Khusus DUDI Ini
    FiturDudi -->|Pemantauan Siswa Magang| QuerySiswaDudi[Query Siswa: role = siswa & company_id = DUDI Ini]
    QuerySiswaDudi --> CekMutasiSiswa{Apakah Ada Siswa yang Pindah / Masuk DUDI?}
    CekMutasiSiswa -->|Siswa Pindah ke DUDI Lain| SiswaHilang[Nama Siswa Otomatis Hilang dari Dashboard DUDI Ini]
    CekMutasiSiswa -->|Siswa Baru Masuk ke DUDI Ini| SiswaMasuk[Nama Siswa Langsung Muncul dengan Status Belum Absen]
    CekMutasiSiswa -->|Siswa Aktif Saat Ini| TampilPresensiDudi[Tampilkan Status Masuk/Pulang & Jam Kehadiran Hari Ini]
    
    %% Periksa Laporan Pekerjaan
    FiturDudi -->|Tinjau Laporan Harian Siswa| KlikLaporanDudi[Klik Tombol 'Lihat Laporan' pada Baris Siswa]
    KlikLaporanDudi --> ModalLaporanDudi[Tampil Modal Laporan: Judul Tugas, Uraian Kerja, dan Foto Bukti]
    ModalLaporanDudi --> ValidasiPekerjaan[Instruktur DUDI Memverifikasi Hasil Kerja Siswa]
    
    %% Kelola Berita Khusus DUDI
    FiturDudi -->|Menu Berita DUDI| BukaMenuBeritaDudi[Buka Halaman Berita Perusahaan]
    BukaMenuBeritaDudi --> BuatPengumuman[Tulis Judul & Konten Pengumuman Internal DUDI]
    BuatPengumuman --> SimpanBerita[Simpan ke Tabel news dengan company_id = DUDI Ini]
    SimpanBerita --> BroadcastSiswa[Pengumuman Otomatis Hanya Muncul di Dashboard Siswa Magang DUDI Ini]
    
    %% Pengaturan Profil Perusahaan
    FiturDudi -->|Menu Pengaturan| MenuPengaturanDudi[Update Profil Perusahaan, Titik Lokasi GPS, atau Ganti Kata Sandi]
```

---

## Panduan Menjalankan di Local

### Prasyarat
Pastikan perangkat Anda sudah terinstal:
- [Node.js](https://nodejs.org) versi 18 atau lebih baru
- [Git](https://git-scm.com)
- Akun [Supabase](https://supabase.com) (gratis)

### Langkah-langkah

**1. Clone repositori ini**
```bash
git clone https://github.com/username/viskatoring.git
cd viskatoring
```

**2. Install dependensi**
```bash
npm install
```

**3. Buat file `.env.local` di root proyek**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
```
> Dapatkan nilai ini dari **Supabase Dashboard → Project Settings → API**.

**4. Siapkan database di Supabase**

Buka **SQL Editor** di Supabase dan jalankan query berikut secara berurutan:

```sql
-- Tabel companies (DUDI / Tempat Magang)
CREATE TABLE companies (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_name TEXT NOT NULL,
  latitude FLOAT8,
  longitude FLOAT8,
  radius_meters INT4 NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel user_accounts
CREATE TABLE user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'siswa',
  status TEXT NOT NULL DEFAULT 'pending',
  first_login BOOL NOT NULL DEFAULT true,
  company_id BIGINT REFERENCES companies(id),
  pending_company_id BIGINT REFERENCES companies(id),
  pending_company_status TEXT,
  selected JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel attendances
CREATE TABLE attendances (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  company_id BIGINT REFERENCES companies(id),
  tanggal_absen DATE NOT NULL,
  jam_masuk TIMESTAMPTZ NOT NULL,
  jam_pulang TIMESTAMPTZ,
  status_kehadiran TEXT NOT NULL DEFAULT 'WFH',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel reports
CREATE TABLE reports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attendance_id BIGINT NOT NULL REFERENCES attendances(id) ON DELETE CASCADE,
  judul_laporan TEXT NOT NULL,
  deskripsi_laporan TEXT NOT NULL,
  bukti_laporan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel news (Berita & Pengumuman)
CREATE TABLE news (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'siswa',
  company_id BIGINT REFERENCES companies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**5. Aktifkan Row Level Security (RLS)**

Agar seluruh tabel dapat diakses oleh klien menggunakan Anon Key, jalankan query berikut:

```sql
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Izinkan operasi SELECT, INSERT, UPDATE, DELETE untuk semua (anon)
CREATE POLICY "Allow all" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON user_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON attendances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON news FOR ALL USING (true) WITH CHECK (true);
```

**6. Jalankan server pengembangan**
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## Panduan Deployment ke Vercel

Aplikasi ini di-deploy menggunakan **Vercel** dengan domain kustom `viskatoring.web.id`.

### Langkah-langkah

**1. Push kode ke GitHub**
```bash
git add .
git commit -m "initial commit"
git push origin main
```

**2. Import proyek ke Vercel**
1. Buka [vercel.com](https://vercel.com) dan login.
2. Klik **Add New → Project**.
3. Pilih repositori GitHub `viskatoring` Anda.
4. Klik **Deploy** (Vercel otomatis mendeteksi Next.js).

**3. Tambahkan Environment Variables di Vercel**
1. Di dashboard Vercel → **Project Settings → Environment Variables**.
2. Tambahkan dua variabel berikut:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase project Anda |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon Key Supabase project Anda |

3. Klik **Save** lalu **Redeploy**.

**4. Hubungkan Domain Kustom `viskatoring.web.id`**
1. Di dashboard Vercel → **Project Settings → Domains**.
2. Ketik `portal-viskatoring.web.id` lalu klik **Add**.
3. Vercel akan menampilkan record DNS yang perlu ditambahkan. Salin nilainya.
4. Buka panel kontrol domain Anda (tempat membeli domain `viskatoring.web.id`).
5. Tambahkan **CNAME Record** atau **A Record** sesuai instruksi dari Vercel.
6. Tunggu propagasi DNS (biasanya 1–24 jam). Vercel akan otomatis menerbitkan sertifikat SSL (HTTPS) secara gratis.

---

## Struktur Proyek

```
viskatoring/
├── app/
│   ├── page.tsx                        # Halaman login utama (siswa & guru)
│   ├── login-admin/page.tsx            # Halaman login khusus admin (tersembunyi)
│   ├── konfigurasi-siswa/page.tsx      # Onboarding pertama kali untuk siswa
│   ├── konfigurasi-guru/page.tsx       # Onboarding pertama kali untuk guru
│   ├── konfigurasi-dudi/page.tsx       # Onboarding pertama kali untuk DUDI
│   ├── dashboard-siswa/
│   │   ├── page.tsx                    # Beranda & absensi siswa
│   │   ├── laporan/page.tsx            # Riwayat laporan & cetak rekapitulasi
│   │   ├── berita/page.tsx             # Berita & pengumuman untuk siswa
│   │   └── pengaturan/page.tsx         # Ganti kata sandi & ajukan pindah DUDI
│   ├── dashboard-guru/
│   │   ├── page.tsx                    # Pemantauan absensi siswa harian
│   │   ├── berita/page.tsx             # Berita untuk guru
│   │   └── pengaturan/page.tsx         # Pengaturan akun guru
│   ├── dashboard-dudi/
│   │   ├── page.tsx                    # Pemantauan siswa magang harian
│   │   ├── berita/page.tsx             # Berita dari & untuk DUDI
│   │   └── pengaturan/page.tsx         # Pengaturan akun DUDI
│   └── dashboard-admin/
│       ├── page.tsx                    # Dashboard statistik & persetujuan akun
│       ├── kelola-anggota/page.tsx     # Manajemen seluruh anggota
│       ├── berita/page.tsx             # Manajemen berita sekolah
│       └── pengaturan/page.tsx         # Pengaturan akun admin
├── supabase/
│   ├── client.ts                       # Inisialisasi Supabase client
│   ├── auth.ts                         # Fungsi autentikasi (hash, verify, session)
│   ├── types.ts                        # TypeScript interface untuk seluruh tabel
│   └── helpers.ts                      # Fungsi pembantu (GPS, format tanggal)
└── public/
    ├── smk.svg                         # Logo SMK (favicon)
    └── halaman depan.webp              # Foto latar halaman login
```

## Screenshot tampilan website

---

**Login**
1. Global (Kecuali Admin)
<img width="1279" height="641" alt="image" src="https://github.com/user-attachments/assets/87e0339a-d967-490b-ba26-f8d06df64bcd" />
2. Admin
<img width="1279" height="640" alt="image" src="https://github.com/user-attachments/assets/fe39083c-8445-4686-a105-9c230a1135cb" />

---

**Konfigurasi**
1. Siswa
<img width="1279" height="639" alt="image" src="https://github.com/user-attachments/assets/e906d71d-a628-49c0-b47f-a7b12b06291c" />
2. Guru dan DUDI
<img width="1279" height="641" alt="image" src="https://github.com/user-attachments/assets/36cb48a3-61ad-4541-87a3-f57fa9f16807" />

---

**Dashboard**
1. Siswa
<img width="1279" height="640" alt="image" src="https://github.com/user-attachments/assets/24a43db7-d3ca-4644-b8e2-051dd57b87c3" />
- Model Pop Up Absen Masuk
<img width="1279" height="639" alt="image" src="https://github.com/user-attachments/assets/3f8c40e6-4622-416d-8a44-ed084af3c1ed" />
- Model Pop Up Absen Pulang
<img width="1279" height="640" alt="image" src="https://github.com/user-attachments/assets/5def06df-06c8-4439-a525-d867cbfce518" />
2. Guru
<img width="1279" height="641" alt="image" src="https://github.com/user-attachments/assets/3636311d-6696-4fbb-8a52-c00f8246d0b6" />
- Model Pop Up Filterisasi
<img width="1279" height="641" alt="image" src="https://github.com/user-attachments/assets/833b3b4c-86db-4847-8845-c597ac981fb4" />
- Model Pop Up Lihat Laporan Siswa
<img width="1279" height="637" alt="image" src="https://github.com/user-attachments/assets/35774e65-8a1e-43e2-b6eb-1d11f1e0352d" />
3. DUDI
<img width="1279" height="639" alt="image" src="https://github.com/user-attachments/assets/e38eebd3-e31d-4f05-bd07-9a469bdb16b5" />
- Model Pop Up Lihat Laporan Siswa
<img width="1279" height="637" alt="image" src="https://github.com/user-attachments/assets/c813ea57-90d7-41f4-818d-104ad18a4cce" />
4. Admin
<img width="1279" height="639" alt="image" src="https://github.com/user-attachments/assets/5c8699f5-a89f-4996-80dd-239f6666981d" />
- Model Pop Up Persetujuan Anggota Baru
<img width="1279" height="638" alt="image" src="https://github.com/user-attachments/assets/2afb1176-4358-4e1c-8053-afead2e60662" />
- Model Pop Up Pengajuan Perubahan Dudi
<img width="1279" height="639" alt="image" src="https://github.com/user-attachments/assets/4800b0de-e687-461f-a22c-bd675d5fd17f" />

---

**Kelola Anggota**
1. Admin
<img width="1279" height="639" alt="image" src="https://github.com/user-attachments/assets/0d983593-10dc-404f-aec3-e94ea5b545b1" />
- Model Pop Up Tambah Anggota
<img width="1279" height="639" alt="image" src="https://github.com/user-attachments/assets/34aef64e-d6ee-4408-a20a-04ffcc8013a0" />
- Model Pop Up Edit Anggota
<img width="1279" height="639" alt="image" src="https://github.com/user-attachments/assets/c3cb54ef-0e20-44a5-a53e-af5b308bf3f9" />

---

**Laporan**
1. Siswa
<img width="1279" height="640" alt="image" src="https://github.com/user-attachments/assets/47258570-577b-4d68-9cdf-38f966b404c6" />
- Model Print Laporan
<img width="1279" height="640" alt="image" src="https://github.com/user-attachments/assets/1c1f4de8-7765-486e-8640-95e6909b75c2" />

---

**Berita**
1. Siswa
<img width="1279" height="639" alt="image" src="https://github.com/user-attachments/assets/fe85b2da-2b15-4909-8e56-e355caed9be1" />
2. Guru
<img width="1279" height="637" alt="image" src="https://github.com/user-attachments/assets/a3fb5225-70dd-4a31-a650-fcaf56cd0905" />
3. DUDI
<img width="1279" height="639" alt="image" src="https://github.com/user-attachments/assets/c350164a-cc21-49c9-ab64-92490edb3430" />
- Model Pop Up Tambah berita
<img width="1279" height="640" alt="image" src="https://github.com/user-attachments/assets/49e13362-e0ed-43df-8d1e-dcec4f3ec0bc" />
4. Admin
<img width="1279" height="641" alt="image" src="https://github.com/user-attachments/assets/daea5eb7-0114-48d2-9c8a-62d11ec33263" />
- Model Pop Up Tambah berita Siswa dan Guru
<img width="1279" height="641" alt="image" src="https://github.com/user-attachments/assets/c7a14ee0-f41e-4686-ae8b-34b90a240c2d" />

---

**Pengaturan**
1. Siswa
<img width="1279" height="638" alt="image" src="https://github.com/user-attachments/assets/d1eb5eda-fffd-4447-85d5-27df2c2f4499" />
2. Guru
<img width="1279" height="641" alt="image" src="https://github.com/user-attachments/assets/2287faa1-0970-4ab3-9e13-a68699548110" />
3. DUDI
<img width="1279" height="640" alt="image" src="https://github.com/user-attachments/assets/3d3f50c7-a9bc-4ae9-830f-8b98fd2e4a10" />
4. Admin
<img width="1279" height="638" alt="image" src="https://github.com/user-attachments/assets/7d0087a8-9693-4e01-8663-6b53e494bbb3" />
