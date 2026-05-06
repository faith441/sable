-- Safe migration that skips existing objects
-- Run this in your Supabase SQL Editor

-- Skip CREATE TYPE app_role - it already exists with admin, user, brand

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
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

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Style preferences table
CREATE TABLE IF NOT EXISTS public.style_preferences (
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

DROP POLICY IF EXISTS "Users can view own preferences" ON public.style_preferences;
CREATE POLICY "Users can view own preferences"
  ON public.style_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.style_preferences;
CREATE POLICY "Users can insert own preferences"
  ON public.style_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.style_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.style_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all preferences" ON public.style_preferences;
CREATE POLICY "Admins can view all preferences"
  ON public.style_preferences FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Brands table
CREATE TABLE IF NOT EXISTS public.brands (
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

-- Add columns if they don't exist
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS api_key TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS payment_provider TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS order_tracking_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

DROP POLICY IF EXISTS "Anyone can view active brands" ON public.brands;
CREATE POLICY "Anyone can view active brands"
  ON public.brands FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage brands" ON public.brands;
CREATE POLICY "Admins can manage brands"
  ON public.brands FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Brand users can view their own brand" ON public.brands;
CREATE POLICY "Brand users can view their own brand"
ON public.brands
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Brand users can update their own brand" ON public.brands;
CREATE POLICY "Brand users can update their own brand"
ON public.brands
FOR UPDATE
USING (user_id = auth.uid());

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
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

-- Add columns if they don't exist
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone DEFAULT now();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reviewed_by uuid;

DROP POLICY IF EXISTS "Anyone can view available products" ON public.products;
CREATE POLICY "Anyone can view available products"
  ON public.products FOR SELECT
  TO authenticated
  USING (is_available = true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Continue with remaining tables...
-- (This is getting long, let me create a script to generate the rest)


-- User wardrobe table
CREATE TABLE IF NOT EXISTS public.user_wardrobe (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Add columns if they don't exist
ALTER TABLE public.user_wardrobe ADD COLUMN IF NOT EXISTS custom_image_url text;
ALTER TABLE public.user_wardrobe ADD COLUMN IF NOT EXISTS custom_description text;
ALTER TABLE public.user_wardrobe ADD COLUMN IF NOT EXISTS custom_size text;
ALTER TABLE public.user_wardrobe ADD COLUMN IF NOT EXISTS custom_brand text;
ALTER TABLE public.user_wardrobe ADD COLUMN IF NOT EXISTS custom_category text;
ALTER TABLE public.user_wardrobe ADD COLUMN IF NOT EXISTS is_custom boolean DEFAULT false;
ALTER TABLE public.user_wardrobe ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;
ALTER TABLE public.user_wardrobe ADD COLUMN IF NOT EXISTS season text DEFAULT 'All';

-- Make product_id nullable for custom items
ALTER TABLE public.user_wardrobe ALTER COLUMN product_id DROP NOT NULL;

-- Disable RLS (as per migrations)
ALTER TABLE public.user_wardrobe DISABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_wardrobe_user_id ON public.user_wardrobe(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wardrobe_is_custom ON public.user_wardrobe(is_custom);

-- Cart items table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS product_data JSONB;

-- Remove FK constraint if it exists
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('closet-items', 'closet-items', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-products', 'brand-products', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Allow all uploads to closet-items" ON storage.objects;
CREATE POLICY "Allow all uploads to closet-items" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'closet-items');

DROP POLICY IF EXISTS "Allow all reads from closet-items" ON storage.objects;
CREATE POLICY "Allow all reads from closet-items" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'closet-items');

-- Update timestamp function
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
$$;

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
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Make first user admin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'user')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN new;
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
END $$;
