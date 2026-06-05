require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const adminCrudRoutes = require('./routes/admin-crud');

const app = express();
const PORT = process.env.PORT || 3000;
const rootDir = path.join(__dirname, '..', '..');

if (!process.env.DATABASE_URL) {
  console.warn('Peringatan: DATABASE_URL belum di-set. Salin backend/.env.example ke backend/.env');
}
if (!process.env.JWT_SECRET) {
  console.warn('Peringatan: JWT_SECRET belum di-set.');
}

function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true);
  var allowed = (process.env.CORS_ORIGIN || '').split(',').map(function (s) {
    return s.trim();
  }).filter(Boolean);
  if (!allowed.length) return callback(null, true);
  if (allowed.indexOf(origin) !== -1) return callback(null, true);
  if (/\.vercel\.app$/i.test(origin)) return callback(null, true);
  callback(new Error('CORS: origin tidak diizinkan — ' + origin));
}

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminCrudRoutes);

app.use(express.static(rootDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan server' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Jalankebromo API + website: port ${PORT}`);
  console.log(`Health check: /api/health`);
});
