import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  category: string;
  gender: 'men' | 'women' | 'unisex' | null;
  image_url: string;
  affiliate_link: string;
  retailer: string;
  brand: string | null;
  sizes: string[] | null;
  colors: string[] | null;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * React hook to fetch and use products from Supabase database
 */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('affiliate_products')
        .select('*')
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        throw fetchError;
      }

      console.log('Loaded products:', data?.length || 0);
      setProducts(data || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const getByGender = (gender: 'men' | 'women' | 'unisex'): Product[] => {
    return products.filter(p => p.gender === gender || p.gender === 'unisex');
  };

  const getByCategory = (category: string): Product[] => {
    return products.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
  };

  const getByRetailer = (retailer: string): Product[] => {
    return products.filter(p => p.retailer.toLowerCase() === retailer.toLowerCase());
  };

  return {
    products,
    loading,
    error,
    getByGender,
    getByCategory,
    getByRetailer,
    reload: loadProducts
  };
}
