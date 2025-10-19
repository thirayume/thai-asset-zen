import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getRateLimitHeaders, extractUserId } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit: 10 calls per hour (admin only function)
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const userId = extractUserId(req.headers.get('authorization'));
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const rateLimitResult = checkRateLimit(userId, RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: rateLimitResult.message }),
        { 
          status: 429,
          headers: { ...corsHeaders, ...getRateLimitHeaders(rateLimitResult), 'Content-Type': 'application/json' }
        }
      );
    }
    console.log('Starting trading signals generation...');
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LOVABLE_API_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch current stocks
    const { data: stocks, error: stocksError } = await supabase
      .from('thai_stocks')
      .select('*')
      .order('market_cap', { ascending: false })
      .limit(15);

    if (stocksError) throw stocksError;
    console.log(`Analyzing ${stocks?.length || 0} stocks`);

    // Fetch historical data for each stock
    const signals = [];

    for (const stock of stocks || []) {
      try {
        const { data: history, error: historyError } = await supabase
          .from('stock_price_history')
          .select('*')
          .eq('stock_symbol', stock.symbol)
          .gte('recorded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('recorded_at', { ascending: true });

        if (historyError || !history || history.length < 5) {
          console.log(`Insufficient data for ${stock.symbol} (need at least 5 data points, have ${history?.length || 0})`);
          continue;
        }

        // Calculate technical indicators
        const prices = history.map(h => Number(h.close_price));
        const volumes = history.map(h => Number(h.volume));

        // RSI calculation (adaptive period based on available data)
        const rsiPeriod = Math.min(14, Math.max(5, prices.length - 1));
        const rsi = calculateRSI(prices, rsiPeriod);
        
        // Moving averages (adaptive periods)
        const ma20Period = Math.min(20, prices.length);
        const ma50Period = Math.min(50, prices.length);
        const ma20 = calculateSMA(prices, ma20Period);
        const ma50 = calculateSMA(prices, ma50Period);
        
        // Volume analysis
        const avgVolume = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / (volumes.length - 1);
        const volumeChange = ((volumes[volumes.length - 1] - avgVolume) / avgVolume) * 100;

        // Price change
        const priceChange = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;

        // Prepare context for AI analysis
        const dataPointsNote = history.length < 14 
          ? `\nNote: Limited historical data available (${history.length} data points). Analysis based on available data.` 
          : '';
        
        const technicalContext = `
Stock: ${stock.symbol} (${stock.name})
Current Price: ฿${stock.current_price}
Change: ${stock.change_percent}%

Technical Indicators:
- RSI (${rsiPeriod}): ${rsi.toFixed(2)}
- MA${ma20Period}: ฿${ma20.toFixed(2)}
- MA${ma50Period}: ฿${ma50.toFixed(2)}
- Volume Change: ${volumeChange.toFixed(1)}%
- ${history.length}-day Price Change: ${priceChange.toFixed(2)}%
- P/E Ratio: ${stock.pe_ratio}
- Dividend Yield: ${(stock.dividend_yield * 100).toFixed(2)}%${dataPointsNote}

Historical Price Trend (last ${Math.min(7, history.length)} days):
${history.slice(-7).map(h => `${new Date(h.recorded_at).toLocaleDateString()}: ฿${Number(h.close_price).toFixed(2)}`).join('\n')}
`;

        console.log(`Analyzing ${stock.symbol} with AI...`);

        // Call Lovable AI for analysis
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
                content: 'You are an expert stock market analyst specializing in Thai stocks. Analyze technical indicators and provide clear, actionable trading signals.'
              },
              {
                role: 'user',
                content: `Analyze this stock and provide a trading signal:\n\n${technicalContext}\n\nProvide your analysis in this exact JSON format:\n{\n  "signal": "BUY" or "SELL" or "HOLD",\n  "confidence": number from 0-100,\n  "reasoning": "Brief explanation in 1-2 sentences",\n  "target_price": number (estimated target price),\n  "stop_loss": number (suggested stop loss price)\n}`
              }
            ],
            temperature: 0.3,
          }),
        });

        if (!aiResponse.ok) {
          if (aiResponse.status === 429) {
            console.error('Rate limit exceeded');
            break; // Stop processing more stocks
          }
          console.error(`AI analysis failed for ${stock.symbol}: ${aiResponse.status}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices[0].message.content;
        
        // Parse AI response
        let analysis;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (parseError) {
          console.error(`Failed to parse AI response for ${stock.symbol}:`, parseError);
          continue;
        }

        // Store signal
        const signal = {
          stock_symbol: stock.symbol,
          stock_name: stock.name,
          signal_type: analysis.signal,
          confidence_score: Math.min(Math.max(analysis.confidence, 0), 100),
          reasoning: analysis.reasoning,
          indicators: {
            rsi,
            ma20,
            ma50,
            volumeChange,
            priceChange,
          },
          current_price: stock.current_price,
          target_price: analysis.target_price || null,
          stop_loss: analysis.stop_loss || null,
        };

        signals.push(signal);
        console.log(`Generated ${analysis.signal} signal for ${stock.symbol}`);

      } catch (stockError) {
        console.error(`Error analyzing ${stock.symbol}:`, stockError);
      }
    }

    // Delete old signals
    await supabase
      .from('trading_signals')
      .delete()
      .lt('expires_at', new Date().toISOString());

    // Insert new signals
    if (signals.length > 0) {
      const { error: insertError } = await supabase
        .from('trading_signals')
        .insert(signals);

      if (insertError) {
        console.error('Error inserting signals:', insertError);
        throw insertError;
      }

      console.log(`Successfully generated ${signals.length} trading signals`);
    }

    const message = signals.length > 0 
      ? `Successfully generated ${signals.length} trading signals`
      : 'No signals generated. Waiting for more historical data to accumulate.';
    
    console.log(message);

    return new Response(
      JSON.stringify({
        success: true,
        signalsGenerated: signals.length,
        message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error generating trading signals:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper functions
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  
  const slice = prices.slice(-period);
  const sum = slice.reduce((acc: number, price: number) => acc + price, 0);
  return sum / period;
}
