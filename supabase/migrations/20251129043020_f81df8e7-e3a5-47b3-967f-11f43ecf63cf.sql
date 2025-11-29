-- Extend user_wardrobe table to support manually added items
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
CREATE INDEX IF NOT EXISTS idx_user_wardrobe_is_custom ON user_wardrobe(is_custom);