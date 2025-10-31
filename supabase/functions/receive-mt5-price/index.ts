import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { symbol, bid, ask, volume } = await req.json();
    
    // Validate input
    if (!symbol || !bid || !ask) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: symbol, bid, ask' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Store tick
    const { error } = await supabase
      .from('mt5_ticks')
      .insert({
        symbol,
        bid: parseFloat(bid),
        ask: parseFloat(ask),
        volume: volume ? parseInt(volume) : 0,
        timestamp: new Date(),
      });
    
    if (error) {
      console.error('[receive-mt5-price] Insert error:', error);
      throw error;
    }
    
    // Broadcast to realtime channel
    const channel = supabase.channel('mt5_prices');
    await channel.send({
      type: 'broadcast',
      event: 'price_update',
      payload: { symbol, bid, ask, time: new Date().toISOString() },
    });
    
    console.log(`[receive-mt5-price] ${symbol}: ${bid}/${ask}`);
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[receive-mt5-price] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Failed to process price update' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
