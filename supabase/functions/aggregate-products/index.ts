import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Product sources with affiliate programs
const PRODUCT_SOURCES = {
  ASOS: "asos",
  AMAZON: "amazon",
  SHEIN: "shein",
  NORDSTROM: "nordstrom",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, query, gender, priceRange, limit = 20 } = await req.json();

    const rapidApiKey = Deno.env.get("RAPIDAPI_KEY");
    const amazonTag = Deno.env.get("AMAZON_ASSOCIATE_TAG") || "sableaffiliat-20";

    console.log("Fetching products:", { category, query, gender });

    const allProducts = [];

    // 1. Fetch from ASOS via RapidAPI
    try {
      const asosProducts = await fetchAsosProducts(rapidApiKey, { category, query, gender, limit: 10 });
      allProducts.push(...asosProducts);
    } catch (error) {
      console.error("ASOS fetch error:", error);
    }

    // 2. Fetch from Amazon (Fashion category)
    try {
      const amazonProducts = await fetchAmazonProducts(rapidApiKey, amazonTag, { category, query, limit: 10 });
      allProducts.push(...amazonProducts);
    } catch (error) {
      console.error("Amazon fetch error:", error);
    }

    // 3. Fetch from SHEIN via RapidAPI
    try {
      const sheinProducts = await fetchSheinProducts(rapidApiKey, { category, query, limit: 10 });
      allProducts.push(...sheinProducts);
    } catch (error) {
      console.error("SHEIN fetch error:", error);
    }

    // Filter by price range if specified
    let filteredProducts = allProducts;
    if (priceRange) {
      filteredProducts = allProducts.filter(p =>
        p.price >= priceRange.min && p.price <= priceRange.max
      );
    }

    // Sort by relevance/popularity
    filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    // Limit results
    const limitedProducts = filteredProducts.slice(0, limit);

    return new Response(
      JSON.stringify({
        products: limitedProducts,
        count: limitedProducts.length,
        sources: [...new Set(limitedProducts.map(p => p.source))]
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Fetch from ASOS API
async function fetchAsosProducts(apiKey: string, params: any) {
  if (!apiKey) return [];

  try {
    const searchTerm = params.query || params.category || "clothing";
    const response = await fetch(
      `https://asos2.p.rapidapi.com/products/v2/list?store=US&offset=0&categoryId=&limit=48&country=US&sort=freshness&q=${encodeURIComponent(searchTerm)}&currency=USD&sizeSchema=US&lang=en-US`,
      {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "asos2.p.rapidapi.com"
        }
      }
    );

    if (!response.ok) {
      console.error("ASOS API error:", response.status);
      return [];
    }

    const data = await response.json();
    const products = data.products || [];

    return products.slice(0, 10).map((item: any) => ({
      id: `asos-${item.id}`,
      name: item.name,
      description: item.name,
      price: item.price?.current?.value || 0,
      originalPrice: item.price?.previous?.value,
      currency: "USD",
      image_url: `https://${item.imageUrl}`,
      product_url: `https://www.asos.com/us/prd/${item.id}`,
      brand: item.brandName || "ASOS",
      category: params.category || "Clothing",
      source: "ASOS",
      affiliate_url: `https://www.asos.com/us/prd/${item.id}`, // Add ASOS affiliate tracking
      colors: [],
      sizes: [],
      rating: 4.0,
      inStock: item.isInStock !== false
    }));
  } catch (error) {
    console.error("ASOS fetch error:", error);
    return [];
  }
}

// Fetch from Amazon Products API
async function fetchAmazonProducts(apiKey: string, amazonTag: string, params: any) {
  if (!apiKey) return [];

  try {
    const searchTerm = params.query || params.category || "women fashion";
    const response = await fetch(
      `https://amazon23.p.rapidapi.com/product-search?query=${encodeURIComponent(searchTerm)}&country=US`,
      {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "amazon23.p.rapidapi.com"
        }
      }
    );

    if (!response.ok) {
      console.error("Amazon API error:", response.status);
      return [];
    }

    const data = await response.json();
    const products = data.result || [];

    return products.slice(0, 10).map((item: any) => {
      // Add affiliate tag to Amazon URLs
      const productUrl = item.url || item.product_url || "";
      const affiliateUrl = productUrl.includes('?')
        ? `${productUrl}&tag=${amazonTag}`
        : `${productUrl}?tag=${amazonTag}`;

      return {
        id: `amazon-${item.asin || item.id}`,
        name: item.title || item.product_title,
        description: item.title || item.product_title,
        price: parseFloat(item.price?.replace('$', '') || item.product_price?.replace('$', '') || 0),
        currency: "USD",
        image_url: item.thumbnail || item.product_photo,
        product_url: productUrl,
        affiliate_url: affiliateUrl,
        brand: item.brand || "Amazon",
        category: params.category || "Clothing",
        source: "Amazon",
        colors: [],
        sizes: [],
        rating: parseFloat(item.product_star_rating || item.rating || 0),
        reviewCount: parseInt(item.product_num_ratings || 0),
        inStock: true
      };
    });
  } catch (error) {
    console.error("Amazon fetch error:", error);
    return [];
  }
}

// Fetch from SHEIN API
async function fetchSheinProducts(apiKey: string, params: any) {
  if (!apiKey) return [];

  try {
    const searchTerm = params.query || params.category || "dress";
    const response = await fetch(
      `https://shein-scraper-api.p.rapidapi.com/shein/search?query=${encodeURIComponent(searchTerm)}&page=1&limit=20&country=US`,
      {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "shein-scraper-api.p.rapidapi.com"
        }
      }
    );

    if (!response.ok) {
      console.error("SHEIN API error:", response.status);
      return [];
    }

    const data = await response.json();
    const products = data.products || data.data || [];

    return products.slice(0, 10).map((item: any) => ({
      id: `shein-${item.goods_id || item.id}`,
      name: item.goods_name || item.name,
      description: item.goods_name || item.name,
      price: parseFloat(item.salePrice?.amount || item.price || 0),
      originalPrice: parseFloat(item.retailPrice?.amount || 0),
      currency: "USD",
      image_url: item.goods_img || item.image,
      product_url: item.goods_url || `https://www.shein.com`,
      affiliate_url: item.goods_url || `https://www.shein.com`, // Add SHEIN affiliate tracking
      brand: "SHEIN",
      category: params.category || "Clothing",
      source: "SHEIN",
      colors: [],
      sizes: [],
      rating: parseFloat(item.comment_rank || 4.0),
      inStock: true
    }));
  } catch (error) {
    console.error("SHEIN fetch error:", error);
    return [];
  }
}

// Fetch from Nordstrom (if available via RapidAPI or other source)
async function fetchNordstromProducts(apiKey: string, params: any) {
  // Nordstrom affiliate program available - implement when API access is obtained
  // For now, return empty array
  return [];
}
