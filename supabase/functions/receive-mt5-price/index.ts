import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { rateLimit } from '../_shared/rateLimit.ts';
import { validateMT5Price, sanitizePriceData } from '../_shared/mt5Validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-mt5-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Rate Limiting (100 requests per minute per IP)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rateLimitResult = await rateLimit(req, 100, 60);
    
    if (!rateLimitResult.allowed) {
      console.warn(`[receive-mt5-price] Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before sending more requests.' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      );
    }

    // 2. Token Authentication
    const mt5Token = req.headers.get('x-mt5-token');
    
    if (!mt5Token) {
      await supabase.from('security_audit_log').insert({
        event_type: 'mt5_invalid_token',
        ip_address: clientIp,
        details: { error: 'Missing MT5 token header' }
      });
      
      return new Response(
        JSON.stringify({ error: 'Missing MT5 authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token format
    if (!mt5Token.startsWith('mt5_')) {
      await supabase.from('security_audit_log').insert({
        event_type: 'mt5_invalid_token',
        ip_address: clientIp,
        details: { error: 'Invalid token format' }
      });
      
      return new Response(
        JSON.stringify({ error: 'Invalid MT5 token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token and get user_id
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('validate_mt5_token', { token_value: mt5Token });

    if (tokenError || !tokenData) {
      await supabase.from('security_audit_log').insert({
        event_type: 'mt5_token_rejected',
        ip_address: clientIp,
        details: { token: mt5Token.substring(0, 10) + '...', error: tokenError?.message }
      });
      
      console.warn(`[receive-mt5-price] Invalid token attempt from ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive MT5 token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = tokenData;

    // 3. Parse and validate input
    const requestData = await req.json();
    const { symbol, bid, ask, volume } = requestData;
    
    // Basic field check
    if (!symbol || bid === undefined || ask === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: symbol, bid, ask' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Comprehensive validation
    const validation = validateMT5Price(requestData);
    if (!validation.valid) {
      console.warn(`[receive-mt5-price] Validation failed: ${validation.error}`);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize data
    const sanitizedData = sanitizePriceData(requestData);
    
    // 4. Store tick in database
    const { error: insertError } = await supabase
      .from('mt5_ticks')
      .insert({
        user_id: userId,
        symbol: sanitizedData.symbol,
        bid: sanitizedData.bid,
        ask: sanitizedData.ask,
        volume: sanitizedData.volume,
        timestamp: new Date().toISOString(),
      });
    
    if (insertError) {
      console.error('[receive-mt5-price] Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 5. Broadcast to realtime channel
    const channel = supabase.channel('mt5_prices');
    await channel.send({
      type: 'broadcast',
      event: 'price_update',
      payload: { 
        symbol: sanitizedData.symbol, 
        bid: sanitizedData.bid, 
        ask: sanitizedData.ask, 
        time: new Date().toISOString() 
      },
    });
    
    // 6. Audit log (successful price received)
    await supabase.from('security_audit_log').insert({
      user_id: userId,
      event_type: 'mt5_price_received',
      ip_address: clientIp,
      details: { 
        symbol: sanitizedData.symbol,
        bid: sanitizedData.bid,
        ask: sanitizedData.ask
      }
    });
    
    console.log(`[receive-mt5-price] ${sanitizedData.symbol}: ${sanitizedData.bid}/${sanitizedData.ask} (user: ${userId.substring(0, 8)}...)`);
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[receive-mt5-price] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
