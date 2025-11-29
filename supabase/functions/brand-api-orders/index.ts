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
      // Create or update order from brand's system
      const body = await req.json();
      const {
        brand_order_id,
        user_email,
        order_status,
        tracking_number,
        tracking_url,
        items,
        total_amount,
        payment_status,
        fulfillment_status,
        shipping_address,
        metadata,
      } = body;

      if (!brand_order_id || !items || !order_status) {
        statusCode = 400;
        result = { error: 'Missing required fields: brand_order_id, items, order_status' };
      } else {
        // Find user by email if provided
        let userId = null;
        if (user_email) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', user_email)
            .single();
          userId = profile?.id || null;
        }

        const { data: order, error } = await supabase
          .from('brand_orders')
          .upsert({
            brand_id: brand.id,
            brand_order_id,
            user_id: userId,
            order_status,
            tracking_number,
            tracking_url,
            items,
            total_amount,
            payment_status,
            fulfillment_status,
            shipping_address,
            metadata,
          }, { onConflict: 'brand_id,brand_order_id' })
          .select()
          .single();

        if (error) throw error;
        statusCode = 201;
        result = { success: true, order };
      }
    } else if (method === 'PUT') {
      // Update order status or tracking
      const body = await req.json();
      const { brand_order_id, ...updates } = body;

      if (!brand_order_id) {
        statusCode = 400;
        result = { error: 'Missing brand_order_id' };
      } else {
        const { data: updated, error } = await supabase
          .from('brand_orders')
          .update(updates)
          .eq('brand_order_id', brand_order_id)
          .eq('brand_id', brand.id)
          .select()
          .single();

        if (error) throw error;
        result = { success: true, order: updated };
      }
    } else if (method === 'GET') {
      // Get orders for this brand
      const url = new URL(req.url);
      const orderId = url.searchParams.get('brand_order_id');
      const status = url.searchParams.get('status');

      let query = supabase
        .from('brand_orders')
        .select('*')
        .eq('brand_id', brand.id)
        .order('created_at', { ascending: false });

      if (orderId) {
        query = query.eq('brand_order_id', orderId);
        const { data, error } = await query.single();
        if (error) throw error;
        result = { order: data };
      } else {
        if (status) {
          query = query.eq('order_status', status);
        }
        const { data, error } = await query;
        if (error) throw error;
        result = { orders: data, count: data?.length || 0 };
      }
    } else {
      statusCode = 405;
      result = { error: 'Method not allowed' };
    }

    await supabase.from('brand_api_logs').insert({
      brand_id: brand.id,
      endpoint: '/brand-api-orders',
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