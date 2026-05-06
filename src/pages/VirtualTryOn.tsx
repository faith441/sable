import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Upload, Loader2, Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

const VirtualTryOn = () => {
  const navigate = useNavigate();
  const [userImage, setUserImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [outfit, setOutfit] = useState<OutfitRecommendation | null>(null);
  const [selectedItems, setSelectedItems] = useState<OutfitItem[]>([]);

  useEffect(() => {
    // Load outfit from localStorage if coming from AI chat
    const savedOutfit = localStorage.getItem('virtual-tryon-outfit');
    if (savedOutfit) {
      try {
        const outfitData = JSON.parse(savedOutfit);
        setOutfit(outfitData);
        // Select all items by default
        setSelectedItems(outfitData.items || []);
        // Clear from localStorage
        localStorage.removeItem('virtual-tryon-outfit');
      } catch (error) {
        console.error('Error loading outfit:', error);
      }
    }
  }, []);

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

  const handleUserImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImage(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      console.log("=== VIRTUAL TRY-ON REQUEST ===");
      console.log("Sending user image length:", userImage?.length);
      console.log("Sending garment URL:", selectedItems[0]?.image_url);

      const { data, error } = await supabase.functions.invoke("virtual-tryon", {
        body: {
          userImage,
          garmentImage: selectedItems[0]?.image_url,
          outfit: selectedItems.map(item => ({
            name: item.name,
            category: item.category,
            image_url: item.image_url
          })),
          viewType: "fullBody",
          userGender: "Women's"
        }
      });

      console.log("=== VIRTUAL TRY-ON RESPONSE ===");
      console.log("Error:", error);
      console.log("Data:", data);
      console.log("Result type:", typeof data?.result);
      console.log("Result preview:", data?.result?.substring(0, 100));

      if (error) throw error;

      if (data.result) {
        setResult(data.result);
        toast.success("Try-on complete!");
      } else {
        console.error("No result in response data:", data);
        toast.error("Could not generate try-on image. Please try again.");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to process try-on. This is a preview feature.");
      // For demo purposes, show a mock result
      setResult(userImage); // In production, this would be the AI-generated result
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
        {userImage && outfit && selectedItems.length > 0 && !result && (
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

        {/* Result */}
        {result && (
          <Card>
            <CardContent className="p-6">
              <div className="text-sm font-light mb-3">Result</div>
              <div className="aspect-[3/4] rounded-lg overflow-hidden">
                <img src={result} alt="Try-on result" className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setUserImage(null);
                    setResult(null);
                  }}
                >
                  Try Another
                </Button>
                <Button variant="luxury" size="sm" className="flex-1">
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VirtualTryOn;