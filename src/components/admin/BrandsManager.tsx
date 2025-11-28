import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const BrandsManager = () => {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website_url: "",
    api_endpoint: "",
  });

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error("Error loading brands:", error);
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        const { error } = await supabase
          .from("brands")
          .update(formData)
          .eq("id", editingBrand.id);

        if (error) throw error;
        toast.success("Brand updated successfully");
      } else {
        const { error } = await supabase
          .from("brands")
          .insert([formData]);

        if (error) throw error;
        toast.success("Brand added successfully");
      }

      setIsDialogOpen(false);
      setEditingBrand(null);
      setFormData({ name: "", description: "", website_url: "", api_endpoint: "" });
      loadBrands();
    } catch (error) {
      console.error("Error saving brand:", error);
      toast.error("Failed to save brand");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;

    try {
      const { error } = await supabase
        .from("brands")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Brand deleted successfully");
      loadBrands();
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.error("Failed to delete brand");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("brands")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Brand ${!isActive ? "activated" : "deactivated"}`);
      loadBrands();
    } catch (error) {
      console.error("Error toggling brand status:", error);
      toast.error("Failed to update brand status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Brand Management</h2>
          <p className="text-muted-foreground">Manage brands and their inventory integrations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingBrand(null);
              setFormData({ name: "", description: "", website_url: "", api_endpoint: "" });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Brand
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
              <DialogDescription>
                Enter the brand details and API configuration
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Brand Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api">API Endpoint</Label>
                <Input
                  id="api"
                  type="url"
                  value={formData.api_endpoint}
                  onChange={(e) => setFormData({...formData, api_endpoint: e.target.value})}
                  placeholder="https://api.brand.com/inventory"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingBrand ? "Update Brand" : "Add Brand"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {brands.map((brand) => (
          <Card key={brand.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{brand.name}</span>
                <Switch
                  checked={brand.is_active}
                  onCheckedChange={() => handleToggleActive(brand.id, brand.is_active)}
                />
              </CardTitle>
              <CardDescription>{brand.description || "No description"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {brand.website_url && (
                <a
                  href={brand.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline block"
                >
                  Visit Website
                </a>
              )}
              {brand.api_endpoint && (
                <p className="text-xs text-muted-foreground">API: {brand.api_endpoint}</p>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingBrand(brand);
                    setFormData({
                      name: brand.name,
                      description: brand.description || "",
                      website_url: brand.website_url || "",
                      api_endpoint: brand.api_endpoint || "",
                    });
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(brand.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {brands.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <CardTitle className="mb-2">No brands yet</CardTitle>
          <CardDescription>Add your first brand to get started</CardDescription>
        </Card>
      )}
    </div>
  );
};

export default BrandsManager;