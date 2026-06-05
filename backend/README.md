# Backend API — Jalankebromo

Server Express yang menyajikan **website + API** dari folder project. Data diambil dari **PostgreSQL**.

## Setup

1. Pastikan database `jalankebromo` sudah ada dan `schema.sql` + `seed.sql` sudah dijalankan (lihat `database/README.md`).

2. Install dependency:

```bash
cd backend
npm install
```

3. Salin environment:

```bash
copy .env.example .env
```

Edit `.env` — sesuaikan `DATABASE_URL` dan `JWT_SECRET`:

```
DATABASE_URL=postgresql://postgres:admin@localhost:5432/jalankebromo
JWT_SECRET=ubah-ini-string-panjang-acak
PORT=3000
```

4. Jalankan server:

```bash
npm start
```

5. Buka browser: **http://localhost:3000**

   - Website: http://localhost:3000/paket-wisata.html  
   - Admin: http://localhost:3000/admin/login.html  
   - Health: http://localhost:3000/api/health  

## Login admin

- Email: `admin@jalankebromo.com`
- Password: `admin123` (dari `seed.sql`)

## Endpoint utama

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/health` | Cek koneksi DB |
| GET | `/api/packages` | Daftar paket (publik) |
| GET | `/api/packages/:slug` | Detail paket |
| GET | `/api/cars` | Daftar mobil |
| GET | `/api/articles` | Daftar artikel |
| GET | `/api/orders/lookup?nama=` | Cek pesanan |
| POST | `/api/admin/login` | Login admin → token JWT |
| GET | `/api/admin/orders` | Pesanan (butuh token) |

Header admin: `Authorization: Bearer <token>`

## Catatan

- Jangan buka HTML lewat `file://` — gunakan **http://localhost:3000** agar API sama origin.
- Form simpan di admin masih sebagian demo; list & dashboard sudah dari database.
