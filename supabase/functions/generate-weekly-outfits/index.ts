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
    const { userId } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's wardrobe
    const { data: wardrobe } = await supabase
      .from("user_wardrobe")
      .select(`
        products (
          id,
          name,
          category,
          colors
        )
      `)
      .eq("user_id", userId);

    if (!wardrobe || wardrobe.length === 0) {
      throw new Error("No items in wardrobe");
    }

    const items = wardrobe.map(w => w.products);

    // Generate outfits using AI
    const prompt = `Create 7 outfit combinations (one for each day of the week) using these wardrobe items:
${JSON.stringify(items, null, 2)}

Return a JSON array of 7 outfit objects with:
{
  "day": "Monday/Tuesday/etc",
  "name": "Creative outfit name",
  "items": [list of item IDs used],
  "description": "Brief styling note"
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
    const outfits = JSON.parse(aiData.choices[0].message.content);

    // Save outfits to database
    const outfitPlans = outfits.map((outfit: any) => ({
      user_id: userId,
      name: outfit.name,
      day_of_week: outfit.day,
      items: outfit.items,
    }));

    // Delete existing plans
    await supabase
      .from("outfit_plans")
      .delete()
      .eq("user_id", userId);

    // Insert new plans
    const { error } = await supabase
      .from("outfit_plans")
      .insert(outfitPlans);

    if (error) throw error;

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