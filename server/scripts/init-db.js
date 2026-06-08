const pool = require("../config/db");

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  role VARCHAR(20) DEFAULT 'customer',
  avatar VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image VARCHAR(255),
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_price DECIMAL(10,2),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  sku VARCHAR(100) UNIQUE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  image_url VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  alt_text VARCHAR(255),
  color VARCHAR(100),
  cloudinary_public_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_colors (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  color_name VARCHAR(100) NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_sizes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  color_id INTEGER REFERENCES product_colors(id) ON DELETE CASCADE,
  size_name VARCHAR(100) NOT NULL,
  size_type VARCHAR(50),
  measurements JSONB DEFAULT '{}'::jsonb,
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER REFERENCES carts(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL,
  size VARCHAR(100),
  color VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wishlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id SERIAL PRIMARY KEY,
  wishlist_id INTEGER REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(wishlist_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  shipping_address TEXT NOT NULL,
  billing_address TEXT NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  customer_name VARCHAR(100),
  customer_email VARCHAR(100),
  customer_phone VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  size VARCHAR(100),
  color VARCHAR(100),
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  payment_intent_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE product_images ADD COLUMN IF NOT EXISTS color VARCHAR(100);
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS size VARCHAR(100);
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS color VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size VARCHAR(100);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS color VARCHAR(100);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
ALTER TABLE product_sizes ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
ALTER TABLE product_sizes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

DO $$
DECLARE
  constraint_to_drop text;
BEGIN
  SELECT tc.constraint_name INTO constraint_to_drop
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
  WHERE tc.table_schema = 'public'
    AND tc.table_name = 'cart_items'
    AND tc.constraint_type = 'UNIQUE'
  GROUP BY tc.constraint_name
  HAVING array_agg(kcu.column_name::text ORDER BY kcu.ordinal_position) = ARRAY['cart_id', 'product_id']::text[];

  IF constraint_to_drop IS NOT NULL THEN
    EXECUTE format('ALTER TABLE cart_items DROP CONSTRAINT %I', constraint_to_drop);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS cart_items_variant_unique
  ON cart_items (cart_id, product_id, COALESCE(size, ''), COALESCE(color, ''));
`;

async function initDb() {
  try {
    await pool.query(schema);

    const result = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );

    console.log("Database initialized.");
    console.log(`Tables: ${result.rows.map((row) => row.table_name).join(", ")}`);
  } finally {
    await pool.end();
  }
}

initDb().catch((error) => {
  console.error("Database initialization failed:");
  console.error(error);
  process.exit(1);
});
