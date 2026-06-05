require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool, query } = require('../src/db');

const V_ORDER_SUMMARY = `
CREATE OR REPLACE VIEW v_order_summary AS
SELECT
  o.id,
  o.order_code,
  o.order_type,
  o.status,
  o.customer_first_name || COALESCE(' ' || o.customer_last_name, '') AS customer_name,
  o.customer_email,
  o.customer_phone,
  COALESCE(p.title, c.name) AS product_name,
  o.trip_date,
  o.subtotal,
  o.dp_amount,
  o.paid_amount,
  (o.subtotal - o.paid_amount) AS remaining_amount,
  o.booked_at
FROM orders o
LEFT JOIN packages p ON p.id = o.package_id
LEFT JOIN cars c ON c.id = o.car_id;
`;

(async () => {
  try {
    await query(V_ORDER_SUMMARY);
    const { rows } = await query('SELECT COUNT(*)::int AS n FROM v_order_summary');
    console.log('v_order_summary OK —', rows[0].n, 'pesanan');
    process.exit(0);
  } catch (e) {
    console.error('Gagal:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
