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

    let prompt: string;

    if (customPrompt) {
      prompt = customPrompt;
    } else {
      // Build a detailed prompt for the AI image generation
      const genderTerm = userGender === "Women's" ? "woman" : "man";
      const viewDescription = viewType === "fullBody" 
        ? "full body view from head to toe, standing pose" 
        : "upper body view, from waist up, portrait style";

      const garmentDescriptions = garmentImages?.map((g: any) => 
        `${g.name} (${g.category}) - ${g.brand}`
      ).join(", ") || "stylish clothing items";

      prompt = `Create a high-quality, photorealistic fashion photography image of a stylish ${genderTerm} model wearing these luxury clothing items: ${garmentDescriptions}. 

The image should be a ${viewDescription}. 

Style: Professional fashion catalog photography, clean background (soft gradient or studio setting), perfect lighting that highlights the clothing textures and details. The model should have a confident, elegant pose typical of high-end fashion brands. 

Make the clothing look premium and well-fitted. The overall aesthetic should feel luxury and aspirational, like a Vogue or high-end brand campaign.`;
    }

    console.log("Generating image with prompt:", prompt.substring(0, 200) + "...");

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
            content: prompt
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
