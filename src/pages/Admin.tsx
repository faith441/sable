import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Users, Package, Store, Image, BarChart3, FileText, CheckSquare, Activity } from "lucide-react";
import BrandsManager from "@/components/admin/BrandsManager";
import UsersManager from "@/components/admin/UsersManager";
import ProductsManager from "@/components/admin/ProductsManager";
import UserPhotos from "@/components/admin/UserPhotos";
import DataAnalytics from "@/components/admin/DataAnalytics";
import ExternalAPIManager from "@/components/admin/ExternalAPIManager";
import BrandApplicationsManager from "@/components/admin/BrandApplicationsManager";
import ProductApprovalManager from "@/components/admin/ProductApprovalManager";
import ActivityLogs from "@/components/admin/ActivityLogs";

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!data) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your fashion platform</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="applications">
              <FileText className="mr-2 h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="approval">
              <CheckSquare className="mr-2 h-4 w-4" />
              Product Review
            </TabsTrigger>
            <TabsTrigger value="brands">
              <Store className="mr-2 h-4 w-4" />
              Brands
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="mr-2 h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="photos">
              <Image className="mr-2 h-4 w-4" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="mr-2 h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="api">
              <Package className="mr-2 h-4 w-4" />
              External API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <BrandApplicationsManager />
          </TabsContent>

          <TabsContent value="approval">
            <ProductApprovalManager />
          </TabsContent>

          <TabsContent value="brands">
            <BrandsManager />
          </TabsContent>

          <TabsContent value="products">
            <ProductsManager />
          </TabsContent>

          <TabsContent value="users">
            <UsersManager />
          </TabsContent>

          <TabsContent value="photos">
            <UserPhotos />
          </TabsContent>

          <TabsContent value="analytics">
            <DataAnalytics />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLogs />
          </TabsContent>

          <TabsContent value="api">
            <ExternalAPIManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;