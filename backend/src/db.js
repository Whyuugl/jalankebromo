const dns = require('dns');
const { Pool } = require('pg');

// Railway/cloud sering gagal ke Supabase direct (IPv6 ENETUNREACH) — prioritaskan IPv4
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

let connectionString = process.env.DATABASE_URL || '';

const isSupabase =
  connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com');
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

// Supabase pooler (port 6543) — wajib untuk Railway/Vercel
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
