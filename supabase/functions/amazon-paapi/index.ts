import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { HmacSha256 } from "https://deno.land/std@0.177.0/crypto/mod.ts"

const AWS_ACCESS_KEY = Deno.env.get('AMAZON_ACCESS_KEY')
const AWS_SECRET_KEY = Deno.env.get('AMAZON_SECRET_KEY')
const PARTNER_TAG = Deno.env.get('AMAZON_PARTNER_TAG')
const REGION = 'us-east-1'
const HOST = 'webservices.amazon.com'
const ENDPOINT = '/paapi5/searchitems'

// AWS4 Signature helper
function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string) {
  const kDate = new HmacSha256(dateStamp).update(new TextEncoder().encode('AWS4' + key)).digest()
  const kRegion = new HmacSha256(regionName).update(kDate).digest()
  const kService = new HmacSha256(serviceName).update(kRegion).digest()
  const kSigning = new HmacSha256('aws4_request').update(kService).digest()
  return kSigning
}

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

    console.log('=== AMAZON PA-API SEARCH ===')
    console.log('Category:', category)
    console.log('Keywords:', keywords)
    console.log('Gender:', gender)

    // Build search query
    const searchKeywords = `${gender} ${category} ${keywords || ''}`.trim()

    // Request payload
    const payload = {
      Keywords: searchKeywords,
      PartnerTag: PARTNER_TAG,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.com',
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'ItemInfo.Features',
        'Offers.Listings.Price'
      ],
      SearchIndex: 'Fashion',
      ItemCount: 5
    }

    const payloadString = JSON.stringify(payload)

    // AWS4 Signing
    const now = new Date()
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
    const dateStamp = amzDate.substring(0, 8)

    // Create canonical request
    const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${HOST}\nx-amz-date:${amzDate}\n`
    const signedHeaders = 'content-type;host;x-amz-date'
    const payloadHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payloadString))
      .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))

    const canonicalRequest = `POST\n${ENDPOINT}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256'
    const credentialScope = `${dateStamp}/${REGION}/ProductAdvertisingAPI/aws4_request`
    const canonicalRequestHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest))
      .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))

    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`

    // Calculate signature
    const signingKey = getSignatureKey(AWS_SECRET_KEY!, dateStamp, REGION, 'ProductAdvertisingAPI')
    const signature = new HmacSha256(stringToSign).update(signingKey).digest('hex')

    // Build authorization header
    const authorizationHeader = `${algorithm} Credential=${AWS_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    // Make request to Amazon PA-API
    console.log('Calling Amazon PA-API...')

    const response = await fetch(`https://${HOST}${ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Host': HOST,
        'X-Amz-Date': amzDate,
        'Authorization': authorizationHeader,
        'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems'
      },
      body: payloadString
    })

    console.log('PA-API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('PA-API error:', errorText)

      // Return empty products instead of failing
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
    console.log('PA-API returned items:', data.SearchResult?.Items?.length || 0)

    // Transform response to our format
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
    console.error('=== AMAZON PA-API ERROR ===')
    console.error(error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to search products',
        products: [],
        fallback: true
      }),
      {
        status: 200, // Return 200 with empty products to not break the app
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
