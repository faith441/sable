# Stable Diffusion Virtual Try-On Implementation

## Option 1: Replicate with IDM-VTON (Recommended) ⭐

### Why This is Best:
- Specifically designed for virtual try-on
- Highest quality results
- Simple API
- No GPU infrastructure needed
- Pay only for what you use

### Step 1: Get Replicate API Key

1. Go to [Replicate](https://replicate.com)
2. Sign up / Login
3. Go to Account → API Tokens
4. Copy your API token

### Step 2: Add to Supabase Secrets

```bash
# In Supabase Dashboard:
# Settings → Edge Functions → Secrets
REPLICATE_API_KEY=r8_your_api_key_here
```

### Step 3: Create Edge Function

**File:** `supabase/functions/stable-diffusion-tryon/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY')

serve(async (req) => {
  // CORS
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

    console.log('Starting virtual try-on...')
    console.log('User image length:', userImage?.length)
    console.log('Garment image:', garmentImage)

    // Validate inputs
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

    // Start prediction with IDM-VTON
    const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
        input: {
          garm_img: garmentImage,
          human_img: userImage,
          garment_des: outfit?.name || "clothing item",
          is_checked: true,
          is_checked_crop: false,
          denoise_steps: 30,
          seed: 42
        }
      })
    })

    if (!predictionResponse.ok) {
      const errorText = await predictionResponse.text()
      console.error('Replicate API error:', errorText)
      throw new Error(`Replicate API failed: ${errorText}`)
    }

    const prediction = await predictionResponse.json()
    console.log('Prediction started:', prediction.id)

    // Poll for result (with Prefer: wait, this should be quick)
    if (prediction.status === 'succeeded') {
      return new Response(
        JSON.stringify({
          result: prediction.output,
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
    }

    // If still processing, poll
    let attempts = 0
    const maxAttempts = 30 // 30 seconds max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            'Authorization': `Token ${REPLICATE_API_KEY}`,
          }
        }
      )

      const status = await statusResponse.json()
      console.log('Status:', status.status)

      if (status.status === 'succeeded') {
        return new Response(
          JSON.stringify({
            result: status.output,
            message: 'Virtual try-on completed!'
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Prediction failed')
      }

      attempts++
    }

    throw new Error('Timeout waiting for result')

  } catch (error: any) {
    console.error('Virtual try-on error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Virtual try-on failed',
        details: 'Please ensure images are valid and try again'
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
```

### Step 4: Update VirtualTryOn.tsx

**Update the handleTryOn function:**

```typescript
const handleTryOn = async () => {
  if (!userImage) {
    toast.error("Please upload your photo");
    return;
  }

  if (!outfit || selectedItems.length === 0) {
    toast.error("Please select items to try on");
    return;
  }

  setLoading(true);
  try {
    const garmentImage = selectedItems[0]?.image_url;

    if (!garmentImage) {
      toast.error("No garment image available");
      return;
    }

    console.log("Starting virtual try-on...");

    const { data, error } = await supabase.functions.invoke("stable-diffusion-tryon", {
      body: {
        userImage,
        garmentImage,
        outfit: {
          name: outfit.name,
          style: outfit.style
        }
      }
    });

    if (error) {
      console.error('Try-on error:', error);
      toast.error('Virtual try-on failed. Please try again.');
      return;
    }

    if (data.result) {
      setResult(data.result);
      toast.success("Try-on complete! 🎉");
    } else if (data.error) {
      toast.error(data.error);
    }

  } catch (error: any) {
    console.error("Try-on error:", error);
    toast.error("Failed to generate try-on");
  } finally {
    setLoading(false);
  }
};
```

### Step 5: Deploy

```bash
cd /path/to/your/project
supabase functions deploy stable-diffusion-tryon
```

### Step 6: Test

1. Upload your photo
2. Select an outfit item
3. Click "Try It On"
4. Wait ~10-15 seconds
5. See realistic try-on result! ✨

---

## Option 2: Hugging Face Inference API

### Pros:
- Free tier available
- Good models
- Simple API

### Cons:
- Slower cold starts
- Less reliable than Replicate

**Implementation:**

```typescript
const response = await fetch(
  'https://api-inference.huggingface.co/models/yisol/IDM-VTON',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: {
        image: userImage,
        garment: garmentImage
      }
    })
  }
)

const blob = await response.blob()
const resultImage = await blobToBase64(blob)
```

---

## Option 3: Stable Diffusion Web UI API (Self-Hosted)

### Pros:
- Full control
- No API costs
- Unlimited usage

### Cons:
- Need GPU server
- More complex setup
- Maintenance required

**Setup:**
1. Deploy AUTOMATIC1111 WebUI
2. Install ControlNet extension
3. Add virtual try-on models
4. Call API from your app

---

## Comparison

| Option | Quality | Speed | Cost | Ease |
|--------|---------|-------|------|------|
| **Replicate IDM-VTON** | ⭐⭐⭐⭐⭐ | Fast | $0.0028/img | Easy |
| **Hugging Face** | ⭐⭐⭐⭐ | Medium | Free tier | Easy |
| **Self-hosted** | ⭐⭐⭐⭐⭐ | Fast | GPU cost | Hard |

## Recommended: Use Replicate

**Why:**
- Best quality (IDM-VTON is state-of-the-art)
- Fastest setup
- Most reliable
- Fair pricing ($2.80 per 1000 images)
- No infrastructure needed

---

## Cost Estimate

**Replicate pricing:**
- $0.0028 per virtual try-on
- 100 try-ons = $0.28
- 1,000 try-ons = $2.80
- 10,000 try-ons = $28

**Very affordable for most apps!**

---

## Example Results

IDM-VTON produces:
- ✅ Realistic fabric textures
- ✅ Natural body proportions
- ✅ Proper clothing fit
- ✅ Accurate colors
- ✅ Good lighting/shadows
- ✅ Maintains person's features

**This is the professional-grade solution used by fashion e-commerce platforms.**
