require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { query, pool } = require('../src/db');

(async () => {
  try {
    const { rows } = await query('SELECT current_database() AS db, version()');
    console.log('OK — terhubung ke:', rows[0].db);
    console.log(rows[0].version.split('\n')[0]);
    process.exit(0);
  } catch (e) {
    console.error('Gagal koneksi:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
