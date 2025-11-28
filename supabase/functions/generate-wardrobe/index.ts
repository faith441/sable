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

    // Generate AI wardrobe recommendations
    const prompt = `You are a professional fashion stylist. Based on the following user preferences, suggest a capsule wardrobe of 8-12 essential pieces.

User Preferences:
- Style: ${preferences.styleType}
- Colors: ${preferences.colorPreferences?.join(", ")}
- Budget: ${preferences.budgetRange}
- Lifestyle: ${preferences.lifestyle}
- Occasions: ${preferences.occasions?.join(", ")}

Return a JSON object with the following structure:
{
  "wardrobe_name": "A creative name for the wardrobe",
  "description": "A brief description",
  "season": "Current season this works for",
  "items": [
    {
      "category": "Category (e.g., Tops, Bottoms, Outerwear, Shoes, Accessories)",
      "item_name": "Specific item name",
      "description": "Why this piece is essential",
      "color": "Suggested color",
      "price_range": "Estimated price in the user's budget"
    }
  ]
}`;

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

    // Create wardrobe if userId provided
    if (userId) {
      const { data: wardrobe, error: wardrobeError } = await supabase
        .from("capsule_wardrobes")
        .insert({
          user_id: userId,
          name: wardrobeData.wardrobe_name,
          description: wardrobeData.description,
          season: wardrobeData.season,
          total_pieces: wardrobeData.items.length,
        })
        .select()
        .single();

      if (wardrobeError) {
        console.error("Wardrobe error:", wardrobeError);
      }
    }

    // For now, we'll create mock products
    const mockProducts = wardrobeData.items.map((item: any, index: number) => ({
      id: crypto.randomUUID(),
      name: item.item_name,
      category: item.category,
      price: parseFloat(item.price_range.replace(/[^0-9.]/g, "")) || 50,
      description: item.description,
      image_url: null,
      product_url: "#",
      brand: { name: "Sample Brand" },
    }));

    return new Response(
      JSON.stringify({ 
        products: mockProducts,
        message: "Wardrobe generated successfully",
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