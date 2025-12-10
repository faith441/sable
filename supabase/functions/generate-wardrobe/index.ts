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

    // Fetch ALL available products from brand partners
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*, brands(name, logo_url)")
      .eq("is_available", true);

    if (productsError) {
      console.error("Error fetching products:", productsError);
    }

    // Check if we have real products in the database
    const hasRealProducts = products && products.length >= 15;
    console.log(`Found ${products?.length || 0} products in database. Using ${hasRealProducts ? 'real products' : 'sample fallback'}.`);

    // If no real products, return error indicating empty inventory
    if (!hasRealProducts) {
      return new Response(
        JSON.stringify({ 
          error: "no_inventory",
          message: "No products available from brand partners yet. Please check back later or use sample wardrobes.",
          capsules: []
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse style types and lifestyles from preferences
    let styleTypes: string[] = [];
    let lifestyles: string[] = [];

    if (Array.isArray(preferences.styleType)) {
      styleTypes = preferences.styleType;
    } else if (typeof preferences.styleType === 'string') {
      if (preferences.styleType.includes(',')) {
        styleTypes = preferences.styleType.split(',').map((s: string) => s.trim());
      } else {
        styleTypes = [preferences.styleType.trim()];
      }
    }

    if (Array.isArray(preferences.lifestyle)) {
      lifestyles = preferences.lifestyle;
    } else if (typeof preferences.lifestyle === 'string') {
      if (preferences.lifestyle.includes(',')) {
        lifestyles = preferences.lifestyle.split(',').map((s: string) => s.trim());
      } else {
        lifestyles = [preferences.lifestyle.trim()];
      }
    }

    console.log("Style types:", styleTypes);
    console.log("Lifestyles:", lifestyles);

    const gender = preferences.gender || 'unisex';
    console.log("Gender preference:", gender);

    // Format products for AI to select from
    const productCatalog = products.map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      colors: p.colors,
      tags: p.tags,
      image_url: p.image_url,
      product_url: p.product_url,
      brand: p.brands?.name || 'Unknown Brand',
    }));

    // Use AI to select and organize REAL products into capsules
    const prompt = `You are a professional fashion stylist. Given the following REAL product catalog from brand partners, create 3 capsule wardrobes by SELECTING products from this catalog.

AVAILABLE PRODUCTS (select from these ONLY):
${JSON.stringify(productCatalog, null, 2)}

USER PREFERENCES:
- Gender: ${gender}
- Style Types: ${styleTypes.join(', ')}
- Lifestyles: ${lifestyles.join(', ')}
- Color Preferences: ${Array.isArray(preferences.colorPreferences) ? preferences.colorPreferences.join(', ') : preferences.colorPreferences}
- Budget Range: ${preferences.budgetRange}
- Occasions: ${Array.isArray(preferences.occasions) ? preferences.occasions.join(', ') : preferences.occasions || 'versatile'}
- Body Type: ${preferences.bodyType || 'Not specified'}

CRITICAL INSTRUCTIONS:
1. ONLY use products from the catalog above - use their exact id, name, price, image_url, product_url
2. Create 3 distinct capsule wardrobes
3. Each capsule should have 8-12 pieces that work together
4. Match products to user's color preferences and budget
5. Select products that fit the user's style types and lifestyles
6. Ensure pieces coordinate within each capsule

Return a JSON object with this EXACT structure (use real product data from catalog):
{
  "capsules": [
    {
      "name": "Capsule name",
      "description": "Brief description",
      "total_pieces": number,
      "total_price": number (sum of selected product prices),
      "outfit_count": number,
      "products": [
        {
          "id": "exact product id from catalog",
          "name": "exact product name from catalog",
          "category": "exact category from catalog",
          "price": exact price from catalog,
          "colors": colors array from catalog,
          "image_url": "exact image_url from catalog",
          "product_url": "exact product_url from catalog",
          "brand": {
            "name": "brand name from catalog"
          }
        }
      ]
    }
  ]
}

IMPORTANT: Only output valid JSON. No markdown, no extra text.`;

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
            content: "You are a professional fashion stylist. Select products from the provided catalog to create wardrobes. Always respond with valid JSON only.",
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
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 402 || errorText.includes("payment_required") || errorText.includes("credits")) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
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

    // Validate that selected products exist in our catalog
    if (wardrobeData.capsules) {
      const productIds = new Set(products.map((p: any) => p.id));
      
      wardrobeData.capsules = wardrobeData.capsules.map((capsule: any) => ({
        ...capsule,
        products: capsule.products.filter((product: any) => {
          const exists = productIds.has(product.id);
          if (!exists) {
            console.warn(`Product ${product.id} not found in catalog, removing from capsule`);
          }
          return exists;
        }),
      }));
      
      // Recalculate totals after filtering
      wardrobeData.capsules = wardrobeData.capsules.map((capsule: any) => ({
        ...capsule,
        total_pieces: capsule.products.length,
        total_price: capsule.products.reduce((sum: number, p: any) => sum + (p.price || 0), 0),
      }));
    }

    // Save capsule wardrobes if userId provided
    if (userId && wardrobeData.capsules) {
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
        source: "brand_partners",
        message: "Capsule wardrobes generated from brand partner inventory",
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
