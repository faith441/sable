-- Add user_id to brands table to link brand accounts to users
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
);