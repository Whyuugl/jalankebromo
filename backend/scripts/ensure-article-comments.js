require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool, query } = require('../src/db');

const SQL = `
CREATE TABLE IF NOT EXISTS article_comments (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  article_id  BIGINT NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
  author_name VARCHAR(120) NOT NULL,
  author_email VARCHAR(255),
  body        TEXT NOT NULL,
  is_visible  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_article_comments_article ON article_comments (article_id, created_at DESC);
`;

(async () => {
  try {
    await query(SQL);
    console.log('article_comments OK');
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
