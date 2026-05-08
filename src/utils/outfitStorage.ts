import { supabase } from '@/integrations/supabase/client';

interface OutfitItem {
  name: string;
  category: string;
  image_url?: string;
}

interface Outfit {
  name: string;
  style: string;
  items: OutfitItem[];
  weather?: {
    temp: number;
    high: number;
    low: number;
  };
}

// Generate or retrieve session ID for guest users
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('getsable_session_id');
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    localStorage.setItem('getsable_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Save outfit recommendations to both Supabase and localStorage
 * Can be called from anywhere without hooks
 */
export const saveOutfitRecommendations = async (outfits: Outfit[]): Promise<void> => {
  try {
    // Save to localStorage first (immediate fallback)
    localStorage.setItem('outfit_recommendations', JSON.stringify(outfits));

    // Get user and session
    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = getSessionId();

    // Insert new recommendations (keep existing ones)
    const outfitsToInsert = outfits.map(outfit => ({
      user_id: user?.id || null,
      session_id: sessionId,
      name: outfit.name,
      style: outfit.style,
      items: outfit.items,
      weather: outfit.weather || null,
      is_recommendation: true
    }));

    const { error: insertError } = await supabase
      .from('outfit_plans')
      .insert(outfitsToInsert);

    if (insertError) {
      console.error('Error saving to Supabase:', insertError);
      // Don't throw - localStorage save already succeeded
    } else {
      console.log('✅ Outfit recommendations saved to Supabase');
    }
  } catch (error) {
    console.error('Error in saveOutfitRecommendations:', error);
    // localStorage save already succeeded, so this is non-fatal
  }
};
