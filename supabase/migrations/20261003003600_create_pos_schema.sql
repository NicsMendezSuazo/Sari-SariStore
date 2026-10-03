/*
# Sari-Sari Store POS Schema

1. New Tables
- `categories` — product categories (drinks, snacks, etc.)
- `products` — items for sale with barcode, price, stock
- `customers` — store customers with credit (utang) tracking
- `suppliers` — inventory suppliers
- `sales` — sales transactions with receipt info
- `sale_items` — line items for each sale
- `inventory_movements` — stock in/out audit log
- `settings` — store configuration (name, GCash number, etc.)

2. Security
- Single-tenant app (PIN-based access, no Supabase auth)
- All tables use `TO anon, authenticated` with `USING (true)` — intentionally public data
- RLS enabled on all tables
*/

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_categories_sel" ON categories;
CREATE POLICY "anon_crud_categories_sel" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_categories_ins" ON categories;
CREATE POLICY "anon_crud_categories_ins" ON categories FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_categories_upd" ON categories;
CREATE POLICY "anon_crud_categories_upd" ON categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_categories_del" ON categories;
CREATE POLICY "anon_crud_categories_del" ON categories FOR DELETE TO anon, authenticated USING (true);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  barcode text UNIQUE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,
  cost numeric(12,2) NOT NULL DEFAULT 0,
  stock int NOT NULL DEFAULT 0,
  low_stock_threshold int NOT NULL DEFAULT 5,
  unit text NOT NULL DEFAULT 'pc',
  is_favorite boolean NOT NULL DEFAULT false,
  favorite_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_products_sel" ON products;
CREATE POLICY "anon_crud_products_sel" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_products_ins" ON products;
CREATE POLICY "anon_crud_products_ins" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_products_upd" ON products;
CREATE POLICY "anon_crud_products_upd" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_products_del" ON products;
CREATE POLICY "anon_crud_products_del" ON products FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_favorite ON products(is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_products_name_lower ON products(lower(name));

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  is_shortcut boolean NOT NULL DEFAULT false,
  shortcut_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_customers_sel" ON customers;
CREATE POLICY "anon_crud_customers_sel" ON customers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_customers_ins" ON customers;
CREATE POLICY "anon_crud_customers_ins" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_customers_upd" ON customers;
CREATE POLICY "anon_crud_customers_upd" ON customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_customers_del" ON customers;
CREATE POLICY "anon_crud_customers_del" ON customers FOR DELETE TO anon, authenticated USING (true);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_suppliers_sel" ON suppliers;
CREATE POLICY "anon_crud_suppliers_sel" ON suppliers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_suppliers_ins" ON suppliers;
CREATE POLICY "anon_crud_suppliers_ins" ON suppliers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_suppliers_upd" ON suppliers;
CREATE POLICY "anon_crud_suppliers_upd" ON suppliers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_suppliers_del" ON suppliers;
CREATE POLICY "anon_crud_suppliers_del" ON suppliers FOR DELETE TO anon, authenticated USING (true);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no text UNIQUE,
  client_id text,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  change_amount numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  note text,
  is_voided boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_sales_sel" ON sales;
CREATE POLICY "anon_crud_sales_sel" ON sales FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_sales_ins" ON sales;
CREATE POLICY "anon_crud_sales_ins" ON sales FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_sales_upd" ON sales;
CREATE POLICY "anon_crud_sales_upd" ON sales FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_sales_del" ON sales;
CREATE POLICY "anon_crud_sales_del" ON sales FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  qty int NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  subtotal numeric(12,2) NOT NULL DEFAULT 0
);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_saleitems_sel" ON sale_items;
CREATE POLICY "anon_crud_saleitems_sel" ON sale_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_saleitems_ins" ON sale_items;
CREATE POLICY "anon_crud_saleitems_ins" ON sale_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_saleitems_upd" ON sale_items;
CREATE POLICY "anon_crud_saleitems_upd" ON sale_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_saleitems_del" ON sale_items;
CREATE POLICY "anon_crud_saleitems_del" ON sale_items FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_saleitems_sale ON sale_items(sale_id);

-- Inventory Movements
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type text NOT NULL,
  qty_change int NOT NULL DEFAULT 0,
  new_qty int NOT NULL DEFAULT 0,
  reason text,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  cost numeric(12,2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_invmov_sel" ON inventory_movements;
CREATE POLICY "anon_crud_invmov_sel" ON inventory_movements FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_invmov_ins" ON inventory_movements;
CREATE POLICY "anon_crud_invmov_ins" ON inventory_movements FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_invmov_upd" ON inventory_movements;
CREATE POLICY "anon_crud_invmov_upd" ON inventory_movements FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_invmov_del" ON inventory_movements;
CREATE POLICY "anon_crud_invmov_del" ON inventory_movements FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_invmov_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_invmov_created ON inventory_movements(created_at DESC);

-- Settings (single row)
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL DEFAULT 'Sari-Sari Store',
  owner_name text,
  pin text NOT NULL DEFAULT '1234',
  gcash_number text,
  maya_number text,
  receipt_header text,
  receipt_footer text,
  idle_timeout_minutes int NOT NULL DEFAULT 5,
  dark_mode boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_settings_sel" ON settings;
CREATE POLICY "anon_crud_settings_sel" ON settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_settings_ins" ON settings;
CREATE POLICY "anon_crud_settings_ins" ON settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_settings_upd" ON settings;
CREATE POLICY "anon_crud_settings_upd" ON settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_settings_del" ON settings;
CREATE POLICY "anon_crud_settings_del" ON settings FOR DELETE TO anon, authenticated USING (true);
