import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/utils/outfitStorage';

interface OutfitItem {
  name: string;
  category: string;
  image_url?: string;
}

interface Outfit {
  id?: string;
  name: string;
  style: string;
  items: OutfitItem[];
  weather?: {
    temp: number;
    high: number;
    low: number;
  };
};

export const useOutfitRecommendations = () => {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load recommendations from Supabase
  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = getSessionId();

      let query = supabase
        .from('outfit_plans')
        .select('*')
        .eq('is_recommendation', true);

      // Filter by user_id or session_id depending on auth status
      if (user?.id) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', sessionId);
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedOutfits: Outfit[] = (data || []).map(plan => ({
        id: plan.id,
        name: plan.name,
        style: plan.style || 'casual',
        items: plan.items as OutfitItem[],
        weather: plan.weather as any
      }));

      setOutfits(formattedOutfits);

      // Also keep in localStorage as fallback
      localStorage.setItem('outfit_recommendations', JSON.stringify(formattedOutfits));

    } catch (err: any) {
      console.error('Error loading recommendations:', err);
      setError(err.message);

      // Fallback to localStorage
      const savedOutfits = localStorage.getItem('outfit_recommendations');
      if (savedOutfits) {
        try {
          setOutfits(JSON.parse(savedOutfits));
        } catch (e) {
          console.error('Error parsing localStorage:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Save recommendations to Supabase
  const saveRecommendations = async (newOutfits: Outfit[]) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = getSessionId();

      // First, delete existing recommendations for this user/session
      if (user?.id) {
        await supabase
          .from('outfit_plans')
          .delete()
          .eq('user_id', user.id)
          .eq('is_recommendation', true);
      } else {
        await supabase
          .from('outfit_plans')
          .delete()
          .eq('session_id', sessionId)
          .eq('is_recommendation', true);
      }

      // Insert new recommendations
      const outfitsToInsert = newOutfits.map(outfit => ({
        user_id: user?.id || null,
        session_id: sessionId,
        name: outfit.name,
        style: outfit.style,
        items: outfit.items,
        weather: outfit.weather || null,
        is_recommendation: true
      }));

      const { data, error: insertError } = await supabase
        .from('outfit_plans')
        .insert(outfitsToInsert)
        .select();

      if (insertError) throw insertError;

      // Update local state with IDs from database
      const formattedOutfits: Outfit[] = (data || []).map(plan => ({
        id: plan.id,
        name: plan.name,
        style: plan.style || 'casual',
        items: plan.items as OutfitItem[],
        weather: plan.weather as any
      }));

      setOutfits(formattedOutfits);

      // Also save to localStorage as backup
      localStorage.setItem('outfit_recommendations', JSON.stringify(formattedOutfits));

      return formattedOutfits;
    } catch (err: any) {
      console.error('Error saving recommendations:', err);
      setError(err.message);

      // Fallback to localStorage only
      localStorage.setItem('outfit_recommendations', JSON.stringify(newOutfits));
      setOutfits(newOutfits);

      return newOutfits;
    } finally {
      setLoading(false);
    }
  };

  // Get session ID for passing to external services
  const getShareableSessionId = () => {
    return getSessionId();
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  return {
    outfits,
    loading,
    error,
    saveRecommendations,
    loadRecommendations,
    getSessionId: getShareableSessionId
  };
};
