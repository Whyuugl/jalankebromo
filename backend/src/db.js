const { Pool } = require('pg');

let connectionString = process.env.DATABASE_URL || '';

const isSupabase = connectionString.includes('supabase.co');
const needsSsl =
  isSupabase ||
  process.env.DATABASE_SSL === 'true' ||
  /sslmode=/i.test(connectionString);

// pg v8+ memetakan sslmode=require ke verify-full — strip agar ssl config kita dipakai
if (needsSsl) {
  connectionString = connectionString
    .replace(/([?&])sslmode=[^&]*&?/gi, (_, sep) => (sep === '?' ? '?' : ''))
    .replace(/\?&/, '?')
    .replace(/[?&]$/, '');
}

const poolConfig = { connectionString };

if (needsSsl) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

if (connectionString.includes('pooler.supabase.com')) {
  poolConfig.max = Number(process.env.PG_POOL_MAX) || 10;
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
