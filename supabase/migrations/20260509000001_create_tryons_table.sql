-- Create virtual try-ons table
CREATE TABLE IF NOT EXISTS public.virtual_tryons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    product_id TEXT,
    product_name TEXT NOT NULL,
    product_image_url TEXT NOT NULL,
    product_category TEXT,
    tryon_image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Either user_id or session_id must be present
    CONSTRAINT user_or_session_check CHECK (
        (user_id IS NOT NULL AND session_id IS NULL) OR
        (user_id IS NULL AND session_id IS NOT NULL)
    )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS virtual_tryons_user_id_idx ON public.virtual_tryons(user_id);
CREATE INDEX IF NOT EXISTS virtual_tryons_session_id_idx ON public.virtual_tryons(session_id);
CREATE INDEX IF NOT EXISTS virtual_tryons_created_at_idx ON public.virtual_tryons(created_at DESC);

-- Enable RLS
ALTER TABLE public.virtual_tryons ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own try-ons
CREATE POLICY "Users can view own tryons"
    ON public.virtual_tryons
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        session_id IS NOT NULL
    );

-- Policy: Users can insert their own try-ons
CREATE POLICY "Users can insert own tryons"
    ON public.virtual_tryons
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR
        (auth.uid() IS NULL AND session_id IS NOT NULL)
    );

-- Policy: Users can delete their own try-ons
CREATE POLICY "Users can delete own tryons"
    ON public.virtual_tryons
    FOR DELETE
    USING (
        auth.uid() = user_id OR
        session_id IS NOT NULL
    );
