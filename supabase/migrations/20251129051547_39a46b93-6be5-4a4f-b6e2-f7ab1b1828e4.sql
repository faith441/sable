-- Remove strict FK so AI-generated wardrobe products can be added to cart
ALTER TABLE public.cart_items
  DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;