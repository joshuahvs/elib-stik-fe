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