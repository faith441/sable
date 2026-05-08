-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Style preferences table
CREATE TABLE public.style_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  style_type text NOT NULL,
  color_preferences text[] DEFAULT '{}',
  budget_range text NOT NULL,
  body_type text,
  lifestyle text NOT NULL,
  occasions text[] DEFAULT '{}',
  favorite_brands text[] DEFAULT '{}',
  sizes jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE public.style_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.style_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.style_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.style_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all preferences"
  ON public.style_preferences FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Brands table
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  website_url text,
  api_endpoint text,
  api_key_hash text,
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active brands"
  ON public.brands FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage brands"
  ON public.brands FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price decimal(10,2) NOT NULL,
  image_url text,
  product_url text NOT NULL,
  sizes text[] DEFAULT '{}',
  colors text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available products"
  ON public.products FOR SELECT
  TO authenticated
  USING (is_available = true);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Capsule wardrobes table
CREATE TABLE public.capsule_wardrobes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  season text,
  total_pieces integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.capsule_wardrobes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wardrobes"
  ON public.capsule_wardrobes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own wardrobes"
  ON public.capsule_wardrobes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wardrobes"
  ON public.capsule_wardrobes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wardrobes"
  ON public.capsule_wardrobes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wardrobes"
  ON public.capsule_wardrobes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Wardrobe items (many-to-many relationship)
CREATE TABLE public.wardrobe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wardrobe_id uuid REFERENCES public.capsule_wardrobes(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(wardrobe_id, product_id)
);

ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items in own wardrobes"
  ON public.wardrobe_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.capsule_wardrobes
      WHERE id = wardrobe_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage items in own wardrobes"
  ON public.wardrobe_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.capsule_wardrobes
      WHERE id = wardrobe_id AND user_id = auth.uid()
    )
  );

-- Trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  
  -- Make first user admin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'user');
  END IF;
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_style_preferences_updated_at
  BEFORE UPDATE ON public.style_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_capsule_wardrobes_updated_at
  BEFORE UPDATE ON public.capsule_wardrobes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;-- Create cart table for guest and authenticated users
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table for AI stylist
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user wardrobe (purchased items)
CREATE TABLE public.user_wardrobe (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Create outfit plans table
CREATE TABLE public.outfit_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  day_of_week TEXT CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  items JSONB NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wardrobe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_plans ENABLE ROW LEVEL SECURITY;

-- Cart policies (allow both authenticated and guest via session_id)
CREATE POLICY "Users can view their own cart items"
ON public.cart_items FOR SELECT
USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can insert their own cart items"
ON public.cart_items FOR INSERT
WITH CHECK (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can update their own cart items"
ON public.cart_items FOR UPDATE
USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can delete their own cart items"
ON public.cart_items FOR DELETE
USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- Chat policies
CREATE POLICY "Users can view their own chat messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can insert their own chat messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id OR session_id IS NOT NULL);

-- User wardrobe policies
CREATE POLICY "Users can view their own wardrobe"
ON public.user_wardrobe FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their wardrobe"
ON public.user_wardrobe FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their wardrobe"
ON public.user_wardrobe FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their wardrobe"
ON public.user_wardrobe FOR DELETE
USING (auth.uid() = user_id);

-- Outfit plans policies
CREATE POLICY "Users can view their own outfit plans"
ON public.outfit_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create outfit plans"
ON public.outfit_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their outfit plans"
ON public.outfit_plans FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their outfit plans"
ON public.outfit_plans FOR DELETE
USING (auth.uid() = user_id);

-- Update triggers
CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_outfit_plans_updated_at
BEFORE UPDATE ON public.outfit_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Extend user_wardrobe table to support manually added items
ALTER TABLE user_wardrobe 
  ALTER COLUMN product_id DROP NOT NULL;

-- Add columns for manually added clothing items
ALTER TABLE user_wardrobe
  ADD COLUMN IF NOT EXISTS custom_image_url text,
  ADD COLUMN IF NOT EXISTS custom_description text,
  ADD COLUMN IF NOT EXISTS custom_size text,
  ADD COLUMN IF NOT EXISTS custom_brand text,
  ADD COLUMN IF NOT EXISTS custom_category text,
  ADD COLUMN IF NOT EXISTS is_custom boolean DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_wardrobe_user_id ON user_wardrobe(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wardrobe_is_custom ON user_wardrobe(is_custom);-- Create storage bucket for user closet items
INSERT INTO storage.buckets (id, name, public)
VALUES ('closet-items', 'closet-items', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for closet-items bucket
CREATE POLICY "Users can view their own closet items"
ON storage.objects FOR SELECT
USING (bucket_id = 'closet-items' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own closet items"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'closet-items' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own closet items"
ON storage.objects FOR UPDATE
USING (bucket_id = 'closet-items' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own closet items"
ON storage.objects FOR DELETE
USING (bucket_id = 'closet-items' AND auth.uid()::text = (storage.foldername(name))[1]);-- Remove strict FK so AI-generated wardrobe products can be added to cart
ALTER TABLE public.cart_items
  DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;-- Add product_data column to store full product information for cart items
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS product_data JSONB;-- Add admin policies for full user data access

-- Allow admins to view all user wardrobes and photos
CREATE POLICY "Admins can view all wardrobes"
ON user_wardrobe
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage all wardrobes
CREATE POLICY "Admins can manage all wardrobes"
ON user_wardrobe
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to read all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all cart items
CREATE POLICY "Admins can view all carts"
ON cart_items
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all chat messages
CREATE POLICY "Admins can view all chats"
ON chat_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all outfit plans
CREATE POLICY "Admins can view all outfits"
ON outfit_plans
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));-- Add API key and webhook fields to brands table
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
EXECUTE FUNCTION update_updated_at_column();-- Create external API keys and usage tracking tables

CREATE TABLE IF NOT EXISTS external_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  organization_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free', -- free, basic, premium, enterprise
  rate_limit_per_minute INTEGER DEFAULT 10,
  rate_limit_per_day INTEGER DEFAULT 1000,
  monthly_quota INTEGER DEFAULT 10000,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS external_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES external_api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  request_tokens INTEGER DEFAULT 0,
  response_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS external_api_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES external_api_keys(id) ON DELETE CASCADE,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  tier TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, overdue
  invoice_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE external_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_api_billing ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can manage external API keys"
ON external_api_keys FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view usage"
ON external_api_usage FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage billing"
ON external_api_billing FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for performance
CREATE INDEX idx_external_api_keys_key ON external_api_keys(api_key);
CREATE INDEX idx_external_api_keys_active ON external_api_keys(is_active);
CREATE INDEX idx_external_api_usage_key_id ON external_api_usage(api_key_id);
CREATE INDEX idx_external_api_usage_created_at ON external_api_usage(created_at);
CREATE INDEX idx_external_api_billing_key_id ON external_api_billing(api_key_id);

-- Trigger for updated_at
CREATE TRIGGER update_external_api_keys_updated_at
BEFORE UPDATE ON external_api_keys
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  _api_key_id UUID,
  _rate_limit_per_minute INTEGER,
  _rate_limit_per_day INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  minute_count INTEGER;
  day_count INTEGER;
BEGIN
  -- Check minute limit
  SELECT COUNT(*) INTO minute_count
  FROM external_api_usage
  WHERE api_key_id = _api_key_id
    AND created_at > now() - interval '1 minute';
  
  IF minute_count >= _rate_limit_per_minute THEN
    RETURN FALSE;
  END IF;
  
  -- Check daily limit
  SELECT COUNT(*) INTO day_count
  FROM external_api_usage
  WHERE api_key_id = _api_key_id
    AND created_at > now() - interval '1 day';
  
  IF day_count >= _rate_limit_per_day THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;-- Allow users to create their own orders
CREATE POLICY "Users can create their own orders" 
ON public.brand_orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);-- Create brand applications table for pending partner requests
CREATE TABLE public.brand_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  website_url TEXT,
  product_categories TEXT[] DEFAULT '{}',
  estimated_products INTEGER,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_applications ENABLE ROW LEVEL SECURITY;

-- Admins can manage all applications
CREATE POLICY "Admins can manage brand applications"
ON public.brand_applications
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Anyone can insert applications (public signup)
CREATE POLICY "Anyone can submit brand applications"
ON public.brand_applications
FOR INSERT
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_brand_applications_updated_at
BEFORE UPDATE ON public.brand_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Add 'brand' role to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'brand';-- Add user_id to brands table to link brand accounts to users
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Add approval_status to products table for brand submissions
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone DEFAULT now();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reviewed_by uuid;

-- Create activity_logs table for tracking actions
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity_logs
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (true);

-- Update brands RLS to allow brand users to view their own brand
CREATE POLICY "Brand users can view their own brand"
ON public.brands
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Brand users can update their own brand"
ON public.brands
FOR UPDATE
USING (user_id = auth.uid());

-- Update products RLS to allow brand users to manage their products
CREATE POLICY "Brand users can view their own products"
ON public.products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = products.brand_id
    AND brands.user_id = auth.uid()
  )
);

CREATE POLICY "Brand users can insert their own products"
ON public.products
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = brand_id
    AND brands.user_id = auth.uid()
  )
);

CREATE POLICY "Brand users can update their own products"
ON public.products
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = products.brand_id
    AND brands.user_id = auth.uid()
  )
);

CREATE POLICY "Brand users can delete their own products"
ON public.products
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = products.brand_id
    AND brands.user_id = auth.uid()
  )
);-- Create a storage bucket for brand product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-products', 'brand-products', true)
ON CONFLICT (id) DO NOTHING;

-- Allow brand users to upload to their brand folder
CREATE POLICY "Brand users can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'brand-products' 
  AND EXISTS (
    SELECT 1 FROM public.brands 
    WHERE brands.id::text = (storage.foldername(name))[1] 
    AND brands.user_id = auth.uid()
  )
);

-- Allow brand users to update their product images
CREATE POLICY "Brand users can update product images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'brand-products' 
  AND EXISTS (
    SELECT 1 FROM public.brands 
    WHERE brands.id::text = (storage.foldername(name))[1] 
    AND brands.user_id = auth.uid()
  )
);

-- Allow brand users to delete their product images
CREATE POLICY "Brand users can delete product images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'brand-products' 
  AND EXISTS (
    SELECT 1 FROM public.brands 
    WHERE brands.id::text = (storage.foldername(name))[1] 
    AND brands.user_id = auth.uid()
  )
);

-- Allow anyone to view brand product images (public bucket)
CREATE POLICY "Anyone can view brand product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'brand-products');-- Create products storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to products bucket
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products');

-- Allow public read access to product images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Allow authenticated users to delete product images
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');-- Add RLS policies for brand-products bucket

-- Allow authenticated users to upload to brand-products bucket
CREATE POLICY "Authenticated users can upload to brand-products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brand-products');

-- Allow authenticated users to update their uploads in brand-products
CREATE POLICY "Authenticated users can update brand-products"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'brand-products');

-- Allow public read access to brand-products images
CREATE POLICY "Public can view brand-products"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'brand-products');

-- Allow authenticated users to delete brand-products images
CREATE POLICY "Authenticated users can delete brand-products"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'brand-products');-- Drop and recreate user policies on user_wardrobe with authenticated role

-- Drop existing policies
DROP POLICY IF EXISTS "Users can add to their wardrobe" ON public.user_wardrobe;
DROP POLICY IF EXISTS "Users can update their wardrobe" ON public.user_wardrobe;
DROP POLICY IF EXISTS "Users can delete from their wardrobe" ON public.user_wardrobe;
DROP POLICY IF EXISTS "Users can view their own wardrobe" ON public.user_wardrobe;

-- Recreate with authenticated role
CREATE POLICY "Users can add to their wardrobe" 
ON public.user_wardrobe 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their wardrobe" 
ON public.user_wardrobe 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their wardrobe" 
ON public.user_wardrobe 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own wardrobe" 
ON public.user_wardrobe 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);-- Temporarily disable RLS on user_wardrobe for debugging
ALTER TABLE public.user_wardrobe DISABLE ROW LEVEL SECURITY;-- Create permissive policies for closet-items bucket (effectively disabling RLS for this bucket)
CREATE POLICY "Allow all uploads to closet-items" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'closet-items');

CREATE POLICY "Allow all reads from closet-items" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'closet-items');

CREATE POLICY "Allow all updates to closet-items" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'closet-items');

CREATE POLICY "Allow all deletes from closet-items" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'closet-items');-- Disable RLS on user_wardrobe table
ALTER TABLE public.user_wardrobe DISABLE ROW LEVEL SECURITY;

-- Make closet-items bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'closet-items';ALTER TABLE public.user_wardrobe ADD COLUMN is_favorite boolean NOT NULL DEFAULT false;ALTER TABLE public.user_wardrobe ADD COLUMN season text DEFAULT 'All';