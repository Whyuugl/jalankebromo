# Setup Supabase untuk Jalankebromo

Database Supabase kamu:

```
postgresql://postgres:[YOUR-PASSWORD]@db.ahymyrqvxbouvterzogt.supabase.co:5432/postgres
```

## 1. Password & connection string

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) → project **ahymyrqvxbouvterzogt**
2. **Project Settings** → **Database** → salin **Database password** (atau reset jika lupa)
3. Ganti `[YOUR-PASSWORD]` di connection string
4. Jika password ada `@`, `#`, `%`, dll. → **URL-encode** dulu (mis. `@` jadi `%40`)

Tambahkan `?sslmode=require` di akhir URL.

## 2. Backend `.env`

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:PASSWORD_KAMU@db.ahymyrqvxbouvterzogt.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=string-acak-panjang-minimal-32-karakter
CORS_ORIGIN=http://localhost:3000
PORT=3000
```

Jangan commit file `.env` ke Git.

## 3. Buat tabel di Supabase

1. Supabase → **SQL Editor** → **New query**
2. Copy-paste isi `database/schema.sql` → **Run**
3. Copy-paste isi `database/seed.sql` → **Run** (data contoh: paket, artikel, admin)

Jika error extension `citext`:

- **Database** → **Extensions** → cari **citext** → Enable
- Ulangi `schema.sql`

Admin default setelah seed:

- Email: `admin@jalankebromo.com`
- Password: `admin123`

## 4. Tes koneksi

```bash
cd backend
npm start
```

Buka: http://localhost:3000/api/health  
Harus: `{"ok":true,"database":"connected"}`

## 5. Deploy ke Vercel (catatan penting)

| Bagian | Hosting |
|--------|---------|
| Website (HTML/JS/CSS) | **Vercel** — deploy folder root project |
| API (Express + `pg`) | **Tidak** di Vercel static saja — pakai **Railway**, **Render**, **Fly.io**, atau Vercel Serverless (perlu refactor) |

Di server API (Railway/Render), set environment variable:

- `DATABASE_URL` = connection string Supabase (pooler port **6543** untuk production)
- `JWT_SECRET` = sama dengan lokal
- `CORS_ORIGIN` = URL Vercel kamu, mis. `https://jalankebromo.vercel.app`

### API URL di frontend production

Kalau API beda domain, tambahkan di `<head>` halaman HTML (atau template):

```html
<meta name="jk-api-base" content="https://api-kamu.railway.app/api" />
```

`js/api-config.js` sudah membaca meta ini.

## 6. Connection pooler (production)

Di Supabase → **Database** → **Connection string** → pilih **Transaction pooler** (port 6543).

Gunakan URL pooler di `DATABASE_URL` production, bukan port 5432 direct.
