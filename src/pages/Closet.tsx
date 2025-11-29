import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Package, Filter } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MobileNav from "@/components/MobileNav";
import ProfileMenu from "@/components/ProfileMenu";
import ProfileSheet from "@/components/ProfileSheet";
import AddCustomItemDialog, { CATEGORIES } from "@/components/AddCustomItemDialog";
import ClosetItemDialog from "@/components/ClosetItemDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface PurchasedItem {
  id: string;
  product_id: string;
  purchased_at: string;
  notes?: string;
  is_custom: boolean;
  product?: {
    id: string;
    name: string;
    category: string;
    price: number;
    colors: string[];
    image_url: string;
    product_url: string;
    brand: {
      name: string;
    };
  };
  custom_image_url?: string;
  custom_description?: string;
  custom_size?: string;
  custom_brand?: string;
  custom_category?: string;
}

const Closet = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PurchasedItem[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PurchasedItem | null>(null);
  const [itemDetailOpen, setItemDetailOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PurchasedItem | null>(null);

  useEffect(() => {
    loadCloset();
  }, []);

  const loadCloset = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to view your closet");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("user_wardrobe")
        .select(`
          *,
          product:products (
            id,
            name,
            category,
            price,
            colors,
            image_url,
            product_url,
            brand:brands (name)
          )
        `)
        .eq("user_id", user.id)
        .order("purchased_at", { ascending: false });

      if (error) throw error;

      setItems(data || []);
    } catch (error: any) {
      console.error("Error loading closet:", error);
      toast.error("Failed to load your closet");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomItem = async (itemData: {
    image: File;
    description: string;
    size: string;
    brand: string;
    category: string;
  }) => {
    console.log("handleAddCustomItem called with:", itemData);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("User:", user);
      if (!user) throw new Error("Not authenticated");

      // Upload image to storage
      const fileExt = itemData.image.name.split('.').pop();
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      console.log("Uploading to:", fileName);
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('closet-items')
        .upload(fileName, itemData.image);

      console.log("Upload result:", { uploadError, uploadData });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('closet-items')
        .getPublicUrl(fileName);

      console.log("Public URL:", publicUrl);

      // Insert into user_wardrobe
      const insertData = {
        user_id: user.id,
        is_custom: true,
        custom_image_url: publicUrl,
        custom_description: itemData.description,
        custom_size: itemData.size,
        custom_brand: itemData.brand,
        custom_category: itemData.category,
      };
      
      console.log("Inserting data:", insertData);
      
      const { error: insertError } = await supabase
        .from("user_wardrobe")
        .insert(insertData);

      console.log("Insert error:", insertError);
      if (insertError) throw insertError;

      toast.success("Item added to your closet!");
      await loadCloset();
      setAddItemOpen(false);
    } catch (error: any) {
      console.error("Error adding item:", error);
      toast.error(error.message || "Failed to add item");
    }
  };

  const handleEdit = (item: PurchasedItem) => {
    toast("Edit functionality coming soon!", {
      description: "You'll be able to edit item details in the next update."
    });
  };

  const handleDeleteClick = (item: PurchasedItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from("user_wardrobe")
        .delete()
        .eq("id", itemToDelete.id);

      if (error) throw error;

      toast.success("Item removed from closet");
      await loadCloset();
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const filteredItems = categoryFilter === "All" 
    ? items 
    : items.filter(item => {
        const category = item.is_custom ? item.custom_category : item.product?.category;
        return category === categoryFilter;
      });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-lg font-light text-muted-foreground">Loading your closet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 
            onClick={() => navigate("/wardrobe")}
            className="text-xl font-light cursor-pointer hover:text-primary transition-colors"
          >
            StyleCapsule
          </h1>
          <ProfileMenu 
            onProfileClick={() => setProfileOpen(true)}
          />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Add Item Button */}
        <Button 
          variant="luxury" 
          className="w-full mb-6"
          onClick={() => setAddItemOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item to Closet
        </Button>

        {/* Category Filter */}
        {items.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by Category</span>
            </div>
            <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1">
                <TabsTrigger value="All" className="flex-shrink-0">All</TabsTrigger>
                {CATEGORIES.map((cat) => (
                  <TabsTrigger key={cat} value={cat} className="flex-shrink-0">
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {filteredItems.length === 0 ? (
          categoryFilter === "All" ? (
            <Card className="mt-8">
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                <Package className="w-16 h-16 text-muted-foreground" strokeWidth={1} />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-light">Your Closet is Empty</h3>
                  <p className="text-sm text-muted-foreground font-light">
                    Add items you've purchased or upload photos of clothing you already own
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mt-8">
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                <Package className="w-16 h-16 text-muted-foreground" strokeWidth={1} />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-light">No {categoryFilter} Items</h3>
                  <p className="text-sm text-muted-foreground font-light">
                    You don't have any {categoryFilter.toLowerCase()} items in your closet yet
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <Card 
                key={item.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedItem(item);
                  setItemDetailOpen(true);
                }}
              >
                <CardContent className="p-0">
                  <div className="aspect-[3/4] bg-secondary relative">
                    {item.is_custom ? (
                      <img 
                        src={item.custom_image_url} 
                        alt={item.custom_description || 'Custom item'} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      item.product?.image_url && (
                        <img 
                          src={item.product.image_url} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover" 
                        />
                      )
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      {item.is_custom ? item.custom_brand : item.product?.brand.name}
                    </p>
                    <h4 className="font-light text-sm truncate">
                      {item.is_custom 
                        ? item.custom_category 
                        : item.product?.name
                      }
                    </h4>
                    {item.custom_size && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Size: {item.custom_size}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
      <AddCustomItemDialog 
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        onSubmit={handleAddCustomItem}
      />
      <ClosetItemDialog
        item={selectedItem}
        open={itemDetailOpen}
        onOpenChange={setItemDetailOpen}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from your closet? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MobileNav />
    </div>
  );
};

export default Closet;
