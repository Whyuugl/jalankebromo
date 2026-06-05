# Database PostgreSQL — Jalankebromo

Skema ini dipakai untuk website wisata + panel admin (paket, mobil, artikel, pesanan).

> **Supabase (production):** set `DATABASE_URL` di `backend/.env`, lalu `npm run db:migrate` dari folder `backend`. Detail: [SUPABASE.md](./SUPABASE.md).

## Persiapan di pgAdmin

1. Buka **pgAdmin** → connect ke server PostgreSQL lokal (Docker / instalasi biasa).
2. Klik kanan **Databases** → **Create** → **Database…**
   - **Database:** `jalankebromo`
   - **Owner:** user PostgreSQL kamu (mis. `postgres`)
   - Save
3. Klik kanan database **`jalankebromo`** → **Query Tool**.
4. Jalankan file berurutan:
   - `schema.sql` — tipe data, tabel, index, trigger
   - `seed.sql` — data contoh (opsional)

Atau lewat menu: **File → Open** → pilih `schema.sql` → **Execute** (F5), lalu sama untuk `seed.sql`.

## File

| File | Isi |
|------|-----|
| `schema.sql` | Struktur tabel lengkap |
| `seed.sql` | Data demo (admin, paket, mobil, artikel, pesanan) |

## Tabel utama

| Tabel | Fungsi |
|-------|--------|
| `admin_users` | Login panel admin |
| `packages` | Paket wisata |
| `package_images` | Galeri foto paket |
| `package_itinerary_items` | Itinerary per baris |
| `cars` | Unit sewa mobil |
| `articles` | Blog / artikel |
| `article_tags` + `article_tag_map` | Tag artikel |
| `orders` | Pesanan paket atau sewa mobil |
| `order_reschedules` | Riwayat ubah tanggal trip |
| `reviews` | Review paket (halaman detail) |
| `site_settings` | Kontak, brand, sosial media |

## Akun admin demo (dari seed)

- **Email:** `admin@jalankebromo.com`
- **Password:** `admin123` (hash di DB hanya placeholder — ganti saat backend siap)

## Catatan backend nanti

- Simpan password dengan **bcrypt** / **argon2**, jangan plain text.
- `order_code` format contoh: `JK-2026-0001` (unik).
- Status pesanan: `pending` → `dp_paid` → `paid` → `completed` atau `cancelled`.

## Hubungkan ke website

Setelah database siap, jalankan backend:

```bash
cd backend
npm install
copy .env.example .env
npm start
```

Buka **http://localhost:3000** (bukan file HTML langsung). Lihat `backend/README.md`.

## Docker (opsional)

```bash
docker run -d --name jk-postgres -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=jalankebromo -p 5432:5432 postgres:16
```

Lalu di pgAdmin: host `localhost`, port `5432`, user `postgres`, database `jalankebromo`.
