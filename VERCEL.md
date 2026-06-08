# Deploy Jalankebromo — Panduan Lengkap

## Kenapa Vercel "gagal memuat"?

Vercel hanya host **file HTML/CSS/JS**. Database & API ada di **Railway + Supabase**.

Tanpa Railway jalan + `vercel.json` di-set, website coba akses `/api` di Vercel → **tidak ada** → gagal memuat paket/artikel.

---

## Urutan deploy (WAJIB ikut ini)

```
1. Railway (API)  →  2. Edit vercel.json  →  3. Push GitHub  →  4. Vercel redeploy
```

---

## STEP 1 — Railway (API backend)

### A. Buat project

1. Login [railway.app](https://railway.app)
2. **New Project** → **GitHub Repo** → pilih repo `jalankebromo`
3. Klik service → **Settings**:
   - **Root Directory** = `backend`  ← PENTING!
   - **Start Command** = `node src/index.js` (biasanya otomatis)

### B. Environment Variables

Klik **Variables** → tambahkan:

| Name | Value |
|------|--------|
| `DATABASE_URL` | **Pooler Supabase** (bukan port 5432 direct!) — lihat bawah |
| `JWT_SECRET` | string acak panjang (min 32 karakter) |
| `CORS_ORIGIN` | URL Vercel kamu, mis. `https://jalankebromo.vercel.app` |

> `PORT` **jangan** di-set manual — Railway isi otomatis.

### C. Public URL

1. Tab **Settings** → **Networking** → **Generate Domain**
2. Salin URL, mis: `https://jalankebromo-production-a1b2.up.railway.app`

### D. Tes Railway (wajib OK dulu!)

Buka di browser:

```
https://URL-RAILWAY-KAMU.up.railway.app/api/health
```

Harus muncul:
```json
{"ok":true,"database":"connected"}
```

### DATABASE_URL untuk Railway (PENTING!)

Jangan pakai URL direct `db.xxx.supabase.co:5432` di Railway — error:
`ENETUNREACH 2406:da1c:...:5432` (IPv6 tidak bisa dijangkau).

1. Supabase Dashboard → **Project Settings** → **Database**
2. **Connection string** → pilih **Transaction pooler** (port **6543**)
3. **Copy paste utuh** dari dashboard — jangan ketik manual! Bentuknya kira-kira:
   ```
   postgresql://postgres.ahymyrqvxbouvterzogt:PASSWORD@aws-1-REGION.pooler.supabase.com:6543/postgres
   ```
   ⚠️ Host bisa `aws-0` **atau** `aws-1`, region beda-beda. **Harus dari dashboard kamu**, bukan contoh di atas.

4. Pastikan:
   - **User** = `postgres.ahymyrqvxbouvterzogt` (bukan cuma `postgres`)
   - **Host** = persis dari Supabase (mis. `aws-1-ap-southeast-1.pooler.supabase.com`)
   - **Port** = `6543`

5. Paste ke Railway **Variables** → `DATABASE_URL` → Save → redeploy

**Kalau gagal:**

| Gejala | Solusi |
|--------|--------|
| `ENETUNREACH` + IPv6 `:5432` | Ganti ke **pooler port 6543** (bukan direct) |
| `tenant/user postgres.xxx not found` | Host pooler **salah region** atau username bukan `postgres.[project-ref]` — copy ulang dari Supabase **Connect** |
| 502 / Application failed | Cek **Deploy Logs** — `DATABASE_URL` salah atau root directory bukan `backend` |
| `database` error | Password Supabase salah / URL belum benar |
| Crash saat start | Pastikan Root Directory = `backend`, bukan root repo |
| Tidak ada domain | Generate Domain di Networking |

---

## STEP 2 — Hubungkan Vercel ke Railway

Edit file **`vercel.json`** di root project — ganti baris `destination`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://jalankebromo-production-a1b2.up.railway.app/api/:path*"
    }
  ]
}
```

Ganti `jalankebromo-production-a1b2` dengan URL Railway kamu yang asli.

**Commit & push** ke GitHub.

---

## STEP 3 — Vercel

1. Import repo di [vercel.com](https://vercel.com)
2. **Root Directory** = `.` (root, BUKAN `backend`)
3. Framework = **Other**
4. Build Command = **kosong**
5. Deploy

Setelah `vercel.json` di-update, klik **Redeploy** di Vercel.

### Tes Vercel

Buka:
```
https://nama-project-kamu.vercel.app/api/health
```

Harus sama: `{"ok":true,"database":"connected"}`

Kalau ini OK, homepage akan memuat paket & artikel.

---

## STEP 4 — Admin live

```
https://nama-project-kamu.vercel.app/admin/login.html
```

Login: `admin@jalankebromo.com` / `admin123`

---

## Checklist cepat

- [ ] Railway `/api/health` → connected
- [ ] `vercel.json` destination = URL Railway yang benar
- [ ] Push GitHub + Redeploy Vercel
- [ ] Vercel `/api/health` → connected
- [ ] Homepage tidak "gagal memuat"

---

## Alternatif: tanpa proxy (langsung ke Railway)

Kalau tidak mau pakai `vercel.json` rewrite, edit **`js/site-config.js`**:

```js
window.__JK_API_BASE__ = 'https://URL-RAILWAY-KAMU.up.railway.app/api';
```

Lalu tambahkan `<script src="./js/site-config.js"></script>` sebelum `api-config.js` di setiap halaman (atau push perubahan terbaru jika sudah di-include).

Set `CORS_ORIGIN` di Railway = URL Vercel kamu.

---

## Database Supabase

Sudah jalan? Tes dari Railway health. Kalau perlu ulang view:

```bash
cd backend
npm run db:views
```
