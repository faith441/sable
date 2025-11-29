-- Add admin policies for full user data access

-- Allow admins to view all user wardrobes and photos
CREATE POLICY "Admins can view all wardrobes"
ON user_wardrobe
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage all wardrobes
CREATE POLICY "Admins can manage all wardrobes"
ON user_wardrobe
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to read all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all cart items
CREATE POLICY "Admins can view all carts"
ON cart_items
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all chat messages
CREATE POLICY "Admins can view all chats"
ON chat_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all outfit plans
CREATE POLICY "Admins can view all outfits"
ON outfit_plans
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));