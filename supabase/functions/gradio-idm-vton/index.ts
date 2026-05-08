import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GRADIO_SPACE_URL = 'https://yisol-idm-vton.hf.space'

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { userImage, garmentImage, outfit } = await req.json()

    console.log('=== GRADIO IDM-VTON REQUEST ===')
    console.log('User image length:', userImage?.length)
    console.log('Garment image:', garmentImage?.substring(0, 50))

    if (!userImage || !garmentImage) {
      return new Response(
        JSON.stringify({ error: 'Missing user image or garment image' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Strip data URL prefix from user image
    const userImageData = userImage.replace(/^data:image\/\w+;base64,/, '')

    // Convert garment URL to base64 if needed
    let garmentImageData = garmentImage
    if (garmentImage.startsWith('http')) {
      console.log('Fetching garment image from URL...')
      const garmentResponse = await fetch(garmentImage)
      const garmentBlob = await garmentResponse.blob()
      const garmentArrayBuffer = await garmentBlob.arrayBuffer()
      const garmentBytes = new Uint8Array(garmentArrayBuffer)
      garmentImageData = btoa(String.fromCharCode(...garmentBytes))
    } else {
      garmentImageData = garmentImage.replace(/^data:image\/\w+;base64,/, '')
    }

    // Format as data URLs for Gradio
    const userDataUrl = `data:image/jpeg;base64,${userImageData}`
    const garmentDataUrl = `data:image/jpeg;base64,${garmentImageData}`

    console.log('Calling Gradio Space API...')

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
          "clothing item",       // garment_des
          true,                  // is_checked
          false,                 // is_checked_crop
          30,                    // denoise_steps
          42                     // seed
        ]
      })
    })

    console.log('Gradio response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gradio error:', errorText)
      throw new Error(`Gradio API failed: ${errorText}`)
    }

    const result = await response.json()
    console.log('Gradio result:', result)

    // Extract the result image
    // Gradio returns: { data: [result_image, mask_image] }
    const resultImage = result.data?.[0]

    if (!resultImage) {
      throw new Error('No result image in response')
    }

    return new Response(
      JSON.stringify({
        result: resultImage,
        message: 'Virtual try-on completed successfully!'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error: any) {
    console.error('=== GRADIO IDM-VTON ERROR ===')
    console.error(error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Virtual try-on failed',
        details: 'The Gradio Space may be busy. Please try again in a moment.'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
