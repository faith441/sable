import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sable-api-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const apiKey = req.headers.get('x-sable-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: keyData, error: keyError } = await supabase
      .from('external_api_keys')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: withinLimits } = await supabase.rpc('check_rate_limit', {
      _api_key_id: keyData.id,
      _rate_limit_per_minute: keyData.rate_limit_per_minute,
      _rate_limit_per_day: keyData.rate_limit_per_day,
    });

    if (!withinLimits) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { style_type, budget_range, lifestyle, occasions, num_items = 10 } = body;

    if (!style_type || !budget_range) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: style_type, budget_range' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get products matching criteria
    let query = supabase
      .from('products')
      .select('*, brands(name), garment_metadata(*)')
      .eq('is_available', true)
      .limit(num_items);

    if (occasions && Array.isArray(occasions)) {
      query = query.contains('tags', occasions);
    }

    const { data: products, error: productsError } = await query;

    if (productsError) throw productsError;

    // Use AI to curate and explain the wardrobe
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const systemPrompt = `You are Sable's AI wardrobe curator. Create a cohesive capsule wardrobe recommendation explaining why these pieces work together.`;

    const userPrompt = `Create a capsule wardrobe for:
Style: ${style_type}
Budget: ${budget_range}
Lifestyle: ${lifestyle || 'versatile'}
Occasions: ${occasions ? occasions.join(', ') : 'everyday'}

Available products: ${JSON.stringify(products?.slice(0, 20) || [])}

Explain how these pieces work together as a cohesive wardrobe.`;

    const aiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    const aiData = await aiResponse.json();
    const curation_notes = aiData.choices[0].message.content;

    const requestTokens = userPrompt.length / 4;
    const responseTokens = curation_notes.length / 4;

    await supabase.from('external_api_usage').insert({
      api_key_id: keyData.id,
      endpoint: '/external-api-wardrobe-recommendations',
      method: 'POST',
      status_code: 200,
      request_tokens: Math.round(requestTokens),
      response_tokens: Math.round(responseTokens),
      total_tokens: Math.round(requestTokens + responseTokens),
      response_time_ms: Date.now() - startTime,
    });

    await supabase
      .from('external_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id);

    return new Response(
      JSON.stringify({
        wardrobe: {
          items: products || [],
          total_items: products?.length || 0,
          curation_notes,
          style_type,
          budget_range,
        },
        metadata: {
          response_time_ms: Date.now() - startTime,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});