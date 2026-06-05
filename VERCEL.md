# Deploy Jalankebromo ke Vercel

## Arsitektur

| Komponen | Platform | Catatan |
|----------|----------|---------|
| Website + Admin (HTML/JS) | **Vercel** | Static files dari root repo |
| API (Express + Node) | **Railway** atau **Render** | Vercel tidak menjalankan server Express lama |
| Database | **Supabase** | Sudah dipakai |

---

## Langkah 1 — Push ke GitHub

Ya, **perlu upload ke GitHub** (atau GitLab/Bitbucket) supaya Vercel bisa deploy otomatis.

```bash
cd c:\project\jalankebromo
git init
git add .
git commit -m "Initial commit jalankebromo"
git branch -M main
git remote add origin https://github.com/USERNAME/jalankebromo.git
git push -u origin main
```

Pastikan `backend/.env` **tidak** ikut commit (sudah di `.gitignore`).

---

## Langkah 2 — Deploy API ke Railway

1. Buka [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Pilih repo ini, set **Root Directory** = `backend`
3. **Variables** (Environment):

   | Variable | Nilai |
   |----------|--------|
   | `DATABASE_URL` | Connection string Supabase (pooler port 6543 untuk production) |
   | `JWT_SECRET` | String acak panjang (sama dengan lokal) |
   | `CORS_ORIGIN` | URL Vercel nanti, mis. `https://jalankebromo.vercel.app` |
   | `PORT` | `3000` (Railway biasanya set otomatis) |

4. Deploy → salin URL public, mis. `https://jalankebromo-api.up.railway.app`

5. Tes: `https://URL-KAMU/api/health` → harus `{"ok":true,"database":"connected"}`

---

## Langkah 3 — Deploy frontend ke Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → import repo GitHub
2. **Framework Preset:** Other (static)
3. **Root Directory:** `.` (root project, bukan `backend`)
4. **Build Command:** kosongkan (tidak perlu build)
5. **Output Directory:** `.` atau biarkan default
6. Deploy

Setelah dapat URL, mis. `https://jalankebromo.vercel.app`:

---

## Langkah 4 — Hubungkan frontend ke API

Tambahkan di `<head>` file utama (minimal `index.html` dan halaman admin bisa lewat satu template — untuk sekarang tambahkan di **`index.html`** dan **`admin/login.html`**):

```html
<meta name="jk-api-base" content="https://URL-RAILWAY-KAMU/api" />
```

`js/api-config.js` sudah membaca meta ini. Tanpa meta, frontend mengira API ada di domain yang sama (`/api`) — itu tidak ada di Vercel static saja.

**Update `CORS_ORIGIN` di Railway** = URL Vercel kamu (tanpa slash di akhir).

---

## Langkah 5 — Cek setelah live

- [ ] Homepage memuat paket & artikel dari database
- [ ] Booking bisa submit
- [ ] Admin login: `https://domain.vercel.app/admin/login.html`
- [ ] Daftar pesanan + filter jenis/status jalan
- [ ] Toast notifikasi muncul (bukan popup browser)

---

## FAQ

**Harus GitHub?**  
Tidak wajib GitHub saja — Vercel juga bisa deploy dari CLI (`npx vercel`), tapi GitHub + auto-deploy paling praktis.

**Bisa API di Vercel juga?**  
Bisa, tapi perlu refactor ke Vercel Serverless Functions. Untuk project ini, Railway/Render lebih cepat.

**Database?**  
Tetap Supabase. Jalankan `npm run db:migrate` dan `npm run db:views` dari folder `backend` jika tabel/view belum lengkap.
