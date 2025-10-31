//+------------------------------------------------------------------+
//|                                        MT5WebSocketStreamer.mq5  |
//|                          Stream prices to Supabase (HTTP method) |
//+------------------------------------------------------------------+
#property copyright "Thai Portfolio Tracker"
#property version   "1.00"
#property strict

input string SupabaseURL = "https://ohuzblalbmgykwaaecds.supabase.co/functions/v1/receive-mt5-price";
input string APIKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odXpibGFsYm1neWt3YWFlY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjMzNjMsImV4cCI6MjA3NTIzOTM2M30.D6kolU3r9WOTDEbjhaRniiWHKjZV5pV_nFx2MgQ0JWw";
input string Symbols = "EURUSD,GBPUSD,USDJPY,XAUUSD";
input int SendIntervalSeconds = 2;

string symbolArray[];
datetime lastSendTime = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit() {
    Print("=== MT5 Price Streamer Initialized ===");
    Print("Supabase URL: ", SupabaseURL);
    
    // Parse symbols
    StringSplit(Symbols, StringGetCharacter(",", 0), symbolArray);
    Print("Streaming symbols: ", Symbols);
    Print("Update interval: ", SendIntervalSeconds, " seconds");
    
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
    headers += "apikey: " + APIKey + "\r\n";
    
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
            Print("ERROR: WebRequest not allowed for this URL!");
            Print("Go to: Tools -> Options -> Expert Advisors");
            Print("Add to allowed URLs: https://ohuzblalbmgykwaaecds.supabase.co");
        } else {
            Print("WebRequest error for ", symbol, ": ", error);
        }
    } else if(res == 200) {
        Print("✓ ", symbol, ": ", DoubleToString(tick.bid, 5), "/", DoubleToString(tick.ask, 5));
    } else {
        Print("HTTP error ", res, " for ", symbol);
    }
}
