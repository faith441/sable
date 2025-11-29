import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-brand-api-key, x-webhook-signature',
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
    const webhookSignature = req.headers.get('x-webhook-signature');
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';

    if (!brandApiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, name, is_active, webhook_url')
      .eq('api_key', brandApiKey)
      .single();

    if (brandError || !brand || !brand.is_active) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { event_type, data, timestamp } = body;

    if (!event_type || !data) {
      return new Response(
        JSON.stringify({ error: 'Missing event_type or data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log webhook event
    await supabase.from('brand_api_logs').insert({
      brand_id: brand.id,
      endpoint: '/brand-api-webhooks',
      method: 'POST',
      status_code: 200,
      request_body: { event_type, data, timestamp },
      response_body: { received: true },
      ip_address: clientIp,
    });

    // Handle different webhook event types
    let result: any = { received: true };

    switch (event_type) {
      case 'order.created':
      case 'order.updated':
      case 'order.fulfilled':
      case 'order.cancelled':
        // Update order in brand_orders table
        const orderData = data;
        await supabase.from('brand_orders').upsert({
          brand_id: brand.id,
          brand_order_id: orderData.id || orderData.order_id,
          order_status: orderData.status,
          tracking_number: orderData.tracking_number,
          tracking_url: orderData.tracking_url,
          items: orderData.items || orderData.line_items,
          total_amount: orderData.total_amount || orderData.total,
          payment_status: orderData.payment_status,
          fulfillment_status: orderData.fulfillment_status,
          metadata: { webhook_event: event_type, received_at: timestamp },
        }, { onConflict: 'brand_id,brand_order_id' });
        result = { received: true, processed: 'order_updated' };
        break;

      case 'product.created':
      case 'product.updated':
        // Update product in products table
        const productData = data;
        await supabase.from('products').upsert({
          brand_id: brand.id,
          name: productData.name || productData.title,
          description: productData.description,
          price: productData.price,
          category: productData.category || productData.product_type,
          image_url: productData.image_url || productData.image,
          product_url: productData.product_url || productData.url,
          sizes: productData.sizes || productData.variants?.map((v: any) => v.size),
          colors: productData.colors,
          tags: productData.tags,
          is_available: productData.is_available !== false,
        }, { onConflict: 'brand_id,name' });
        result = { received: true, processed: 'product_updated' };
        break;

      case 'inventory.updated':
        // Update product availability based on inventory
        const inventoryData = data;
        await supabase.from('products').update({
          is_available: inventoryData.in_stock !== false && inventoryData.quantity > 0,
        }).eq('id', inventoryData.product_id);
        result = { received: true, processed: 'inventory_updated' };
        break;

      case 'payment.completed':
      case 'payment.failed':
        // Update payment status in brand_orders
        const paymentData = data;
        await supabase.from('brand_orders').update({
          payment_status: event_type === 'payment.completed' ? 'paid' : 'failed',
        }).eq('brand_order_id', paymentData.order_id).eq('brand_id', brand.id);
        result = { received: true, processed: 'payment_updated' };
        break;

      default:
        result = { received: true, event_type, note: 'Event logged but not processed' };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
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