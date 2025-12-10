import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Copy, Eye, EyeOff } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  api_key: string | null;
  api_endpoint: string | null;
  webhook_url: string | null;
}

const BrandAccount = () => {
  const navigate = useNavigate();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website_url: "",
    webhook_url: "",
  });

  useEffect(() => {
    loadBrandData();
  }, []);

  const loadBrandData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/brand/auth");
        return;
      }

      const { data: brandData, error } = await supabase
        .from("brands")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error || !brandData) {
        navigate("/brand/auth");
        return;
      }

      setBrand(brandData);
      setFormData({
        name: brandData.name,
        description: brandData.description || "",
        website_url: brandData.website_url || "",
        webhook_url: brandData.webhook_url || "",
      });
    } catch (error) {
      console.error("Error loading brand:", error);
      navigate("/brand/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!brand) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("brands")
        .update({
          name: formData.name,
          description: formData.description || null,
          website_url: formData.website_url || null,
          webhook_url: formData.webhook_url || null,
        })
        .eq("id", brand.id);

      if (error) throw error;
      toast.success("Account updated");
      loadBrandData();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!brand) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/brand")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your brand profile</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Brand Information */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Information</CardTitle>
            <CardDescription>
              Update your brand details visible to the Sable team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Brand Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://yourbrand.com"
              />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Use these credentials to integrate with our API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={brand.api_key || "No API key assigned"}
                    readOnly
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => brand.api_key && copyToClipboard(brand.api_key)}
                  disabled={!brand.api_key}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Include this in the x-brand-api-key header when making API requests
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook">Webhook URL</Label>
              <Input
                id="webhook"
                type="url"
                value={formData.webhook_url}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                placeholder="https://yourbrand.com/webhooks/sable"
              />
              <p className="text-xs text-muted-foreground">
                We'll send order notifications and status updates to this URL
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>API Documentation</CardTitle>
            <CardDescription>
              Quick reference for product upload API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-1">Endpoint</h4>
                <code className="text-xs bg-background p-2 rounded block">
                  POST /functions/v1/brand-api-products
                </code>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Headers</h4>
                <code className="text-xs bg-background p-2 rounded block">
                  x-brand-api-key: your_api_key
                </code>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Request Body</h4>
                <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`{
  "products": [
    {
      "name": "Product Name",
      "description": "Description",
      "category": "Tops",
      "price": 99.00,
      "sizes": ["S", "M", "L"],
      "colors": ["Black", "White"],
      "tags": ["casual", "summer"],
      "image_url": "https://...",
      "product_url": "https://..."
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BrandAccount;