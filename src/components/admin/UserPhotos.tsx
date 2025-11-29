import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search } from "lucide-react";

const UserPhotos = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadPhotos();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredPhotos(
        photos.filter(
          (photo) =>
            photo.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            photo.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredPhotos(photos);
    }
  }, [searchTerm, photos]);

  const loadPhotos = async () => {
    try {
      const { data: wardrobeItems, error } = await supabase
        .from("user_wardrobe")
        .select(`
          id,
          custom_image_url,
          custom_brand,
          custom_category,
          custom_description,
          notes,
          purchased_at,
          user_id,
          profiles (full_name, email)
        `)
        .not("custom_image_url", "is", null)
        .order("purchased_at", { ascending: false });

      if (error) throw error;

      const formattedPhotos = (wardrobeItems || []).map((item: any) => ({
        id: item.id,
        image_url: item.custom_image_url,
        brand: item.custom_brand,
        category: item.custom_category,
        description: item.custom_description,
        notes: item.notes,
        date: item.purchased_at,
        user_id: item.user_id,
        user_name: item.profiles?.full_name,
        user_email: item.profiles?.email,
      }));

      setPhotos(formattedPhotos);
      setFilteredPhotos(formattedPhotos);
    } catch (error) {
      console.error("Error loading photos:", error);
      toast.error("Failed to load user photos");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading photos...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Uploaded Photos</h2>
        <p className="text-muted-foreground">View all photos uploaded by users to their closets</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Photo Gallery</CardTitle>
          <CardDescription>Total: {photos.length} uploaded photos</CardDescription>
          <div className="pt-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={photo.image_url}
                    alt={photo.description || "User uploaded item"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-3 space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">User</Label>
                    <p className="text-sm font-medium">{photo.user_name || "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">{photo.user_email}</p>
                  </div>
                  {photo.brand && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Brand</Label>
                      <p className="text-sm">{photo.brand}</p>
                    </div>
                  )}
                  {photo.category && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Category</Label>
                      <p className="text-sm">{photo.category}</p>
                    </div>
                  )}
                  {photo.description && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <p className="text-sm">{photo.description}</p>
                    </div>
                  )}
                  {photo.notes && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Notes</Label>
                      <p className="text-sm">{photo.notes}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-muted-foreground">Uploaded</Label>
                    <p className="text-xs">{new Date(photo.date).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredPhotos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? "No photos found matching your search" : "No photos uploaded yet"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserPhotos;