import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Copy, Eye, EyeOff, Trash2, TrendingUp } from "lucide-react";

const ExternalAPIManager = () => {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [formData, setFormData] = useState({
    key_name: "",
    organization_name: "",
    contact_email: "",
    tier: "free",
    rate_limit_per_minute: 10,
    rate_limit_per_day: 1000,
    monthly_quota: 10000,
  });

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from("external_api_keys")
        .select("*, external_api_usage(count)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error("Error loading API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    return `sbl_${crypto.randomUUID().replace(/-/g, '')}`;
  };

  const handleCreate = async () => {
    try {
      const apiKey = generateApiKey();
      const { error } = await supabase.from("external_api_keys").insert([{
        ...formData,
        api_key: apiKey,
      }]);

      if (error) throw error;
      toast.success("API key created successfully");
      setDialogOpen(false);
      setFormData({
        key_name: "",
        organization_name: "",
        contact_email: "",
        tier: "free",
        rate_limit_per_minute: 10,
        rate_limit_per_day: 1000,
        monthly_quota: 10000,
      });
      loadApiKeys();
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error("Failed to create API key");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will revoke access for this API key.")) return;

    try {
      const { error } = await supabase
        .from("external_api_keys")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("API key deleted successfully");
      loadApiKeys();
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("Failed to delete API key");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("external_api_keys")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(`API key ${!currentStatus ? 'activated' : 'deactivated'}`);
      loadApiKeys();
    } catch (error) {
      console.error("Error toggling API key:", error);
      toast.error("Failed to update API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API key copied to clipboard");
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'default';
      case 'premium': return 'secondary';
      case 'basic': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) return <div>Loading API keys...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">External API Management</h2>
          <p className="text-muted-foreground">Manage API keys for LLM integrations and third-party access</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key for external integration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Key Name</Label>
                <Input
                  placeholder="Production Key, ChatGPT Integration, etc."
                  value={formData.key_name}
                  onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Organization Name</Label>
                <Input
                  placeholder="Acme Inc."
                  value={formData.organization_name}
                  onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  placeholder="contact@example.com"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>
              <div>
                <Label>Tier</Label>
                <Select value={formData.tier} onValueChange={(value) => {
                  const tierConfig = {
                    free: { rpm: 10, rpd: 1000, quota: 10000 },
                    basic: { rpm: 60, rpd: 10000, quota: 100000 },
                    premium: { rpm: 300, rpd: 50000, quota: 500000 },
                    enterprise: { rpm: 1000, rpd: 200000, quota: 2000000 },
                  }[value as keyof typeof tierConfig] || { rpm: 10, rpd: 1000, quota: 10000 };
                  
                  setFormData({
                    ...formData,
                    tier: value,
                    rate_limit_per_minute: tierConfig.rpm,
                    rate_limit_per_day: tierConfig.rpd,
                    monthly_quota: tierConfig.quota,
                  });
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free (10 req/min)</SelectItem>
                    <SelectItem value="basic">Basic (60 req/min) - $49/mo</SelectItem>
                    <SelectItem value="premium">Premium (300 req/min) - $199/mo</SelectItem>
                    <SelectItem value="enterprise">Enterprise (Custom)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Requests/Minute</Label>
                  <Input
                    type="number"
                    value={formData.rate_limit_per_minute}
                    onChange={(e) => setFormData({ ...formData, rate_limit_per_minute: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Requests/Day</Label>
                  <Input
                    type="number"
                    value={formData.rate_limit_per_day}
                    onChange={(e) => setFormData({ ...formData, rate_limit_per_day: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Monthly Quota</Label>
                  <Input
                    type="number"
                    value={formData.monthly_quota}
                    onChange={(e) => setFormData({ ...formData, monthly_quota: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create API Key</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active API Keys</CardTitle>
          <CardDescription>Total: {apiKeys.length} API keys</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.key_name}</TableCell>
                  <TableCell>{key.organization_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs">
                        {showKeys[key.id] ? key.api_key : '••••••••••••••••'}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowKeys({ ...showKeys, [key.id]: !showKeys[key.id] })}
                      >
                        {showKeys[key.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(key.api_key)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTierBadgeVariant(key.tier)}>
                      {key.tier.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{key.external_api_usage?.[0]?.count || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={key.is_active ? "default" : "outline"}>
                      {key.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(key.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(key.id, key.is_active)}
                      >
                        {key.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(key.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExternalAPIManager;