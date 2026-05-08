# External AI + Webhook Architecture

## Overview

Use external AI service (getsable.ai) for recommendations, send results to your app via webhook.

## Architecture Diagram

```
┌─────────────────────────┐
│  External AI Service    │
│  (getsable.ai)          │
│                         │
│  - More powerful        │
│  - Better AI models     │
│  - Heavy computation    │
└──────────┬──────────────┘
           │
           │ Webhook POST
           ↓
┌─────────────────────────┐
│  Supabase Edge Function │
│  /webhook/outfit        │
│                         │
│  - Validates request    │
│  - Stores in database   │
└──────────┬──────────────┘
           │
           │ INSERT INTO outfit_plans
           ↓
┌─────────────────────────┐
│  Supabase Database      │
│  outfit_plans table     │
└──────────┬──────────────┘
           │
           │ Real-time subscription
           ↓
┌─────────────────────────┐
│  Your Mobile App        │
│                         │
│  - Native UI            │
│  - Instant updates      │
│  - Beautiful display    │
└─────────────────────────┘
```

## Step 1: Create Webhook Edge Function

**File:** `supabase/functions/webhook-outfit/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-webhook-secret, content-type',
      }
    })
  }

  try {
    // Verify webhook secret
    const secret = req.headers.get('x-webhook-secret')
    if (secret !== WEBHOOK_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { userId, sessionId, outfit } = await req.json()

    console.log('=== WEBHOOK RECEIVED ===')
    console.log('User:', userId)
    console.log('Session:', sessionId)
    console.log('Outfit:', outfit.name)

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Store outfit in database
    const { data, error } = await supabase
      .from('outfit_plans')
      .insert({
        user_id: userId || null,
        session_id: sessionId,
        name: outfit.name,
        style: outfit.style,
        items: outfit.items,
        weather: outfit.weather,
        is_recommendation: true
      })
      .select()
      .single()

    if (error) throw error

    console.log('✅ Outfit stored:', data.id)

    return new Response(
      JSON.stringify({
        success: true,
        outfitId: data.id
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

## Step 2: External Service Calls Webhook

**On getsable.ai (your external AI service):**

```python
import requests

def send_outfit_to_app(user_session_id, outfit_data):
    webhook_url = "https://xrfwsqwtzhsozezjbwgy.supabase.co/functions/v1/webhook-outfit"

    payload = {
        "sessionId": user_session_id,
        "outfit": {
            "name": "Business Casual Look",
            "style": "professional",
            "items": [
                {
                    "name": "White Blouse",
                    "category": "Women's Tops",
                    "image_url": "https://..."
                },
                {
                    "name": "Black Trousers",
                    "category": "Women's Pants",
                    "image_url": "https://..."
                }
            ],
            "weather": {
                "temp": 72,
                "high": 75,
                "low": 68
            }
        }
    }

    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Secret": "your_secret_key_here"
    }

    response = requests.post(webhook_url, json=payload, headers=headers)
    return response.json()
```

## Step 3: App Subscribes to Updates

**In your React app:**

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { getSessionId } from '@/utils/outfitStorage'

const useRealtimeOutfits = () => {
  const [outfits, setOutfits] = useState([])
  const sessionId = getSessionId()

  useEffect(() => {
    // Load existing outfits
    const loadOutfits = async () => {
      const { data } = await supabase
        .from('outfit_plans')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_recommendation', true)
        .order('created_at', { ascending: false })

      setOutfits(data || [])
    }

    loadOutfits()

    // Subscribe to new outfits in real-time
    const subscription = supabase
      .channel('outfit_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'outfit_plans',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('✨ New outfit received!', payload.new)
          setOutfits(prev => [payload.new, ...prev])
          toast.success('New outfit recommendation!')
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [sessionId])

  return outfits
}
```

## Step 4: Display in App

```typescript
const AIStyleChat = () => {
  const outfits = useRealtimeOutfits()

  // When external AI sends outfit via webhook,
  // it instantly appears here!

  return (
    <div>
      {outfits.map(outfit => (
        <OutfitCard key={outfit.id} outfit={outfit} />
      ))}
    </div>
  )
}
```

## Benefits

✅ **Heavy AI on powerful servers** - Not limited by mobile
✅ **Instant updates** - Real-time subscriptions
✅ **Native UI** - Full control over display
✅ **App Store approved** - Common pattern
✅ **Scalable** - Backend does heavy lifting
✅ **Flexible** - Can use any AI model externally

## App Store Perspective

**What they see:**
- Native app with beautiful UI ✅
- Fetches data from your backend ✅ (normal)
- Displays recommendations ✅
- Great user experience ✅

**What they DON'T care about:**
- Where AI processing happens (backend vs app)
- That you use external services
- How recommendations are generated

**Similar apps that do this:**
- Spotify (recommendations from backend)
- Instagram (filters processed externally)
- Netflix (personalization on backend)

## Security

1. **Webhook Secret** - Verify requests from your external service
2. **Session ID** - Link data to correct user
3. **RLS Policies** - Users only see their own outfits
4. **HTTPS** - All communication encrypted

## Testing

### 1. Deploy webhook function
```bash
supabase functions deploy webhook-outfit
```

### 2. Test with curl
```bash
curl -X POST https://your-project.supabase.co/functions/v1/webhook-outfit \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_secret" \
  -d '{
    "sessionId": "guest_123",
    "outfit": {
      "name": "Test Outfit",
      "style": "casual",
      "items": []
    }
  }'
```

### 3. Check app
- Open your app
- Should instantly see new outfit!

## Deployment

1. **Add webhook secret to Supabase:**
   ```
   WEBHOOK_SECRET=your_random_secret_string_here
   ```

2. **Deploy edge function:**
   ```bash
   supabase functions deploy webhook-outfit
   ```

3. **Configure external service:**
   - Add webhook URL
   - Add secret
   - Test integration

4. **Enable real-time in app:**
   - Already implemented above
   - Just works!

## Cost

- Supabase: Free tier supports this
- Real-time: 200 concurrent connections free
- Webhooks: Unlimited on Supabase

## Summary

✅ **Allowed by App Store** - Common pattern
✅ **Better performance** - Heavy work on backend
✅ **Native experience** - Full UI control
✅ **Real-time updates** - Instant notifications
✅ **Scalable** - Easy to add more features

This is the **professional way** to build AI-powered mobile apps! 🚀
