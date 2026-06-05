const express = require('express');
const { query } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { slugify, normalizePublishStatus, formatRp } = require('../utils');

const router = express.Router();
router.use(requireAdmin);

async function uniqueSlug(table, baseSlug, excludeId) {
  let slug = baseSlug;
  let n = 0;
  while (true) {
    const check = excludeId
      ? await query(`SELECT id FROM ${table} WHERE slug = $1 AND id <> $2`, [slug, excludeId])
      : await query(`SELECT id FROM ${table} WHERE slug = $1`, [slug]);
    if (!check.rows.length) return slug;
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
}

// --- Packages ---
router.get('/packages/:id', async (req, res) => {
  const { rows } = await query(`SELECT * FROM packages WHERE id = $1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Paket tidak ditemukan' });
  const it = await query(
    `SELECT time_label, title, description, sort_order FROM package_itinerary_items WHERE package_id = $1 ORDER BY sort_order`,
    [req.params.id]
  );
  res.json({ ...rows[0], itinerary: it.rows });
});

router.post('/packages', async (req, res) => {
  const b = req.body || {};
  if (!b.title || b.price == null) return res.status(400).json({ error: 'Nama dan harga wajib diisi' });
  const slug = await uniqueSlug('packages', slugify(b.slug || b.title));
  const pub = normalizePublishStatus(b.publishStatus || b.publish_status || 'published');

  const { rows } = await query(
    `INSERT INTO packages (slug, title, category, duration_label, price, short_description, description, main_image_url, publish_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [
      slug,
      b.title,
      b.category || 'Open Trip',
      b.durationLabel || b.duration_label || null,
      Number(b.price),
      b.shortDescription || b.short_description || null,
      b.description || null,
      b.mainImageUrl || b.main_image_url || null,
      pub,
    ]
  );
  const id = rows[0].id;
  const lines = String(b.itinerary || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    await query(
      `INSERT INTO package_itinerary_items (package_id, sort_order, description) VALUES ($1,$2,$3)`,
      [id, i + 1, lines[i]]
    );
  }
  res.status(201).json({ success: true, id });
});

router.put('/packages/:id', async (req, res) => {
  const b = req.body || {};
  const id = req.params.id;
  const slug = await uniqueSlug('packages', slugify(b.slug || b.title), id);
  const pub = normalizePublishStatus(b.publishStatus || b.publish_status);

  await query(
    `UPDATE packages SET slug=$1, title=$2, category=$3, duration_label=$4, price=$5,
     short_description=$6, description=$7, main_image_url=$8, publish_status=$9, updated_at=NOW()
     WHERE id=$10`,
    [
      slug,
      b.title,
      b.category || 'Open Trip',
      b.durationLabel || b.duration_label || null,
      Number(b.price),
      b.shortDescription || b.short_description || null,
      b.description || null,
      b.mainImageUrl || b.main_image_url || null,
      pub,
      id,
    ]
  );
  await query(`DELETE FROM package_itinerary_items WHERE package_id = $1`, [id]);
  const lines = String(b.itinerary || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    await query(
      `INSERT INTO package_itinerary_items (package_id, sort_order, description) VALUES ($1,$2,$3)`,
      [id, i + 1, lines[i]]
    );
  }
  res.json({ success: true });
});

router.delete('/packages/:id', async (req, res) => {
  await query(`DELETE FROM packages WHERE id = $1`, [req.params.id]);
  res.json({ success: true });
});

// --- Cars ---
router.get('/cars/:id', async (req, res) => {
  const { rows } = await query(`SELECT * FROM cars WHERE id = $1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Mobil tidak ditemukan' });
  res.json(rows[0]);
});

router.post('/cars', async (req, res) => {
  const b = req.body || {};
  if (!b.name || b.pricePerDay == null) return res.status(400).json({ error: 'Nama dan harga wajib' });
  const slug = await uniqueSlug('cars', slugify(b.slug || b.name));
  const pub = normalizePublishStatus(b.publishStatus || b.publish_status);

  const { rows } = await query(
    `INSERT INTO cars (slug, name, capacity_label, transmission, price_per_day, description, main_image_url, publish_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [
      slug,
      b.name,
      b.capacityLabel || b.capacity_label || null,
      b.transmission || 'Manual',
      Number(b.pricePerDay || b.price_per_day),
      b.description || null,
      b.mainImageUrl || b.main_image_url || null,
      pub,
    ]
  );
  res.status(201).json({ success: true, id: rows[0].id });
});

router.put('/cars/:id', async (req, res) => {
  const b = req.body || {};
  const id = req.params.id;
  const slug = await uniqueSlug('cars', slugify(b.slug || b.name), id);
  const pub = normalizePublishStatus(b.publishStatus || b.publish_status);

  await query(
    `UPDATE cars SET slug=$1, name=$2, capacity_label=$3, transmission=$4, price_per_day=$5,
     description=$6, main_image_url=$7, publish_status=$8, updated_at=NOW() WHERE id=$9`,
    [
      slug,
      b.name,
      b.capacityLabel || b.capacity_label || null,
      b.transmission || 'Manual',
      Number(b.pricePerDay || b.price_per_day),
      b.description || null,
      b.mainImageUrl || b.main_image_url || null,
      pub,
      id,
    ]
  );
  res.json({ success: true });
});

router.delete('/cars/:id', async (req, res) => {
  await query(`DELETE FROM cars WHERE id = $1`, [req.params.id]);
  res.json({ success: true });
});

// --- Articles ---
router.get('/articles/:id', async (req, res) => {
  const { rows } = await query(`SELECT * FROM articles WHERE id = $1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Artikel tidak ditemukan' });
  const tags = await query(
    `SELECT t.name FROM article_tags t JOIN article_tag_map m ON m.tag_id = t.id WHERE m.article_id = $1`,
    [req.params.id]
  );
  res.json({ ...rows[0], tagNames: tags.rows.map((r) => r.name).join(', ') });
});

function parsePublishedAt(raw, publishStatus) {
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return publishStatus === 'published' ? new Date() : null;
}

function excerptFromArticleContent(content) {
  if (!content) return null;
  const text = String(content).trim();
  try {
    const data = JSON.parse(text);
    const blocks = Array.isArray(data) ? data : data.blocks;
    if (Array.isArray(blocks)) {
      const para = blocks.find((b) => b && (b.type === 'paragraph' || b.type === 'heading') && b.text);
      if (para) return String(para.text).slice(0, 240);
    }
  } catch {
    /* plain text */
  }
  return text.slice(0, 240) || null;
}

router.post('/articles', async (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.content) return res.status(400).json({ error: 'Judul dan isi wajib' });
  const slug = await uniqueSlug('articles', slugify(b.slug || b.title));
  const pub = normalizePublishStatus(b.publishStatus || b.publish_status);
  const publishedAt = parsePublishedAt(b.publishedAt || b.published_at, pub);
  const excerpt = b.excerpt || excerptFromArticleContent(b.content);

  const { rows } = await query(
    `INSERT INTO articles (slug, title, excerpt, content, cover_image_url, publish_status, published_at, author_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [
      slug,
      String(b.title).trim(),
      excerpt,
      b.content,
      (b.coverImageUrl || b.cover_image_url || '').trim() || null,
      pub,
      publishedAt,
      req.admin.id,
    ]
  );
  await syncArticleTags(rows[0].id, b.tags || b.tagNames || '');
  res.status(201).json({ success: true, id: rows[0].id });
});

router.put('/articles/:id', async (req, res) => {
  const b = req.body || {};
  const id = req.params.id;
  if (!b.title || !String(b.title).trim()) {
    return res.status(400).json({ error: 'Judul wajib' });
  }
  if (!b.content || !String(b.content).trim()) {
    return res.status(400).json({ error: 'Isi artikel wajib' });
  }
  const slug = await uniqueSlug('articles', slugify(b.slug || b.title), id);
  const pub = normalizePublishStatus(b.publishStatus || b.publish_status);
  const publishedAt = parsePublishedAt(b.publishedAt || b.published_at, pub);
  const excerpt = b.excerpt || excerptFromArticleContent(b.content);

  await query(
    `UPDATE articles SET slug=$1, title=$2, excerpt=$3, content=$4, cover_image_url=$5,
     publish_status=$6, published_at=$7, updated_at=NOW() WHERE id=$8`,
    [
      slug,
      String(b.title).trim(),
      excerpt,
      b.content,
      (b.coverImageUrl || b.cover_image_url || '').trim() || null,
      pub,
      publishedAt,
      id,
    ]
  );
  await syncArticleTags(id, b.tags || b.tagNames || '');
  res.json({ success: true });
});

router.delete('/articles/:id', async (req, res) => {
  await query(`DELETE FROM articles WHERE id = $1`, [req.params.id]);
  res.json({ success: true });
});

async function syncArticleTags(articleId, tagsStr) {
  await query(`DELETE FROM article_tag_map WHERE article_id = $1`, [articleId]);
  const names = String(tagsStr)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  for (const name of names) {
    const slug = slugify(name);
    let tag = await query(`SELECT id FROM article_tags WHERE slug = $1`, [slug]);
    if (!tag.rows.length) {
      tag = await query(`INSERT INTO article_tags (name, slug) VALUES ($1,$2) RETURNING id`, [name, slug]);
    }
    await query(`INSERT INTO article_tag_map (article_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [
      articleId,
      tag.rows[0].id,
    ]);
  }
}

// --- Order detail (full) ---
router.get('/orders/:id/full', async (req, res) => {
  const { rows } = await query(
    `SELECT o.*, p.title AS package_title, c.name AS car_name
     FROM orders o
     LEFT JOIN packages p ON p.id = o.package_id
     LEFT JOIN cars c ON c.id = o.car_id
     WHERE o.id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
  const o = rows[0];
  res.json({
    id: o.id,
    orderCode: o.order_code,
    orderType: o.order_type,
    status: o.status,
    customerFirstName: o.customer_first_name,
    customerLastName: o.customer_last_name,
    customerEmail: o.customer_email,
    customerPhone: o.customer_phone,
    customerCity: o.customer_city,
    productName: o.package_title || o.car_name,
    tripDate: o.trip_date,
    participantsCount: o.participants_count,
    rentalDays: o.rental_days,
    subtotal: Number(o.subtotal),
    dpPercent: Number(o.dp_percent),
    dpAmount: Number(o.dp_amount),
    paidAmount: Number(o.paid_amount),
    remainingAmount: Number(o.subtotal) - Number(o.paid_amount),
    subtotalFormatted: formatRp(o.subtotal),
    dpAmountFormatted: formatRp(o.dp_amount),
    paidAmountFormatted: formatRp(o.paid_amount),
    remainingFormatted: formatRp(Number(o.subtotal) - Number(o.paid_amount)),
    notes: o.notes,
  });
});

module.exports = router;
