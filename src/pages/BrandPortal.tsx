import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Package, Upload, User, CheckCircle, Clock, XCircle } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  description: string | null;
  api_key: string | null;
}

interface ProductStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const BrandPortal = () => {
  const navigate = useNavigate();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [stats, setStats] = useState<ProductStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBrandAccess();
  }, []);

  const checkBrandAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/brand/auth");
        return;
      }

      // Check if user has brand role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "brand")
        .single();

      if (!roleData) {
        toast.error("Access denied. Brand account required.");
        navigate("/");
        return;
      }

      // Get brand data
      const { data: brandData, error: brandError } = await supabase
        .from("brands")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (brandError || !brandData) {
        toast.error("Brand account not found.");
        navigate("/");
        return;
      }

      setBrand(brandData);

      // Get product stats
      const { data: products } = await supabase
        .from("products")
        .select("approval_status")
        .eq("brand_id", brandData.id);

      if (products) {
        const statsData: ProductStats = {
          total: products.length,
          pending: products.filter(p => p.approval_status === 'pending').length,
          approved: products.filter(p => p.approval_status === 'approved').length,
          rejected: products.filter(p => p.approval_status === 'rejected').length,
        };
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error checking brand access:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/brand/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!brand) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{brand.name}</h1>
            <p className="text-muted-foreground text-sm">Brand Portal</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Products</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => navigate("/brand/products/upload")}
          >
            <CardHeader>
              <Upload className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Upload Products</CardTitle>
              <CardDescription>
                Add new products via drag & drop or CSV upload
              </CardDescription>
            </CardHeader>
          </Card>
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => navigate("/brand/products")}
          >
            <CardHeader>
              <Package className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">View Products</CardTitle>
              <CardDescription>
                See all your products and their approval status
              </CardDescription>
            </CardHeader>
          </Card>
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => navigate("/brand/account")}
          >
            <CardHeader>
              <User className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Account Settings</CardTitle>
              <CardDescription>
                Update your brand information and API keys
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* API Key Section */}
        {brand.api_key && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Integration</CardTitle>
              <CardDescription>
                Use your API key to upload products programmatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-3 py-2 rounded text-sm flex-1 overflow-x-auto">
                  {brand.api_key}
                </code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(brand.api_key || '');
                    toast.success("API key copied to clipboard");
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                API Endpoint: POST /functions/v1/brand-api-products
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default BrandPortal;