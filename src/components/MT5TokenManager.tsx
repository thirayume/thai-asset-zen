import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Plus, Trash2, Key, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MT5Token {
  id: string;
  token: string;
  description: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export function MT5TokenManager() {
  const [tokens, setTokens] = useState<MT5Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTokenDescription, setNewTokenDescription] = useState('');
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('mt5_auth_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading tokens',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    if (!newTokenDescription.trim()) {
      toast({
        title: 'Description required',
        description: 'Please enter a description for this token',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Generate token using database function
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_mt5_token');

      if (tokenError) throw tokenError;

      // Store token
      const { error: insertError } = await supabase
        .from('mt5_auth_tokens')
        .insert({
          user_id: user.user.id,
          token: tokenData,
          description: newTokenDescription,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Token generated',
        description: 'New MT5 authentication token created',
      });

      setNewTokenDescription('');
      loadTokens();
    } catch (error: any) {
      toast({
        title: 'Error generating token',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast({
        title: 'Token copied',
        description: 'Token copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy token',
        variant: 'destructive',
      });
    }
  };

  const toggleTokenVisibility = (id: string) => {
    setShowTokens(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const deleteToken = async (id: string) => {
    if (!confirm('Are you sure you want to delete this token? Your MT5 EA will stop working.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('mt5_auth_tokens')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Token deleted',
        description: 'Authentication token removed',
      });

      loadTokens();
    } catch (error: any) {
      toast({
        title: 'Error deleting token',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleTokenStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('mt5_auth_tokens')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: currentStatus ? 'Token deactivated' : 'Token activated',
        description: currentStatus 
          ? 'MT5 EA will not be able to send prices'
          : 'MT5 EA can now send prices',
      });

      loadTokens();
    } catch (error: any) {
      toast({
        title: 'Error updating token',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const maskToken = (token: string) => {
    return `${token.substring(0, 10)}${'•'.repeat(20)}${token.substring(token.length - 10)}`;
  };

  if (loading) {
    return <div>Loading tokens...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          MT5 Authentication Tokens
        </CardTitle>
        <CardDescription>
          Generate secure tokens for your MT5 Expert Advisor to stream prices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertDescription>
            <strong>Security Notice:</strong> Never share your MT5 tokens. Treat them like passwords.
            If you suspect a token is compromised, delete it immediately and generate a new one.
          </AlertDescription>
        </Alert>

        {/* Generate new token */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="description">Token Description</Label>
            <Input
              id="description"
              placeholder="e.g., My Desktop MT5, VPS Server, Demo Account"
              value={newTokenDescription}
              onChange={(e) => setNewTokenDescription(e.target.value)}
            />
          </div>
          <Button onClick={generateToken} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Generate New Token
          </Button>
        </div>

        {/* Token list */}
        <div className="space-y-4">
          {tokens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tokens yet. Generate one to start streaming prices from MT5.
            </div>
          ) : (
            tokens.map((token) => (
              <div
                key={token.id}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {token.description || 'Unnamed Token'}
                      </h4>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          token.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {token.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(token.created_at).toLocaleDateString()}
                    </p>
                    {token.last_used_at && (
                      <p className="text-sm text-muted-foreground">
                        Last used: {new Date(token.last_used_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-xs font-mono overflow-x-auto">
                    {showTokens[token.id] ? token.token : maskToken(token.token)}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleTokenVisibility(token.id)}
                  >
                    {showTokens[token.id] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToken(token.token)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleTokenStatus(token.id, token.is_active)}
                    className="flex-1"
                  >
                    {token.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteToken(token.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Setup instructions */}
        <Alert>
          <AlertDescription>
            <strong>Setup Instructions:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Generate a token above</li>
              <li>Copy the token (click the copy icon)</li>
              <li>Open MT5 and attach the MT5WebSocketStreamer EA to any chart</li>
              <li>Paste your token into the "MT5Token" parameter</li>
              <li>Click OK to start streaming prices</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
