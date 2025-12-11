-- Create a storage bucket for brand product images
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
USING (bucket_id = 'brand-products');