-- Add API key and webhook fields to brands table
ALTER TABLE brands ADD COLUMN IF NOT EXISTS api_key TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS payment_provider TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS order_tracking_enabled BOOLEAN DEFAULT false;

-- Create brand_api_logs table to track API usage
CREATE TABLE IF NOT EXISTS brand_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  request_body JSONB,
  response_body JSONB,
  error_message TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create product_compatibility table for garment matching
CREATE TABLE IF NOT EXISTS product_compatibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  compatible_with UUID REFERENCES products(id) ON DELETE CASCADE,
  compatibility_score DECIMAL(3,2),
  compatibility_reasons JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create garment_metadata table for detailed garment information
CREATE TABLE IF NOT EXISTS garment_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  fabric_composition JSONB,
  care_instructions TEXT[],
  fit_type TEXT,
  silhouette TEXT,
  neckline TEXT,
  sleeve_length TEXT,
  rise TEXT,
  leg_opening TEXT,
  closure_type TEXT,
  pattern TEXT,
  season TEXT[],
  occasion TEXT[],
  style_tags TEXT[],
  layering_position TEXT,
  formality_level TEXT,
  versatility_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create brand_orders table to track orders from brand systems
CREATE TABLE IF NOT EXISTS brand_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  brand_order_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  order_status TEXT NOT NULL,
  tracking_number TEXT,
  tracking_url TEXT,
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2),
  payment_status TEXT,
  fulfillment_status TEXT,
  shipping_address JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE brand_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE garment_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_orders ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can manage API logs"
ON brand_api_logs FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage compatibility"
ON product_compatibility FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage garment metadata"
ON garment_metadata FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view brand orders"
ON brand_orders FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
ON brand_orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Public read for compatibility (needed for AI recommendations)
CREATE POLICY "Anyone can view compatibility"
ON product_compatibility FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone can view garment metadata"
ON garment_metadata FOR SELECT
TO authenticated
USING (true);

-- Indexes for performance
CREATE INDEX idx_brand_api_logs_brand_id ON brand_api_logs(brand_id);
CREATE INDEX idx_brand_api_logs_created_at ON brand_api_logs(created_at);
CREATE INDEX idx_product_compatibility_product_id ON product_compatibility(product_id);
CREATE INDEX idx_product_compatibility_compatible_with ON product_compatibility(compatible_with);
CREATE INDEX idx_garment_metadata_product_id ON garment_metadata(product_id);
CREATE INDEX idx_brand_orders_brand_id ON brand_orders(brand_id);
CREATE INDEX idx_brand_orders_user_id ON brand_orders(user_id);
CREATE INDEX idx_brand_orders_status ON brand_orders(order_status);

-- Trigger for updated_at
CREATE TRIGGER update_product_compatibility_updated_at
BEFORE UPDATE ON product_compatibility
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_garment_metadata_updated_at
BEFORE UPDATE ON garment_metadata
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_orders_updated_at
BEFORE UPDATE ON brand_orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();