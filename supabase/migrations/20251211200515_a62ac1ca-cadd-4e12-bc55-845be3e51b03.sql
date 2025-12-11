-- Add RLS policies for brand-products bucket

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
USING (bucket_id = 'brand-products');