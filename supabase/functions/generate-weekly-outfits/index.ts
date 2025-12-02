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
    const { userId, weather, dayOnly } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's wardrobe - both purchased products and custom items
    const { data: wardrobe } = await supabase
      .from("user_wardrobe")
      .select("*")
      .eq("user_id", userId);

    if (!wardrobe || wardrobe.length === 0) {
      throw new Error("No items in wardrobe");
    }

    // Fetch product details for non-custom items
    const productIds = wardrobe
      .filter(w => !w.is_custom && w.product_id)
      .map(w => w.product_id);
    
    const { data: products } = productIds.length > 0 
      ? await supabase.from("products").select("*").in("id", productIds)
      : { data: [] };

    // Combine purchased products and custom items
    const items = wardrobe.map(w => {
      if (w.is_custom) {
        return {
          id: w.id,
          name: w.custom_description || "Custom item",
          category: w.custom_category || "Clothing",
          brand: w.custom_brand,
          size: w.custom_size,
          image_url: w.custom_image_url,
          isCustom: true
        };
      } else {
        const product = products?.find(p => p.id === w.product_id);
        return product ? {
          id: product.id,
          name: product.name,
          category: product.category,
          colors: product.colors,
          image_url: product.image_url,
          isCustom: false
        } : null;
      }
    }).filter(Boolean);

    const weatherContext = weather 
      ? `Weather: ${weather.condition}, Temperature: ${weather.temp}°F. Consider appropriate layering and weather protection.`
      : "";

    const daysToGenerate = dayOnly ? [dayOnly] : [
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ];

    // Generate outfits using AI with detailed layering
    const prompt = `Create ${daysToGenerate.length} complete outfit combination(s) for ${dayOnly ? dayOnly : "the week"} using ONLY items from this wardrobe:
${JSON.stringify(items, null, 2)}

${weatherContext}

CRITICAL RULES:
1. ONLY use items that exist in the wardrobe above (match by id)
2. If an outfit needs additional items NOT in the wardrobe (belts, jewelry, bags, etc.), you can suggest them as "recommended_additions" but DO NOT include them as actual outfit items
3. Each outfit MUST be buildable from the existing wardrobe

For each outfit, create a complete look including available layers:
- Base layer (if available)
- Mid layer (shirts, blouses, dresses, pants, skirts from wardrobe)
- Outer layer (jackets, coats from wardrobe if available)
- Footwear (from wardrobe if available)
- Accessories (from wardrobe if available)

Return a JSON array of outfit objects for days: ${daysToGenerate.join(", ")}

Each outfit object should have:
{
  "day": "Monday/Tuesday/etc",
  "name": "Creative outfit name",
  "items": [
    {
      "id": "item_id_from_wardrobe",
      "name": "item name from wardrobe",
      "category": "item category",
      "layer": "base/mid/outer/footwear/accessory"
    }
  ],
  "recommended_additions": [
    {
      "type": "generic item type",
      "description": "e.g., 'Brown leather belt' or 'Gold hoop earrings'",
      "reason": "why this would complete the look"
    }
  ],
  "description": "Brief styling note about the complete look"
}

Make sure outfits are cohesive, weather-appropriate, and ONLY use items that exist in the provided wardrobe.`;

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
            content: "You are a professional stylist. Return only valid JSON, no markdown.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error("Failed to generate outfits");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices[0].message.content;
    
    console.log("AI Response content:", content);
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI returned invalid JSON");
    }
    
    // Ensure we have an array of outfits
    let outfits;
    if (Array.isArray(parsedContent)) {
      outfits = parsedContent;
    } else if (parsedContent.outfits && Array.isArray(parsedContent.outfits)) {
      outfits = parsedContent.outfits;
    } else {
      console.error("Unexpected AI response structure:", parsedContent);
      throw new Error("AI response is not in expected format");
    }

    if (outfits.length === 0) {
      throw new Error("No outfits generated");
    }

    console.log("Generated outfits count:", outfits.length);

    // Save outfits to database
    const outfitPlans = outfits.map((outfit: any) => ({
      user_id: userId,
      name: outfit.name,
      day_of_week: outfit.day,
      items: outfit.recommended_additions ? {
        items: outfit.items,
        recommended_additions: outfit.recommended_additions
      } : outfit.items
    }));

    console.log("Saving outfit plans to database...");

    // Delete existing plans for the days being generated
    if (dayOnly) {
      const { error: deleteError } = await supabase
        .from("outfit_plans")
        .delete()
        .eq("user_id", userId)
        .eq("day_of_week", dayOnly);
      
      if (deleteError) {
        console.error("Delete error:", deleteError);
        throw deleteError;
      }
    } else {
      const { error: deleteError } = await supabase
        .from("outfit_plans")
        .delete()
        .eq("user_id", userId);
      
      if (deleteError) {
        console.error("Delete error:", deleteError);
        throw deleteError;
      }
    }

    console.log("Deleted old plans, inserting new ones...");

    // Insert new plans
    const { data: insertedData, error: insertError } = await supabase
      .from("outfit_plans")
      .insert(outfitPlans)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    console.log("Successfully saved", insertedData?.length, "outfit plans");

    return new Response(
      JSON.stringify({ success: true, outfits: outfitPlans }),
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