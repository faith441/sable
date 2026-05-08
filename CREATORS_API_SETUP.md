# Amazon Creators API Setup (Easiest!)

## Why Creators API is Best

✅ **Simple** - Just API key, no complex AWS signing
✅ **Fast** - Quick setup
✅ **Perfect fit** - Designed for content creators/influencers
✅ **Same data** - All Amazon product info

## Step 1: Get API Key

1. Go to [Amazon Creators API](https://affiliate-program.amazon.com/creatorsapi)
2. Sign in with your Amazon Associates account
3. Click **"Get API Key"**
4. Copy your:
   - **API Key** (for authentication)
   - **Partner Tag** (your tracking ID)

## Step 2: Add to Supabase

```bash
# Supabase Dashboard → Settings → Edge Functions → Secrets

AMAZON_CREATORS_API_KEY=your_api_key_here
AMAZON_PARTNER_TAG=yourname-20
```

## Step 3: Deploy Edge Function

```bash
cd /path/to/your/project
supabase functions deploy amazon-creators
```

## Step 4: Create React Hook

**File:** `src/hooks/useAmazonProducts.ts`

```typescript
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface AmazonProduct {
  id: string
  name: string
  category: string
  image_url?: string
  price?: string
  affiliate_link: string
  asin: string
  rating?: number
}

export const useAmazonProducts = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchProducts = async (
    category: string,
    keywords?: string,
    gender: string = 'women'
  ): Promise<AmazonProduct[]> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: searchError } = await supabase.functions.invoke('amazon-creators', {
        body: { category, keywords, gender }
      })

      if (searchError) throw searchError

      return data.products || []
    } catch (err: any) {
      console.error('Product search error:', err)
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }

  return { searchProducts, loading, error }
}
```

## Step 5: Use in Your App

```typescript
import { useAmazonProducts } from '@/hooks/useAmazonProducts'

function ProductList() {
  const { searchProducts } = useAmazonProducts()
  const [products, setProducts] = useState([])

  useEffect(() => {
    const load = async () => {
      const items = await searchProducts("Women's Tops", "blouse", "women")
      setProducts(items)
    }
    load()
  }, [])

  return (
    <div>
      {products.map(product => (
        <a href={product.affiliate_link} key={product.asin}>
          <img src={product.image_url} alt={product.name} />
          <h3>{product.name}</h3>
          <p>{product.price}</p>
        </a>
      ))}
    </div>
  )
}
```

## API Endpoints

### Search Products
```bash
POST https://api.amazon.com/creators/v1/products/search
Headers:
  X-Api-Key: your_key
  Content-Type: application/json

Body:
{
  "keywords": "women blazer",
  "category": "Fashion",
  "partnerTag": "yourname-20",
  "maxResults": 10
}
```

### Get Product Details
```bash
GET https://api.amazon.com/creators/v1/products/{asin}
Headers:
  X-Api-Key: your_key
```

## Rate Limits

- **Free:** 8,640 requests/day (1 every 10 seconds)
- **No cost** for Amazon Associates

## Testing

```typescript
// Test the edge function directly
const { data } = await supabase.functions.invoke('amazon-creators', {
  body: {
    category: "Women's Tops",
    keywords: "professional blouse",
    gender: "women"
  }
})

console.log('Products:', data.products)
```

## Integration with Outfit Recommendations

Update `OutfitRecommendations.tsx`:

```typescript
import { useAmazonProducts } from '@/hooks/useAmazonProducts'

const OutfitRecommendations = () => {
  const { searchProducts } = useAmazonProducts()
  const [productLinks, setProductLinks] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadAmazonProducts = async () => {
      if (!currentOutfit) return

      const links: Record<string, string> = {}

      for (const item of currentOutfit.items) {
        const products = await searchProducts(item.category, item.name, 'women')
        if (products[0]) {
          links[item.name] = products[0].affiliate_link
        }
      }

      setProductLinks(links)
    }

    loadAmazonProducts()
  }, [currentOutfit])

  // Use productLinks[item.name] for Shop button
}
```

## Benefits

✅ **Easy setup** - Just API key, no AWS complexity
✅ **Real products** - Live Amazon data
✅ **Better UX** - Real prices, images, availability
✅ **Higher revenue** - More clickable = more commissions

## Comparison

| Method | Ease | Data | Revenue |
|--------|------|------|---------|
| **CSV (current)** | ⭐⭐⭐⭐⭐ | Static | Low |
| **Creators API** | ⭐⭐⭐⭐ | Live | High |
| **PA-API** | ⭐⭐ | Live | High |

## Quick Start

1. ✅ Get Creators API key (5 minutes)
2. ✅ Add to Supabase secrets
3. ✅ Deploy edge function
4. ✅ Use hook in your app
5. ✅ Test with outfit recommendations

**Much simpler than PA-API!** 🎉
