import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header - user must be authenticated');
    }

    // Create client with user context to verify authentication
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('User not authenticated');
    }

    console.log('Generating suggestions for user:', user.id);

    // Create Supabase client with service role key for data operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch current stock data
    const { data: stocks } = await supabase
      .from('thai_stocks')
      .select('*')
      .order('last_updated', { ascending: false })
      .limit(20);

    console.log('Generating AI suggestions for stocks:', stocks?.length || 0);

    // Call Lovable AI for investment analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert Thai stock market analyst specializing in helping newbie investors identify short-term profit opportunities in SET and SET50 stocks. 

Your analysis should focus on:
- Stocks suitable for beginners (low volatility, stable companies)
- Short-term profit potential (1-4 weeks holding period)
- Clear entry/exit points with stop-loss levels
- Risk assessment for each recommendation
- Educational reasoning to help beginners learn

Always provide conservative, beginner-friendly advice with proper risk management.`
          },
          {
            role: 'user',
            content: `Analyze these Thai stocks and provide 3-5 investment suggestions for newbie investors seeking short-term profits:

${stocks?.map(s => `${s.symbol} (${s.name}): ฿${s.current_price}, Change: ${s.change_percent}%, P/E: ${s.pe_ratio}, Div Yield: ${s.dividend_yield}%`).join('\n')}

For each suggestion, provide:
1. Stock symbol and name
2. Suggestion type (buy/hold/sell)
3. Profit potential percentage (realistic estimate)
4. Risk level (low/medium/high) - prefer low-medium for newbies
5. Recommended entry price
6. Recommended exit price (take profit)
7. Stop-loss price
8. Holding period
9. Reasoning (educational, 2-3 sentences)
10. Confidence score (0-1)

Return ONLY a JSON array with this exact structure:
[
  {
    "stock_symbol": "PTT",
    "stock_name": "PTT Public Company",
    "suggestion_type": "buy",
    "profit_potential": 5.5,
    "risk_level": "low",
    "recommended_entry": 38.0,
    "recommended_exit": 40.0,
    "stop_loss": 36.5,
    "holding_period": "2-3 weeks",
    "reasoning": "Strong fundamentals with consistent dividend payments. Current price shows good support level.",
    "confidence_score": 0.75
  }
]`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    console.log('AI Response:', content);

    // Parse AI response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }
    
    const suggestions = JSON.parse(jsonMatch[0]);

    // Add user_id to each suggestion
    const suggestionsWithUserId = suggestions.map((s: any) => ({
      ...s,
      user_id: user.id
    }));

    console.log('Adding user_id to suggestions:', user.id);

    // Delete old suggestions for THIS user only (keep last 24 hours)
    await supabase
      .from('investment_suggestions')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Insert new suggestions with user_id
    const { data: insertedSuggestions, error: insertError } = await supabase
      .from('investment_suggestions')
      .insert(suggestionsWithUserId)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('Inserted suggestions:', insertedSuggestions?.length);

    return new Response(
      JSON.stringify({
        success: true,
        suggestions: insertedSuggestions,
        count: insertedSuggestions?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});