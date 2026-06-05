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

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
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

app.listen(PORT, () => {
  console.log(`Jalankebromo API + website: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
