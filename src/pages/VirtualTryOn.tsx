import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Upload, Loader2, Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/utils/outfitStorage";

interface OutfitItem {
  name: string;
  category: string;
  image_url?: string;
}

interface OutfitRecommendation {
  name: string;
  items: OutfitItem[];
  style: string;
}

interface TryOnResult {
  item: OutfitItem;
  image: string;
}

const VirtualTryOn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userImage, setUserImage] = useState<string | null>(null);
  const [results, setResults] = useState<TryOnResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [outfit, setOutfit] = useState<OutfitRecommendation | null>(null);
  const [selectedItems, setSelectedItems] = useState<OutfitItem[]>([]);

  // Load outfit from navigation state if provided
  useEffect(() => {
    const stateOutfit = location.state?.outfit;
    if (stateOutfit) {
      setOutfit(stateOutfit);
      // Auto-select all items from the outfit
      setSelectedItems(stateOutfit.items || []);
    }
  }, [location]);

  const toggleItemSelection = (item: OutfitItem) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(i => i.name === item.name);
      if (isSelected) {
        return prev.filter(i => i.name !== item.name);
      } else {
        return [...prev, item];
      }
    });
  };

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          // Create canvas and resize
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(resizedBase64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUserImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        toast.loading("Optimizing image...");
        // Resize to max 768x1024 to reduce payload size
        const resizedImage = await resizeImage(file, 768, 1024);
        setUserImage(resizedImage);
        toast.dismiss();
        toast.success("Image uploaded!");
      } catch (error) {
        console.error("Error resizing image:", error);
        toast.error("Failed to process image");
      }
    }
  };

  const handleAddToCart = async () => {
    if (!outfit || selectedItems.length === 0) {
      toast.error("No items to add to cart");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = localStorage.getItem('guest_session_id') || crypto.randomUUID();

      if (!user) {
        localStorage.setItem('guest_session_id', sessionId);
      }

      // Add each selected item to cart
      for (const item of selectedItems) {
        // Create a temporary product ID based on the item name
        const productId = `virtual-tryon-${item.name.toLowerCase().replace(/\s+/g, '-')}`;

        // Check if item already exists in cart
        const query = supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("product_id", productId);

        if (user) {
          query.eq("user_id", user.id);
        } else {
          query.eq("session_id", sessionId);
        }

        const { data: existing } = await query.maybeSingle();

        if (existing) {
          // Update quantity if item exists
          await supabase
            .from("cart_items")
            .update({ quantity: existing.quantity + 1 })
            .eq("id", existing.id);
        } else {
          // Insert new item
          await supabase.from("cart_items").insert({
            user_id: user?.id || null,
            session_id: user ? null : sessionId,
            product_id: productId,
            quantity: 1,
            product_data: {
              id: productId,
              name: item.name,
              price: 0, // Virtual try-on items don't have prices yet
              image_url: item.image_url || '',
              brand: { name: 'Sable' },
            },
          });
        }
      }

      toast.success(`${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''} added to cart!`);

      // Redirect to cart after a brief delay
      setTimeout(() => navigate("/cart"), 800);
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add items to cart");
    }
  };

  const handleTryOn = async () => {
    if (!userImage) {
      toast.error("Please upload your photo");
      return;
    }

    if (!outfit || selectedItems.length === 0) {
      toast.error("Please select items to try on");
      return;
    }

    setLoading(true);

    try {
      console.log("=== PROCESSING PARALLEL TRY-ONS ===");
      console.log("User image length:", userImage?.length);
      console.log("Selected items:", selectedItems.length);
      console.log("Session ID:", getSessionId());

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/virtual-tryon-idm`;

      // Use new multi-set mode for parallel processing
      const garmentSets = selectedItems.map((item, idx) => ({
        label: item.name,
        garments: [{
          image_url: item.image_url,
          name: item.name,
          category: item.category
        }]
      }));

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPhoto: userImage,
          garmentSets,
          sessionId: getSessionId()
        })
      });

      console.log("=== MULTI-SET RESPONSE ===");
      console.log("Status:", response.status);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limited. Please try again later.");
        } else if (response.status === 402) {
          throw new Error("AI credits exhausted. Please contact support.");
        } else if (response.status === 502) {
          throw new Error("All try-ons failed. Please try again.");
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Results received:", data.results?.length);

      // Process results
      const tryOnResults: TryOnResult[] = [];
      for (const result of data.results || []) {
        if (result.success && result.image) {
          // Find corresponding item by index
          const item = selectedItems[result.index];
          if (item) {
            tryOnResults.push({
              item,
              image: result.image
            });
            console.log(`✓ ${item.name} completed`);
          }
        } else {
          console.warn(`✗ Set ${result.index} (${result.label}) failed:`, result.error);
        }
      }

      if (tryOnResults.length === 0) {
        throw new Error("Failed to generate any try-on results");
      }

      setResults(tryOnResults);
      toast.success(`Generated ${tryOnResults.length} try-on result${tryOnResults.length !== 1 ? 's' : ''}!`);

    } catch (error: any) {
      console.error("Virtual try-on error:", error);
      toast.error(error.message || "Failed to process try-on");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/wardrobe")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-light">Virtual Try-On</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <Sparkles className="w-12 h-12 mx-auto text-primary" strokeWidth={1.5} />
            <div className="space-y-2">
              <h2 className="text-2xl font-light">
                {outfit ? `Try On: ${outfit.name}` : 'See How It Looks'}
              </h2>
              <p className="text-sm text-muted-foreground font-light">
                {outfit
                  ? 'Upload your photo to see yourself in this outfit'
                  : 'Upload a photo of yourself and the garment you want to try on'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Outfit Items Selection */}
        {outfit && (
          <Card>
            <CardContent className="p-6">
              <div className="text-sm font-light mb-4">Select Items to Try On</div>
              <div className="grid grid-cols-2 gap-3">
                {outfit.items.map((item, idx) => {
                  const isSelected = selectedItems.some(i => i.name === item.name);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleItemSelection(item)}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-primary' : 'opacity-60'
                      }`}
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary/20 flex items-center justify-center">
                          <span className="text-xs text-center p-2">{item.name}</span>
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-xs text-white font-light">{item.category}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Photo Upload */}
        <Card>
          <CardContent className="p-6">
            <label className="block">
              <div className="text-sm font-light mb-3">Your Photo</div>
              {userImage ? (
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                  <img src={userImage} alt="Your photo" className="w-full h-full object-cover" />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-2 right-2"
                    onClick={() => setUserImage(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <label className="aspect-[3/4] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground font-light">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUserImageUpload}
                  />
                </label>
              )}
            </label>
          </CardContent>
        </Card>

        {/* Try On Button */}
        {userImage && outfit && selectedItems.length > 0 && results.length === 0 && (
          <Button
            variant="luxury"
            size="lg"
            className="w-full"
            onClick={handleTryOn}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Your Try-On...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {outfit ? `Try On ${selectedItems.length} Item${selectedItems.length !== 1 ? 's' : ''}` : 'Try It On'}
              </>
            )}
          </Button>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm font-light">
              {results.length} Result{results.length !== 1 ? 's' : ''}
            </div>
            {results.map((result, idx) => (
              <Card key={idx}>
                <CardContent className="p-6">
                  <div className="text-sm font-light mb-3">{result.item.name}</div>
                  <div className="aspect-[3/4] rounded-lg overflow-hidden">
                    <img src={result.image} alt={`${result.item.name} try-on`} className="w-full h-full object-cover" />
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setUserImage(null);
                  setResults([]);
                }}
              >
                Try Another
              </Button>
              <Button
                variant="luxury"
                size="sm"
                className="flex-1"
                onClick={handleAddToCart}
              >
                Add to Cart
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualTryOn;