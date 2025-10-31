import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RealTimeChart } from './RealTimeChart';
import { Button } from './ui/button';
import { Activity, TrendingUp, Download } from 'lucide-react';

const FOREX_PAIRS = [
  { symbol: 'EURUSD', name: 'Euro / US Dollar' },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar' },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen' },
  { symbol: 'XAUUSD', name: 'Gold / US Dollar' },
];

export function MT5TradingPanel() {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                MT5 Real-Time Trading
              </CardTitle>
              <CardDescription>
                Live forex prices streamed from your MetaTrader 5 terminal
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/MT5_SETUP_GUIDE.md" download>
                <Download className="h-4 w-4 mr-2" />
                Setup Guide
              </a>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Symbol Selector */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <TabsList className="grid w-full grid-cols-4">
              {FOREX_PAIRS.map((pair) => (
                <TabsTrigger key={pair.symbol} value={pair.symbol}>
                  {pair.symbol}
                </TabsTrigger>
              ))}
            </TabsList>

            {FOREX_PAIRS.map((pair) => (
              <TabsContent key={pair.symbol} value={pair.symbol} className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{pair.name}</h3>
                    <Button variant="ghost" size="sm">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Generate AI Signal
                    </Button>
                  </div>
                  <RealTimeChart symbol={pair.symbol} height={500} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold">1. Install MT5 EA</h4>
              <p className="text-sm text-muted-foreground">
                Copy <code className="bg-muted px-1 rounded">MT5WebSocketStreamer.mq5</code> to your MT5 Experts folder and attach to any chart.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">2. Run Python Bot</h4>
              <p className="text-sm text-muted-foreground">
                Configure <code className="bg-muted px-1 rounded">.env</code> with your MT5 credentials and run <code className="bg-muted px-1 rounded">python mt5_trading_bot.py</code>
              </p>
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> All files are in your project root. See <code className="bg-muted px-1 rounded">MT5_SETUP_GUIDE.md</code> for complete instructions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
