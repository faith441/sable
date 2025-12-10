-- Allow users to create their own orders
CREATE POLICY "Users can create their own orders" 
ON public.brand_orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);