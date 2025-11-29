import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, sessionId, userPreferences } = await req.json();
    
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user's cart and wardrobe history
    let userContext = "";
    
    if (userId) {
      // Get user's cart items
      const { data: cartItems } = await supabase
        .from("cart_items")
        .select(`
          quantity,
          products (
            name,
            category,
            price,
            colors,
            brands (name)
          )
        `)
        .eq("user_id", userId);

      // Get user's wardrobe items
      const { data: wardrobeItems } = await supabase
        .from("user_wardrobe")
        .select(`
          products (
            name,
            category,
            price,
            colors,
            brands (name)
          )
        `)
        .eq("user_id", userId);

      if (cartItems && cartItems.length > 0) {
        userContext += `\n\nUser's Current Cart:\n${cartItems.map(item => 
          `- ${item.products.name} by ${item.products.brands.name} (${item.products.category}, ${item.products.colors.join(', ')}, $${item.products.price})`
        ).join('\n')}`;
      }

      if (wardrobeItems && wardrobeItems.length > 0) {
        userContext += `\n\nUser's Past Purchases:\n${wardrobeItems.map(item => 
          `- ${item.products.name} by ${item.products.brands.name} (${item.products.category}, ${item.products.colors.join(', ')})`
        ).join('\n')}`;
      }
    }

    // Build comprehensive system prompt with user preferences
    const systemPrompt = `You are an expert personal fashion stylist and luxury shopping consultant for StyleCapsule, a premium fashion platform.

${userPreferences ? `USER PROFILE:
Gender: ${userPreferences.gender?.join(', ') || 'Not specified'}
Style Types: ${userPreferences.styleTypes?.join(', ') || 'Not specified'}
Preferred Colors: ${userPreferences.colors?.join(', ') || 'Not specified'}
Budget Range: ${userPreferences.budget || 'Not specified'}
Lifestyle: ${userPreferences.lifestyle?.join(', ') || 'Not specified'}
Occasions: ${userPreferences.occasions?.join(', ') || 'Not specified'}
Body Type: ${userPreferences.bodyType || 'Not specified'}
${userPreferences.measurements ? `Measurements: Torso ${userPreferences.measurements.torsoLength}, Legs ${userPreferences.measurements.legLength}, Hair ${userPreferences.measurements.hairColor}, Eyes ${userPreferences.measurements.eyeColor}` : ''}
${userContext}` : ''}

Your capabilities:
1. Provide personalized styling advice based on the user's profile
2. Search for current fashion trends relevant to their style
3. Recommend products from our inventory that match their preferences
4. Help build cohesive capsule wardrobes
5. Suggest outfit combinations from their existing wardrobe

Guidelines:
- Always consider their stated preferences, lifestyle, and budget
- Reference their past purchases when making new recommendations
- Keep responses conversational, helpful, and under 200 words
- When recommending products, consider what they already own to build cohesive looks
- Stay current with fashion trends but filter through their personal style
- Be enthusiastic but authentic - you're building a long-term styling relationship`;

    // Define tools for the AI
    const tools = [
      {
        type: "function",
        function: {
          name: "search_fashion_trends",
          description: "Search the web for current fashion trends, styling tips, or specific fashion information relevant to the user's query",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The fashion trend or styling topic to search for"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_products",
          description: "Search the StyleCapsule product inventory for items matching specific criteria",
          parameters: {
            type: "object",
            properties: {
              category: {
                type: "string",
                description: "Product category (e.g., tops, bottoms, dresses, shoes, accessories)"
              },
              colors: {
                type: "array",
                items: { type: "string" },
                description: "Preferred colors"
              },
              maxPrice: {
                type: "number",
                description: "Maximum price in dollars"
              },
              style: {
                type: "string",
                description: "Style keywords (e.g., classic, casual, formal)"
              }
            },
            required: []
          }
        }
      }
    ];

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
            content: systemPrompt,
          },
          {
            role: "user",
            content: message,
          },
        ],
        tools,
        tool_choice: "auto"
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error("Failed to get AI response");
    }

    const aiData = await aiResponse.json();
    const responseMessage = aiData.choices[0].message;

    // Handle tool calls if any
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);

      let toolResult = "";

      if (toolName === "search_fashion_trends") {
        // Search web for fashion trends
        const searchQuery = toolArgs.query + " fashion trends 2025";
        // For now, return a placeholder - in production, integrate with a web search API
        toolResult = `Current trends for "${toolArgs.query}": Trends show a focus on sustainable materials, versatile pieces, and personal expression. Consider incorporating these elements into recommendations.`;
      } else if (toolName === "find_products") {
        // Search products in database
        let query = supabase
          .from("products")
          .select(`
            id,
            name,
            category,
            price,
            colors,
            image_url,
            brands (name)
          `)
          .eq("is_available", true)
          .limit(5);

        if (toolArgs.category) {
          query = query.ilike("category", `%${toolArgs.category}%`);
        }
        if (toolArgs.maxPrice) {
          query = query.lte("price", toolArgs.maxPrice);
        }

        const { data: products } = await query;

        if (products && products.length > 0) {
          toolResult = `Found ${products.length} products:\n${products.map(p => 
            `- ${p.name} by ${p.brands.name} (${p.category}, ${p.colors.join(', ')}, $${p.price})`
          ).join('\n')}`;
        } else {
          toolResult = "No products found matching those criteria. Consider broadening the search.";
        }
      }

      // Make second API call with tool results
      const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: systemPrompt,
            },
            {
              role: "user",
              content: message,
            },
            responseMessage,
            {
              role: "tool",
              tool_call_id: toolCall.id,
              content: toolResult
            }
          ],
        }),
      });

      const followUpData = await followUpResponse.json();
      const reply = followUpData.choices[0].message.content;

      return new Response(
        JSON.stringify({ reply }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const reply = responseMessage.content;

    return new Response(
      JSON.stringify({ reply }),
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