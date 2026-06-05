function slugify(text) {
  return (
    String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'item'
  );
}

function normalizePublishStatus(val) {
  const v = String(val || '').toLowerCase();
  if (['published', 'aktif', 'terbit', 'tersedia', 'active'].includes(v)) return 'published';
  return 'draft';
}

function parseDurationDays(label) {
  if (!label) return 0;
  const m = String(label).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function formatRp(amount) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

function mapPackageRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    durationLabel: row.duration_label,
    durationDays: parseDurationDays(row.duration_label),
    price: Number(row.price),
    priceFormatted: formatRp(row.price),
    shortDescription: row.short_description,
    description: row.description,
    mainImageUrl: row.main_image_url,
    publishStatus: row.publish_status,
  };
}

module.exports = {
  slugify,
  normalizePublishStatus,
  parseDurationDays,
  formatRp,
  mapPackageRow,
};
