-- Create permissive policies for closet-items bucket (effectively disabling RLS for this bucket)
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
USING (bucket_id = 'closet-items');