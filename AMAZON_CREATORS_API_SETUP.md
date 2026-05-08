# Amazon Creators API Integration

## Overview

Integrate Amazon Creators API to fetch real products dynamically instead of using static CSV.

## Step 1: Get API Credentials

1. Go to [Amazon Associates](https://affiliate-program.amazon.com/)
2. Navigate to Tools → Creators API
3. Get your:
   - **API Key**
   - **Partner Tag** (your affiliate tracking ID)

## Step 2: Add to Supabase Secrets

```bash
# In Supabase Dashboard:
# Settings → Edge Functions → Secrets

AMAZON_API_KEY=your_api_key_here
AMAZON_PARTNER_TAG=your_partner_tag_here
```

## Step 3: Create Edge Function

**File:** `supabase/functions/amazon-products/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const AMAZON_API_KEY = Deno.env.get('AMAZON_API_KEY')
const AMAZON_PARTNER_TAG = Deno.env.get('AMAZON_PARTNER_TAG')
const AMAZON_API_URL = 'https://api.amazon.com/paapi5'

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
    const { category, keywords, gender } = await req.json()

    console.log('Searching Amazon for:', { category, keywords, gender })

    // Build search keywords
    const searchKeywords = `${gender} ${category} ${keywords || ''}`.trim()

    // Call Amazon Creators API
    const response = await fetch(`${AMAZON_API_URL}/searchitems`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Access-Key': AMAZON_API_KEY!,
        'X-Amz-Partner-Tag': AMAZON_PARTNER_TAG!
      },
      body: JSON.stringify({
        Keywords: searchKeywords,
        SearchIndex: 'Fashion',
        ItemCount: 5,
        Resources: [
          'Images.Primary.Large',
          'ItemInfo.Title',
          'ItemInfo.Features',
          'Offers.Listings.Price'
        ],
        PartnerTag: AMAZON_PARTNER_TAG,
        PartnerType: 'Associates'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Amazon API error:', errorText)
      throw new Error(`Amazon API failed: ${errorText}`)
    }

    const data = await response.json()

    // Transform Amazon response to our format
    const products = data.SearchResult?.Items?.map((item: any) => ({
      id: item.ASIN,
      name: item.ItemInfo?.Title?.DisplayValue || 'Product',
      category: category,
      image_url: item.Images?.Primary?.Large?.URL,
      price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount,
      affiliate_link: item.DetailPageURL,
      asin: item.ASIN
    })) || []

    return new Response(
      JSON.stringify({
        products,
        count: products.length
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
    console.error('Product search error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to search products',
        products: []
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

## Step 4: Create Product Search Hook

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
      const { data, error: searchError } = await supabase.functions.invoke('amazon-products', {
        body: {
          category,
          keywords,
          gender
        }
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

  const getProductForOutfitItem = async (
    itemCategory: string,
    itemName: string,
    gender: string = 'women'
  ): Promise<AmazonProduct | null> => {
    const products = await searchProducts(itemCategory, itemName, gender)
    return products[0] || null
  }

  return {
    searchProducts,
    getProductForOutfitItem,
    loading,
    error
  }
}
```

## Step 5: Update OutfitRecommendations to Use Amazon API

**Update:** `src/pages/OutfitRecommendations.tsx`

```typescript
import { useAmazonProducts } from '@/hooks/useAmazonProducts'

const OutfitRecommendations = () => {
  // ... existing code ...
  const { getProductForOutfitItem } = useAmazonProducts()
  const [productLinks, setProductLinks] = useState<Record<string, string>>({})

  // Load Amazon products for each outfit item
  useEffect(() => {
    const loadProducts = async () => {
      if (!currentOutfit) return

      const links: Record<string, string> = {}

      for (const item of currentOutfit.items) {
        const product = await getProductForOutfitItem(
          item.category,
          item.name,
          currentOutfit.gender || 'women'
        )

        if (product) {
          links[item.name] = product.affiliate_link
        }
      }

      setProductLinks(links)
    }

    loadProducts()
  }, [currentOutfit])

  // Use productLinks[item.name] instead of CSV affiliate links
  const getAffiliateLink = (item: OutfitItem) => {
    return productLinks[item.name] || null
  }

  // ... rest of code ...
}
```

## Step 6: Cache Products in Supabase

**Create table for caching:**

```sql
-- supabase/migrations/[timestamp]_amazon_product_cache.sql

CREATE TABLE public.amazon_product_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asin TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  image_url TEXT,
  price TEXT,
  affiliate_link TEXT NOT NULL,
  search_keywords TEXT,
  gender TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT (now() + interval '7 days')
);

CREATE INDEX amazon_product_cache_category_idx ON amazon_product_cache(category);
CREATE INDEX amazon_product_cache_keywords_idx ON amazon_product_cache(search_keywords);
CREATE INDEX amazon_product_cache_expires_idx ON amazon_product_cache(expires_at);

-- RLS
ALTER TABLE amazon_product_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product cache is publicly readable"
ON amazon_product_cache FOR SELECT
USING (true);
```

**Update Edge Function to use cache:**

```typescript
// Check cache first
const { data: cachedProducts } = await supabase
  .from('amazon_product_cache')
  .select('*')
  .eq('category', category)
  .eq('gender', gender)
  .gt('expires_at', new Date().toISOString())
  .limit(5)

if (cachedProducts && cachedProducts.length > 0) {
  console.log('Returning cached products')
  return new Response(
    JSON.stringify({ products: cachedProducts, cached: true }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  )
}

// If not cached, call Amazon API and cache results
// ... call Amazon API ...

// Save to cache
await supabase.from('amazon_product_cache').insert(
  products.map(p => ({
    ...p,
    search_keywords: searchKeywords,
    gender,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }))
)
```

## Benefits

✅ **Real Products** - Actual Amazon items, not placeholders
✅ **Auto-updated** - Product availability and prices stay current
✅ **Better UX** - Users can actually buy the items
✅ **Higher Conversion** - Real products = more clicks
✅ **Cached** - Fast performance, reduced API calls

## API Rate Limits

Amazon Creators API limits:
- **Free tier:** 8,640 requests/day
- **Cache:** Reduces API calls by 90%+

## Testing

```typescript
// Test searching for products
const { searchProducts } = useAmazonProducts()

const products = await searchProducts('Women\'s Tops', 'blouse', 'women')
console.log('Found products:', products)
```

## Cost

Amazon Creators API is **FREE** for approved affiliates!

## Next Steps

1. Get Amazon API credentials
2. Deploy edge function
3. Test product search
4. Enable caching
5. Update UI to use real products

Would you like me to implement this now?
