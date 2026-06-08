const express = require('express');
const { query } = require('../db');
const { mapPackageRow, formatRp, parseDurationDays } = require('../utils');

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, database: 'connected' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/settings', async (req, res) => {
  const { rows } = await query('SELECT key, value FROM site_settings ORDER BY key');
  const settings = {};
  rows.forEach((r) => {
    settings[r.key] = r.value;
  });
  res.json(settings);
});

router.get('/packages', async (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  const duration = req.query.duration ? parseInt(req.query.duration, 10) : null;

  const { rows } = await query(
    `SELECT id, slug, title, category, duration_label, price, currency,
            short_description, description, main_image_url, publish_status
     FROM packages
     WHERE publish_status = 'published'
     ORDER BY sort_order ASC, title ASC`
  );

  let items = rows.map(mapPackageRow);

  if (q) {
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
  }
  if (duration) {
    items = items.filter((p) => p.durationDays === duration);
  }

  res.json(items);
});

router.get('/packages/:slug', async (req, res) => {
  const { rows } = await query(
    `SELECT id, slug, title, category, duration_label, price, currency,
            short_description, description, main_image_url, publish_status
     FROM packages
     WHERE slug = $1 AND publish_status = 'published'`,
    [req.params.slug]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Paket tidak ditemukan' });
  }

  const pkg = mapPackageRow(rows[0]);

  const [images, itinerary, reviews] = await Promise.all([
    query(
      `SELECT image_url, alt_text, sort_order FROM package_images
       WHERE package_id = $1 ORDER BY sort_order`,
      [pkg.id]
    ),
    query(
      `SELECT time_label, title, description, sort_order FROM package_itinerary_items
       WHERE package_id = $1 ORDER BY sort_order`,
      [pkg.id]
    ),
    query(
      `SELECT customer_name, rating, comment, reviewed_at FROM reviews
       WHERE package_id = $1 AND is_visible = TRUE ORDER BY reviewed_at DESC LIMIT 20`,
      [pkg.id]
    ),
  ]);

  res.json({
    ...pkg,
    images: images.rows,
    itinerary: itinerary.rows,
    reviews: reviews.rows,
  });
});

router.post('/packages/:slug/reviews', async (req, res) => {
  const b = req.body || {};
  const name = (b.customerName || b.customer_name || '').trim();
  const comment = (b.comment || '').trim();
  const rating = Number(b.rating);

  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'Nama wajib diisi' });
  }
  if (!comment || comment.length < 10) {
    return res.status(400).json({ error: 'Ulasan minimal 10 karakter' });
  }
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating 1–5 wajib diisi' });
  }

  const { rows } = await query(
    `SELECT id FROM packages WHERE slug = $1 AND publish_status = 'published'`,
    [req.params.slug]
  );
  if (!rows.length) return res.status(404).json({ error: 'Paket tidak ditemukan' });

  await query(
    `INSERT INTO reviews (package_id, customer_name, rating, comment) VALUES ($1, $2, $3, $4)`,
    [rows[0].id, name, rating, comment]
  );

  res.status(201).json({ success: true, message: 'Ulasan berhasil dikirim' });
});

router.get('/cars', async (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();

  const { rows } = await query(
    `SELECT id, slug, name, capacity_label, transmission, price_per_day,
            description, main_image_url, publish_status
     FROM cars
     WHERE publish_status = 'published'
     ORDER BY sort_order ASC, name ASC`
  );

  let items = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    capacityLabel: r.capacity_label,
    capacityKey: (r.capacity_label || '').replace(/\D/g, '').slice(0, 2) || '6',
    transmission: r.transmission,
    pricePerDay: Number(r.price_per_day),
    priceFormatted: formatRp(r.price_per_day),
    description: r.description,
    mainImageUrl: r.main_image_url,
  }));

  if (q) {
    items = items.filter((c) => c.name.toLowerCase().includes(q));
  }

  res.json(items);
});

router.get('/cars/:slug', async (req, res) => {
  const { rows } = await query(
    `SELECT id, slug, name, capacity_label, transmission, price_per_day,
            description, main_image_url
     FROM cars WHERE slug = $1 AND publish_status = 'published'`,
    [req.params.slug]
  );
  if (!rows.length) return res.status(404).json({ error: 'Mobil tidak ditemukan' });
  const r = rows[0];
  res.json({
    id: r.id,
    slug: r.slug,
    name: r.name,
    capacityLabel: r.capacity_label,
    transmission: r.transmission,
    pricePerDay: Number(r.price_per_day),
    priceFormatted: formatRp(r.price_per_day),
    description: r.description,
    mainImageUrl: r.main_image_url,
  });
});

router.get('/articles', async (req, res) => {
  const { rows } = await query(
    `SELECT id, slug, title, excerpt, cover_image_url, published_at
     FROM articles
     WHERE publish_status = 'published'
     ORDER BY published_at DESC NULLS LAST, id DESC`
  );

  res.json(
    rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      coverImageUrl: r.cover_image_url,
      publishedAt: r.published_at,
    }))
  );
});

router.get('/articles/:slug', async (req, res) => {
  const { rows } = await query(
    `SELECT id, slug, title, excerpt, content, cover_image_url, published_at
     FROM articles
     WHERE slug = $1 AND publish_status = 'published'`,
    [req.params.slug]
  );
  if (!rows.length) return res.status(404).json({ error: 'Artikel tidak ditemukan' });

  const article = rows[0];
  const [tags, commentCount] = await Promise.all([
    query(
      `SELECT t.name, t.slug FROM article_tags t
       JOIN article_tag_map m ON m.tag_id = t.id
       WHERE m.article_id = $1`,
      [article.id]
    ),
    query(
      `SELECT COUNT(*)::int AS c FROM article_comments
       WHERE article_id = $1 AND is_visible = TRUE`,
      [article.id]
    ).catch(function () {
      return { rows: [{ c: 0 }] };
    }),
  ]);

  res.json({
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    coverImageUrl: article.cover_image_url,
    publishedAt: article.published_at,
    tags: tags.rows,
    commentCount: commentCount.rows[0]?.c || 0,
  });
});

router.get('/articles/:slug/comments', async (req, res) => {
  const { rows: articles } = await query(
    `SELECT id FROM articles WHERE slug = $1 AND publish_status = 'published'`,
    [req.params.slug]
  );
  if (!articles.length) return res.status(404).json({ error: 'Artikel tidak ditemukan' });

  try {
    const { rows } = await query(
      `SELECT id, author_name, body, created_at FROM article_comments
       WHERE article_id = $1 AND is_visible = TRUE
       ORDER BY created_at DESC LIMIT 50`,
      [articles[0].id]
    );
    res.json(rows);
  } catch (e) {
    if (e.code === '42P01') return res.json([]);
    throw e;
  }
});

router.post('/articles/:slug/comments', async (req, res) => {
  const b = req.body || {};
  const name = (b.authorName || b.author_name || '').trim();
  const email = (b.authorEmail || b.author_email || '').trim() || null;
  const body = (b.body || b.comment || '').trim();

  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'Nama wajib diisi' });
  }
  if (!body || body.length < 5) {
    return res.status(400).json({ error: 'Komentar minimal 5 karakter' });
  }

  const { rows: articles } = await query(
    `SELECT id FROM articles WHERE slug = $1 AND publish_status = 'published'`,
    [req.params.slug]
  );
  if (!articles.length) return res.status(404).json({ error: 'Artikel tidak ditemukan' });

  try {
    await query(
      `INSERT INTO article_comments (article_id, author_name, author_email, body) VALUES ($1, $2, $3, $4)`,
      [articles[0].id, name, email, body]
    );
    res.status(201).json({ success: true, message: 'Komentar berhasil dikirim' });
  } catch (e) {
    if (e.code === '42P01') {
      return res.status(503).json({ error: 'Fitur komentar belum aktif di database. Jalankan npm run db:comments' });
    }
    throw e;
  }
});

router.get('/orders/lookup', async (req, res) => {
  const name = (req.query.nama || req.query.name || '').trim();
  const code = (req.query.code || req.query.order_code || '').trim();

  const mapOrderRow = (r) => ({
    id: r.id,
    order_code: r.order_code,
    order_type: r.order_type,
    status: r.status,
    customer_name: r.customer_name,
    customer_email: r.customer_email,
    customer_phone: r.customer_phone,
    product_name: r.product_name,
    trip_date: r.trip_date,
    participants_count: r.participants_count,
    rental_days: r.rental_days,
    subtotal: Number(r.subtotal),
    dp_amount: Number(r.dp_amount),
    paid_amount: Number(r.paid_amount),
    remaining_amount: Number(r.remaining_amount),
    subtotalFormatted: formatRp(r.subtotal),
    paidAmountFormatted: formatRp(r.paid_amount),
    booked_at: r.booked_at,
    pendingReschedule: r.pending_reschedule_id
      ? {
          id: r.pending_reschedule_id,
          newTripDate: r.pending_reschedule_date,
          status: 'pending',
        }
      : null,
  });

  const lookupSelect = `
    SELECT v.*, o.participants_count, o.rental_days,
           pr.id AS pending_reschedule_id,
           pr.new_trip_date AS pending_reschedule_date
    FROM v_order_summary v
    JOIN orders o ON o.id = v.id
    LEFT JOIN LATERAL (
      SELECT id, new_trip_date
      FROM order_reschedules
      WHERE order_id = o.id AND status = 'pending'
      ORDER BY requested_at DESC
      LIMIT 1
    ) pr ON TRUE`;

  if (code) {
    const { rows } = await query(`${lookupSelect} WHERE v.order_code = $1 LIMIT 1`, [code]);
    return res.json(rows.map(mapOrderRow));
  }

  if (!name) {
    return res.status(400).json({ error: 'Nama pemesan wajib diisi' });
  }

  const { rows } = await query(
    `${lookupSelect}
     WHERE v.customer_name ILIKE $1
     ORDER BY v.booked_at DESC
     LIMIT 20`,
    ['%' + name + '%']
  );

  res.json(rows.map(mapOrderRow));
});

router.post('/orders', async (req, res) => {
  const body = req.body || {};
  const orderType = body.orderType || 'package';

  try {
    const year = new Date().getFullYear();
    const prefix = `JK-${year}-`;
    const codeResult = await query(
      `SELECT COALESCE(MAX(CAST(SPLIT_PART(order_code, '-', 3) AS INTEGER)), 1000) + 1 AS next_num
       FROM orders WHERE order_code LIKE $1`,
      [prefix + '%']
    );
    const nextNum = codeResult.rows[0].next_num;
    const orderCode = `${prefix}${String(nextNum).padStart(4, '0')}`;

    const subtotal = Number(body.subtotal) || 0;
    const dpPercent = Number(body.dpPercent) || 30;
    const dpAmount = Math.round(subtotal * (dpPercent / 100));
    const paidAmount = body.payFull ? subtotal : dpAmount;

    const { rows } = await query(
      `INSERT INTO orders (
        order_code, order_type, status,
        customer_first_name, customer_last_name, customer_email, customer_phone, customer_city,
        package_id, car_id, trip_date, participants_count, rental_days,
        subtotal, dp_percent, dp_amount, paid_amount, payment_method, notes
      ) VALUES (
        $1, $2, 'pending',
        $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18
      ) RETURNING id, order_code`,
      [
        orderCode,
        orderType,
        body.firstName || body.customerFirstName,
        body.lastName || body.customerLastName || null,
        body.email || null,
        body.phone || body.customerPhone,
        body.city || null,
        orderType === 'package' ? body.packageId : null,
        orderType === 'car_rental' ? body.carId : null,
        body.tripDate || null,
        body.participants || body.participantsCount || null,
        body.rentalDays || null,
        subtotal,
        dpPercent,
        dpAmount,
        paidAmount,
        body.paymentMethod || 'bank_transfer',
        body.notes || null,
      ]
    );

    res.status(201).json({ success: true, orderCode: rows[0].order_code, id: rows[0].id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/reschedule', async (req, res) => {
  const b = req.body || {};
  const orderCode = (b.orderCode || '').trim();
  const customerName = (b.customerName || '').trim();
  const newTripDate = b.newTripDate || b.new_trip_date;

  if (!newTripDate) {
    return res.status(400).json({ error: 'Tanggal reschedule wajib diisi' });
  }

  const newDate = new Date(newTripDate + 'T12:00:00');
  if (isNaN(newDate.getTime())) {
    return res.status(400).json({ error: 'Format tanggal tidak valid' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (newDate < today) {
    return res.status(400).json({ error: 'Tanggal baru tidak boleh di masa lalu' });
  }

  let orderRows;
  if (orderCode) {
    orderRows = await query(`SELECT id, trip_date FROM orders WHERE order_code = $1`, [orderCode]);
  } else if (customerName) {
    orderRows = await query(
      `SELECT id, trip_date FROM orders
       WHERE customer_first_name ILIKE $1 OR (customer_first_name || ' ' || COALESCE(customer_last_name,'')) ILIKE $1
       ORDER BY booked_at DESC LIMIT 1`,
      ['%' + customerName + '%']
    );
  } else {
    return res.status(400).json({ error: 'Kode pesanan atau nama pemesan wajib' });
  }

  if (!orderRows.rows.length) {
    return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
  }

  const order = orderRows.rows[0];

  if (order.trip_date) {
    const oldDate = new Date(order.trip_date);
    oldDate.setHours(0, 0, 0, 0);
    if (newDate < oldDate) {
      return res.status(400).json({
        error: 'Tanggal reschedule tidak boleh sebelum tanggal trip yang sudah dijadwalkan',
      });
    }
  }

  const pending = await query(
    `SELECT id FROM order_reschedules WHERE order_id = $1 AND status = 'pending' LIMIT 1`,
    [order.id]
  );
  if (pending.rows.length) {
    return res.status(400).json({
      error: 'Sudah ada pengajuan reschedule yang menunggu persetujuan admin',
    });
  }

  const { rows } = await query(
    `INSERT INTO order_reschedules (order_id, old_trip_date, new_trip_date, status, reason)
     VALUES ($1, $2, $3, 'pending', $4)
     RETURNING id`,
    [order.id, order.trip_date, newTripDate, b.reason || null]
  );

  res.status(201).json({
    success: true,
    message: 'Pengajuan reschedule terkirim. Menunggu persetujuan admin.',
    requestId: rows[0].id,
    status: 'pending',
  });
});

// -----------------------------------------------------------------------------
// Simple page view tracking (untuk laporan admin)
// -----------------------------------------------------------------------------
router.post('/pageviews', async (req, res) => {
  const b = req.body || {};
  const path = (b.path || '').trim();
  if (!path) return res.status(400).json({ error: 'Path wajib diisi' });
  await query(`INSERT INTO page_views (path, visited_at) VALUES ($1, NOW())`, [path]);
  res.json({ success: true });
});

router.get('/contact', async (req, res) => {
  const { rows } = await query(
    `SELECT key, value FROM site_settings WHERE key IN ('contact_whatsapp', 'brand_name')`
  );
  const map = {};
  rows.forEach((r) => {
    map[r.key] = r.value;
  });
  res.json({
    whatsapp: map.contact_whatsapp || '+6281323445911',
    brandName: map.brand_name || 'Jalankebromo',
  });
});

module.exports = router;
