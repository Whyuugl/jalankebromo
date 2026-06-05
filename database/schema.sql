-- =============================================================================
-- Jalankebromo — PostgreSQL Schema
-- Lokal: database "jalankebromo" | Supabase: database default "postgres"
-- Jalankan di SQL Editor (Supabase) atau pgAdmin / psql
-- =============================================================================

BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- -----------------------------------------------------------------------------
-- ENUM types
-- -----------------------------------------------------------------------------

CREATE TYPE publish_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE order_type AS ENUM ('package', 'car_rental');

CREATE TYPE order_status AS ENUM (
  'pending',
  'dp_paid',
  'paid',
  'completed',
  'cancelled'
);

CREATE TYPE payment_method AS ENUM (
  'bank_transfer',
  'cash',
  'e_wallet',
  'other'
);

CREATE TYPE reschedule_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'staff');

-- -----------------------------------------------------------------------------
-- Utility: updated_at trigger
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Admin users
-- -----------------------------------------------------------------------------

CREATE TABLE admin_users (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email           CITEXT NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(120) NOT NULL,
  role            admin_role NOT NULL DEFAULT 'admin',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Site settings (key-value)
-- -----------------------------------------------------------------------------

CREATE TABLE site_settings (
  key         VARCHAR(80) PRIMARY KEY,
  value       TEXT NOT NULL,
  description VARCHAR(255),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Packages (paket wisata)
-- -----------------------------------------------------------------------------

CREATE TABLE packages (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug              VARCHAR(200) NOT NULL UNIQUE,
  title             VARCHAR(255) NOT NULL,
  category          VARCHAR(80) NOT NULL DEFAULT 'Open Trip',
  duration_label    VARCHAR(60),
  price             NUMERIC(14, 0) NOT NULL CHECK (price >= 0),
  currency          CHAR(3) NOT NULL DEFAULT 'IDR',
  short_description TEXT,
  description       TEXT,
  main_image_url    TEXT,
  publish_status    publish_status NOT NULL DEFAULT 'draft',
  sort_order        INT NOT NULL DEFAULT 0,
  meta_title        VARCHAR(255),
  meta_description  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_packages_publish_status ON packages (publish_status);
CREATE INDEX idx_packages_category ON packages (category);
CREATE INDEX idx_packages_sort ON packages (sort_order, title);

CREATE TRIGGER trg_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE package_images (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  package_id  BIGINT NOT NULL REFERENCES packages (id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  alt_text    VARCHAR(255),
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_package_images_package ON package_images (package_id, sort_order);

CREATE TABLE package_itinerary_items (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  package_id   BIGINT NOT NULL REFERENCES packages (id) ON DELETE CASCADE,
  sort_order   INT NOT NULL DEFAULT 0,
  time_label   VARCHAR(40),
  title        VARCHAR(255),
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_package_itinerary_package ON package_itinerary_items (package_id, sort_order);

-- -----------------------------------------------------------------------------
-- Cars (sewa mobil)
-- -----------------------------------------------------------------------------

CREATE TABLE cars (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug            VARCHAR(120) NOT NULL UNIQUE,
  name            VARCHAR(120) NOT NULL,
  capacity_label  VARCHAR(40),
  transmission    VARCHAR(20) NOT NULL DEFAULT 'Manual',
  price_per_day   NUMERIC(14, 0) NOT NULL CHECK (price_per_day >= 0),
  currency        CHAR(3) NOT NULL DEFAULT 'IDR',
  description     TEXT,
  main_image_url  TEXT,
  publish_status  publish_status NOT NULL DEFAULT 'draft',
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cars_publish_status ON cars (publish_status);

CREATE TRIGGER trg_cars_updated_at
  BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Articles
-- -----------------------------------------------------------------------------

CREATE TABLE articles (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug            VARCHAR(255) NOT NULL UNIQUE,
  title           VARCHAR(255) NOT NULL,
  excerpt         TEXT,
  content         TEXT NOT NULL,
  cover_image_url TEXT,
  publish_status  publish_status NOT NULL DEFAULT 'draft',
  published_at    TIMESTAMPTZ,
  author_id       BIGINT REFERENCES admin_users (id) ON DELETE SET NULL,
  view_count      INT NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_articles_publish ON articles (publish_status, published_at DESC);

CREATE TRIGGER trg_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE article_tags (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       VARCHAR(80) NOT NULL UNIQUE,
  slug       VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE article_tag_map (
  article_id BIGINT NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
  tag_id     BIGINT NOT NULL REFERENCES article_tags (id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- -----------------------------------------------------------------------------
-- Reviews (paket)
-- -----------------------------------------------------------------------------

CREATE TABLE reviews (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  package_id    BIGINT NOT NULL REFERENCES packages (id) ON DELETE CASCADE,
  customer_name VARCHAR(120) NOT NULL,
  rating        NUMERIC(2, 1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  comment       TEXT NOT NULL,
  reviewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_visible    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_package ON reviews (package_id, reviewed_at DESC);

-- -----------------------------------------------------------------------------
-- Orders (pesanan)
-- -----------------------------------------------------------------------------

CREATE TABLE orders (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_code          VARCHAR(20) NOT NULL UNIQUE,
  order_type          order_type NOT NULL,
  status              order_status NOT NULL DEFAULT 'pending',

  -- Pelanggan
  customer_first_name VARCHAR(80) NOT NULL,
  customer_last_name  VARCHAR(80),
  customer_email      VARCHAR(255),
  customer_phone      VARCHAR(30) NOT NULL,
  customer_city       VARCHAR(100),

  -- Produk (salah satu)
  package_id          BIGINT REFERENCES packages (id) ON DELETE RESTRICT,
  car_id              BIGINT REFERENCES cars (id) ON DELETE RESTRICT,

  -- Detail trip / sewa
  trip_date           DATE,
  participants_count  INT CHECK (participants_count IS NULL OR participants_count > 0),
  rental_days         INT CHECK (rental_days IS NULL OR rental_days > 0),
  pickup_location     VARCHAR(255),

  -- Pembayaran
  subtotal            NUMERIC(14, 0) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  dp_percent          NUMERIC(5, 2) NOT NULL DEFAULT 30.00,
  dp_amount           NUMERIC(14, 0) NOT NULL DEFAULT 0 CHECK (dp_amount >= 0),
  paid_amount         NUMERIC(14, 0) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  payment_method      payment_method DEFAULT 'bank_transfer',

  notes               TEXT,
  booked_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT orders_product_check CHECK (
    (order_type = 'package' AND package_id IS NOT NULL AND car_id IS NULL)
    OR (order_type = 'car_rental' AND car_id IS NOT NULL AND package_id IS NULL)
  )
);

CREATE INDEX idx_orders_status ON orders (status, booked_at DESC);
CREATE INDEX idx_orders_type ON orders (order_type);
CREATE INDEX idx_orders_customer_name ON orders (customer_first_name, customer_last_name);
CREATE INDEX idx_orders_trip_date ON orders (trip_date);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Page views (untuk laporan admin)
-- -----------------------------------------------------------------------------

CREATE TABLE page_views (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  path        VARCHAR(255) NOT NULL,
  visited_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_page_views_visited_at ON page_views (visited_at DESC);
CREATE INDEX idx_page_views_path ON page_views (path);

-- -----------------------------------------------------------------------------
-- Reschedule
-- -----------------------------------------------------------------------------

CREATE TABLE order_reschedules (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id        BIGINT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  old_trip_date   DATE,
  new_trip_date   DATE NOT NULL,
  status          reschedule_status NOT NULL DEFAULT 'pending',
  reason          TEXT,
  processed_by    BIGINT REFERENCES admin_users (id) ON DELETE SET NULL,
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ
);

CREATE INDEX idx_order_reschedules_order ON order_reschedules (order_id, requested_at DESC);

-- -----------------------------------------------------------------------------
-- Views (opsional, untuk admin dashboard)
-- -----------------------------------------------------------------------------

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

COMMIT;
