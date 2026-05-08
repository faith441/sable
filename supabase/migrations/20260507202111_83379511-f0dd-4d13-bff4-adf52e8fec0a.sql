-- Create virtual_tryon_cache table for caching Replicate API results
CREATE TABLE IF NOT EXISTS virtual_tryon_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  cache_key TEXT NOT NULL,
  result_image TEXT NOT NULL,
  source TEXT NOT NULL,
  view_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Create unique index on cache_key to prevent duplicates
  CONSTRAINT unique_cache_key UNIQUE (cache_key)
);

-- Create index for faster lookups
CREATE INDEX idx_virtual_tryon_cache_key ON virtual_tryon_cache(cache_key);
CREATE INDEX idx_virtual_tryon_cache_user ON virtual_tryon_cache(user_id);
CREATE INDEX idx_virtual_tryon_cache_session ON virtual_tryon_cache(session_id);
CREATE INDEX idx_virtual_tryon_cache_created_at ON virtual_tryon_cache(created_at);

-- Enable Row Level Security
ALTER TABLE virtual_tryon_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can read their own cache entries
CREATE POLICY "Users can read their own cache entries"
  ON virtual_tryon_cache
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR session_id IS NOT NULL
  );

-- Users can insert their own cache entries
CREATE POLICY "Users can insert their own cache entries"
  ON virtual_tryon_cache
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR user_id IS NULL
  );

-- Automatically delete cache entries older than 30 days
-- This will be handled by a cron job or periodic cleanup
COMMENT ON TABLE virtual_tryon_cache IS 'Caches virtual try-on results to avoid duplicate Replicate API calls';
