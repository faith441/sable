import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download } from "lucide-react";

const DataAnalytics = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [
        profilesRes,
        preferencesRes,
        wardrobesRes,
        userWardrobeRes,
        outfitsRes,
        cartsRes,
        productsRes,
        brandsRes,
        chatsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("style_preferences").select("*"),
        supabase.from("capsule_wardrobes").select("*", { count: "exact", head: true }),
        supabase.from("user_wardrobe").select("*", { count: "exact", head: true }),
        supabase.from("outfit_plans").select("*", { count: "exact", head: true }),
        supabase.from("cart_items").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("brands").select("*", { count: "exact", head: true }),
        supabase.from("chat_messages").select("*", { count: "exact", head: true }),
      ]);

      // Calculate analytics
      const totalUsers = profilesRes.count || 0;
      const completedProfiles = preferencesRes.data?.length || 0;
      const profileCompletionRate = totalUsers > 0 ? ((completedProfiles / totalUsers) * 100).toFixed(1) : "0";

      // Style type breakdown
      const styleTypes: { [key: string]: number } = {};
      preferencesRes.data?.forEach((pref: any) => {
        if (pref.style_type) {
          styleTypes[pref.style_type] = (styleTypes[pref.style_type] || 0) + 1;
        }
      });

      // Budget range breakdown
      const budgetRanges: { [key: string]: number } = {};
      preferencesRes.data?.forEach((pref: any) => {
        if (pref.budget_range) {
          budgetRanges[pref.budget_range] = (budgetRanges[pref.budget_range] || 0) + 1;
        }
      });

      // Lifestyle breakdown
      const lifestyles: { [key: string]: number } = {};
      preferencesRes.data?.forEach((pref: any) => {
        if (pref.lifestyle) {
          lifestyles[pref.lifestyle] = (lifestyles[pref.lifestyle] || 0) + 1;
        }
      });

      setAnalytics({
        totalUsers,
        completedProfiles,
        profileCompletionRate,
        totalWardrobes: wardrobesRes.count || 0,
        totalUserItems: userWardrobeRes.count || 0,
        totalOutfits: outfitsRes.count || 0,
        totalCartItems: cartsRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalBrands: brandsRes.count || 0,
        totalChatMessages: chatsRes.count || 0,
        styleTypes,
        budgetRanges,
        lifestyles,
        rawPreferences: preferencesRes.data,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const exportAllData = async () => {
    try {
      toast.info("Exporting complete database... This may take a moment.");
      
      const [
        profiles, 
        preferences, 
        wardrobes, 
        wardrobeItems,
        userWardrobe, 
        outfits, 
        carts, 
        chats,
        brands,
        products,
        userRoles
      ] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("style_preferences").select("*"),
        supabase.from("capsule_wardrobes").select("*"),
        supabase.from("wardrobe_items").select("*"),
        supabase.from("user_wardrobe").select("*"),
        supabase.from("outfit_plans").select("*"),
        supabase.from("cart_items").select("*"),
        supabase.from("chat_messages").select("*"),
        supabase.from("brands").select("*"),
        supabase.from("products").select("*"),
        supabase.from("user_roles").select("*"),
      ]);

      const exportData = {
        export_info: {
          exported_at: new Date().toISOString(),
          export_type: "complete_database_raw_unfiltered",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          total_users: profiles.data?.length || 0,
          total_records: (profiles.data?.length || 0) + 
                        (preferences.data?.length || 0) + 
                        (wardrobes.data?.length || 0) +
                        (userWardrobe.data?.length || 0) +
                        (outfits.data?.length || 0) +
                        (carts.data?.length || 0) +
                        (chats.data?.length || 0) +
                        (brands.data?.length || 0) +
                        (products.data?.length || 0)
        },
        analytics_summary: analytics,
        raw_data_complete: {
          profiles: {
            count: profiles.data?.length || 0,
            data: profiles.data || []
          },
          style_preferences: {
            count: preferences.data?.length || 0,
            data: preferences.data || []
          },
          capsule_wardrobes: {
            count: wardrobes.data?.length || 0,
            data: wardrobes.data || []
          },
          wardrobe_items: {
            count: wardrobeItems.data?.length || 0,
            data: wardrobeItems.data || []
          },
          user_wardrobe: {
            count: userWardrobe.data?.length || 0,
            data: userWardrobe.data || []
          },
          outfit_plans: {
            count: outfits.data?.length || 0,
            data: outfits.data || []
          },
          cart_items: {
            count: carts.data?.length || 0,
            data: carts.data || []
          },
          chat_messages: {
            count: chats.data?.length || 0,
            data: chats.data || []
          },
          brands: {
            count: brands.data?.length || 0,
            data: brands.data || []
          },
          products: {
            count: products.data?.length || 0,
            data: products.data || []
          },
          user_roles: {
            count: userRoles.data?.length || 0,
            data: userRoles.data || []
          }
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sable-complete-database-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Complete database exported: ${exportData.export_info.total_records} total records`);
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Data Analytics & Extraction</h2>
          <p className="text-muted-foreground">Comprehensive insights and raw data collection</p>
        </div>
        <Button onClick={exportAllData}>
          <Download className="mr-2 h-4 w-4" />
          Export All Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.profileCompletionRate}%</p>
            <p className="text-sm text-muted-foreground">{analytics.completedProfiles} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.totalProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Brands</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.totalBrands}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wardrobes Created</span>
              <span className="font-bold">{analytics.totalWardrobes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">User Items</span>
              <span className="font-bold">{analytics.totalUserItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Outfit Plans</span>
              <span className="font-bold">{analytics.totalOutfits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cart Items</span>
              <span className="font-bold">{analytics.totalCartItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chat Messages</span>
              <span className="font-bold">{analytics.totalChatMessages}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Style Types</CardTitle>
            <CardDescription>User preferences breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(analytics.styleTypes).map(([style, count]) => (
              <div key={style} className="flex justify-between">
                <span className="text-muted-foreground">{style}</span>
                <span className="font-bold">{count as number}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget Ranges</CardTitle>
            <CardDescription>Spending preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(analytics.budgetRanges).map(([range, count]) => (
              <div key={range} className="flex justify-between">
                <span className="text-muted-foreground">{range}</span>
                <span className="font-bold">{count as number}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lifestyle Distribution</CardTitle>
          <CardDescription>User lifestyle preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.lifestyles).map(([lifestyle, count]) => (
              <div key={lifestyle} className="flex justify-between p-2 bg-muted rounded">
                <span className="text-sm">{lifestyle}</span>
                <span className="font-bold">{count as number}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Raw Data Preview</CardTitle>
          <CardDescription>Sample of collected user preference data</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(analytics.rawPreferences?.slice(0, 3), null, 2)}
          </pre>
          <p className="text-sm text-muted-foreground mt-2">
            Showing 3 of {analytics.rawPreferences?.length} records. Export all data for complete dataset.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataAnalytics;