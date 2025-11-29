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
      styleTypes = preferences.styleType.split(',').map((s: string) => s.trim());
    }

    if (Array.isArray(preferences.lifestyle)) {
      lifestyles = preferences.lifestyle;
    } else if (typeof preferences.lifestyle === 'string') {
      lifestyles = preferences.lifestyle.split(',').map((s: string) => s.trim());
    }

    console.log("Style types:", styleTypes);
    console.log("Lifestyles:", lifestyles);

    // Generate capsules for each style type + primary lifestyle combination
    // Limit to reasonable number of capsules (max 10)
    const capsuleCombinations = [];
    
    // Create combinations: each style type gets paired with primary lifestyles
    for (const style of styleTypes.slice(0, 10)) {
      const primaryLifestyle = lifestyles[0] || "Versatile";
      capsuleCombinations.push({
        style,
        lifestyle: primaryLifestyle,
        name: `${style} ${primaryLifestyle}`
      });
    }

    console.log("Generating capsules for:", capsuleCombinations);

    // Generate wardrobes for each combination
    const prompt = `Based on these style preferences, generate ${capsuleCombinations.length} complete CAPSULE WARDROBES. Each capsule should be a cohesive collection that creates multiple outfit combinations. Include clothing, fragrance, and hair care recommendations.

REQUIRED CAPSULES TO GENERATE (one for each):
${capsuleCombinations.map(c => `- ${c.name}: A ${c.style} style capsule for ${c.lifestyle} lifestyle`).join('\n')}
    
User Preferences:
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

CRITICAL RULES:
- Generate EXACTLY ${capsuleCombinations.length} capsule collections (one for each style/lifestyle combination listed above)
- Each capsule MUST match the specific style type and lifestyle assigned to it
- Each capsule name should clearly reflect its style + lifestyle (e.g., "Minimalist Professional", "Vintage Casual", "Chic Executive")
- Each capsule should have 10-15 pieces that work together (clothing + 1 fragrance + 1 shampoo + 1 conditioner)
- ALL pieces in a capsule must coordinate (colors, style, formality) and match the specific style type
- Calculate outfit_count realistically (e.g., 3 tops × 2 bottoms = 6 outfits minimum)
- Match capsules to user's budget range
- ALWAYS include 1 signature fragrance recommendation per capsule based on user's fragrance preferences and the capsule's style
- ALWAYS include 1 shampoo and 1 conditioner recommendation per capsule based on user's hair type and concerns
- Use real Unsplash URLs for image_url (fashion items, perfume bottles, hair care products)
- Each capsule should have a clear purpose/occasion matching its lifestyle
- Items should feel premium and intentional
- Fragrance should complement the capsule's overall aesthetic and occasion
- Hair care should match user's specific hair type, concerns, and product preferences
- DO NOT generate generic capsules - each must be distinctly ${capsuleCombinations.map(c => c.style).join(', ')}`;

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