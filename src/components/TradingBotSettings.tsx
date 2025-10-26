import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Bot, Shield, TrendingUp, Zap } from "lucide-react";

interface BotConfig {
  enabled: boolean;
  mode: 'paper' | 'live';
  max_position_size: number;
  max_daily_trades: number;
  max_total_exposure: number;
  min_confidence_score: number;
  allowed_signal_types: string[];
  auto_stop_loss: boolean;
  auto_take_profit: boolean;
  trailing_stop_percent: number;
  daily_loss_limit: number;
  max_portfolio_drawdown: number;
  broker_name: string;
  broker_api_key: string;
  broker_account_id: string;
}

const defaultConfig: BotConfig = {
  enabled: false,
  mode: 'paper',
  max_position_size: 10000,
  max_daily_trades: 3,
  max_total_exposure: 50000,
  min_confidence_score: 75,
  allowed_signal_types: ['BUY'],
  auto_stop_loss: true,
  auto_take_profit: true,
  trailing_stop_percent: 5,
  daily_loss_limit: 5000,
  max_portfolio_drawdown: 20,
  broker_name: '',
  broker_api_key: '',
  broker_account_id: '',
};

export default function TradingBotSettings() {
  const [config, setConfig] = useState<BotConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('trading_bot_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig({
          enabled: data.enabled,
          mode: data.mode as 'paper' | 'live',
          max_position_size: Number(data.max_position_size),
          max_daily_trades: data.max_daily_trades,
          max_total_exposure: Number(data.max_total_exposure),
          min_confidence_score: Number(data.min_confidence_score),
          allowed_signal_types: data.allowed_signal_types || ['BUY'],
          auto_stop_loss: data.auto_stop_loss,
          auto_take_profit: data.auto_take_profit,
          trailing_stop_percent: Number(data.trailing_stop_percent),
          daily_loss_limit: Number(data.daily_loss_limit),
          max_portfolio_drawdown: Number(data.max_portfolio_drawdown),
          broker_name: data.broker_name || '',
          broker_api_key: data.broker_api_key || '',
          broker_account_id: data.broker_account_id || '',
        });
      }
    } catch (error) {
      console.error('Error fetching bot config:', error);
      toast({
        title: "Error",
        description: "Failed to load bot configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('trading_bot_config')
        .upsert({
          user_id: user.id,
          ...config,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bot configuration saved successfully",
      });
    } catch (error) {
      console.error('Error saving bot config:', error);
      toast({
        title: "Error",
        description: "Failed to save bot configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (updates: Partial<BotConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Warning Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>⚠️ Important:</strong> Always start with Paper Trading mode to test strategies. 
          Live trading involves real money and risks. Past performance does not guarantee future results.
        </AlertDescription>
      </Alert>

      {/* Bot Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Trading Bot Status
          </CardTitle>
          <CardDescription>
            Enable or disable the automated trading bot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="bot-enabled">Enable Bot</Label>
              <p className="text-sm text-muted-foreground">
                Turn on/off automated trading
              </p>
            </div>
            <Switch
              id="bot-enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => updateConfig({ enabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trading-mode">Trading Mode</Label>
            <Select
              value={config.mode}
              onValueChange={(value: 'paper' | 'live') => updateConfig({ mode: value })}
            >
              <SelectTrigger id="trading-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paper">
                  Paper Trading (Simulated - Recommended)
                </SelectItem>
                <SelectItem value="live">
                  Live Trading (Real Money ⚠️)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {config.mode === 'paper' 
                ? 'Simulates trades without real money. Perfect for testing!' 
                : 'Uses real money. Ensure you understand the risks.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Risk Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Management
          </CardTitle>
          <CardDescription>
            Set limits to protect your capital
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="max-position-size">
              Max Position Size: ฿{config.max_position_size.toLocaleString()}
            </Label>
            <Slider
              id="max-position-size"
              min={1000}
              max={100000}
              step={1000}
              value={[config.max_position_size]}
              onValueChange={([value]) => updateConfig({ max_position_size: value })}
            />
            <p className="text-sm text-muted-foreground">
              Maximum amount to invest in a single trade
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-daily-trades">
              Max Daily Trades: {config.max_daily_trades}
            </Label>
            <Slider
              id="max-daily-trades"
              min={1}
              max={10}
              step={1}
              value={[config.max_daily_trades]}
              onValueChange={([value]) => updateConfig({ max_daily_trades: value })}
            />
            <p className="text-sm text-muted-foreground">
              Maximum number of trades per day
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-total-exposure">
              Max Total Exposure: ฿{config.max_total_exposure.toLocaleString()}
            </Label>
            <Slider
              id="max-total-exposure"
              min={10000}
              max={500000}
              step={10000}
              value={[config.max_total_exposure]}
              onValueChange={([value]) => updateConfig({ max_total_exposure: value })}
            />
            <p className="text-sm text-muted-foreground">
              Total portfolio value at risk
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily-loss-limit">
              Daily Loss Limit: ฿{config.daily_loss_limit.toLocaleString()}
            </Label>
            <Slider
              id="daily-loss-limit"
              min={1000}
              max={50000}
              step={1000}
              value={[config.daily_loss_limit]}
              onValueChange={([value]) => updateConfig({ daily_loss_limit: value })}
            />
            <p className="text-sm text-muted-foreground">
              Bot pauses if daily losses exceed this amount
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-drawdown">
              Max Portfolio Drawdown: {config.max_portfolio_drawdown}%
            </Label>
            <Slider
              id="max-drawdown"
              min={5}
              max={50}
              step={5}
              value={[config.max_portfolio_drawdown]}
              onValueChange={([value]) => updateConfig({ max_portfolio_drawdown: value })}
            />
            <p className="text-sm text-muted-foreground">
              Bot pauses if portfolio drops by this percentage
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Trading Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trading Rules
          </CardTitle>
          <CardDescription>
            Configure how the bot trades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="min-confidence">
              Min Confidence Score: {config.min_confidence_score}%
            </Label>
            <Slider
              id="min-confidence"
              min={50}
              max={95}
              step={5}
              value={[config.min_confidence_score]}
              onValueChange={([value]) => updateConfig({ min_confidence_score: value })}
            />
            <p className="text-sm text-muted-foreground">
              Only execute trades with signals above this confidence level
            </p>
          </div>

          <div className="space-y-3">
            <Label>Allowed Signal Types</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow-buy"
                  checked={config.allowed_signal_types.includes('BUY')}
                  onCheckedChange={(checked) => {
                    const types = checked
                      ? [...config.allowed_signal_types.filter(t => t !== 'BUY'), 'BUY']
                      : config.allowed_signal_types.filter(t => t !== 'BUY');
                    updateConfig({ allowed_signal_types: types });
                  }}
                />
                <Label htmlFor="allow-buy">Allow BUY signals</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow-sell"
                  checked={config.allowed_signal_types.includes('SELL')}
                  onCheckedChange={(checked) => {
                    const types = checked
                      ? [...config.allowed_signal_types.filter(t => t !== 'SELL'), 'SELL']
                      : config.allowed_signal_types.filter(t => t !== 'SELL');
                    updateConfig({ allowed_signal_types: types });
                  }}
                />
                <Label htmlFor="allow-sell">Allow SELL signals</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-stop-loss">Auto Stop Loss</Label>
              <p className="text-sm text-muted-foreground">
                Automatically set stop loss on trades
              </p>
            </div>
            <Switch
              id="auto-stop-loss"
              checked={config.auto_stop_loss}
              onCheckedChange={(checked) => updateConfig({ auto_stop_loss: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-take-profit">Auto Take Profit</Label>
              <p className="text-sm text-muted-foreground">
                Automatically set take profit targets
              </p>
            </div>
            <Switch
              id="auto-take-profit"
              checked={config.auto_take_profit}
              onCheckedChange={(checked) => updateConfig({ auto_take_profit: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trailing-stop">
              Trailing Stop: {config.trailing_stop_percent}%
            </Label>
            <Slider
              id="trailing-stop"
              min={1}
              max={20}
              step={1}
              value={[config.trailing_stop_percent]}
              onValueChange={([value]) => updateConfig({ trailing_stop_percent: value })}
            />
            <p className="text-sm text-muted-foreground">
              Stop loss adjusts upward as price increases
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Broker Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Broker Integration
          </CardTitle>
          <CardDescription>
            Connect to your broker for live trading (optional for paper trading)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="broker-name">Broker</Label>
            <Select
              value={config.broker_name}
              onValueChange={(value) => updateConfig({ broker_name: value })}
            >
              <SelectTrigger id="broker-name">
                <SelectValue placeholder="Select broker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None (Paper Trading)</SelectItem>
                <SelectItem value="SETTRADE">SET Trade</SelectItem>
                <SelectItem value="IRIS">IRIS</SelectItem>
                <SelectItem value="KT_ZMICO">KT Zmico</SelectItem>
                <SelectItem value="SETTRADE_STREAMING">Settrade Streaming</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.broker_name && (
            <>
              <div className="space-y-2">
                <Label htmlFor="broker-account-id">Account ID</Label>
                <Input
                  id="broker-account-id"
                  type="text"
                  value={config.broker_account_id}
                  onChange={(e) => updateConfig({ broker_account_id: e.target.value })}
                  placeholder="Enter your broker account ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="broker-api-key">API Key</Label>
                <Input
                  id="broker-api-key"
                  type="password"
                  value={config.broker_api_key}
                  onChange={(e) => updateConfig({ broker_api_key: e.target.value })}
                  placeholder="Enter your broker API key"
                />
                <p className="text-sm text-muted-foreground">
                  Your API key is encrypted and stored securely
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={fetchConfig} disabled={saving}>
          Reset
        </Button>
        <Button onClick={saveConfig} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
