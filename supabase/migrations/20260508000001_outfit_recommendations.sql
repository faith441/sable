-- Add session_id support to outfit_plans for guest users
-- This allows sharing outfit recommendations with external try-on service

-- Add session_id column to outfit_plans
ALTER TABLE public.outfit_plans
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS style TEXT,
ADD COLUMN IF NOT EXISTS weather JSONB,
ADD COLUMN IF NOT EXISTS is_recommendation BOOLEAN DEFAULT false;

-- Update RLS policies to support session_id (like cart_items)
DROP POLICY IF EXISTS "Users can view their own outfit plans" ON public.outfit_plans;
CREATE POLICY "Users can view their own outfit plans"
ON public.outfit_plans FOR SELECT
USING (auth.uid() = user_id OR session_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can create outfit plans" ON public.outfit_plans;
CREATE POLICY "Users can create outfit plans"
ON public.outfit_plans FOR INSERT
WITH CHECK (auth.uid() = user_id OR session_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their outfit plans" ON public.outfit_plans;
CREATE POLICY "Users can update their outfit plans"
ON public.outfit_plans FOR UPDATE
USING (auth.uid() = user_id OR session_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their outfit plans" ON public.outfit_plans;
CREATE POLICY "Users can delete their outfit plans"
ON public.outfit_plans FOR DELETE
USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- Create index for faster session_id lookups
CREATE INDEX IF NOT EXISTS outfit_plans_session_id_idx ON public.outfit_plans(session_id);
CREATE INDEX IF NOT EXISTS outfit_plans_user_id_idx ON public.outfit_plans(user_id);
CREATE INDEX IF NOT EXISTS outfit_plans_is_recommendation_idx ON public.outfit_plans(is_recommendation);

-- Add comment
COMMENT ON COLUMN public.outfit_plans.session_id IS 'Session ID for guest users to share data with external services';
COMMENT ON COLUMN public.outfit_plans.is_recommendation IS 'True if this outfit was AI-generated recommendation';
COMMENT ON COLUMN public.outfit_plans.style IS 'Style category (casual, formal, sporty, etc)';
COMMENT ON COLUMN public.outfit_plans.weather IS 'Weather data when recommendation was made (temp, high, low)';
