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

    console.log("=== CODE PATH DECISION ===");
    console.log("Has customPrompt:", !!customPrompt);
    console.log("Has userImage:", !!userImage, "length:", userImage?.length || 0);
    console.log("Has primaryGarmentImage:", !!primaryGarmentImage, "url:", primaryGarmentImage);

    if (customPrompt) {
      console.log("Taking path: CUSTOM PROMPT");
      prompt = customPrompt;
      messageContent = prompt;
    } else if (userImage && primaryGarmentImage) {
      console.log("Taking path: USER IMAGE + GARMENT (HF or Gemini fallback)");
      // User has uploaded their own image AND we have the garment image
      // Use Hugging Face IDM-VTON for identity-preserving virtual try-on
      console.log("Using Hugging Face IDM-VTON for virtual try-on");

      const hfToken = Deno.env.get("HUGGINGFACE_API_TOKEN");
      console.log("HF Token available:", !!hfToken);

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
        // Use Hugging Face Gradio Space ONLY - NO REPLICATE
        try {
          console.log("=== STEP 1: RECEIVED REQUEST ===");
          console.log("User image size:", userImage?.length || 0, "chars");
          console.log("Garment image URL:", primaryGarmentImage);

          // STEP 2: Download garment image from Unsplash
          console.log("=== STEP 2: DOWNLOADING GARMENT IMAGE ===");
          let garmentImageBase64 = primaryGarmentImage;

          if (primaryGarmentImage.startsWith('http')) {
            try {
              // Modify Unsplash URL to request smaller image (max 512x768) to reduce payload
              let optimizedUrl = primaryGarmentImage;
              if (primaryGarmentImage.includes('unsplash.com')) {
                const url = new URL(primaryGarmentImage);
                url.searchParams.set('w', '512');
                url.searchParams.set('h', '768');
                url.searchParams.set('fit', 'crop');
                url.searchParams.set('q', '75'); // Quality 75%
                optimizedUrl = url.toString();
                console.log("Optimized Unsplash URL:", optimizedUrl);
              }

              console.log("Fetching garment from URL:", optimizedUrl.substring(0, 100));
              const garmentResponse = await fetch(optimizedUrl);
              if (!garmentResponse.ok) {
                throw new Error(`Failed to fetch garment: ${garmentResponse.status}`);
              }
              const garmentBlob = await garmentResponse.blob();
              console.log("Garment blob size:", garmentBlob.size, "bytes");
              const garmentBuffer = await garmentBlob.arrayBuffer();
              const garmentBase64 = btoa(String.fromCharCode(...new Uint8Array(garmentBuffer)));
              garmentImageBase64 = `data:image/jpeg;base64,${garmentBase64}`;
              console.log("Garment image downloaded and converted, base64 size:", garmentImageBase64.length, "chars");
            } catch (downloadError) {
              console.error("Failed to download garment image:", downloadError);
              throw new Error(`Could not download garment image: ${downloadError}`);
            }
          }

          console.log("=== STEP 3: PREPARING PAYLOAD ===");

          // Keep data URI format for Gradio FileData
          const userImageData = userImage;
          const garmentImageData = garmentImageBase64;

          console.log("User image length:", userImageData.length);
          console.log("Garment image length:", garmentImageData.length);

          console.log("=== STEP 4: CALLING HUGGING FACE GRADIO SPACE ===");
          const gradioBaseUrl = "https://yisol-idm-vton.hf.space";
          const sessionHash = Math.random().toString(36).substring(2);
          console.log("Base URL:", gradioBaseUrl);
          console.log("Session hash:", sessionHash);

          // Use Gradio /run API format with proper FileData structure
          const inferencePayload = {
            data: [
              // dict parameter - EditorData with background image
              {
                background: {
                  path: userImageData,
                  url: null,
                  orig_name: "user.jpg",
                  meta: { _type: "gradio.FileData" }
                },
                layers: [],
                composite: null
              },
              // garm_img parameter - FileData for garment
              {
                path: garmentImageData,
                url: null,
                orig_name: "garment.jpg",
                meta: { _type: "gradio.FileData" }
              },
              // garment_des
              "clothing item",
              // is_checked
              true,
              // is_checked_crop
              false,
              // denoise_steps
              30,
              // seed
              42
            ]
          };

          const payloadSize = JSON.stringify(inferencePayload).length;
          console.log("Payload size:", payloadSize, "chars");
          console.log("Payload structure:", {
            dict_type: typeof inferencePayload.data[0],
            garm_img_type: typeof inferencePayload.data[1],
            params: inferencePayload.data.slice(2)
          });

          if (payloadSize > 10000000) {
            console.warn("⚠️ WARNING: Payload is very large (>10MB), may fail");
          }

          // Join Gradio queue
          console.log("Joining queue...");
          const queueJoinPayload = {
            ...inferencePayload,
            session_hash: sessionHash,
            fn_index: 0  // Index of the /tryon function
          };

          const joinResponse = await fetch(`${gradioBaseUrl}/queue/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(queueJoinPayload)
          });

          if (!joinResponse.ok) {
            const errorText = await joinResponse.text();
            console.error("Failed to join queue:", joinResponse.status, errorText);
            throw new Error(`Failed to join queue: ${joinResponse.status}`);
          }

          const joinData = await joinResponse.json();
          console.log("Queue join response:", joinData);

          // Poll for results using event stream
          console.log("Polling for results...");
          const eventUrl = `${gradioBaseUrl}/queue/data?session_hash=${sessionHash}`;

          let hfResponse;
          let resultData;

          try {
            const eventResponse = await fetch(eventUrl);
            const reader = eventResponse.body?.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader!.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = JSON.parse(line.slice(6));
                  console.log("Event:", data.msg, data);

                  if (data.msg === 'process_completed') {
                    resultData = data.output?.data;
                    console.log("✓ Processing complete!");
                    break;
                  } else if (data.msg === 'estimation') {
                    console.log(`⏳ Queue position: ${data.rank}, estimated time: ${data.estimation}s`);
                  } else if (data.msg === 'error') {
                    throw new Error(`Gradio error: ${data.error || 'Unknown error'}`);
                  }
                }
              }

              if (resultData) break;
            }

            hfResponse = { ok: true, status: 200 };
          } catch (fetchError) {
            console.error("✗ Fetch error:", fetchError);
            throw new Error(`Failed to get results: ${fetchError}`);
          }

          console.log("=== STEP 5: PROCESSING RESPONSE ===");

          if (!resultData) {
            throw new Error("No result data received from Gradio queue");
          }

          console.log("Result data:", JSON.stringify(resultData).substring(0, 500));

          // Gradio queue returns data array with result images
          // Result is typically at index 0 (output image) and index 1 (masked image)
          if (resultData && resultData[0]) {
            const resultImage = resultData[0];
            console.log("✓ Got result image from Gradio queue");
            console.log("Result type:", typeof resultImage);

            // Extract URL from FileData object if needed
            let imageUrl = resultImage;
            if (typeof resultImage === 'object' && resultImage.url) {
              imageUrl = resultImage.url;
            } else if (typeof resultImage === 'object' && resultImage.path) {
              imageUrl = resultImage.path;
            }

            console.log("Image URL:", String(imageUrl).substring(0, 100));

            return new Response(
              JSON.stringify({
                result: imageUrl,
                viewType,
                source: "gradio-queue"
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          throw new Error("Unexpected response format from Gradio queue");

        } catch (hfError) {
          console.error("=== GRADIO ERROR ===");
          console.error("Error type:", typeof hfError);
          console.error("Error:", hfError);
          console.error("Error message:", hfError instanceof Error ? hfError.message : String(hfError));
          console.error("Error stack:", hfError instanceof Error ? hfError.stack : "No stack");

          return new Response(
            JSON.stringify({
              error: "Gradio API failed",
              details: hfError instanceof Error ? hfError.message : String(hfError),
              errorType: typeof hfError,
              viewType
            }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }
      }
    } else if (primaryGarmentImage) {
      console.log("Taking path: GARMENT ONLY (no user image) - Gemini generation");
      // No user image - generate a fashion model wearing the garment
      // This path uses Gemini since we're generating a new image, not preserving identity
      prompt = `Create a fashion photography image showing a ${genderTerm} model wearing the EXACT clothing item shown in the provided product image. Same color, pattern, style, design details, fabric appearance. Professional fashion catalog photography, clean studio background, perfect lighting.`;

      messageContent = [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: primaryGarmentImage } }
      ];
    } else {
      console.log("Taking path: FALLBACK (no images)");
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
