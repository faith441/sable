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
        JSON.stringify({ error: 'Missing API key. Include x-sable-api-key header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify API key
    const { data: keyData, error: keyError } = await supabase
      .from('external_api_keys')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      await logUsage(supabase, null, '/external-api-style-consultation', 'POST', 401, 0, 0, Date.now() - startTime, 'Invalid API key');
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limits
    const { data: withinLimits } = await supabase.rpc('check_rate_limit', {
      _api_key_id: keyData.id,
      _rate_limit_per_minute: keyData.rate_limit_per_minute,
      _rate_limit_per_day: keyData.rate_limit_per_day,
    });

    if (!withinLimits) {
      await logUsage(supabase, keyData.id, '/external-api-style-consultation', 'POST', 429, 0, 0, Date.now() - startTime, 'Rate limit exceeded');
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please upgrade your tier or wait.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { user_preferences, occasion, budget, question } = body;

    if (!user_preferences || !question) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_preferences, question' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate AI style consultation using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const systemPrompt = `You are Sable's AI style consultant. Provide personalized fashion advice based on user preferences, budget, and occasion. Be specific, practical, and consider current trends while respecting the user's personal style.`;

    const userPrompt = `User Preferences: ${JSON.stringify(user_preferences)}
${occasion ? `Occasion: ${occasion}` : ''}
${budget ? `Budget: ${budget}` : ''}

Question: ${question}

Provide detailed style advice including specific garment types, colors, and styling tips.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
    const advice = aiData.choices[0].message.content;

    const requestTokens = userPrompt.length / 4; // Rough estimate
    const responseTokens = advice.length / 4;

    await logUsage(supabase, keyData.id, '/external-api-style-consultation', 'POST', 200, requestTokens, responseTokens, Date.now() - startTime, null);

    // Update last used
    await supabase
      .from('external_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id);

    return new Response(
      JSON.stringify({
        advice,
        metadata: {
          occasion: occasion || 'general',
          budget: budget || 'not specified',
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

async function logUsage(
  supabase: any,
  apiKeyId: string | null,
  endpoint: string,
  method: string,
  statusCode: number,
  requestTokens: number,
  responseTokens: number,
  responseTimeMs: number,
  errorMessage: string | null
) {
  await supabase.from('external_api_usage').insert({
    api_key_id: apiKeyId,
    endpoint,
    method,
    status_code: statusCode,
    request_tokens: Math.round(requestTokens),
    response_tokens: Math.round(responseTokens),
    total_tokens: Math.round(requestTokens + responseTokens),
    response_time_ms: responseTimeMs,
    error_message: errorMessage,
  });
}