import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCw } from "lucide-react";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
}

const AdminSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch system settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleValueChange = (settingKey: string, newValue: string) => {
    setSettings(prev =>
      prev.map(setting =>
        setting.setting_key === settingKey
          ? { ...setting, setting_value: newValue }
          : setting
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      for (const setting of settings) {
        const { error } = await supabase
          .from('system_settings')
          .update({
            setting_value: setting.setting_value,
            updated_at: new Date().toISOString(),
          })
          .eq('setting_key', setting.setting_key);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "System settings updated successfully",
      });

      fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save system settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>
              Configure global platform settings
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchSettings} variant="outline" size="sm" disabled={saving}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleSave} size="sm" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {settings.map((setting) => (
          <div key={setting.id} className="space-y-2">
            <Label htmlFor={setting.setting_key} className="text-base font-semibold">
              {setting.setting_key.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </Label>
            {setting.description && (
              <p className="text-sm text-muted-foreground">{setting.description}</p>
            )}
            <Input
              id={setting.setting_key}
              value={
                typeof setting.setting_value === 'string'
                  ? setting.setting_value.replace(/"/g, '')
                  : setting.setting_value
              }
              onChange={(e) => handleValueChange(setting.setting_key, e.target.value)}
              className="max-w-md"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AdminSystemSettings;
