import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-brand-api-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const brandApiKey = req.headers.get('x-brand-api-key');
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';

    if (!brandApiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key. Include x-brand-api-key header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify brand API key
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, name, is_active')
      .eq('api_key', brandApiKey)
      .single();

    if (brandError || !brand || !brand.is_active) {
      await logApiCall(supabase, null, req.method, '/brand-api-products', 401, null, { error: 'Invalid or inactive API key' }, 'Invalid API key', clientIp);
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { method } = req;
    let result: any;
    let statusCode = 200;
    let requestBody: any = null;

    if (method === 'GET') {
      // Get all products for this brand
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('brand_id', brand.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      result = { products, count: products?.length || 0 };
    } else if (method === 'POST') {
      // Create or update products (bulk sync)
      requestBody = await req.json();
      const { products } = requestBody;

      if (!products || !Array.isArray(products)) {
        statusCode = 400;
        result = { error: 'Invalid request. Expected { products: [...] }' };
      } else {
        const productsToUpsert = products.map((p: any) => ({
          brand_id: brand.id,
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          image_url: p.image_url,
          product_url: p.product_url,
          sizes: p.sizes || [],
          colors: p.colors || [],
          tags: p.tags || [],
          is_available: p.is_available !== undefined ? p.is_available : true,
        }));

        const { data: upserted, error } = await supabase
          .from('products')
          .upsert(productsToUpsert, { onConflict: 'brand_id,name' })
          .select();

        if (error) throw error;
        
        statusCode = 201;
        result = { 
          success: true, 
          synced: upserted?.length || 0,
          products: upserted 
        };
      }
    } else if (method === 'PUT') {
      // Update specific product
      requestBody = await req.json();
      const { product_id, ...updates } = requestBody;

      if (!product_id) {
        statusCode = 400;
        result = { error: 'Missing product_id' };
      } else {
        const { data: updated, error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', product_id)
          .eq('brand_id', brand.id)
          .select()
          .single();

        if (error) throw error;
        result = { success: true, product: updated };
      }
    } else if (method === 'DELETE') {
      // Delete product
      requestBody = await req.json();
      const { product_id } = requestBody;

      if (!product_id) {
        statusCode = 400;
        result = { error: 'Missing product_id' };
      } else {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', product_id)
          .eq('brand_id', brand.id);

        if (error) throw error;
        result = { success: true, message: 'Product deleted' };
      }
    } else {
      statusCode = 405;
      result = { error: 'Method not allowed' };
    }

    await logApiCall(supabase, brand.id, method, '/brand-api-products', statusCode, requestBody, result, null, clientIp);

    return new Response(JSON.stringify(result), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function logApiCall(
  supabase: any,
  brandId: string | null,
  method: string,
  endpoint: string,
  statusCode: number,
  requestBody: any,
  responseBody: any,
  errorMessage: string | null,
  ipAddress: string
) {
  await supabase.from('brand_api_logs').insert({
    brand_id: brandId,
    endpoint,
    method,
    status_code: statusCode,
    request_body: requestBody,
    response_body: responseBody,
    error_message: errorMessage,
    ip_address: ipAddress,
  });
}