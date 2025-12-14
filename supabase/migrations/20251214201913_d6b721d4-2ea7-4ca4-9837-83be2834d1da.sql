-- Drop and recreate user policies on user_wardrobe with authenticated role

-- Drop existing policies
DROP POLICY IF EXISTS "Users can add to their wardrobe" ON public.user_wardrobe;
DROP POLICY IF EXISTS "Users can update their wardrobe" ON public.user_wardrobe;
DROP POLICY IF EXISTS "Users can delete from their wardrobe" ON public.user_wardrobe;
DROP POLICY IF EXISTS "Users can view their own wardrobe" ON public.user_wardrobe;

-- Recreate with authenticated role
CREATE POLICY "Users can add to their wardrobe" 
ON public.user_wardrobe 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their wardrobe" 
ON public.user_wardrobe 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their wardrobe" 
ON public.user_wardrobe 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own wardrobe" 
ON public.user_wardrobe 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);