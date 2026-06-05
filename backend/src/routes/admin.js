const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { mapPackageRow, formatRp } = require('../utils');
const { asyncHandler } = require('../async-handler');

const router = express.Router();

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' });
  }

  const { rows } = await query(
    `SELECT id, email, full_name, role
     FROM admin_users
     WHERE email = $1
       AND password_hash = crypt($2, password_hash)
       AND is_active = TRUE`,
    [email.trim().toLowerCase(), password]
  );

  if (!rows.length) {
    return res.status(401).json({ error: 'Email atau password salah' });
  }

  const user = rows[0];

  await query(`UPDATE admin_users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.full_name, role: user.role },
  });
}));

router.get('/me', requireAdmin, (req, res) => {
  res.json({ user: req.admin });
});

router.get('/dashboard', requireAdmin, asyncHandler(async (req, res) => {
  const [orders, revenue, packages, articles] = await Promise.all([
    query(`SELECT COUNT(*)::int AS c FROM orders WHERE booked_at >= date_trunc('month', CURRENT_DATE)`),
    query(`SELECT COALESCE(SUM(paid_amount), 0) AS total FROM orders WHERE status IN ('dp_paid', 'paid', 'completed')`),
    query(`SELECT COUNT(*)::int AS c FROM packages WHERE publish_status = 'published'`),
    query(`SELECT COUNT(*)::int AS c FROM articles WHERE publish_status = 'published'`),
  ]);

  const recent = await query(`SELECT * FROM v_order_summary ORDER BY booked_at DESC LIMIT 5`);

  const [pendingCount, pendingList] = await Promise.all([
    query(`SELECT COUNT(*)::int AS c FROM order_reschedules WHERE status = 'pending'`),
    query(
      `SELECT r.id, r.new_trip_date, r.old_trip_date, r.requested_at, r.reason,
              o.order_code,
              o.customer_first_name || COALESCE(' ' || o.customer_last_name, '') AS customer_name,
              v.product_name
       FROM order_reschedules r
       JOIN orders o ON o.id = r.order_id
       LEFT JOIN v_order_summary v ON v.id = o.id
       WHERE r.status = 'pending'
       ORDER BY r.requested_at DESC
       LIMIT 8`
    ),
  ]);

  res.json({
    stats: {
      ordersThisMonth: orders.rows[0].c,
      revenuePaid: Number(revenue.rows[0].total),
      revenueFormatted: formatRp(revenue.rows[0].total),
      packagesActive: packages.rows[0].c,
      articlesPublished: articles.rows[0].c,
      pendingReschedules: pendingCount.rows[0].c,
    },
    recentOrders: recent.rows,
    pendingReschedules: pendingList.rows.map((r) => ({
      id: r.id,
      orderCode: r.order_code,
      customerName: r.customer_name,
      productName: r.product_name,
      oldTripDate: r.old_trip_date,
      newTripDate: r.new_trip_date,
      requestedAt: r.requested_at,
      reason: r.reason,
    })),
  });
}));

router.get('/reschedules', requireAdmin, async (req, res) => {
  const status = (req.query.status || 'pending').trim();
  const allowed = ['pending', 'approved', 'rejected', 'all'];
  const filterStatus = allowed.includes(status) ? status : 'pending';

  let sql = `
    SELECT r.id, r.order_id, r.old_trip_date, r.new_trip_date, r.status, r.reason,
           r.requested_at, r.processed_at,
           o.order_code,
           o.customer_first_name || COALESCE(' ' || o.customer_last_name, '') AS customer_name,
           o.customer_phone,
           v.product_name
    FROM order_reschedules r
    JOIN orders o ON o.id = r.order_id
    LEFT JOIN v_order_summary v ON v.id = o.id`;
  const params = [];
  if (filterStatus !== 'all') {
    sql += ` WHERE r.status = $1`;
    params.push(filterStatus);
  }
  sql += ` ORDER BY r.requested_at DESC LIMIT 100`;

  const { rows } = await query(sql, params);
  res.json(rows);
});

router.patch('/reschedules/:id/approve', requireAdmin, async (req, res) => {
  const id = req.params.id;
  const { rows } = await query(`SELECT * FROM order_reschedules WHERE id = $1`, [id]);
  if (!rows.length) return res.status(404).json({ error: 'Pengajuan tidak ditemukan' });

  const reqRow = rows[0];
  if (reqRow.status !== 'pending') {
    return res.status(400).json({ error: 'Pengajuan sudah diproses' });
  }

  await query(`UPDATE orders SET trip_date = $1, updated_at = NOW() WHERE id = $2`, [
    reqRow.new_trip_date,
    reqRow.order_id,
  ]);
  await query(
    `UPDATE order_reschedules
     SET status = 'approved', processed_by = $1, processed_at = NOW()
     WHERE id = $2`,
    [req.admin.id, id]
  );

  res.json({ success: true, message: 'Reschedule disetujui, tanggal trip diperbarui' });
});

router.patch('/reschedules/:id/reject', requireAdmin, async (req, res) => {
  const id = req.params.id;
  const { rows } = await query(`SELECT * FROM order_reschedules WHERE id = $1`, [id]);
  if (!rows.length) return res.status(404).json({ error: 'Pengajuan tidak ditemukan' });

  if (rows[0].status !== 'pending') {
    return res.status(400).json({ error: 'Pengajuan sudah diproses' });
  }

  await query(
    `UPDATE order_reschedules
     SET status = 'rejected', processed_by = $1, processed_at = NOW()
     WHERE id = $2`,
    [req.admin.id, id]
  );

  res.json({ success: true, message: 'Pengajuan reschedule ditolak' });
});

router.get(
  '/orders',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await query(`SELECT * FROM v_order_summary ORDER BY booked_at DESC LIMIT 100`);
    res.json(rows);
  })
);

router.get('/orders/:id', requireAdmin, async (req, res) => {
  const { rows } = await query(`SELECT * FROM v_order_summary WHERE id = $1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
  res.json(rows[0]);
});

router.patch('/orders/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  const allowed = ['pending', 'dp_paid', 'paid', 'completed', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Status tidak valid' });
  }
  await query(`UPDATE orders SET status = $1 WHERE id = $2`, [status, req.params.id]);
  res.json({ success: true });
});

router.get('/packages', requireAdmin, async (req, res) => {
  const { rows } = await query(
    `SELECT id, slug, title, category, duration_label, price, publish_status, sort_order
     FROM packages ORDER BY sort_order, title`
  );
  res.json(rows.map(mapPackageRow));
});

router.get('/cars', requireAdmin, async (req, res) => {
  const { rows } = await query(
    `SELECT id, slug, name, capacity_label, transmission, price_per_day, publish_status
     FROM cars ORDER BY sort_order, name`
  );
  res.json(
    rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      capacityLabel: r.capacity_label,
      transmission: r.transmission,
      pricePerDay: Number(r.price_per_day),
      priceFormatted: formatRp(r.price_per_day),
      publishStatus: r.publish_status,
    }))
  );
});

router.get('/articles', requireAdmin, async (req, res) => {
  const { rows } = await query(
    `SELECT id, slug, title, publish_status, published_at FROM articles ORDER BY published_at DESC NULLS LAST`
  );
  res.json(rows);
});

router.get('/settings', requireAdmin, async (req, res) => {
  const { rows } = await query('SELECT key, value, description FROM site_settings ORDER BY key');
  res.json(rows);
});

router.put('/settings', requireAdmin, async (req, res) => {
  const items = req.body || {};
  for (const [key, value] of Object.entries(items)) {
    await query(
      `INSERT INTO site_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, String(value)]
    );
  }
  res.json({ success: true });
});

// -----------------------------------------------------------------------------
// Laporan (rekap bulanan)
// -----------------------------------------------------------------------------
router.get('/report', requireAdmin, async (req, res) => {
  const parseMonth = (m) => {
    const mm = String(m || '').trim().match(/^(\d{4})-(\d{2})$/);
    if (!mm) return null;
    const year = parseInt(mm[1], 10);
    const monthIndex = parseInt(mm[2], 10) - 1;
    return new Date(year, monthIndex, 1, 0, 0, 0, 0);
  };

  const now = new Date();
  const currentStart = parseMonth(req.query.month) || new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const prevStart = new Date(currentStart);
  prevStart.setMonth(prevStart.getMonth() - 1);
  const nextStart = new Date(currentStart);
  nextStart.setMonth(nextStart.getMonth() + 1);

  const monthLabel = currentStart.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  const paidStatuses = ['dp_paid', 'paid', 'completed'];

  const [
    curOrders,
    prevOrders,
    curVisits,
    prevVisits,
    pendingReqCur,
    curPackages,
    curArticles,
  ] = await Promise.all([
    query(
      `SELECT COUNT(*)::int AS orders_count,
              COALESCE(SUM(paid_amount), 0) AS revenue_paid
       FROM orders
       WHERE booked_at >= $1 AND booked_at < $2
         AND status IN ('dp_paid','paid','completed')`,
      [currentStart, nextStart]
    ),
    query(
      `SELECT COUNT(*)::int AS orders_count,
              COALESCE(SUM(paid_amount), 0) AS revenue_paid
       FROM orders
       WHERE booked_at >= $1 AND booked_at < $2
         AND status IN ('dp_paid','paid','completed')`,
      [prevStart, currentStart]
    ),
    query(
      `SELECT COUNT(*)::int AS visits
       FROM page_views
       WHERE visited_at >= $1 AND visited_at < $2`,
      [currentStart, nextStart]
    ),
    query(
      `SELECT COUNT(*)::int AS visits
       FROM page_views
       WHERE visited_at >= $1 AND visited_at < $2`,
      [prevStart, currentStart]
    ),
    query(
      `SELECT COUNT(*)::int AS pending_requests
       FROM order_reschedules
       WHERE status = 'pending'
         AND requested_at >= $1 AND requested_at < $2`,
      [currentStart, nextStart]
    ),
    query(`SELECT COUNT(*)::int AS c FROM packages WHERE publish_status = 'published'`),
    query(`SELECT COUNT(*)::int AS c FROM articles WHERE publish_status = 'published'`),
  ]);

  const curOrdersRow = curOrders.rows[0];
  const prevOrdersRow = prevOrders.rows[0];
  const curVisitsRow = curVisits.rows[0];
  const prevVisitsRow = prevVisits.rows[0];

  const pctChange = (a, b) => {
    const prev = Number(b) || 0;
    const curr = Number(a) || 0;
    if (prev === 0) return null;
    return ((curr - prev) / prev) * 100;
  };

  // Trend 6 bulan terakhir (termasuk bulan yang dipilih)
  const trendStart = new Date(currentStart);
  trendStart.setMonth(trendStart.getMonth() - 5);

  const [trendOrders, trendVisits] = await Promise.all([
    query(
      `SELECT to_char(date_trunc('month', booked_at), 'YYYY-MM') AS month_key,
              COUNT(*)::int AS orders_count,
              COALESCE(SUM(paid_amount), 0) AS revenue_paid
       FROM orders
       WHERE booked_at >= $1 AND booked_at < $2
         AND status IN ('dp_paid','paid','completed')
       GROUP BY 1
       ORDER BY month_key`,
      [trendStart, nextStart]
    ),
    query(
      `SELECT to_char(date_trunc('month', visited_at), 'YYYY-MM') AS month_key,
              COUNT(*)::int AS visits
       FROM page_views
       WHERE visited_at >= $1 AND visited_at < $2
       GROUP BY 1
       ORDER BY month_key`,
      [trendStart, nextStart]
    ),
  ]);

  var ordersByMonth = {};
  trendOrders.rows.forEach(function (r) {
    ordersByMonth[r.month_key] = {
      orders_count: Number(r.orders_count) || 0,
      revenue_paid: Number(r.revenue_paid) || 0,
    };
  });
  var visitsByMonth = {};
  trendVisits.rows.forEach(function (r) {
    visitsByMonth[r.month_key] = { visits: Number(r.visits) || 0 };
  });

  var months = [];
  for (var d = new Date(trendStart); d < nextStart; d.setMonth(d.getMonth() + 1)) {
    var key = d.toISOString().slice(0, 7); // YYYY-MM
    months.push({
      monthKey: key,
      label: d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
      ordersCount: (ordersByMonth[key] && ordersByMonth[key].orders_count) || 0,
      revenuePaid: (ordersByMonth[key] && ordersByMonth[key].revenue_paid) || 0,
      visits: (visitsByMonth[key] && visitsByMonth[key].visits) || 0,
    });
  }

  res.json({
    month: {
      monthKey: currentStart.toISOString().slice(0, 7),
      label: monthLabel,
    },
    current: {
      ordersCount: curOrdersRow.orders_count || 0,
      revenuePaid: Number(curOrdersRow.revenue_paid) || 0,
      visits: curVisitsRow.visits || 0,
      pendingRescheduleRequests: pendingReqCur.rows[0].pending_requests || 0,
      packagesActiveCount: curPackages.rows[0].c,
      articlesPublishedCount: curArticles.rows[0].c,
    },
    previous: {
      ordersCount: prevOrdersRow.orders_count || 0,
      revenuePaid: Number(prevOrdersRow.revenue_paid) || 0,
      visits: prevVisitsRow.visits || 0,
    },
    growth: {
      ordersPct: pctChange(curOrdersRow.orders_count, prevOrdersRow.orders_count),
      revenuePct: pctChange(curOrdersRow.revenue_paid, prevOrdersRow.revenue_paid),
      visitsPct: pctChange(curVisitsRow.visits, prevVisitsRow.visits),
    },
    trend: months,
  });
});

module.exports = router;
