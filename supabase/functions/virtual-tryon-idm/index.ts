import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRADIO_SPACE_URL = 'https://yisol-idm-vton.hf.space';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userPhoto, garments, garmentDescription, sessionId } = await req.json();

    console.log("=== VIRTUAL TRYON IDM REQUEST ===");
    console.log("User photo length:", userPhoto?.length || 0);
    console.log("Garments count:", garments?.length || 0);
    console.log("Session ID:", sessionId);

    // Validate required fields
    if (!userPhoto) {
      return new Response(
        JSON.stringify({ error: "Missing userPhoto" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (!garments || garments.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing garments" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Use first garment for single-item try-on
    const primaryGarment = garments[0];
    console.log("Primary garment:", primaryGarment);

    // Strip data URL prefix from user photo
    const userImageData = userPhoto.replace(/^data:image\/\w+;base64,/, '');

    // Download and convert garment image to base64
    let garmentImageData = primaryGarment.image_url;

    if (primaryGarment.image_url.startsWith('http')) {
      console.log('Fetching garment image from URL...');
      try {
        const garmentResponse = await fetch(primaryGarment.image_url);
        if (!garmentResponse.ok) {
          throw new Error(`Failed to fetch garment: ${garmentResponse.status}`);
        }
        const garmentBlob = await garmentResponse.blob();
        const garmentArrayBuffer = await garmentBlob.arrayBuffer();
        const garmentBytes = new Uint8Array(garmentArrayBuffer);
        garmentImageData = btoa(String.fromCharCode(...garmentBytes));
      } catch (fetchError) {
        console.error('Failed to download garment image:', fetchError);
        return new Response(
          JSON.stringify({ error: "Could not download garment image" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    } else {
      garmentImageData = primaryGarment.image_url.replace(/^data:image\/\w+;base64,/, '');
    }

    // Format as data URLs for Gradio
    const userDataUrl = `data:image/jpeg;base64,${userImageData}`;
    const garmentDataUrl = `data:image/jpeg;base64,${garmentImageData}`;

    console.log('Calling Gradio Space API...');

    // Call Gradio Space API
    const response = await fetch(`${GRADIO_SPACE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: [
          userDataUrl,           // dict (human image)
          garmentDataUrl,        // garm_img
          garmentDescription || `${primaryGarment.name || 'clothing item'}`,  // garment_des
          true,                  // is_checked
          false,                 // is_checked_crop
          30,                    // denoise_steps
          42                     // seed
        ]
      })
    });

    console.log('Gradio response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gradio error:', errorText);

      if (response.status === 429) {
        return new Response(null, {
          status: 429,
          headers: corsHeaders
        });
      }

      throw new Error(`Gradio API failed: ${errorText}`);
    }

    const result = await response.json();
    console.log('Gradio result received');

    // Extract the result image
    // Gradio returns: { data: [result_image, mask_image] }
    const resultImage = result.data?.[0];

    if (!resultImage) {
      throw new Error('No result image in response');
    }

    // Convert result image (data URL) to blob
    const base64Data = resultImage.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Return as binary image/png
    return new Response(binaryData, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png"
      }
    });

  } catch (error) {
    console.error("Virtual try-on error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: "The Gradio Space may be busy. Please try again in a moment."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
