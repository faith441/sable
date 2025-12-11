import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userImage, garmentImages, viewType, userGender, customPrompt } = await req.json();
    
    console.log("Virtual try-on request received:", { 
      hasUserImage: !!userImage, 
      garmentCount: garmentImages?.length || 0,
      viewType,
      userGender,
      hasCustomPrompt: !!customPrompt
    });

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // Build prompt based on whether user has uploaded their own image
    const genderTerm = userGender === "Women's" ? "woman" : "man";
    const viewDescription = viewType === "fullBody" 
      ? "full body view from head to toe, standing pose" 
      : "upper body view, from waist up, portrait style";

    const garmentDescriptions = garmentImages?.map((g: any) => 
      `${g.name} (${g.category}) by ${g.brand}`
    ).join(", ") || "stylish clothing items";

    // Get the primary garment image URL for the AI to reference
    const primaryGarmentImage = garmentImages?.[0]?.image_url;

    let prompt: string;
    let messageContent: any;

    if (customPrompt) {
      prompt = customPrompt;
      messageContent = prompt;
    } else if (userImage && primaryGarmentImage) {
      // User has uploaded their own image AND we have the garment image
      // Use both images so AI can see the exact clothing to apply
      prompt = `Virtual try-on task: Take the clothing item from the SECOND image (the product photo) and show it being worn by the person in the FIRST image.

FIRST IMAGE: The customer's photo - keep their face, body shape, skin tone, hair exactly the same.
SECOND IMAGE: The product clothing - this is the EXACT garment that must appear on the person.

Requirements:
- The person must be wearing the EXACT clothing item shown in the product image (same color, pattern, style, details)
- Keep the person's appearance identical - only change their outfit
- Show a ${viewDescription}
- Professional fashion photography lighting
- The clothing should look naturally fitted on this person`;
      
      messageContent = [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: userImage } },
        { type: "image_url", image_url: { url: primaryGarmentImage } }
      ];
    } else if (primaryGarmentImage) {
      // No user image but we have the garment image - generate model wearing THIS EXACT garment
      prompt = `Create a fashion photography image showing a ${genderTerm} model wearing the EXACT clothing item shown in the provided product image.

CRITICAL: The model MUST be wearing the EXACT same garment from the product photo:
- Same color and pattern
- Same style and design details
- Same fabric appearance

Product: ${garmentDescriptions}

Requirements:
- ${viewDescription}
- The model should be an attractive ${genderTerm} with ${userGender === "Women's" ? "elegant features, styled hair" : "well-groomed appearance, clean-cut look"}
- Professional fashion catalog photography style
- Clean studio background (soft gradient or neutral)
- Perfect lighting highlighting the clothing textures
- Confident, elegant pose typical of luxury fashion brands
- The clothing must look premium and well-fitted

The overall aesthetic should feel like a high-end fashion campaign.`;
      
      messageContent = [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: primaryGarmentImage } }
      ];
    } else {
      // Fallback - no garment image available (shouldn't happen normally)
      prompt = `Create a high-quality fashion photography image of a stylish ${genderTerm} model wearing luxury ${garmentDescriptions}. 

${viewDescription}. 

Professional fashion catalog photography, clean background, perfect lighting. The model should have a confident, elegant pose. Make the clothing look premium and well-fitted.`;
      
      messageContent = prompt;
    }

    console.log("Generating image with prompt:", typeof messageContent === 'string' ? messageContent.substring(0, 200) + "..." : `Multi-image request with ${Array.isArray(messageContent) ? messageContent.filter((m: any) => m.type === 'image_url').length : 0} images`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: messageContent
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response structure:", JSON.stringify(aiData, null, 2).substring(0, 1000));
    
    // Try multiple paths to find the image
    let resultImage = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    // Alternative: check if image is in content directly
    if (!resultImage && aiData.choices?.[0]?.message?.content) {
      const content = aiData.choices[0].message.content;
      // Check if content contains base64 image
      if (typeof content === 'string' && content.includes('data:image')) {
        resultImage = content;
      }
    }
    
    // Alternative: check for image_url at message level
    if (!resultImage && aiData.choices?.[0]?.message?.image_url) {
      resultImage = aiData.choices[0].message.image_url.url || aiData.choices[0].message.image_url;
    }

    if (!resultImage) {
      console.error("No image found in AI response. Full response:", JSON.stringify(aiData));
      // Return a placeholder instead of erroring
      return new Response(
        JSON.stringify({ 
          result: null,
          error: "Image generation temporarily unavailable",
          viewType 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        result: resultImage,
        viewType 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Virtual try-on error:", error);
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
