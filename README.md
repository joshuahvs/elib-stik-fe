# 📚 Sistem Informasi Perpustakaan Digital
## 📌 Branch Scope – PBI Implementation

Repository ini berisi implementasi Product Backlog Item (PBI) untuk fitur:
1. Authentication & Account Management  
2. Mengelola Peminjaman Buku  
3. Kelola Antarmuka (Blog & Pengumuman)  

---

# 🧩 EPIC 01 – Authentication & Account Management

---

## 🟢 PBI-01 – Registrasi Akun Berdasarkan Role dan Identitas Unik
**Story Point: 3**

### Deskripsi
Pengguna dapat melakukan registrasi akun dengan role tertentu (Mahasiswa/Dosen/Admin) serta menggunakan identitas unik (NIM/NIDN/Email institusi).

### Business Value
Menjamin setiap akun valid dan sesuai dengan identitas resmi pengguna.

### Acceptance Criteria (Backend)
- Endpoint POST /register tersedia.
- Jika role = Mahasiswa → wajib input NIM dan NIM harus unik.
- Jika role = Dosen → wajib input Nomor Dosen dan harus unik.
- Jika role = Umum → wajib input Email/NIK dan harus unik.
- Sistem menolak registrasi jika identitas sudah terdaftar.
- Password di-hash sebelum disimpan.
- Role disimpan sesuai pilihan pengguna.

### Acceptance Criteria (Frontend)
- -Form registrasi menampilkan field berbeda sesuai role yang dipilih.
- Jika pilih Mahasiswa → muncul field NIM.
- Jika pilih Dosen → muncul field Nomor Dosen.
- Jika pilih Umum → muncul field Email.
- Muncul pesan error jika identitas sudah terdaftar.
- Muncul notifikasi sukses jika registrasi berhasil.

---

## 🟢 PBI-02 – Pengaturan Masa Aktif Akun Berdasarkan Jenjang
**Story Point: 3**

### Deskripsi
Sistem mengatur masa aktif akun sesuai jenjang (misalnya mahasiswa aktif selama masa studi).

### Business Value
Mengontrol akses sistem berdasarkan status akademik pengguna.

### Acceptance Criteria (Backend)
- Sistem menyimpan jenjang mahasiswa (S1 / S2 / S3).
- Sistem mengatur masa aktif:
- S1 = 4 tahun
- S2 = 3 tahun
- S3 = 4 tahun
- Setelah melewati masa aktif → status akun berubah menjadi “Nonaktif”.
- Akun nonaktif tidak dapat login."

### Acceptance Criteria (Frontend)
- Jika akun tidak aktif, tampil pesan bahwa masa aktif telah habis.
- Pengguna diarahkan untuk menghubungi admin.

---

## 🟢 PBI-03 – Auto Delete Akun Tidak Aktif 6 Bulan
**Story Point: 5**

### Deskripsi
Sistem otomatis menghapus akun yang tidak memiliki aktivitas login selama 6 bulan.

### Business Value
Menjaga kebersihan database dan keamanan sistem.

### Acceptance Criteria (Backend)
- Sistem mencatat last_login setiap user.
- Jika tidak ada login selama 6 bulan → status akun menjadi “Deleted”.
- Akun deleted tidak dapat login."

---

## 🟢 PBI-04 – Logging Aktivitas Login Pengguna
**Story Point: 3**

### Deskripsi
Sistem mencatat setiap aktivitas login pengguna.

### Business Value
Mendukung monitoring keamanan dan audit aktivitas pengguna.

### Acceptance Criteria (Backend)
- Sistem mencatat waktu login, role, dan user_id.
- Data tersimpan di tabel log_aktivitas.

### Acceptance Criteria (Frontend)
- Admin dapat melihat tabel riwayat login.
- Data dapat difilter berdasarkan tanggal.
---

# 📘 EPIC 02 – Mengelola Peminjaman Buku

---

## 🟢 PBI-05 – Mengakses Buku Digital
**Story Point: 3**

### Business Value
Memberikan akses literatur digital secara online.

### Acceptance Criteria (Backend)
- Validasi login sebelum akses file.
- File hanya dapat diakses jika user berhak.

### Acceptance Criteria (Frontend)
- Tombol akses muncul jika buku tersedia dalam format digital.
- File terbuka di tab baru.

---

## 🟢 PBI-06 – Approve/Reject Peminjaman (Admin)
**Story Point: 3**

### Business Value
Mengontrol proses peminjaman agar terstruktur.

### Acceptance Criteria (Backend)
- Admin dapat mengubah status pinjaman.
- Due date otomatis ditetapkan saat approve.

### Acceptance Criteria (Frontend)
- Admin melihat daftar request pending.
- Tombol Approve/Reject tersedia.

---

## 🟢 PBI-7 – Approve/Reject Perpanjangan (Admin)
**Story Point: 2**

### Business Value
Mengatur perpanjangan agar sesuai kebijakan perpustakaan.

### Acceptance Criteria (Backend)
- Status perpanjangan dapat diubah.
- Due date diperbarui jika disetujui.

### Acceptance Criteria (Frontend)
- Admin dapat melihat request perpanjangan.
- Tombol aksi tersedia.

## 🟢 PBI-8 – Melihat Daftar Buku yang Dipinjam
**Story Point: 3**

### Business Value
Membantu pengguna memonitor status pinjaman dan menghindari keterlambatan pengembalian.

### Acceptance Criteria (Backend)
- Endpoint GET /loans/user tersedia dan hanya dapat diakses oleh user yang sudah login (JWT valid).
- Sistem hanya menampilkan data pinjaman milik user yang sedang login (tidak boleh melihat milik user lain).
- Response mencakup: id buku, judul, tanggal pinjam, tanggal jatuh tempo, status (aktif/terlambat/ditolak), dan sisa hari.
- Jika tidak ada data, sistem tetap mengembalikan response sukses dengan array kosong.

### Acceptance Criteria (Frontend)
- Halaman “Pinjaman Saya” hanya dapat diakses setelah login.
- Data ditampilkan dalam bentuk card atau tabel yang rapi dan mudah dibaca.
- Status “Terlambat” memiliki indikator visual berbeda (misalnya warna merah).
- Jika tidak ada pinjaman, tampilkan pesan informatif seperti “Belum ada buku yang dipinjam”.


## 🟢 PBI-9 – Mengajukan Peminjaman Buku

**Story Point: 5**

### Business Value
Memungkinkan pengguna memanfaatkan layanan utama sistem perpustakaan.

### Acceptance Criteria (Backend)
- Endpoint POST /loans hanya dapat diakses oleh user yang sudah login.
- Sistem memvalidasi kuota peminjaman user sebelum menyimpan data.
- Sistem memvalidasi ketersediaan stok buku sebelum memproses peminjaman.
- Jika valid, sistem menyimpan data peminjaman dan mengurangi stok buku secara otomatis.
- Jika kuota habis atau stok kosong, sistem mengembalikan response error yang jelas.

### Acceptance Criteria (Frontend)
- Tombol “Pinjam Buku” hanya muncul jika buku tersedia.
- Saat tombol ditekan, sistem menampilkan loading state.
- Jika berhasil, tampil notifikasi sukses dan redirect ke halaman “Pinjaman Saya”.
- Jika gagal, tampilkan pesan error sesuai respon backend.


## 🟢 PBI-10 – Perpanjangan Masa Peminjaman
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

---

# 🎨 EPIC 03 – Kelola Antarmuka (Blog & Pengumuman)

---

## 🟢 PBI-11 – Melihat Daftar Section Landing Page
**Story Point: 2**

### Business Value
Memungkinkan admin mengelola konten informasi.

### Acceptance Criteria (Backend)
- Endpoint GET /interface/sections hanya dapat diakses oleh role Admin.
- Sistem mengembalikan daftar section lengkap dengan id dan nama section.
- Jika tidak ada section, sistem mengembalikan array kosong."

### Acceptance Criteria (Frontend)
- Menu “Kelola Antarmuka” hanya muncul pada sidebar Admin.
- Daftar section ditampilkan dalam bentuk list atau tabel sederhana.
- Admin dapat memilih salah satu section untuk melihat detailnya.

---

## 🟢 PBI-12 – Mengubah Konten Section Landing Page
**Story Point: 2**

### Business Value
Memungkinkan admin mengelola konten informasi.

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

## 🟢 PBI-13 – Tambah Blog
**Story Point: 2**

### Business Value
Memungkinkan admin mengelola konten informasi.

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

## 🟢 PBI-14 – Edit Blog
**Story Point: 2**

### Acceptance Criteria (Backend)
- Endpoint PUT /blogs/{id} tersedia.
- Sistem memvalidasi bahwa blog ada sebelum update.
- Data yang diperbarui tersimpan dengan timestamp terbaru.

### Acceptance Criteria (Frontend)
- Admin dapat mengakses halaman edit dari daftar blog.
- Data lama otomatis terisi di form.
- Setelah update, perubahan langsung terlihat di halaman publik.

---

## 🟢 PBI-15 – Hapus Blog
**Story Point: 1**

### Acceptance Criteria (Backend)
- Endpoint DELETE /blogs/{id} tersedia.
- Sistem memastikan hanya admin yang dapat menghapus.
- Data dapat di-soft delete atau permanent delete.

### Acceptance Criteria (Frontend)
- Tersedia tombol hapus pada daftar blog.
- Muncul dialog konfirmasi sebelum penghapusan.
- Blog tidak lagi muncul setelah berhasil dihapus.

---

## 🟢 PBI-16 – Tambah Pengumuman
**Story Point: 2**

### Acceptance Criteria (Backend)
- Endpoint POST /announcements tersedia.
- Validasi judul dan isi wajib diisi.
- Pengumuman memiliki periode aktif.

### Acceptance Criteria (Frontend)
- Tersedia form tambah pengumuman.
- Pengumuman tampil di halaman beranda saat aktif.
- Tersedia notifikasi sukses setelah publish.

---

## 🟢 PBI-17 – Edit Pengumuman
**Story Point: 2**

### Acceptance Criteria (Backend)
- Endpoint PUT /announcements/{id} tersedia.
- Sistem memvalidasi keberadaan data sebelum update.
- Timestamp update tercatat di database.

### Acceptance Criteria (Frontend)
- Admin dapat mengedit pengumuman dari daftar.
- Perubahan langsung terlihat di halaman publik.
- Tersedia notifikasi setelah update berhasil.

---

## 🟢 PBI-18 – Hapus Pengumuman
**Story Point: 1**

### Acceptance Criteria (Backend)
- Endpoint DELETE /announcements/{id} tersedia.
- Validasi role admin sebelum penghapusan.
- Data dinonaktifkan atau dihapus sesuai kebijakan.

### Acceptance Criteria (Frontend)
- Tersedia tombol hapus pada daftar pengumuman.
- Terdapat dialog konfirmasi sebelum eksekusi.
- Pengumuman tidak lagi tampil setelah berhasil dihapus.


