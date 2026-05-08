import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CREATORS_API_KEY = Deno.env.get('AMAZON_CREATORS_API_KEY')
const PARTNER_TAG = Deno.env.get('AMAZON_PARTNER_TAG')

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
    const { category, keywords, gender = 'women' } = await req.json()

    console.log('=== AMAZON CREATORS API SEARCH ===')
    console.log('Category:', category)
    console.log('Keywords:', keywords)
    console.log('Gender:', gender)

    if (!CREATORS_API_KEY || !PARTNER_TAG) {
      throw new Error('Missing Amazon Creators API credentials')
    }

    // Build search query
    const searchKeywords = `${gender} ${category} ${keywords || ''}`.trim()

    // Call Amazon Creators API (much simpler than PA-API!)
    const response = await fetch('https://api.amazon.com/creators/v1/products/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': CREATORS_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        keywords: searchKeywords,
        category: 'Fashion',
        partnerTag: PARTNER_TAG,
        maxResults: 5
      })
    })

    console.log('Creators API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Creators API error:', errorText)

      // Return empty products gracefully
      return new Response(
        JSON.stringify({
          products: [],
          error: 'Amazon API temporarily unavailable',
          fallback: true
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

    const data = await response.json()
    console.log('Found products:', data.products?.length || 0)

    // Transform to our format
    const products = data.products?.map((item: any) => ({
      id: item.asin,
      name: item.title,
      category: category,
      image_url: item.image?.url,
      price: item.price?.displayAmount,
      affiliate_link: item.affiliateUrl,
      asin: item.asin,
      rating: item.rating
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
    console.error('=== CREATORS API ERROR ===')
    console.error(error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to search products',
        products: [],
        fallback: true
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
})
