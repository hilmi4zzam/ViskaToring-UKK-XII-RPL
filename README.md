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

## Rancangan Database (ERD)

Aplikasi menggunakan database relasional PostgreSQL (Supabase) yang terdiri dari **5 tabel** yang saling berelasi:

```
companies ──< user_accounts ──< attendances ──< reports
                                     ^
                              (company_id FK)
                              
news (berdiri sendiri, opsional FK ke companies)
```

---

### Tabel: `companies`
Menyimpan data tempat magang / DUDI beserta koordinat GPS untuk validasi absensi WFO.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `BIGINT` (PK) | ID unik DUDI, auto-increment |
| `company_name` | `TEXT` | Nama perusahaan / DUDI |
| `latitude` | `FLOAT8` | Koordinat lintang kantor DUDI |
| `longitude` | `FLOAT8` | Koordinat bujur kantor DUDI |
| `radius_meters` | `INT4` | Radius area (meter) untuk validasi WFO |
| `created_at` | `TIMESTAMPTZ` | Waktu data dibuat (default: `now()`) |

---

### Tabel: `user_accounts`
Menyimpan seluruh akun pengguna (siswa, guru, DUDI, dan admin).

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `UUID` (PK) | ID unik akun, default `gen_random_uuid()` |
| `username` | `TEXT` | Nama akun / nama lengkap |
| `password` | `TEXT` | Kata sandi (bcrypt hash) |
| `role` | `TEXT` | Peran: `siswa` / `guru` / `dudi` / `admin` |
| `status` | `TEXT` | Status akun: `pending` / `approved` / `rejected` |
| `first_login` | `BOOL` | `true` jika belum pernah masuk dan ganti kata sandi |
| `company_id` | `BIGINT` (FK → `companies.id`) | DUDI aktif siswa/DUDI saat ini |
| `pending_company_id` | `BIGINT` (FK → `companies.id`) | DUDI yang sedang diajukan pindah, menunggu persetujuan Admin |
| `pending_company_status` | `TEXT` | Status pengajuan pindah DUDI: `pending` / `approved` / `rejected` |
| `selected` | `JSONB` | (Khusus Guru) Daftar `id` siswa bimbingan yang dipilih |
| `created_at` | `TIMESTAMPTZ` | Waktu akun dibuat (default: `now()`) |

---

### Tabel: `attendances`
Mencatat setiap sesi kehadiran harian siswa (satu baris = satu hari kerja).

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `BIGINT` (PK) | ID unik presensi, auto-increment |
| `user_id` | `UUID` (FK → `user_accounts.id`) | Pemilik presensi ini |
| `company_id` | `BIGINT` (FK → `companies.id`) | DUDI yang aktif **saat presensi dilakukan** |
| `tanggal_absen` | `DATE` | Tanggal kehadiran (format `YYYY-MM-DD`) |
| `jam_masuk` | `TIMESTAMPTZ` | Waktu tap masuk |
| `jam_pulang` | `TIMESTAMPTZ` | Waktu tap pulang (nullable sebelum pulang) |
| `status_kehadiran` | `TEXT` | Status: `WFO` (di kantor) / `WFH` / `ALPA` |
| `created_at` | `TIMESTAMPTZ` | Waktu baris dibuat (default: `now()`) |

> **Catatan penting:** Kolom `company_id` di tabel ini sengaja menyimpan DUDI pada **saat presensi dilakukan**. Ini memastikan jika siswa pindah DUDI di kemudian hari, seluruh historis presensi lama tetap terisolasi dan tidak bercampur dengan data DUDI baru.

---

### Tabel: `reports`
Menyimpan laporan kegiatan harian yang diisi siswa saat absen pulang.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `BIGINT` (PK) | ID unik laporan, auto-increment |
| `attendance_id` | `BIGINT` (FK → `attendances.id`) | Presensi yang terkait laporan ini |
| `judul_laporan` | `TEXT` | Judul kegiatan yang dilaporkan |
| `deskripsi_laporan` | `TEXT` | Deskripsi detail kegiatan |
| `bukti_laporan` | `TEXT` | Foto bukti dalam format Base64 Data URL |
| `created_at` | `TIMESTAMPTZ` | Waktu laporan dikirim (default: `now()`) |

---

### Tabel: `news`
Menyimpan berita dan pengumuman dari Admin (untuk semua) atau dari DUDI (khusus siswa di DUDI-nya).

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `BIGINT` (PK) | ID unik berita, auto-increment |
| `title` | `TEXT` | Judul berita / pengumuman |
| `content` | `TEXT` | Isi berita |
| `kategori` | `TEXT` | Target pembaca: `siswa` / `guru` / `dudi` |
| `company_id` | `BIGINT` (FK → `companies.id`, nullable) | Jika diisi, berita hanya tampil untuk siswa di DUDI tersebut |
| `created_at` | `TIMESTAMPTZ` | Waktu berita dipublikasikan (default: `now()`) |

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
