-- Disable RLS on user_wardrobe table
ALTER TABLE public.user_wardrobe DISABLE ROW LEVEL SECURITY;

-- Make closet-items bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'closet-items';