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
    const { userImage, garmentImage, garmentImages, outfit, viewType, userGender, customPrompt } = await req.json();

    // Support both formats: single garmentImage or array of garmentImages
    const garments = garmentImages || (garmentImage ? [{ image_url: garmentImage }] : []);
    const outfitItems = outfit || garments;

    console.log("Virtual try-on request received:", {
      hasUserImage: !!userImage,
      garmentCount: outfitItems?.length || 0,
      viewType,
      userGender,
      hasCustomPrompt: !!customPrompt
    });

    const googleApiKey = Deno.env.get("GOOGLE_AI_API_KEY")!;
    const replicateToken = Deno.env.get("REPLICATE_API_TOKEN");

    // Build prompt based on whether user has uploaded their own image
    const genderTerm = userGender === "Women's" ? "woman" : "man";
    const viewDescription = viewType === "fullBody"
      ? "full body view from head to toe, standing pose"
      : "upper body view, from waist up, portrait style";

    const garmentDescriptions = outfitItems?.map((g: any) =>
      g.name && g.category ? `${g.name} (${g.category})${g.brand ? ` by ${g.brand}` : ""}` : "clothing item"
    ).join(", ") || "stylish clothing items";

    // Get the primary garment image URL for the AI to reference
    const primaryGarmentImage = outfitItems?.[0]?.image_url;

    let prompt: string;
    let messageContent: any;

    if (customPrompt) {
      prompt = customPrompt;
      messageContent = prompt;
    } else if (userImage && primaryGarmentImage) {
      // User has uploaded their own image AND we have the garment image
      // Use Hugging Face IDM-VTON for identity-preserving virtual try-on
      console.log("Using Hugging Face IDM-VTON for virtual try-on");

      const hfToken = Deno.env.get("HUGGINGFACE_API_TOKEN");

      if (!hfToken) {
        console.warn("No Hugging Face token found, falling back to Gemini");
        // Fallback to Gemini if no HF token
        prompt = `Take the clothing item from the SECOND image (the product photo) and show it being worn by the person in the FIRST image. Keep their face, body shape, skin tone, hair exactly the same. The person must be wearing the EXACT clothing item shown in the product image.`;

        messageContent = [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: userImage } },
          { type: "image_url", image_url: { url: primaryGarmentImage } }
        ];
      } else {
        // Use Hugging Face IDM-VTON
        try {
          console.log("Calling Hugging Face IDM-VTON API");

          // Try Replicate API for better results
          if (replicateToken) {
            console.log("Using Replicate API for virtual try-on");

            try {
              const replicateResponse = await fetch(
                "https://api.replicate.com/v1/predictions",
                {
                  method: "POST",
                  headers: {
                    "Authorization": `Token ${replicateToken}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
                    input: {
                      garm_img: primaryGarmentImage,
                      human_img: userImage,
                      garment_des: "clothing item"
                    }
                  })
                }
              );

              if (replicateResponse.ok) {
                const prediction = await replicateResponse.json();
                console.log("Replicate prediction created:", prediction.id, "status:", prediction.status);

                // Poll for result if not immediately available
                if (prediction.status === "succeeded" && prediction.output) {
                  console.log("Replicate virtual try-on succeeded immediately");
                  return new Response(
                    JSON.stringify({
                      result: prediction.output,
                      viewType,
                      source: "replicate"
                    }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                  );
                } else if (prediction.status === "starting" || prediction.status === "processing") {
                  // Return a message to try again
                  return new Response(
                    JSON.stringify({
                      result: null,
                      error: "Virtual try-on is processing. Please try again in a few seconds.",
                      retry: true,
                      predictionId: prediction.id
                    }),
                    {
                      status: 202,
                      headers: { ...corsHeaders, "Content-Type": "application/json" }
                    }
                  );
                }
              } else {
                const errorText = await replicateResponse.text();
                console.error("Replicate API error:", replicateResponse.status, errorText);
              }
            } catch (replicateError) {
              console.error("Replicate error:", replicateError);
            }
          } else {
            console.warn("No Replicate token found");
          }

          // If Replicate didn't work, try simple HF API
          const hfResponse = await fetch(
            "https://api-inference.huggingface.co/models/yisol/IDM-VTON",
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${hfToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                inputs: userImage,
                parameters: {
                  garment_image: primaryGarmentImage
                }
              })
            }
          );

          if (!hfResponse.ok) {
            const errorText = await hfResponse.text();
            console.error("HF API error:", hfResponse.status, errorText);

            // Check if model is loading
            if (hfResponse.status === 503) {
              const errorJson = JSON.parse(errorText);
              if (errorJson.error?.includes("loading")) {
                return new Response(
                  JSON.stringify({
                    error: "Virtual try-on model is starting up. Please wait a moment and try again.",
                    retry: true
                  }),
                  {
                    status: 503,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                  }
                );
              }
            }

            throw new Error(`HF API error: ${hfResponse.status}`);
          }

          // Get the image blob from response
          const imageBlob = await hfResponse.blob();
          const arrayBuffer = await imageBlob.arrayBuffer();
          const base64Image = btoa(
            String.fromCharCode(...new Uint8Array(arrayBuffer))
          );
          const resultImage = `data:image/jpeg;base64,${base64Image}`;

          console.log("HF virtual try-on succeeded");
          return new Response(
            JSON.stringify({
              result: resultImage,
              viewType
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );

        } catch (hfError) {
          console.error("HF virtual try-on failed:", hfError);
          console.log("All virtual try-on APIs failed, returning placeholder");

          // Return user's photo as placeholder with message
          return new Response(
            JSON.stringify({
              result: userImage,
              viewType,
              placeholder: true,
              message: "Virtual try-on service is temporarily unavailable. Showing your uploaded photo as a placeholder."
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } else if (primaryGarmentImage) {
      // No user image - generate a fashion model wearing the garment
      // This path uses Gemini since we're generating a new image, not preserving identity
      prompt = `Create a fashion photography image showing a ${genderTerm} model wearing the EXACT clothing item shown in the provided product image. Same color, pattern, style, design details, fabric appearance. Professional fashion catalog photography, clean studio background, perfect lighting.`;

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

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${googleApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: typeof messageContent === 'string'
            ? [{ text: messageContent }]
            : messageContent.map((item: any) => {
                if (item.type === 'text') {
                  return { text: item.text };
                } else if (item.type === 'image_url') {
                  const imageData = item.image_url.url.includes('base64,')
                    ? item.image_url.url.split('base64,')[1]
                    : item.image_url.url;
                  return {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: imageData
                    }
                  };
                }
                return { text: "" };
              })
        }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 4096
        }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errorText);
      
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
      
      // Handle 400 errors (usually invalid/broken image URLs) gracefully
      if (aiResponse.status === 400) {
        console.log("Image URL likely invalid or inaccessible, skipping try-on for this product");
        return new Response(
          JSON.stringify({ 
            result: null,
            skipped: true,
            reason: "Product image unavailable for try-on",
            viewType 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    // Note: Gemini can't generate images, so this is just a fallback message
    return new Response(
      JSON.stringify({
        result: null,
        error: "Virtual try-on requires Replicate or Hugging Face API. Please ensure API tokens are set.",
        message: "Gemini can analyze images but cannot generate virtual try-on results. Use Replicate for best results.",
        viewType
      }),
      {
        status: 400,
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
