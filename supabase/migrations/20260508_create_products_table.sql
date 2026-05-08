-- Create products table for real affiliate products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'PHP',
  category TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('men', 'women', 'unisex')),
  image_url TEXT NOT NULL,
  affiliate_link TEXT NOT NULL,
  retailer TEXT NOT NULL,
  brand TEXT,
  sizes TEXT[], -- Array of available sizes
  colors TEXT[], -- Array of available colors
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on category and gender for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
CREATE INDEX IF NOT EXISTS idx_products_retailer ON products(retailer);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read products (they're public)
CREATE POLICY "Anyone can view products"
  ON products
  FOR SELECT
  USING (true);

-- Only authenticated users can insert/update/delete (for admin purposes)
CREATE POLICY "Authenticated users can manage products"
  ON products
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Insert the first real product (Everlane jeans)
INSERT INTO products (
  name,
  description,
  price,
  currency,
  category,
  gender,
  image_url,
  affiliate_link,
  retailer,
  brand,
  in_stock
) VALUES (
  'Everlane Women''s The Way-High® Twist Curve Jean',
  'High-waisted wide-leg jeans with a flattering curve fit',
  5683.96,
  'PHP',
  'Pants',
  'women',
  'https://m.media-amazon.com/images/I/71QZxBYvTyL._AC_SY741_.jpg',
  'https://amzn.to/4fg2mrE',
  'Amazon',
  'Everlane',
  true
);
