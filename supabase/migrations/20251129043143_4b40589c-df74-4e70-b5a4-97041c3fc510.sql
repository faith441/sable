-- Create storage bucket for user closet items
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
USING (bucket_id = 'closet-items' AND auth.uid()::text = (storage.foldername(name))[1]);