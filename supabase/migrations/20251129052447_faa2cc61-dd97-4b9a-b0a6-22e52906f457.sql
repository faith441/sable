-- Add product_data column to store full product information for cart items
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS product_data JSONB;