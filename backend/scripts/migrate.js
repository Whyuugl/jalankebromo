require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { pool, query } = require('../src/db');

const root = path.join(__dirname, '..', '..', 'database');

async function tableExists(name) {
  const { rows } = await query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [name]
  );
  return rows.length > 0;
}

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log('Menjalankan:', path.basename(filePath));
  await pool.query(sql);
}

async function viewExists(name) {
  const { rows } = await query(
    `SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = $1`,
    [name]
  );
  return rows.length > 0;
}

const V_ORDER_SUMMARY = `
CREATE OR REPLACE VIEW v_order_summary AS
SELECT
  o.id, o.order_code, o.order_type, o.status,
  o.customer_first_name || COALESCE(' ' || o.customer_last_name, '') AS customer_name,
  o.customer_email, o.customer_phone,
  COALESCE(p.title, c.name) AS product_name,
  o.trip_date, o.subtotal, o.dp_amount, o.paid_amount,
  (o.subtotal - o.paid_amount) AS remaining_amount, o.booked_at
FROM orders o
LEFT JOIN packages p ON p.id = o.package_id
LEFT JOIN cars c ON c.id = o.car_id`;

async function ensureViews() {
  if (await viewExists('v_order_summary')) {
    console.log('View v_order_summary sudah ada.');
    return;
  }
  console.log('Membuat view v_order_summary...');
  await query(V_ORDER_SUMMARY);
  console.log('View v_order_summary selesai.');
}

(async () => {
  try {
    const hasPackages = await tableExists('packages');
    if (!hasPackages) {
      await runSqlFile(path.join(root, 'schema.sql'));
      console.log('Schema selesai.');
    } else {
      console.log('Schema sudah ada, lewati schema.sql');
    }

    const { rows } = await query('SELECT COUNT(*)::int AS n FROM packages');
    if (rows[0].n === 0) {
      await runSqlFile(path.join(root, 'seed.sql'));
      console.log('Seed selesai.');
    } else {
      console.log('Data sudah ada (' + rows[0].n + ' paket), lewati seed.sql');
    }

    await ensureViews();

    const admin = await query(
      `SELECT email FROM admin_users WHERE email = 'admin@jalankebromo.com' LIMIT 1`
    );
    console.log('Admin:', admin.rows[0]?.email || '(tidak ditemukan)');
    process.exit(0);
  } catch (e) {
    console.error('Migrasi gagal:', e.message);
    if (e.detail) console.error('Detail:', e.detail);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
