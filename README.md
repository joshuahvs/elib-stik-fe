# 📚 e-Library STIK – Frontend

Frontend Sistem Informasi Perpustakaan STIK dibangun menggunakan **Next.js (App Router)** dan **Tailwind CSS**.  
Aplikasi ini berfungsi sebagai antarmuka pengguna (User & Admin) yang terhubung ke backend melalui REST API.

---

# 🚀 Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Axios / Fetch API
- JWT Authentication (dari backend)
- Deployment: Vercel

---

# 📁 Struktur Direktori

Berikut adalah struktur direktori utama dalam repository:
```
├── app/ # Routing utama (Next.js App Router)
│ ├── (auth)/ # Halaman login & registrasi
│ ├── dashboard/ # Dashboard admin
│ ├── books/ # Halaman katalog & detail buku
│ ├── blog/ # Halaman blog
│ ├── announcements/ # Halaman pengumuman
│ └── layout.tsx # Root layout
│
├── components/ # Reusable UI components
│ ├── ui/ # Button, Input, Modal, dll
│ ├── navbar/ # Navigasi user
│ └── sidebar/ # Navigasi admin
│
├── lib/ # Helper & konfigurasi
│ ├── api.ts # Konfigurasi base API
│ ├── auth.ts # Helper autentikasi
│ └── utils.ts # Utility functions
│
├── hooks/ # Custom React hooks
├── styles/ # Global styling
├── public/ # Static assets
├── .env.local # Environment variables (tidak di-commit)
├── next.config.js
├── tailwind.config.ts
└── package.json
```
---

# ⚙️ Environment Variables

Buat file `.env.local` di root project dan isi dengan:

NEXT_PUBLIC_API_URL=http://localhost:3001


Jika backend sudah dideploy:

NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app


> `NEXT_PUBLIC_` diperlukan agar variable bisa diakses di sisi client.

---

# 🛠️ Instalasi & Setup Lokal

### 1️⃣ Clone Repository
```bash
git clone <repository-url>
cd <repository-name>
```

### 2️⃣ Install Dependencies
```
npm install
```
atau jika menggunakan yarn:
```
yarn install
```

### 3️⃣ Setup Environment Variable
Buat file .env.local seperti yang dijelaskan di atas.

### 4️⃣ Jalankan Development Server
npm run dev
Aplikasi akan berjalan di:
http://localhost:3000

## 🔐 Autentikasi
Frontend menggunakan JWT yang dikirim dari backend setelah login.
- Token disimpan di localStorage / cookie
- Protected route dicek sebelum mengakses halaman tertentu
- Role-based UI (User vs Admin)

## 📦 Build Production
Untuk build production:
```
npm run build
```
Untuk menjalankan hasil build:
```
npm start
```

## 🌐 Deployment
Frontend dideploy menggunakan Vercel.

Langkah umum:
1. Push repository ke GitLab/GitHub
2. Import project ke Vercel
3. Tambahkan environment variable di dashboard Vercel
4. Deploy


Kontributor
Tim Pengembang e-Library STIK
Anggota:
- Joshua Hans Vito Soehendra
- Muhammad Fadhlan Arradhi
- Safira Salma Humaira
- Shalya Naura Lionita
- Shintia Dharma Shanty



# Kontribusi Masing-Masing Anggota
<details>
<summary><b>Joshua Hans Vito Soehendra</b></summary>

Nama: Joshua Hans Vito Soehendra
NPM: 2306165540
Role: Lead Programmer

## 📌 Branch Scope – PBI Implementation

Repository ini berisi implementasi Product Backlog Item (PBI) untuk fitur:
1. Mengelola Peminjaman Buku  
2. Kelola Antarmuka (Blog & Pengumuman)  

---

# 📘 EPIC 02 – Mengelola Peminjaman Buku

---

## 🟢 PBI-09 – Mengakses Buku Digital
**Story Point: 3**

### Business Value
Memberikan akses literatur digital secara online.

### Acceptance Criteria (Backend)
- Endpoint GET /books/{id}/digital tersedia.
- Sistem memvalidasi bahwa pengguna sudah login.
- Sistem memastikan buku memiliki versi digital.
- File dilindungi agar tidak dapat diakses tanpa autentikasi.

### Acceptance Criteria (Frontend)
- Tombol “Baca Digital” muncul jika buku memiliki versi digital.
- Buku terbuka dalam viewer atau tab baru.
- Jika belum login, pengguna diarahkan ke halaman login.
- Jika tidak tersedia versi digital, tombol tidak ditampilkan.

---

## 🟢 PBI-12 – Melihat Daftar Buku yang Dipinjam dengan Pagination
**Story Point: 3**

### Business Value
Membantu pengguna memonitor status pinjaman dan menghindari keterlambatan pengembalian.

### Acceptance Criteria (Backend)
- Endpoint tersedia: GET /books/borrowed-books
- Endpoint hanya dapat diakses oleh user yang sudah login 
- Endpoint menerima parameter query: page, limit
- Default value jika tidak diberikan: page = 1; limit = 10
- Backend menggunakan mekanisme limit & offset
- Response mengembalikan: data daftar peminjaman, total data, total halaman,
current page
- Data yang dikembalikan hanya milik user yang sedang login
- Data yang ditampilkan mencakup: Judul buku, Tanggal pinjam,Tanggal jatuh tempo, Status peminjaman.

### Acceptance Criteria (Frontend)
- Halaman “Buku Saya” tersedia untuk user
- Data ditampilkan dalam bentuk tabel
- Informasi yang ditampilkan: Judul buku, Tanggal pinjam, Jatuh tempo,
Status
- Terdapat kontrol pagination: Tombol Next, Tombol Previous, Nomor halaman aktif
- Ketika user berpindah halaman:
Frontend mengirim request ulang dengan parameter page
Data diperbarui tanpa reload penuh halaman
- Jika tidak ada data: Tampilkan state “Belum ada buku yang dipinjam"

---

## 🟢 PBI-15 – Mengajukan Peminjaman Buku

**Story Point: 3**

### Business Value
Memungkinkan pengguna memanfaatkan layanan utama sistem perpustakaan.

### Acceptance Criteria (Backend)
- Endpoint tersedia: GET /books/borrowed-books
- Endpoint hanya dapat diakses oleh user yang sudah login 
- Endpoint menerima parameter query: page, limit
- Default value jika tidak diberikan: page = 1; limit = 10
- Backend menggunakan mekanisme limit & offset
- Response mengembalikan: data daftar peminjaman, total data, total halaman,
current page
- Data yang dikembalikan hanya milik user yang sedang login
- Data yang ditampilkan mencakup: Judul buku, Tanggal pinjam,Tanggal jatuh tempo, Status peminjaman.

### Acceptance Criteria (Frontend)
"- Halaman “Buku Saya” tersedia untuk user
- Data ditampilkan dalam bentuk tabel
- Informasi yang ditampilkan: Judul buku, Tanggal pinjam, Jatuh tempo,
Status
- Terdapat kontrol pagination: Tombol Next, Tombol Previous, Nomor halaman aktif
- Ketika user berpindah halaman:
Frontend mengirim request ulang dengan parameter page
Data diperbarui tanpa reload penuh halaman
- Jika tidak ada data: Tampilkan state “Belum ada buku yang dipinjam”

---

## 🟢 PBI-16 – Admin Mengubah Status Pinjaman Buku

**Story Point: 3**

### Business Value
Memastikan pencatatan status pinjaman buku akurat dan terkendali sehingga data ketersediaan buku selalu valid dan dapat dipertanggungjawabkan.

### Acceptance Criteria (Backend)
- Sistem menyediakan endpoint PUT /api/admin/loans/{loanId}/status yang hanya dapat diakses oleh Admin.
- Endpoint memvalidasi perubahan status sesuai alur yang diperbolehkan (misal: DISETUJUI → DIAMBIL → DIKEMBALIKAN).
- Sistem mengembalikan response yang sesuai (200 OK, 400 Bad Request, 403 Forbidden, 404 Not Found).
- Saat status berubah, sistem memperbarui tanggal terkait (tanggal ambil/kembali) dan stok buku.
-  Perubahan status tersimpan di database.

### Acceptance Criteria (Frontend)
- Admin dapat melihat status pinjaman pada halaman daftar/detail pinjaman.
- Sistem menampilkan tombol aksi sesuai status (misal: “Tandai Telah Diambil” / “Tandai Telah Dikembalikan”).
- Saat tombol ditekan, muncul konfirmasi sebelum request dikirim ke backend.
- UI menampilkan notifikasi sukses atau error berdasarkan response backend.
- Status pinjaman langsung ter-update di tampilan setelah perubahan berhasil.


---
## 🟢 PBI-17 – Perpanjangan Masa Peminjaman
**Story Point: 3**

### Business Value
Mengurangi risiko denda dan meningkatkan kenyamanan pengguna.

### Acceptance Criteria (Backend)
- Endpoint PATCH /loans/{id}/extend hanya dapat diakses oleh pemilik pinjaman.
- Sistem memvalidasi bahwa buku belum melewati batas maksimal perpanjangan.
- Sistem tidak mengizinkan perpanjangan jika status sudah terlambat (jika itu aturan bisnis).
- Jika valid, sistem memperbarui tanggal jatuh tempo dan menyimpan riwayat perpanjangan.

### Acceptance Criteria (Frontend)
- Tombol “Ajukan Perpanjangan” hanya muncul untuk pinjaman aktif.
- Setelah diklik, sistem meminta konfirmasi sebelum memproses.
- Jika berhasil, tanggal jatuh tempo langsung diperbarui di tampilan.
- Jika gagal, tampilkan alasan penolakan dengan jelas.


# Total Story Point
- EPIC 02: 15 Story Points  
- EPIC 03: 14 Story Points  

**Total: 29 Story Points**

---

# 🎨 EPIC 03 – Kelola Antarmuka (Content Management System)

---

## 🟢 PBI-18 – Melihat Daftar Section Landing Page
**Story Point: 1**

### Business Value
Memudahkan admin memilih bagian yang akan dikelola.

### Acceptance Criteria (Backend)
- Endpoint GET /interface/sections hanya dapat diakses oleh role Admin.
- Sistem mengembalikan daftar section lengkap dengan id dan nama section.
- Jika tidak ada section, sistem mengembalikan array kosong.


### Acceptance Criteria (Frontend)
- Menu “Kelola Antarmuka” hanya muncul pada sidebar Admin.
- Daftar section ditampilkan dalam bentuk list atau tabel sederhana.
- Admin dapat memilih salah satu section untuk melihat detailnya.

---

## 🟢 PBI-19 – Mengubah Konten Section Landing Page
**Story Point: 2**

### Business Value
Memastikan konten website selalu relevan dan up-to-date.

### Acceptance Criteria (Backend)
- Endpoint PUT /interface/sections/{id} hanya dapat diakses oleh Admin.
- Sistem memvalidasi input (tidak boleh kosong jika field wajib).
- Data berhasil diperbarui di database dan mengembalikan response sukses.
- Jika id tidak ditemukan, sistem mengembalikan error 404.

### Acceptance Criteria (Frontend)
- Form edit menampilkan data lama sebagai default value.
- Tombol “Simpan Perubahan” hanya aktif jika ada perubahan data.
- Setelah berhasil disimpan, tampil notifikasi sukses.
- Perubahan langsung tercermin pada landing page setelah refresh.

---

## 🟢 PBI-20 – Menambahkan Blog
**Story Point: 3**

### Business Value
Menyediakan media komunikasi dan edukasi bagi pengguna.

### Acceptance Criteria (Backend)
- Endpoint POST /blogs tersedia.
- Validasi field judul dan konten wajib diisi.
- Data blog disimpan ke database.
- Status publish dapat diatur (draft/publish).

### Acceptance Criteria (Frontend)
- Tersedia form tambah blog.
- Admin dapat mengunggah gambar (opsional).
- Tersedia notifikasi sukses/gagal setelah submit.

---

## 🟢 PBI-21 – Edit Blog
**Story Point: 2**

### Business Value
Memastikan konten selalu relevan dan terkini.

### Acceptance Criteria (Backend)
- Endpoint PUT /blogs/{id} tersedia.
- Sistem memvalidasi bahwa blog ada sebelum update.
- Data yang diperbarui tersimpan dengan timestamp terbaru.

### Acceptance Criteria (Frontend)
- Admin dapat mengakses halaman edit dari daftar blog.
- Data lama otomatis terisi di form.
- Setelah update, perubahan langsung terlihat di halaman publik.

---

## 🟢 PBI-22 – Hapus Blog
**Story Point: 1**

### Business Value
Menghapus konten yang sudah tidak relevan.

### Acceptance Criteria (Backend)
- Endpoint DELETE /blogs/{id} tersedia.
- Sistem memastikan hanya admin yang dapat menghapus.
- Data dapat di-soft delete atau permanent delete.

### Acceptance Criteria (Frontend)
- Tersedia tombol hapus pada daftar blog.
- Muncul dialog konfirmasi sebelum penghapusan.
- Blog tidak lagi muncul setelah berhasil dihapus.

---

## 🟢 PBI-23 – Tambah Pengumuman
**Story Point: 2**

### Business Value
Menyampaikan informasi penting kepada pengguna secara cepat.

### Acceptance Criteria (Backend)
- Endpoint POST /announcements tersedia.
- Validasi judul dan isi wajib diisi.
- Pengumuman memiliki periode aktif.

### Acceptance Criteria (Frontend)
- Tersedia form tambah pengumuman.
- Pengumuman tampil di halaman beranda saat aktif.
- Tersedia notifikasi sukses setelah publish.

---

## 🟢 PBI-24 – Edit Pengumuman
**Story Point: 2**

### Business Value
Menjaga akurasi informasi yang ditampilkan.

### Acceptance Criteria (Backend)
- Endpoint PUT /announcements/{id} tersedia.
- Sistem memvalidasi keberadaan data sebelum update.
- Timestamp update tercatat di database.

### Acceptance Criteria (Frontend)
- Admin dapat mengedit pengumuman dari daftar.
- Perubahan langsung terlihat di halaman publik.
- Tersedia notifikasi setelah update berhasil.

---

## 🟢 PBI-25 – Hapus Pengumuman
**Story Point: 1**

### Business Value
Menghindari informasi usang tetap tampil kepada pengguna.

### Acceptance Criteria (Backend)
- Endpoint DELETE /announcements/{id} tersedia.
- Validasi role admin sebelum penghapusan.
- Data dinonaktifkan atau dihapus sesuai kebijakan.

### Acceptance Criteria (Frontend)
- Tersedia tombol hapus pada daftar pengumuman.
- Terdapat dialog konfirmasi sebelum eksekusi.
- Pengumuman tidak lagi tampil setelah berhasil dihapus.

</details>

<details>
<summary><b>Safira Salma Humaira</b></summary>
# Sistem Informasi Perpustakaan STIK
**Nama:** Safira Salma Humaira
**NPM:** 2306245850
**Role:** SCRUM Master

---

## 1. Deskripsi Proyek

Sistem Informasi Perpustakaan STIK merupakan sistem berbasis web yang mendukung digitalisasi layanan perpustakaan. Pada iterasi pengembangan ini, fitur yang dikembangkan berfokus pada proses persetujuan peminjaman dan perpanjangan oleh admin, pengelolaan ulasan dan rating buku, serta dashboard monitoring keaktifan anggota perpustakaan berbasis data transaksi peminjaman.

---

## 2. EPIC 02 – Mengelola Pinjaman Buku

Fitur ini memungkinkan admin untuk menyetujui atau menolak permintaan peminjaman dan perpanjangan sesuai kebijakan perpustakaan.

### 2.1 PBI-10 Approve / Reject Perpanjangan (Admin)

**Story Point:** 2

**Deskripsi:**
Memungkinkan admin menyetujui atau menolak permintaan perpanjangan masa peminjaman buku.

**Backlog Teknis:**

* Endpoint `PUT /loans/{id}/extend/approve`
* Endpoint `PUT /loans/{id}/extend/reject`
* Status awal harus `PENDING`
* Jika approve:

  * Tanggal jatuh tempo diperbarui
  * Status perpanjangan menjadi `APPROVED`
* Jika reject:

  * Status perpanjangan menjadi `REJECTED`
* Validasi batas maksimal perpanjangan
* Hanya role Admin yang dapat mengakses endpoint
* Perubahan disimpan di database

---

### 2.2 PBI-11 Approve / Reject Peminjaman Buku (Admin)

**Story Point:** 2

**Deskripsi:**
Memungkinkan admin menyetujui atau menolak permintaan peminjaman buku berdasarkan ketersediaan dan aturan perpustakaan.

**Backlog Teknis:**

* Endpoint `PUT /loans/{id}/approve`
* Endpoint `PUT /loans/{id}/reject`
* Status awal harus `PENDING`
* Jika approve:

  * Status peminjaman menjadi `APPROVED`
  * Sistem menetapkan tanggal jatuh tempo otomatis
  * Status buku menjadi `DIPINJAM`
* Jika reject:

  * Status peminjaman menjadi `REJECTED`
  * Alasan penolakan dapat disimpan
* Validasi ketersediaan buku
* Validasi aturan peminjaman pengguna
* Hanya role Admin yang dapat mengakses endpoint
* Perubahan disimpan di database

---

## 3. EPIC 04 – Mengelola Ulasan Buku

Fitur ini memungkinkan pengguna memberikan dan melihat ulasan buku, serta memberikan kontrol kepada admin untuk melakukan moderasi konten.

### 3.1 PBI-26 Menampilkan Ulasan Buku

**Story Point:** 1

**Deskripsi:**
Menampilkan daftar ulasan pada halaman detail buku untuk membantu pengguna mengetahui pengalaman pengguna lain sebelum melakukan peminjaman.

**Backlog Teknis:**

* Endpoint `GET /books/{id}/reviews`
* Mengembalikan data berdasarkan `book_id`
* Field: `nama_user`, `role`, `isi_ulasan`, `rating`, `tanggal`
* Jika tidak ada ulasan, sistem mengembalikan array kosong
* Section "Ulasan" tampil di halaman detail buku

---

### 3.2 PBI-27 Menambahkan Ulasan Buku

**Story Point:** 2

**Deskripsi:**
Memungkinkan pengguna yang telah login untuk menambahkan ulasan dan rating pada buku.

**Backlog Teknis:**

* Endpoint `POST /books/{id}/reviews`
* Validasi `isi_ulasan` tidak boleh kosong
* Validasi `rating` dalam rentang 1–5
* Data ulasan tersimpan di database
* Response `201 Created` jika berhasil
* Tersedia textarea dan input rating pada frontend
* Notifikasi sukses/gagal ditampilkan

---

### 3.3 PBI-28 Mengedit Ulasan Buku

**Story Point:** 2

**Deskripsi:**
Memungkinkan pengguna mengedit ulasan yang telah dibuat.

**Backlog Teknis:**

* Endpoint `PUT /reviews/{id}`
* Hanya pemilik ulasan yang dapat mengedit
* Validasi isi ulasan tidak boleh kosong
* Perubahan disimpan di database
* Ulasan diperbarui pada halaman detail buku

---

### 3.4 PBI-29 Menghapus Ulasan Buku

**Story Point:** 1

**Deskripsi:**
Memungkinkan pengguna atau admin menghapus ulasan.

**Backlog Teknis:**

* Endpoint `DELETE /reviews/{id}`
* Hanya pemilik ulasan atau Admin yang dapat menghapus
* Data dihapus atau menggunakan mekanisme soft delete
* Ulasan tidak tampil setelah dihapus

---

### 3.5 PBI-30 Rata-Rata Rating Buku

**Story Point:** 3

**Deskripsi:**
Menampilkan rata-rata rating buku berdasarkan seluruh penilaian pengguna.

**Backlog Teknis:**

* Sistem menghitung rata-rata rating berdasarkan seluruh rating buku
* Perhitungan dilakukan secara dinamis
* Rata-rata rating ditampilkan pada halaman detail buku
* Rating divisualisasikan dalam bentuk bintang

---

## 4. EPIC 05 – Dashboard Keaktifan Anggota

Fitur ini menyediakan dashboard analitik untuk memantau tingkat keaktifan anggota perpustakaan berdasarkan data transaksi peminjaman.

### 4.1 PBI-31 Menampilkan Ringkasan Statistik Keaktifan (Card)

**Story Point:** 3

**Deskripsi:**
Menampilkan ringkasan statistik penggunaan perpustakaan dalam periode tertentu.

**Backlog Teknis:**

* Endpoint `GET /dashboard/keaktifan`
* Endpoint menerima parameter `periode`
* Menghitung total mahasiswa aktif
* Menghitung total transaksi peminjaman
* Menghitung rata-rata peminjaman
* Menampilkan summary cards pada frontend

---

### 4.2 PBI-32 Menampilkan Grafik Batang Keaktifan Anggota

**Story Point:** 5

**Deskripsi:**
Menampilkan visualisasi grafik batang jumlah peminjaman mahasiswa.

**Backlog Teknis:**

* Endpoint menyediakan data agregasi jumlah peminjaman
* Mengembalikan minimal Top 5 mahasiswa
* Data diurutkan secara descending
* Grafik batang ditampilkan pada dashboard
* Grafik otomatis diperbarui saat periode berubah

---

### 4.3 PBI-33 Menampilkan Ranking Mahasiswa Aktif

**Story Point:** 3

**Deskripsi:**
Menampilkan tabel ranking mahasiswa berdasarkan jumlah peminjaman.

**Backlog Teknis:**

* Menghitung jumlah peminjaman per mahasiswa
* Data diurutkan secara descending
* Mengembalikan Top 5 mahasiswa
* Menampilkan tabel ranking (nama, NIM, jumlah peminjaman)

---

### 4.4 PBI-34 Filter Periode Dashboard

**Story Point:** 2

**Deskripsi:**
Memungkinkan pengguna memilih periode waktu untuk analisis laporan keaktifan.

**Backlog Teknis:**

* Endpoint menerima parameter `periode`
* Sistem memfilter data berdasarkan tanggal transaksi
* Dropdown periode tersedia pada frontend
* Dashboard otomatis refresh saat periode berubah

---

## 5. Total Story Point

* EPIC 02: 4 Story Points
* EPIC 04: 9 Story Points
* EPIC 05: 13 Story Points
* **Total: 26 Story Points**


</details>

<details>
<summary><b>Shintia Dharma Shanty</b></summary>

## Kontribusi Individu

**Nama:** Shintia Dharma Shanty  
**NPM:** 2306245655  

---

## Fitur yang Dikerjakan

### EPIC 01 – Mengelola Akun Pengguna
Fitur untuk mendukung proses registrasi, login, dan pengelolaan informasi akun pengguna dalam sistem perpustakaan.

#### PBI-1 – Registrasi Akun Berdasarkan Role – Identitas Unik
**Story Point:** 3
Pengguna dapat melakukan registrasi akun sesuai role (Mahasiswa/Dosen/Guest) dengan identitas unik.
**Acceptance Criteria:**
- Endpoint POST /register tersedia.
- Form registrasi menampilkan field berbeda sesuai role.
- Validasi identitas unik (tidak boleh duplikat).
- Data pengguna tersimpan di database.
- Registrasi berhasil menampilkan notifikasi sukses.

#### PBI-2 – Login Pengguna
**Story Point:** 3
Pengguna dapat login ke sistem sesuai role yang dimiliki.
**Acceptance Criteria:**
- Endpoint POST /login tersedia.
- Validasi email/username dan password.
- Sistem menghasilkan token/session login.
- Login gagal menampilkan pesan error.
- Hanya pengguna terdaftar yang dapat mengakses sistem.

#### PBI-3 – Menampilkan Detail Akun Pengguna
**Story Point:** 2
Pengguna dapat melihat detail informasi akun miliknya.
**Acceptance Criteria:**
- Endpoint GET /api/profile tersedia.
- Sistem menampilkan nama, email, role, dan data profil lainnya.
- Data yang ditampilkan sesuai dengan akun yang sedang login.
- Halaman profile hanya dapat diakses oleh pengguna yang sudah login.

---

### EPIC 06 – Unggah & Pengelolaan Skripsi Digital
Fitur untuk mendukung proses unggah skripsi digital oleh mahasiswa serta pengelolaan dan verifikasi skripsi oleh admin dalam sistem perpustakaan.

#### PBI-35 – Isi Form & Submit Data Skripsi
**Story Point:** 2
Mahasiswa dapat mengisi metadata skripsi sebelum mengunggah file.
**Acceptance Criteria:**
- Endpoint untuk menambahkan metadata skripsi tersedia.
- Field judul, tahun, dan abstrak wajib diisi.
- Data metadata tersimpan di database.
- Status awal skripsi Menunggu Verifikasi.

#### PBI-36 – Unggah File PDF Skripsi
**Story Point:** 2
Mahasiswa dapat mengunggah file skripsi dalam format PDF.
**Acceptance Criteria:**
- Sistem menerima file dalam format PDF.
- File tersimpan secara digital di storage/server.
- Jika file bukan PDF → sistem menolak unggahan.
- Notifikasi sukses/gagal ditampilkan.

#### PBI-37 – Menampilkan Daftar dan Status Skripsi
**Story Point:** 2
Mahasiswa dapat melihat daftar dan status skripsi miliknya.
**Acceptance Criteria:**
- Endpoint untuk menampilkan skripsi milik mahasiswa tersedia.
- Status yang ditampilkan: Menunggu Verifikasi, Disetujui, Ditolak.
- Jika tidak ada data → tampil pesan kosong.
- Data difilter berdasarkan user login.

#### PBI-38 – Menampilkan dan Memfilter Daftar Skripsi
**Story Point:** 2
Admin dapat melihat dan memfilter daftar skripsi berdasarkan status.
**Acceptance Criteria:**
- Endpoint menampilkan seluruh skripsi tersedia.
- Filter berdasarkan status berfungsi.
- Data ditampilkan dalam bentuk tabel.
- Jika tidak ada data → tampil pesan kosong.

#### PBI-39 – Lihat Detail & Verifikasi Skripsi
**Story Point:** 3
Admin dapat melihat detail skripsi dan melakukan verifikasi.
**Acceptance Criteria:**
- Endpoint detail skripsi tersedia.
- Metadata dan file PDF dapat diakses.
- Admin dapat memilih aksi setujui/tolak.
- Status berubah sesuai aksi.
- Hanya skripsi berstatus Menunggu Verifikasi yang dapat diverifikasi.

#### PBI-40 – Lihat Semua Skripsi & Filter Daftar Skripsi
**Story Point:** 2
Pengguna dapat melihat seluruh daftar skripsi dengan fitur filter.
**Acceptance Criteria:**
- Endpoint menampilkan seluruh skripsi tersedia.
- Fitur pencarian berdasarkan judul atau nama mahasiswa berfungsi.
- Data dapat difilter sesuai kebutuhan.
- Hasil pencarian menampilkan data yang relevan.

#### PBI-41 – Lihat Detail dan Unduh Skripsi
**Story Point:** 3
Pengguna dapat melihat detail dan mengunduh skripsi yang tersedia.
**Acceptance Criteria:**
- Endpoint detail skripsi tersedia.
- File PDF dapat diunduh.
- Metadata ditampilkan lengkap.
- Hanya skripsi yang sudah Disetujui yang dapat diakses publik.

---

### EPIC 07 – Pengadaan Buku Perpustakaan
Fitur untuk mendukung proses penambahan koleksi buku baru oleh admin perpustakaan.

#### PBI-42 – Tambah Data Buku Baru ke Sistem Perpustakaan
**Story Point:** 2
Admin dapat menambahkan data buku baru ke dalam sistem perpustakaan.
**Acceptance Criteria:**
- Endpoint untuk menambahkan buku tersedia.
- Field judul, penulis, penerbit, tahun, kategori wajib diisi.
- Data buku tersimpan di database.
- Notifikasi sukses/gagal ditampilkan.

#### PBI-43 – Unggah File PDF Buku
**Story Point:** 2
Admin dapat mengunggah file buku dalam format PDF.
**Acceptance Criteria:**
- Sistem menerima file dalam format PDF.
- File tersimpan di storage/server.
- Jika file bukan PDF → sistem menolak unggahan.
- File dapat diakses melalui halaman detail buku.

---

## Total Story Point

* EPIC 01: 8 Story Points
* EPIC 06: 16 Story Points
* EPIC 07: 4 Story Points
* **Total: 28 Story Points**

</details>


<details>
<summary><b>Muhammad Fadhlan Arradhi</b></summary>
# Sistem Informasi Perpustakaan STIK

## Identitas

**Nama:** Radhi
**NPM:** 2306240061

------------------------------------------------------------------------

# 1. Deskripsi Proyek

Pada iterasi pengembangan ini, Radhi bertanggung jawab atas pengembangan
fitur penelusuran koleksi buku dan dashboard analitik pada Sistem
Informasi Perpustakaan STIK. Fitur ini mendukung pengguna dalam mencari
informasi buku serta membantu pengelola perpustakaan dalam pengambilan
keputusan berbasis data.

------------------------------------------------------------------------

# 2. EPIC 02 -- Mengelola Pinjaman Buku

## PBI-13 -- Filter Daftar Buku yang Dipinjam

**Priority:** Should Have
**Story Point:** 2

**Role:**
- Mahasiswa
- Dosen
- Umum

**Deskripsi:**
Membantu pengguna untuk dengan cepat menemukan buku berdasarkan status peminjaman, terutama untuk mengetahui buku yang sudah mendekati atau melewati jatuh tempo.

**Backlog Teknis:** 
- Endpoint GET /books/borrowed-books mendukung parameter query tambahan: status
- Nilai status yang diperbolehkan: AKTIF, TERLAMBAT, DIKEMBALIKAN
- Jika parameter status dikirim: Backend hanya mengembalikan data sesuai status tersebut
- Jika tidak dikirim: Semua data dikembalikan (default behavior)
- Filtering tetap kompatibel dengan pagination (page & limit tetap berjalan)

------------------------------------------------------------------------

## PBI-14 -- Sorting Daftar Buku yang Dipinjam

**Priority:** Could Have
**Story Point:** 1

**Role:**
- Mahasiswa
- Dosen
- Umum

**Deskripsi:**
Membantu pengguna mengurutkan buku berdasarkan tanggal pinjam atau tanggal jatuh tempo sehingga dapat memprioritaskan pengembalian buku yang paling dekat jatuh tempo.


**Backlog Teknis:** 
- Endpoint GET /books/borrowed-books mendukung parameter: sortBy (loanDate / dueDate), order (asc / desc)
- Jika parameter tidak diberikan: Default sorting berdasarkan dueDate ASC
- Backend memastikan parameter valid sebelum dieksekusi
- Sorting tetap berjalan bersamaan dengan: Pagination, Filtering

------------------------------------------------------------------------

# 3. EPIC 08 -- Penelusuran dan Manajemen Informasi Koleksi

## PBI-44 -- Mencari Koleksi Buku Berdasarkan Judul atau ISBN

**Priority:** Must Have
**Story Point:** 5

**Role:**
- Mahasiswa
- Dosen
- Umum

**Deskripsi:**
Memungkinkan pengguna mencari koleksi buku berdasarkan judul atau ISBN
secara cepat dan akurat.

**Backlog Teknis:** 
- Sistem menyediakan endpoint GET /api/books/search untuk pencarian
- Sistem menerima parameter pencarian pada kolom judul, pengarang, dan ISBN di database
- Sistem mengembalikan daftar buku yang relevan dalam format JSON
- Sistem mengembalikan pesan "data tidak ditemukan" jika hasil pencarian kosong

------------------------------------------------------------------------

## PBI-45 -- Melihat Detail dan Ketersediaan Buku

**Priority:** Must Have
**Story Point:** 3

**Role:**
- Mahasiswa
- Dosen
- Umum

**Deskripsi:**
Menampilkan informasi lengkap buku beserta status ketersediaannya.

**Backlog Teknis:**
- Sistem menyediakan endpoint GET /api/books/{id} untuk detail buku
- Sistem melakukan pengecekan status ketersediaan secara real-time
- Endpoint mengembalikan data lengkap judul, penulis, sinopsis, lokasi rak, dan status
- Sistem menangani error jika ID buku tidak ditemukan (404 Not Found)

------------------------------------------------------------------------

## PBI-46 -- Memfilter Koleksi Buku Berdasarkan Parameter

**Priority:** Should Have
**Story Point:** 3

**Role:**
- Mahasiswa
- Dosen
- Umum

**Deskripsi:**
Memungkinkan pengguna memfilter koleksi berdasarkan kategori, penulis,
tahun, atau status ketersediaan.

**Backlog Teknis:**
- Endpoint mendukung parameter sorting sort_by (judul, tahun, atau terbaru)
- Sistem memvalidasi parameter filter dan sort yang dikirimkan
- Sistem mengembalikan daftar buku yang relevan dalam format JSON
- Sistem mengembalikan pesan "data tidak ditemukan" jika hasil pencarian kosong

------------------------------------------------------------------------

# 4. EPIC 09 -- Dashboard dan Analitik Perpustakaan

## PBI-47 -- Dashboard Sirkulasi Harian

**Priority:** Must Have
**Story Point:** 3

**Role:**
- Admin/Pustakawan

**Deskripsi:**
Menampilkan ringkasan aktivitas sirkulasi perpustakaan pada hari
tertentu.

**Backlog Teknis:**
- Sistem menyediakan endpoint untuk mengambil data agregasi sirkulasi harian
- Sistem menghitung total buku dipinjam, dikembalikan, dan terlambat pada hari berjalan
- Data yang dikembalikan harus mencakup timestamp pembaruan terakhir

------------------------------------------------------------------------

## PBI-48 -- Visualisasi Tren Peminjaman

**Priority:** Should Have
**Story Point:** 5

**Role:**
- Admin/Pustakawan

**Deskripsi:**
Menampilkan grafik tren peminjaman buku berdasarkan periode waktu
tertentu.

**Backlog Teknis:**
- Sistem menyediakan data time-series (7-30 hari terakhir) dalam format JSON
- Backend menghitung frekuensi transaksi per hari dari tabel sirkulasi
- Endpoint mendukung parameter rentang tanggal (start_date & end_date)
- Sistem memvalidasi agar rentang tanggal tidak lebih dari 1 tahun

------------------------------------------------------------------------

## PBI-49 -- Analisis Buku Populer

**Priority:** Could Have
**Story Point:** 3

**Role:**
- Admin/Pustakawan

**Deskripsi:**
Menampilkan daftar buku yang paling sering dipinjam dalam periode
tertentu.

**Backlog Teknis:**
- Sistem menyediakan endpoint untuk mengambil daftar buku dengan jumlah pinjam terbanyak
- Query melakukan sorting DESC berdasarkan kolom total_loans
- Sistem membatasi hasil hanya 5 (Limit 5) record teratas
- Mendukung filter berdasarkan kategori untuk melihat buku populer di bidang tertentu

------------------------------------------------------------------------
</details>

<details>
<summary><b>Shalya Naura Lionita</b></summary>
# Sistem Informasi Perpustakaan STIK

## Identitas

**Nama:** Shalya Naura Lionita  
**NPM:** 2306245535  

---

# EPIC 01 – Mengelola Akun Pengguna

EPIC ini berfokus pada pengelolaan akun pengguna untuk memastikan keamanan, validitas masa aktif, serta monitoring aktivitas sistem.

---

# PBI 4 – Mengubah Data Akun (Edit Profile)

**Story Points:** 2  
**Priority:** Should Have  

## Deskripsi
Fitur ini memungkinkan pengguna memperbarui informasi akun agar tetap akurat dan relevan.

## User Story
**AS** Pengguna  
**I WANT TO** memperbarui data akun saya  
**SO THAT** informasi akun tetap akurat dan terbaru  

## Backlog Teknis
- Endpoint `PUT /api/profile` tersedia
- Endpoint hanya dapat diakses oleh user yang sudah login
- Field yang dapat diubah: nama lengkap, email, dll (tidak termasuk role dan username unik)
- Validasi username unik dan tidak boleh kosong
- Jika email sudah digunakan → response 409 Conflict
- Jika input tidak valid → response 400 Bad Request
- Response 200 OK jika berhasil

## Acceptance Criteria
- Tersedia tombol “Edit Profile” di halaman profil
- Form edit menampilkan data lama sebagai default value
- Role dan username tidak dapat diubah
- Jika berhasil → tampil pesan “Profil berhasil diperbarui”
- Jika gagal → tampil pesan error sesuai response backend

---

# PBI 5 – Logout Pengguna

**Story Points:** 1  
**Priority:** Must Have  

## Deskripsi
Fitur ini memungkinkan pengguna keluar dari sistem dengan aman.

## User Story
**AS** Pengguna  
**I WANT TO** logout dari sistem  
**SO THAT** sesi penggunaan dapat berakhir dengan aman  

## Backlog Teknis
- Sistem menyediakan endpoint logout
- Sistem menghapus session/token pengguna

## Acceptance Criteria
- Tersedia tombol Logout pada halaman sistem
- Setelah logout, pengguna diarahkan ke halaman login

---

# PBI 6 – Pengaturan Masa Aktif Akun Berdasarkan Jenjang

**Story Points:** 3  
**Priority:** Must Have  

## Deskripsi
Fitur ini memastikan akun mahasiswa hanya aktif sesuai masa studi berdasarkan jenjang pendidikan.

## User Story
**AS** Sistem  
**I WANT TO** mengatur masa aktif akun mahasiswa berdasarkan jenjang  
**SO THAT** akun otomatis nonaktif setelah masa studi berakhir  

## Backlog Teknis
- Sistem menyimpan jenjang mahasiswa (S1/S2/S3)
- S1 = 4 tahun
- S2 = 3 tahun
- S3 = 4 tahun
- Setelah melewati masa aktif → status akun berubah menjadi “Nonaktif”
- Akun nonaktif tidak dapat login

## Acceptance Criteria
- Status akun ditampilkan di halaman profil
- Setelah masa studi berakhir, akun otomatis tidak dapat login

---

# PBI 7 – Auto Delete Akun Tidak Aktif 6 Bulan

**Story Points:** 3  
**Priority:** Must Have  

## Deskripsi
Fitur ini menghapus akun yang tidak aktif selama 6 bulan untuk menjaga keamanan sistem.

## User Story
**AS** Sistem  
**I WANT TO** menghapus akun yang tidak aktif selama 6 bulan  
**SO THAT** sistem lebih aman dan bersih dari akun tidak digunakan  

## Backlog Teknis
- Sistem mencatat last_login setiap user
- Jika tidak ada login selama 6 bulan → status akun menjadi “Deleted”
- Akun deleted tidak dapat login

## Acceptance Criteria
- Sistem otomatis melakukan pengecekan masa tidak aktif
- Akun yang dihapus tidak dapat digunakan kembali

---

# PBI 8 – Logging Aktivitas Login Pengguna

**Story Points:** 3  
**Priority:** Should Have  

## Deskripsi
Fitur ini memungkinkan admin memonitor aktivitas login pengguna untuk meningkatkan keamanan sistem.

## User Story
**AS** Admin  
**I WANT TO** melihat riwayat login pengguna  
**SO THAT** saya dapat memonitor aktivitas mencurigakan  

## Backlog Teknis
- Sistem mencatat waktu login, role, dan user_id
- Data disimpan dalam tabel `log_aktivitas`
- Endpoint khusus admin untuk melihat log login

## Acceptance Criteria
- Admin dapat melihat tabel riwayat login
- Data dapat difilter berdasarkan tanggal

---

# EPIC 10 – Pencatatan Kunjungan Perpustakaan

EPIC ini berfokus pada digitalisasi pencatatan kunjungan perpustakaan untuk kebutuhan monitoring dan pelaporan.

---

# PBI 50 – Mengisi & Submit Form Check-in Kunjungan

**Story Points:** 2  
**Priority:** Must Have  

## Deskripsi
Fitur ini memungkinkan pengguna melakukan check-in kunjungan perpustakaan secara digital.

## User Story
**AS** Pengguna (Mahasiswa, Dosen, Guest)  
**I WANT TO** melakukan check-in kunjungan perpustakaan  
**SO THAT** kunjungan saya tercatat secara resmi di sistem  

## Backlog Teknis
- Endpoint `POST /api/kunjungan` tersedia
- Request berisi: tanggal (auto dari server), waktu (auto), dan identitas user
- Validasi: user hanya dapat check-in 1 kali per hari
- Jika sudah check-in → response 409 Conflict
- Jika data tidak valid → 400 Bad Request
- Jika berhasil → 201 Created

## Acceptance Criteria
- Tombol “Check-in Kunjungan” hanya tampil untuk user login
- Jika sukses → tampil notifikasi “Check-in berhasil”
- Jika gagal → tampil pesan error sesuai response backend

---

# PBI 51 – Menampilkan Daftar Riwayat Kunjungan

**Story Points:** 2  
**Priority:** Must Have  

## Deskripsi
Fitur ini memungkinkan admin melihat seluruh riwayat kunjungan dalam bentuk tabel.

## User Story
**AS** Admin  
**I WANT TO** melihat seluruh data kunjungan dalam bentuk tabel  
**SO THAT** saya dapat memonitor aktivitas pengunjung  

## Backlog Teknis
- Endpoint `GET /api/kunjungan`
- Hanya admin yang dapat mengakses endpoint
- Data: nama, role, id pengguna, tanggal, waktu
- Mendukung pagination

## Acceptance Criteria
- Halaman admin menampilkan tabel riwayat kunjungan
- Jika data kosong → tampil pesan “Data tidak ditemukan”
- Mendukung pagination

---

# PBI 52 – Filter & Pencarian Riwayat Kunjungan

**Story Points:** 3  
**Priority:** Must Have  

## Deskripsi
Fitur ini memungkinkan admin memfilter dan mencari data kunjungan berdasarkan berbagai parameter.

## User Story
**AS** Admin  
**I WANT TO** memfilter dan mencari data kunjungan berdasarkan tanggal, nama, atau ID pengguna  
**SO THAT** saya dapat memperoleh data spesifik sesuai kebutuhan laporan  

## Backlog Teknis
- Endpoint `GET /api/kunjungan` mendukung parameter filter
- Validasi parameter tanggal
- Jika filter tidak sesuai → 400 Bad Request
- Jika tidak ada data → 200 OK dengan array kosong

## Acceptance Criteria
- Tersedia filter tanggal, nama, dan role
- Setelah filter diterapkan → tabel update otomatis
- Jika kosong → tampil “Data tidak ditemukan”

---

# PBI 53 – Validasi Role Pengunjung

**Story Points:** 1  
**Priority:** Should Have  

## Deskripsi
Fitur ini memastikan bahwa data kunjungan tercatat sesuai dengan kategori pengguna untuk kebutuhan analisis dan pelaporan.

## User Story
**AS** Sistem  
**I WANT TO** mencatat role pengguna saat check-in  
**SO THAT** data kunjungan dapat dikelompokkan berdasarkan kategori pengguna  

## Backlog Teknis
- Role pengguna diambil langsung dari tabel user saat proses check-in
- Role tidak dapat dimanipulasi dari sisi front-end
- Sistem menolak request jika role tidak valid
- Jika role tidak ditemukan atau tidak sesuai → response 400 Bad Request

## Acceptance Criteria
- Role tidak tersedia sebagai field input manual pada form check-in
- Role otomatis tersimpan bersama data kunjungan
- Data role tampil otomatis pada dashboard/admin riwayat kunjungan

---

# EPIC 11 – Mengelola Koleksi Buku Perpustakaan

EPIC ini berfokus pada pengelolaan koleksi buku agar data selalu akurat dan mudah dikelola.

---

# PBI 54 – Menampilkan Daftar Koleksi Buku

**Story Points:** 2  
**Priority:** Must Have  

## Deskripsi
Fitur ini memungkinkan admin melihat daftar koleksi buku yang tersedia di sistem.

## User Story
**AS** Admin  
**I WANT TO** melihat daftar koleksi buku  
**SO THAT** saya dapat mengelola data buku dengan mudah  

## Backlog Teknis
- Endpoint `GET /api/buku`
- Data: judul, penulis, kategori, tahun terbit, stok, status
- Mendukung pagination

## Acceptance Criteria
- Tabel koleksi buku tampil
- Jika kosong → tampil “Belum ada koleksi buku”

---

# PBI 55 – Filter & Pencarian Koleksi Buku

**Story Points:** 3  
**Priority:** Must Have  

## Deskripsi
Fitur ini memungkinkan admin mencari dan memfilter buku berdasarkan berbagai parameter.

## User Story
**AS** Admin  
**I WANT TO** memfilter dan mencari buku berdasarkan judul, penulis, kategori  
**SO THAT** saya dapat menemukan buku dengan cepat  

## Backlog Teknis
- Endpoint mendukung parameter query
- Validasi input pencarian
- Jika tidak ada hasil → return array kosong

## Acceptance Criteria
- Tersedia field search dan dropdown filter
- Tabel update sesuai hasil filter
- Jika kosong → tampil “Data tidak ditemukan”

---

# PBI 56 – Mengubah Data Buku

**Story Points:** 2  
**Priority:** Must Have  

## Deskripsi
Fitur ini memungkinkan admin memperbarui informasi buku.

## User Story
**AS** Admin  
**I WANT TO** mengubah informasi buku  
**SO THAT** data koleksi tetap akurat  

## Backlog Teknis
- Endpoint `PUT /api/buku/{id}`
- Validasi id buku
- Validasi stok tidak boleh negatif

## Acceptance Criteria
- Admin dapat membuka halaman edit
- Jika berhasil → tampil notifikasi sukses
- Jika gagal → tampil pesan error

---

# PBI 57 – Menghapus Buku

**Story Points:** 1  
**Priority:** Must Have  

## Deskripsi
Fitur ini memungkinkan admin menghapus buku dari sistem.

## User Story
**AS** Admin  
**I WANT TO** menghapus buku  
**SO THAT** koleksi tetap relevan  

## Backlog Teknis
- Endpoint `DELETE /api/buku/{id}`
- Tidak dapat menghapus buku yang sedang dipinjam

## Acceptance Criteria
- Tersedia tombol “Hapus”
- Sistem meminta konfirmasi sebelum menghapus
- Jika berhasil → tampil notifikasi “Buku berhasil dihapus”

---

# Total Story Point

- EPIC 01: 12 Story Points  
- EPIC 10: 8 Story Points  
- EPIC 11: 8 Story Points  

**Total: 28 Story Points**
</details>