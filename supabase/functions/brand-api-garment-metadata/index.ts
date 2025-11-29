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
        JSON.stringify({ error: 'Missing API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, name, is_active')
      .eq('api_key', brandApiKey)
      .single();

    if (brandError || !brand || !brand.is_active) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { method } = req;
    let result;
    let statusCode = 200;

    if (method === 'POST') {
      // Add/update garment metadata for products
      const body = await req.json();
      const { product_id, metadata } = body;

      if (!product_id || !metadata) {
        statusCode = 400;
        result = { error: 'Missing product_id or metadata' };
      } else {
        // Verify product belongs to this brand
        const { data: product } = await supabase
          .from('products')
          .select('id')
          .eq('id', product_id)
          .eq('brand_id', brand.id)
          .single();

        if (!product) {
          statusCode = 404;
          result = { error: 'Product not found or does not belong to your brand' };
        } else {
          const { data: upserted, error } = await supabase
            .from('garment_metadata')
            .upsert({
              product_id,
              fabric_composition: metadata.fabric_composition,
              care_instructions: metadata.care_instructions,
              fit_type: metadata.fit_type,
              silhouette: metadata.silhouette,
              neckline: metadata.neckline,
              sleeve_length: metadata.sleeve_length,
              rise: metadata.rise,
              leg_opening: metadata.leg_opening,
              closure_type: metadata.closure_type,
              pattern: metadata.pattern,
              season: metadata.season,
              occasion: metadata.occasion,
              style_tags: metadata.style_tags,
              layering_position: metadata.layering_position,
              formality_level: metadata.formality_level,
              versatility_score: metadata.versatility_score,
            })
            .select()
            .single();

          if (error) throw error;
          statusCode = 201;
          result = { success: true, metadata: upserted };
        }
      }
    } else if (method === 'GET') {
      // Get metadata for brand's products
      const url = new URL(req.url);
      const productId = url.searchParams.get('product_id');

      let query = supabase
        .from('garment_metadata')
        .select('*, products!inner(brand_id)')
        .eq('products.brand_id', brand.id);

      if (productId) {
        query = query.eq('product_id', productId);
        const { data, error } = await query.single();
        if (error) throw error;
        result = { metadata: data };
      } else {
        const { data, error } = await query;
        if (error) throw error;
        result = { metadata: data, count: data?.length || 0 };
      }
    } else if (method === 'POST' && req.url.includes('/compatibility')) {
      // Set compatibility between products
      const body = await req.json();
      const { product_id, compatible_with, compatibility_score, compatibility_reasons } = body;

      if (!product_id || !compatible_with) {
        statusCode = 400;
        result = { error: 'Missing product_id or compatible_with' };
      } else {
        // Verify both products belong to this brand
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('brand_id', brand.id)
          .in('id', [product_id, compatible_with]);

        if (!products || products.length !== 2) {
          statusCode = 404;
          result = { error: 'One or both products not found or do not belong to your brand' };
        } else {
          const { data: compatibility, error } = await supabase
            .from('product_compatibility')
            .upsert({
              product_id,
              compatible_with,
              compatibility_score: compatibility_score || 1.0,
              compatibility_reasons: compatibility_reasons || {},
            })
            .select()
            .single();

          if (error) throw error;
          statusCode = 201;
          result = { success: true, compatibility };
        }
      }
    } else {
      statusCode = 405;
      result = { error: 'Method not allowed' };
    }

    await supabase.from('brand_api_logs').insert({
      brand_id: brand.id,
      endpoint: '/brand-api-garment-metadata',
      method,
      status_code: statusCode,
      request_body: await req.clone().json().catch(() => null),
      response_body: result,
      ip_address: clientIp,
    });

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