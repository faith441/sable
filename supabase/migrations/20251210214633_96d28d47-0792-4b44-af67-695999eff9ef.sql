-- Create brand applications table for pending partner requests
CREATE TABLE public.brand_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  website_url TEXT,
  product_categories TEXT[] DEFAULT '{}',
  estimated_products INTEGER,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_applications ENABLE ROW LEVEL SECURITY;

-- Admins can manage all applications
CREATE POLICY "Admins can manage brand applications"
ON public.brand_applications
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Anyone can insert applications (public signup)
CREATE POLICY "Anyone can submit brand applications"
ON public.brand_applications
FOR INSERT
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_brand_applications_updated_at
BEFORE UPDATE ON public.brand_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();