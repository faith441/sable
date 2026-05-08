# IDM-VTON with Hugging Face Implementation

## Option 1: Hugging Face Inference API (Recommended)

### Step 1: Get Hugging Face API Token

1. Go to [Hugging Face](https://huggingface.co/join)
2. Sign up (just email + password)
3. Go to Settings → Access Tokens
4. Create new token → Copy it

### Step 2: Add to Supabase Secrets

```bash
# Supabase Dashboard:
# Settings → Edge Functions → Secrets
HUGGINGFACE_API_KEY=hf_your_token_here
```

### Step 3: Create Edge Function

**File:** `supabase/functions/huggingface-tryon/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const HF_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY')
const HF_MODEL = 'yisol/IDM-VTON'

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

    console.log('Starting Hugging Face IDM-VTON...')

    if (!userImage || !garmentImage) {
      return new Response(
        JSON.stringify({ error: 'Missing required images' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Strip base64 prefix if present
    const userImageData = userImage.replace(/^data:image\/\w+;base64,/, '')

    // Convert garment URL to base64 if it's a URL
    let garmentImageData = garmentImage
    if (garmentImage.startsWith('http')) {
      const garmentResponse = await fetch(garmentImage)
      const garmentBlob = await garmentResponse.blob()
      const garmentArrayBuffer = await garmentBlob.arrayBuffer()
      const garmentBase64 = btoa(String.fromCharCode(...new Uint8Array(garmentArrayBuffer)))
      garmentImageData = garmentBase64
    } else {
      garmentImageData = garmentImage.replace(/^data:image\/\w+;base64,/, '')
    }

    // Call Hugging Face Inference API
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: {
            image: userImageData,
            cloth: garmentImageData,
            prompt: outfit?.name || "clothing item"
          },
          parameters: {
            num_inference_steps: 30,
            guidance_scale: 2.0
          }
        })
      }
    )

    console.log('Hugging Face response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Hugging Face error:', errorText)

      // Check if model is loading
      if (response.status === 503) {
        return new Response(
          JSON.stringify({
            error: 'Model is loading',
            retry: true,
            message: 'The AI model is starting up. Please wait 20 seconds and try again.'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          }
        )
      }

      throw new Error(`Hugging Face API error: ${errorText}`)
    }

    // Get image blob
    const imageBlob = await response.blob()

    // Convert blob to base64
    const arrayBuffer = await imageBlob.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    const resultImage = `data:image/png;base64,${base64}`

    return new Response(
      JSON.stringify({
        result: resultImage,
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

  } catch (error: any) {
    console.error('Virtual try-on error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Virtual try-on failed',
        details: 'Please try again in a moment'
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

    const { data, error } = await supabase.functions.invoke("huggingface-tryon", {
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

    if (data.retry) {
      // Model is loading
      toast.error(data.message || "Model is loading. Please wait and try again.");
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
supabase functions deploy huggingface-tryon
```

---

## Option 2: Hugging Face Spaces (Free, No API Key Needed)

Use the public IDM-VTON space directly:

### Implementation:

```typescript
const response = await fetch(
  'https://yisol-idm-vton.hf.space/api/predict',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [
        userImage,     // base64 image
        garmentImage,  // base64 or URL
        "clothing",    // garment type
        true,          // is_checked
        false,         // is_checked_crop
        30,            // denoise_steps
        42             // seed
      ]
    })
  }
)

const result = await response.json()
const generatedImage = result.data[0] // Result image URL or base64
```

**Pros:**
- ✅ No API key needed
- ✅ Free
- ✅ Official IDM-VTON space

**Cons:**
- ⚠️ Slower (cold starts)
- ⚠️ Can be rate limited
- ⚠️ Less reliable

---

## Option 3: Modal.com (Replicate Alternative)

**Similar to Replicate:**
- Serverless GPU
- Pay per use
- Easy deployment

**Setup:**
1. Sign up at [modal.com](https://modal.com)
2. Install: `pip install modal`
3. Deploy IDM-VTON
4. Get endpoint URL

---

## Option 4: Google Colab (Free GPU)

Run IDM-VTON for free with GPU:

1. Open [Google Colab](https://colab.research.google.com)
2. Install IDM-VTON:
```python
!git clone https://github.com/yisol/IDM-VTON.git
!cd IDM-VTON && pip install -r requirements.txt
```
3. Run inference
4. Use ngrok to expose API

**Pros:**
- ✅ Free GPU
- ✅ Full control

**Cons:**
- ❌ Manual setup
- ❌ Not production-ready

---

## Option 5: fal.ai (Easy Replicate Alternative)

**Similar pricing, easier signup:**

1. Go to [fal.ai](https://fal.ai)
2. Sign up (email only)
3. Use their IDM-VTON endpoint

```typescript
const response = await fetch('https://fal.run/fal-ai/idm-vton', {
  method: 'POST',
  headers: {
    'Authorization': `Key ${FAL_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    human_img_url: userImageUrl,
    garm_img_url: garmentImageUrl
  })
})
```

---

## Comparison

| Option | Cost | Ease | Speed | Quality |
|--------|------|------|-------|---------|
| **HF Inference API** | Free tier | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **HF Spaces** | Free | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Modal** | Pay/use | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **fal.ai** | Pay/use | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Colab** | Free | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## Recommended Path:

1. **Start with Hugging Face Inference API** (easiest, free tier)
2. If too slow → Try **fal.ai** (similar to Replicate)
3. For production → Use **Modal** (reliable, scalable)

---

## Hugging Face Pros/Cons

**Pros:**
- ✅ Free tier (1000 requests/month)
- ✅ Easy signup
- ✅ Official IDM-VTON support
- ✅ Simple API

**Cons:**
- ⚠️ Cold start delays (20-60 seconds first time)
- ⚠️ Rate limits on free tier
- ⚠️ Can be slow during peak times

**Solution:** Add retry logic and tell users to wait if model is loading.

---

## Quick Start: Hugging Face

1. **Sign up:** huggingface.co (2 minutes)
2. **Get token:** Settings → Access Tokens
3. **Add secret:** Supabase Edge Functions
4. **Deploy:** Use code above
5. **Test:** May need to wait 20s first time (model loading)

**This is your best alternative to Replicate!** ✅
