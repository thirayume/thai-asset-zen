//+------------------------------------------------------------------+
//|                                        MT5WebSocketStreamer.mq5  |
//|                          Stream prices to Supabase (HTTP method) |
//|                                                                  |
//| ⚠️  SECURITY WARNING:                                            |
//|    Do NOT share this file with your MT5 Token configured!       |
//|    Do NOT commit this file to Git/GitHub!                       |
//|    Your MT5 Token is personal and should be kept secret!        |
//+------------------------------------------------------------------+
#property copyright "Thai Portfolio Tracker"
#property version   "2.00"
#property strict

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION - Please configure these settings
// ═══════════════════════════════════════════════════════════════════

input string SupabaseURL = "https://ohuzblalbmgykwaaecds.supabase.co/functions/v1/receive-mt5-price";

// ⚠️  IMPORTANT: Get your MT5 Token from the web app Settings page
// Navigate to: Settings → MT5 Integration → Generate Token
// Copy your token and paste it here (starts with "mt5_")
input string MT5Token = "";  // ← PASTE YOUR TOKEN HERE

input string Symbols = "EURUSD,GBPUSD,USDJPY,XAUUSD";
input int SendIntervalSeconds = 2;

string symbolArray[];
datetime lastSendTime = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit() {
    Print("=== MT5 Price Streamer v2.0 (Secure) ===");
    Print("Supabase URL: ", SupabaseURL);
    
    // Validate token is configured
    if(StringLen(MT5Token) == 0) {
        Print("═══════════════════════════════════════════════════════");
        Print("❌ ERROR: MT5 Token not configured!");
        Print("");
        Print("HOW TO FIX:");
        Print("1. Open your web app and login");
        Print("2. Go to Settings → MT5 Integration");
        Print("3. Click 'Generate New Token'");
        Print("4. Copy the token (starts with 'mt5_')");
        Print("5. Paste it in this EA's MT5Token parameter");
        Print("6. Re-attach the EA to the chart");
        Print("═══════════════════════════════════════════════════════");
        return INIT_FAILED;
    }
    
    // Validate token format
    if(StringSubstr(MT5Token, 0, 4) != "mt5_") {
        Print("═══════════════════════════════════════════════════════");
        Print("❌ ERROR: Invalid MT5 Token format!");
        Print("");
        Print("Token must start with 'mt5_'");
        Print("Please get a valid token from Settings → MT5 Integration");
        Print("═══════════════════════════════════════════════════════");
        return INIT_FAILED;
    }
    
    // Parse symbols
    StringSplit(Symbols, StringGetCharacter(",", 0), symbolArray);
    Print("Streaming symbols: ", Symbols);
    Print("Update interval: ", SendIntervalSeconds, " seconds");
    Print("Token configured: ✓ (", StringSubstr(MT5Token, 0, 10), "...)");
    Print("");
    Print("✅ Initialization successful! Waiting for ticks...");
    
    return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
    Print("=== MT5 Price Streamer Stopped ===");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick() {
    datetime currentTime = TimeCurrent();
    
    // Rate limit: send every X seconds
    if(currentTime - lastSendTime < SendIntervalSeconds) {
        return;
    }
    lastSendTime = currentTime;
    
    // Send prices for all configured symbols
    for(int i = 0; i < ArraySize(symbolArray); i++) {
        string symbol = symbolArray[i];
        SendPriceUpdate(symbol);
    }
}

//+------------------------------------------------------------------+
//| Send price update via HTTP POST                                  |
//+------------------------------------------------------------------+
void SendPriceUpdate(string symbol) {
    MqlTick tick;
    if(!SymbolInfoTick(symbol, tick)) {
        Print("Failed to get tick for ", symbol);
        return;
    }
    
    // Build JSON payload
    string json = "{";
    json += "\"symbol\":\"" + symbol + "\",";
    json += "\"bid\":" + DoubleToString(tick.bid, 5) + ",";
    json += "\"ask\":" + DoubleToString(tick.ask, 5) + ",";
    json += "\"volume\":" + IntegerToString(tick.volume);
    json += "}";
    
    // Prepare HTTP request
    char post[];
    char result[];
    string headers;
    
    StringToCharArray(json, post, 0, StringLen(json));
    
    headers = "Content-Type: application/json\r\n";
    headers += "x-mt5-token: " + MT5Token + "\r\n";
    
    // Send request
    ResetLastError();
    int res = WebRequest(
        "POST",
        SupabaseURL,
        headers,
        5000,  // 5 second timeout
        post,
        result,
        headers
    );
    
    if(res == -1) {
        int error = GetLastError();
        if(error == 4060) {
            Print("═══════════════════════════════════════════════════════");
            Print("❌ ERROR: WebRequest not allowed for this URL!");
            Print("");
            Print("HOW TO FIX:");
            Print("1. Go to: Tools → Options → Expert Advisors");
            Print("2. Check 'Allow WebRequest for listed URL'");
            Print("3. Add to allowed URLs:");
            Print("   https://ohuzblalbmgykwaaecds.supabase.co");
            Print("4. Click OK and restart MT5");
            Print("═══════════════════════════════════════════════════════");
        } else {
            Print("❌ WebRequest error for ", symbol, ": ", error);
        }
    } else if(res == 200) {
        Print("✓ ", symbol, ": ", DoubleToString(tick.bid, 5), "/", DoubleToString(tick.ask, 5));
    } else if(res == 401) {
        Print("═══════════════════════════════════════════════════════");
        Print("❌ AUTHENTICATION ERROR (HTTP 401)");
        Print("");
        Print("Your MT5 Token is invalid or has been deactivated.");
        Print("");
        Print("HOW TO FIX:");
        Print("1. Go to web app → Settings → MT5 Integration");
        Print("2. Check if your token is still active");
        Print("3. If deactivated, generate a new token");
        Print("4. Update the MT5Token parameter with the new token");
        Print("5. Re-attach this EA to the chart");
        Print("═══════════════════════════════════════════════════════");
    } else if(res == 429) {
        Print("⚠️  Rate limit exceeded for ", symbol, " - waiting 60 seconds...");
    } else {
        Print("❌ HTTP ", res, " error for ", symbol);
    }
}
