import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, preferences: guestPreferences } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    let preferences = guestPreferences;

    // If userId provided, try to get from database
    if (userId && !preferences) {
      const { data: dbPreferences, error: prefsError } = await supabase
        .from("style_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!prefsError && dbPreferences) {
        preferences = {
          styleType: dbPreferences.style_type,
          colorPreferences: dbPreferences.color_preferences,
          budgetRange: dbPreferences.budget_range,
          lifestyle: dbPreferences.lifestyle,
          occasions: dbPreferences.occasions,
        };
      }
    }

    if (!preferences) {
      throw new Error("No preferences provided");
    }

    // Get available products (mock for now - in production, this would fetch from brand APIs)
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*, brands(*)")
      .eq("is_available", true)
      .limit(50);

    if (productsError) {
      console.error("Error fetching products:", productsError);
    }

    // Parse style types and lifestyles from preferences
    let styleTypes: string[] = [];
    let lifestyles: string[] = [];

    // Handle both array and string formats
    if (Array.isArray(preferences.styleType)) {
      styleTypes = preferences.styleType;
    } else if (typeof preferences.styleType === 'string') {
      // Check if it's a comma-separated list or just a single value
      if (preferences.styleType.includes(',')) {
        styleTypes = preferences.styleType.split(',').map((s: string) => s.trim());
      } else {
        styleTypes = [preferences.styleType.trim()];
      }
    }

    if (Array.isArray(preferences.lifestyle)) {
      lifestyles = preferences.lifestyle;
    } else if (typeof preferences.lifestyle === 'string') {
      // Check if it's a comma-separated list or just a single value
      if (preferences.lifestyle.includes(',')) {
        lifestyles = preferences.lifestyle.split(',').map((s: string) => s.trim());
      } else {
        lifestyles = [preferences.lifestyle.trim()];
      }
    }

    console.log("Style types:", styleTypes);
    console.log("Lifestyles:", lifestyles);

    // Get gender preference for filtering
    const gender = preferences.gender || 'unisex';
    console.log("Gender preference:", gender);

    // Generate 3 comprehensive capsules that work across ALL styles and lifestyles
    const prompt = `Based on these comprehensive style preferences, generate 3 complete CAPSULE WARDROBES that work across ALL the user's selected styles and lifestyles. Each capsule should be versatile and incorporate elements from multiple style types and lifestyle needs.

IMPORTANT: Generate ${gender === 'male' ? 'MENS' : gender === 'female' ? 'WOMENS' : 'UNISEX'} clothing only.

USER'S COMPLETE STYLE PROFILE:
- Gender: ${gender}
- Style Types: ${styleTypes.join(', ')}
- Lifestyles: ${lifestyles.join(', ')}
- Color Preferences: ${Array.isArray(preferences.colorPreferences) ? preferences.colorPreferences.join(', ') : preferences.colorPreferences}
- Budget Range: ${preferences.budgetRange}
- Occasions: ${Array.isArray(preferences.occasions) ? preferences.occasions.join(', ') : preferences.occasions || 'Not specified'}
- Body Type: ${preferences.bodyType || 'Not specified'}
- Fragrance Preferences: ${JSON.stringify({
  types: preferences.fragranceTypes,
  intensity: preferences.fragranceIntensity,
  scents: preferences.scentPreferences
}) || 'Not specified'}
- Hair Care Needs: ${JSON.stringify({
  hairType: preferences.hairType,
  concerns: preferences.hairConcerns,
  preferences: preferences.shampooPreferences
}) || 'Not specified'}

Full Preferences Data:
${JSON.stringify(preferences, null, 2)}

Return a JSON object with this EXACT structure:
{
  "capsules": [
    {
      "name": "Capsule name (e.g., 'Essential Minimalist', 'Weekend Casual')",
      "description": "Brief description of the capsule's vibe and occasion",
      "total_pieces": number,
      "total_price": number,
      "outfit_count": number (how many outfits can be created),
      "products": [
        {
          "name": "Product name",
          "category": "Category (tops/bottoms/outerwear/shoes/accessories/fragrance/shampoo/conditioner)",
          "price": number,
          "colors": ["color1"],
          "image_url": "https://images.unsplash.com/photo-relevant-fashion-item",
          "product_url": "https://example.com/product",
          "brand": {
            "name": "Premium Brand Name"
          }
        }
      ]
    }
  ]
}

CRITICAL RULES - USE ALL USER PREFERENCES:
- Generate EXACTLY 3 capsule collections
- Each capsule should blend multiple style types from: ${styleTypes.join(', ')}
- Each capsule should work across multiple lifestyles from: ${lifestyles.join(', ')}
- Name capsules descriptively based on their primary focus (e.g., "Professional Essentials", "Weekend Versatile", "Evening Elevated")
- Each capsule should have 10-15 pieces that work together (clothing + 1 fragrance + 1 shampoo + 1 conditioner)
- STRICTLY match user's COLOR PREFERENCES: ${Array.isArray(preferences.colorPreferences) ? preferences.colorPreferences.join(', ') : preferences.colorPreferences}
- ALL pieces must use ONLY colors from user's preferred palette
- Consider user's OCCASIONS when selecting pieces: ${Array.isArray(preferences.occasions) ? preferences.occasions.join(', ') : preferences.occasions || 'versatile'}
- ALL pieces in a capsule must coordinate (colors, style, formality) and be versatile across multiple occasions
- Calculate outfit_count realistically (e.g., 3 tops × 2 bottoms = 6 outfits minimum)
- Match capsules STRICTLY to user's BUDGET RANGE: ${preferences.budgetRange}
- GENERATE ${gender === 'male' ? 'MENS' : gender === 'female' ? 'WOMENS' : 'UNISEX'} CLOTHING ONLY - absolutely critical
- Consider body type ${preferences.bodyType || 'standard'} when selecting fits and silhouettes
- FRAGRANCE: Select based on user's fragrance type preferences (${preferences.fragranceTypes || 'any'}), intensity (${preferences.fragranceIntensity || 'moderate'}), and scent preferences (${preferences.scentPreferences || 'versatile'})
- HAIR CARE: Select shampoo and conditioner based on hair type (${preferences.hairType || 'normal'}), hair concerns (${preferences.hairConcerns || 'general care'}), and product preferences (${preferences.shampooPreferences || 'standard'})
- Use real Unsplash URLs for image_url (fashion items, perfume bottles, hair care products)
- Each capsule should be versatile enough to work across multiple user lifestyles and occasions
- Items should feel premium and intentional within the specified budget range`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a professional fashion stylist. Always respond with valid JSON only, no markdown or extra text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error("Failed to generate wardrobe recommendations");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices[0].message.content;
    
    // Strip markdown code blocks if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    console.log("AI Response content:", content);
    
    let wardrobeData;
    try {
      wardrobeData = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse wardrobe data");
    }

    // Add unique IDs to all products in all capsules
    if (wardrobeData.capsules) {
      wardrobeData.capsules = wardrobeData.capsules.map((capsule: any) => ({
        ...capsule,
        products: capsule.products.map((product: any) => ({
          ...product,
          id: crypto.randomUUID(),
        })),
      }));
    }

    // Create wardrobe if userId provided
    if (userId && wardrobeData.capsules) {
      // Save each capsule to the database
      for (const capsule of wardrobeData.capsules) {
        const { error: wardrobeError } = await supabase
          .from("capsule_wardrobes")
          .insert({
            user_id: userId,
            name: capsule.name,
            description: capsule.description,
            total_pieces: capsule.total_pieces,
          });

        if (wardrobeError) {
          console.error("Wardrobe error:", wardrobeError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        capsules: wardrobeData.capsules,
        message: "Capsule wardrobes generated successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});