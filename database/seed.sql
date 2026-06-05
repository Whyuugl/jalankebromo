-- =============================================================================
-- Jalankebromo — Data contoh (opsional)
-- Jalankan SETELAH schema.sql pada database jalankebromo
-- =============================================================================

BEGIN;

-- Kosongkan data (hati-hati di production)
TRUNCATE TABLE
  page_views,
  order_reschedules,
  orders,
  reviews,
  article_tag_map,
  article_tags,
  articles,
  package_itinerary_items,
  package_images,
  cars,
  packages,
  site_settings,
  admin_users
RESTART IDENTITY CASCADE;

-- -----------------------------------------------------------------------------
-- Admin (password: admin123)
-- -----------------------------------------------------------------------------

INSERT INTO admin_users (email, password_hash, full_name, role)
VALUES (
  'admin@jalankebromo.com',
  crypt('admin123', gen_salt('bf')),
  'Admin Jalankebromo',
  'super_admin'
);

-- -----------------------------------------------------------------------------
-- Pengaturan situs
-- -----------------------------------------------------------------------------

INSERT INTO site_settings (key, value, description) VALUES
  ('brand_name', 'Jalankebromo Tour Organizer', 'Nama brand'),
  ('footer_description', 'jalankebromo.com adalah situs resmi dari PT. Jalankebromo Tour Organizer, sejak 2014 menjadi referensi wisatawan dari seluruh Indonesia untuk merencanakan dan melaksanakan perjalanan ke Bromo.', 'Teks footer'),
  ('contact_whatsapp', '+6281323445911', 'WhatsApp'),
  ('contact_phone', '(0333) 2821229', 'Telepon kantor'),
  ('contact_email', 'office@jalankebromo.com', 'Email'),
  ('instagram_url', 'https://www.instagram.com/jalankebromotour', 'Instagram'),
  ('dp_percent_default', '30', 'Persentase DP default');

-- -----------------------------------------------------------------------------
-- Paket wisata
-- -----------------------------------------------------------------------------

INSERT INTO packages (
  slug, title, category, duration_label, price,
  short_description, description, main_image_url, publish_status, sort_order
) VALUES
(
  'open-trip-bromo-start-malang',
  'Open Trip Bromo Start Malang',
  'Open Trip',
  '1 Hari',
  780000,
  'Paket sunrise Bromo dengan jeep dan guide berpengalaman.',
  'Open Trip Bromo Start Malang cocok untuk Anda yang ingin menikmati sunrise Bromo tanpa repot menyusun itinerary sendiri.',
  'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=1200&q=80',
  'published',
  1
),
(
  'paket-wisata-malang-3d2n',
  'Paket Wisata Malang 3D2N Fasilitas Lengkap?, Intip Harganya!',
  'Paket Malang',
  '3 Hari 2 Malam',
  1150000,
  'Liburan Malang–Batu lengkap: Jatim Park, BNS, dan spot viral.',
  'Paket Wisata Malang 3D2N dengan transportasi AC, tiket wisata, guide, dan air mineral.',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80',
  'published',
  2
),
(
  'open-trip-tumpak-sewu',
  'Open Trip Tumpak Sewu',
  'Open Trip',
  '2 Hari',
  995000,
  'Kombinasi air terjun Tumpak Sewu dan wisata sekitar.',
  'Paket dua hari eksplorasi Tumpak Sewu dengan pendamping profesional.',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
  'published',
  3
),
(
  'open-trip-bromo-midnight',
  'Open Trip Bromo Midnight',
  'Open Trip',
  '1 Hari',
  850000,
  'Berangkat malam, sunrise di Bromo, pulang siang—praktis untuk weekend.',
  'Open Trip Bromo Midnight untuk Anda yang ingin itinerary ringkas: penjemputan malam, sunrise, kawah, lautan pasir, dan kembali ke Malang.',
  'https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=1200&q=80',
  'published',
  4
),
(
  'paket-bromo-malang-3d2n',
  'Paket Bromo Malang 3D2N',
  'Paket Bromo Malang',
  '3 Hari 2 Malam',
  2350000,
  'Kombinasi Bromo sunrise + city tour Malang/Batu dengan itinerary fleksibel.',
  'Paket Bromo Malang 3D2N cocok untuk keluarga/rombongan: transport AC, driver, tiket wisata, dan pendamping perjalanan.',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
  'published',
  5
),
(
  'paket-bromo-ijen-3d2n',
  'Paket Bromo Ijen 3D2N (Blue Fire)',
  'Paket Bromo Ijen',
  '3 Hari 2 Malam',
  2950000,
  'Bromo sunrise + Kawah Ijen Blue Fire. Cocok buat pecinta alam.',
  'Trip padat tapi nyaman: sunrise Bromo, spot ikonik, lanjut ke Banyuwangi untuk Ijen Blue Fire, pulang dengan aman.',
  'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200&q=80',
  'published',
  6
),
(
  'paket-bromo-madakaripura-1d',
  'Bromo + Air Terjun Madakaripura (1 Hari)',
  'Paket Bromo',
  '1 Hari',
  1450000,
  'Sunrise Bromo lalu lanjut ke Madakaripura. Banyak spot foto epic.',
  'Paket 1 hari untuk sunrise Bromo kemudian eksplor Madakaripura. Termasuk transport, jeep Bromo, dan pendamping.',
  'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc3?w=1200&q=80',
  'published',
  7
),
(
  'paket-malang-batu-2d1n',
  'Paket Wisata Malang Batu 2D1N',
  'Paket Malang',
  '2 Hari 1 Malam',
  840000,
  'Pilihan keluarga: Batu, kuliner, dan wisata favorit.',
  'Paket Malang Batu 2D1N: itinerary santai, transport nyaman, tiket wisata menyesuaikan pilihan.',
  'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=1200&q=80',
  'published',
  8
),
(
  'paket-batu-bns-1d',
  'City Tour Batu + BNS (1 Hari)',
  'Paket Malang',
  '1 Hari',
  620000,
  'Trip 1 hari ke Batu: spot hits + malam di Batu Night Spectacular.',
  'Cocok untuk short trip: kunjungan tempat populer di Batu dan BNS di malam hari.',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
  'published',
  9
),
(
  'open-trip-ijen-blue-fire',
  'Open Trip Ijen Blue Fire Start Malang',
  'Open Trip',
  '2 Hari',
  1650000,
  'Trip ke Ijen Blue Fire dengan start Malang, aman dan terjadwal.',
  'Open Trip Ijen: berangkat malam, pendakian dini hari, lihat blue fire (kondisional), sunrise, dan kembali.',
  'https://images.unsplash.com/photo-1433838552652-f9a46b332c40?w=1200&q=80',
  'published',
  10
),
(
  'open-trip-bromo-tumpak-sewu-2d',
  'Open Trip Bromo + Tumpak Sewu 2D1N',
  'Open Trip',
  '2 Hari 1 Malam',
  1850000,
  'Bromo sunrise lanjut Tumpak Sewu. Favorit buat yang mau 2 ikon sekaligus.',
  'Trip 2D1N: sunrise Bromo + lautan pasir, lalu hari berikutnya air terjun Tumpak Sewu. Jadwal bisa menyesuaikan.',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
  'published',
  11
),
(
  'paket-bromo-private-tour',
  'Private Tour Bromo (Custom Itinerary)',
  'Private Trip',
  '1 Hari',
  2100000,
  'Trip private lebih fleksibel: jam jemput, rute, dan spot menyesuaikan.',
  'Private Tour Bromo: itinerary custom, cocok untuk keluarga/pasangan. Termasuk transport, jeep, dan pendamping.',
  'https://images.unsplash.com/photo-1504557973960-4fac9832008f?w=1200&q=80',
  'published',
  12
),
(
  'paket-malang-family-trip',
  'Family Trip Malang (Santai & Ramah Anak)',
  'Paket Malang',
  '3 Hari',
  980000,
  'Paket santai untuk keluarga: tempo tidak terburu-buru.',
  'Family Trip Malang: rekomendasi tempat ramah anak, waktu istirahat cukup, dan pilihan kuliner yang aman.',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80',
  'published',
  13
),
(
  'paket-malang-coban-rondo',
  'Family Trip Coban Rondo',
  'Paket Malang',
  '1 Hari',
  750000,
  'Wisata alam + aktivitas ringan, cocok untuk keluarga.',
  'Trip Coban Rondo dengan waktu fleksibel, spot foto, dan opsi tambahan wisata sekitar.',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80',
  'published',
  14
),
(
  'paket-pantai-balekambang-goa-cina',
  'Pantai Balekambang + Goa Cina',
  'Paket Malang',
  '1 Hari',
  550000,
  'Pantai favorit Malang Selatan: Balekambang dan Goa Cina.',
  'Trip 1 hari menikmati pantai, sunset (kondisional), dan spot foto Malang Selatan.',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
  'published',
  15
);

INSERT INTO package_images (package_id, image_url, sort_order) VALUES
  (1, 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=800&q=80', 1),
  (1, 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&q=80', 2),
  (1, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80', 3),
  (5, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', 1),
  (5, 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc3?w=800&q=80', 2),
  (6, 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80', 1),
  (11, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', 1),
  (15, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', 1);

INSERT INTO package_itinerary_items (package_id, sort_order, time_label, title, description) VALUES
  (1, 1, '00:00', 'Penjemputan', 'Area Kota Malang'),
  (1, 2, '03:30', 'Tiba di base camp jeep', NULL),
  (1, 3, '04:30', 'Sunrise Penanjakan', NULL),
  (1, 4, '07:00', 'Kawah Bromo & Pasir Berbisik', NULL),
  (6, 1, 'Hari 1', 'Bromo Sunrise', 'Sunrise Penanjakan, lautan pasir, Kawah Bromo'),
  (6, 2, 'Hari 2', 'Transit Banyuwangi', 'Perjalanan dan persiapan pendakian Ijen'),
  (6, 3, 'Hari 3', 'Ijen Blue Fire', 'Pendakian dini hari, sunrise, lalu kembali');

-- -----------------------------------------------------------------------------
-- Mobil
-- -----------------------------------------------------------------------------

INSERT INTO cars (slug, name, capacity_label, transmission, price_per_day, main_image_url, publish_status, sort_order) VALUES
  ('toyota-avanza', 'Toyota Avanza', '6+1', 'Manual', 450000, 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80', 'published', 1),
  ('toyota-innova-reborn', 'Toyota Innova Reborn', '6+1', 'Matic', 650000, 'https://images.unsplash.com/photo-1519641471654-76ce5427ada4?w=800&q=80', 'published', 2),
  ('hiace-premio', 'Hiace Premio', '14+1', 'Manual', 1200000, 'https://images.unsplash.com/photo-1544628917-3e1d1c0c2c0e?w=800&q=80', 'draft', 3);

-- -----------------------------------------------------------------------------
-- Artikel
-- -----------------------------------------------------------------------------

INSERT INTO articles (
  slug, title, excerpt, content, cover_image_url,
  publish_status, published_at, author_id
) VALUES
(
  'paket-wisata-malang-3d2n-fasilitas-lengkap-intip-harganya',
  'Paket Wisata Malang 3D2N Fasilitas Lengkap?, Intip Harganya!',
  'Liburan tiga hari dua malam ke wisata hits Malang dan Batu.',
  'Kalau kamu lagi cari liburan yang nggak terlalu singkat tapi juga nggak bikin capek di jalan terus, Paket Wisata Malang 3D2N cocok banget...',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80',
  'published',
  '2026-05-19 10:00:00+07',
  1
),
(
  'paket-wisata-malang-2d1n-cek-itinerary-dan-spotnya',
  'Paket Wisata Malang 2D1N!, Cek Itinerary dan Spotnya!',
  'Ringkas tapi padat untuk short trip Malang–Batu.',
  'Paket 2 hari 1 malam dengan spot pilihan dan fasilitas lengkap...',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
  'published',
  '2026-05-18 09:00:00+07',
  1
),
(
  'open-trip-bromo-start-malang-itinerary-lengkapnya',
  'Open Trip Bromo Start Malang!, Lihat Itinerary Lengkapnya!',
  'Itinerary lengkap open trip Bromo dari Malang.',
  'Detail jadwal penjemputan hingga selesai tour Bromo...',
  'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=1200&q=80',
  'published',
  '2026-05-13 08:00:00+07',
  1
),
(
  'tips-sunrise-bromo-biar-ga-kedinginan',
  'Tips Sunrise Bromo Biar Nggak Kedinginan (Checklist Ringkas)',
  'Checklist simple: jaket, sarung tangan, dan timing terbaik.',
  'Sunrise di Bromo itu dingin. Ini checklist ringkas yang bikin kamu tetap nyaman: layer baju, sarung tangan, kupluk, sampai tips waktu berangkat.',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80',
  'published',
  '2026-05-10 08:30:00+07',
  1
),
(
  'rute-malang-bromo-estimasi-waktu-istirahat',
  'Rute Malang–Bromo: Estimasi Waktu & Titik Istirahat Aman',
  'Panduan rute dari Malang ke Bromo plus rekomendasi rest area.',
  'Kalau kamu start dari Malang, ini gambaran rute menuju Bromo, estimasi durasi, dan tips supaya perjalanan tetap aman dan nyaman.',
  'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200&q=80',
  'published',
  '2026-05-08 12:00:00+07',
  1
),
(
  'bromo-vs-ijen-pilih-yang-mana',
  'Bromo vs Ijen: Pilih yang Mana? (Biar Nggak Salah Itinerary)',
  'Perbandingan singkat Bromo dan Ijen untuk pemula.',
  'Bromo unggul sunrise dan akses mudah, Ijen unggul blue fire dan kawah. Ini perbandingan supaya itinerary kamu pas sama waktu dan stamina.',
  'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200&q=80',
  'published',
  '2026-05-06 15:30:00+07',
  1
),
(
  'itinerary-malang-batu-2d1n-versi-santai',
  'Itinerary Malang Batu 2D1N Versi Santai (Ramah Keluarga)',
  'Contoh itinerary 2D1N yang tidak terburu-buru.',
  'Kalau bawa keluarga, itinerary santai itu penting. Ini contoh susunan 2D1N: waktu makan, waktu istirahat, dan spot yang ramah anak.',
  'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=1200&q=80',
  'published',
  '2026-05-04 09:15:00+07',
  1
);

INSERT INTO article_tags (name, slug) VALUES
  ('PaketWisataMalang', 'paket-wisata-malang'),
  ('JalanKeBromo', 'jalan-ke-bromo'),
  ('LiburanMalang', 'liburan-malang'),
  ('HargaPaketWisataMalang3D2N', 'harga-paket-wisata-malang-3d2n'),
  ('TipsBromo', 'tips-bromo'),
  ('Itinerary', 'itinerary'),
  ('IjenBlueFire', 'ijen-blue-fire'),
  ('RutePerjalanan', 'rute-perjalanan'),
  ('MalangBatu', 'malang-batu');

INSERT INTO article_tag_map (article_id, tag_id) VALUES
  (1, 1), (1, 2), (1, 3), (1, 4),
  (2, 1), (2, 3),
  (3, 2), (3, 6),
  (4, 5), (4, 2),
  (5, 8), (5, 2),
  (6, 7), (6, 5),
  (7, 9), (7, 6);

-- -----------------------------------------------------------------------------
-- Review paket
-- -----------------------------------------------------------------------------

INSERT INTO reviews (package_id, customer_name, rating, comment, reviewed_at) VALUES
  (1, 'Aulia', 5.0, 'Pengalaman sunrise paling rapi, timnya tepat waktu.', NOW() - INTERVAL '4 days'),
  (1, 'Rizki', 5.0, 'Jeep bersih, itinerary jelas, recommended banget.', NOW() - INTERVAL '7 days'),
  (1, 'Nadya', 4.5, 'Harga sesuai fasilitas, admin responsif.', NOW() - INTERVAL '14 days');

-- -----------------------------------------------------------------------------
-- Pesanan
-- -----------------------------------------------------------------------------

INSERT INTO orders (
  order_code, order_type, status,
  customer_first_name, customer_last_name, customer_email, customer_phone, customer_city,
  package_id, car_id, trip_date, participants_count, rental_days,
  subtotal, dp_percent, dp_amount, paid_amount, payment_method, booked_at
) VALUES
(
  'JK-2026-1042', 'package', 'dp_paid',
  'Muhammad', 'Syarkawi', 'syarkawi123@gmail.com', '+6281234567890', 'Surabaya',
  1, NULL, '2026-05-25', 2, NULL,
  2340000, 30, 702000, 702000, 'bank_transfer', NOW() - INTERVAL '1 day'
),
(
  'JK-2026-1041', 'package', 'pending',
  'Aulia', 'Rahma', 'aulia@email.com', '+6289876543210', 'Malang',
  2, NULL, '2026-06-10', 4, NULL,
  4600000, 30, 1380000, 0, 'bank_transfer', NOW() - INTERVAL '2 days'
),
(
  'JK-2026-1040', 'car_rental', 'dp_paid',
  'Rizki', 'Pratama', 'rizki@email.com', '+628112223344', 'Batu',
  NULL, 1, '2026-05-22', NULL, 2,
  850000, 30, 255000, 255000, 'bank_transfer', NOW() - INTERVAL '3 days'
);

INSERT INTO orders (
  order_code, order_type, status,
  customer_first_name, customer_last_name, customer_email, customer_phone, customer_city,
  package_id, car_id, trip_date, participants_count, rental_days,
  subtotal, dp_percent, dp_amount, paid_amount, payment_method, booked_at
) VALUES
(
  'JK-2026-1039', 'package', 'cancelled',
  'Nadya', 'Putri', 'nadya@email.com', '+628556677889', 'Jakarta',
  1, NULL, '2026-05-20', 2, NULL,
  780000, 30, 234000, 0, 'bank_transfer', NOW() - INTERVAL '5 days'
);

-- Reschedule contoh
INSERT INTO order_reschedules (order_id, old_trip_date, new_trip_date, status, reason)
VALUES (1, '2026-05-20', '2026-05-25', 'approved', 'Jadwal kerja berubah');

COMMIT;

-- Verifikasi cepat
-- SELECT * FROM v_order_summary;
-- SELECT email, full_name FROM admin_users;
