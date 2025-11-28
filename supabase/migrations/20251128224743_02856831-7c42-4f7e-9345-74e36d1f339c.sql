-- Create cart table for guest and authenticated users
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table for AI stylist
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user wardrobe (purchased items)
CREATE TABLE public.user_wardrobe (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Create outfit plans table
CREATE TABLE public.outfit_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  day_of_week TEXT CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  items JSONB NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wardrobe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_plans ENABLE ROW LEVEL SECURITY;

-- Cart policies (allow both authenticated and guest via session_id)
CREATE POLICY "Users can view their own cart items"
ON public.cart_items FOR SELECT
USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can insert their own cart items"
ON public.cart_items FOR INSERT
WITH CHECK (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can update their own cart items"
ON public.cart_items FOR UPDATE
USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can delete their own cart items"
ON public.cart_items FOR DELETE
USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- Chat policies
CREATE POLICY "Users can view their own chat messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can insert their own chat messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id OR session_id IS NOT NULL);

-- User wardrobe policies
CREATE POLICY "Users can view their own wardrobe"
ON public.user_wardrobe FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their wardrobe"
ON public.user_wardrobe FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their wardrobe"
ON public.user_wardrobe FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their wardrobe"
ON public.user_wardrobe FOR DELETE
USING (auth.uid() = user_id);

-- Outfit plans policies
CREATE POLICY "Users can view their own outfit plans"
ON public.outfit_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create outfit plans"
ON public.outfit_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their outfit plans"
ON public.outfit_plans FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their outfit plans"
ON public.outfit_plans FOR DELETE
USING (auth.uid() = user_id);

-- Update triggers
CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_outfit_plans_updated_at
BEFORE UPDATE ON public.outfit_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();