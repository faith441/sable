import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, User, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  category: string;
  brand: {
    name: string;
  };
  image_url: string;
}

interface VirtualTryOnPreviewProps {
  products: Product[];
  capsuleName: string;
}

const VirtualTryOnPreview = ({ products, capsuleName }: VirtualTryOnPreviewProps) => {
  const [fullBodyImage, setFullBodyImage] = useState<string | null>(null);
  const [upperBodyImage, setUpperBodyImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingView, setLoadingView] = useState<"fullBody" | "upperBody" | null>(null);

  const preferences = JSON.parse(localStorage.getItem('guest_preferences') || '{}');
  const userGender = Array.isArray(preferences.gender) 
    ? preferences.gender[0] 
    : preferences.gender || "Women's";

  // Get top items (tops, jackets, shirts) and bottom items for the preview
  const getPreviewItems = () => {
    const tops = products.filter(p => 
      ['tops', 'shirts', 'jackets', 'sweaters', 'outerwear', 'blouses'].some(
        cat => p.category?.toLowerCase().includes(cat)
      )
    ).slice(0, 2);

    const bottoms = products.filter(p => 
      ['pants', 'trousers', 'jeans', 'skirts', 'shorts'].some(
        cat => p.category?.toLowerCase().includes(cat)
      )
    ).slice(0, 1);

    return [...tops, ...bottoms].slice(0, 3);
  };

  const generateTryOnImage = async (viewType: "fullBody" | "upperBody") => {
    setLoadingView(viewType);
    setLoading(true);

    try {
      const previewItems = getPreviewItems();
      
      if (previewItems.length === 0) {
        toast.error("No suitable items found for try-on");
        return;
      }

      const garmentImages = previewItems.map(p => ({
        name: p.name,
        category: p.category,
        brand: p.brand.name,
        image_url: p.image_url
      }));

      const { data, error } = await supabase.functions.invoke("virtual-tryon", {
        body: {
          garmentImages,
          viewType,
          userGender
        }
      });

      if (error) {
        console.error("Try-on error:", error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (viewType === "fullBody") {
        setFullBodyImage(data.result);
      } else {
        setUpperBodyImage(data.result);
      }

      toast.success(`${viewType === "fullBody" ? "Full body" : "Upper body"} look generated!`);
    } catch (error: any) {
      console.error("Error generating try-on:", error);
      toast.error(error.message || "Failed to generate try-on image");
    } finally {
      setLoading(false);
      setLoadingView(null);
    }
  };

  const generateBothViews = async () => {
    setLoading(true);
    try {
      // Generate both views in sequence
      await generateTryOnImage("fullBody");
      await generateTryOnImage("upperBody");
    } catch (error) {
      console.error("Error generating views:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on mount
  useEffect(() => {
    if (products.length > 0 && !fullBodyImage && !upperBodyImage) {
      generateBothViews();
    }
  }, [products]);

  const ImagePlaceholder = ({ viewType }: { viewType: "fullBody" | "upperBody" }) => (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-secondary/30 rounded-lg">
      <User className="w-12 h-12 text-muted-foreground/50 mb-2" />
      <p className="text-xs text-muted-foreground text-center px-2">
        {viewType === "fullBody" ? "Full Body" : "Upper Body"}
      </p>
    </div>
  );

  return (
    <Card className="bg-gradient-to-br from-sage/5 via-cream to-accent/5 border-sage/20 shadow-soft overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sage" />
            <h3 className="text-sm font-medium">Virtual Try-On</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateBothViews}
            disabled={loading}
            className="text-xs"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            <span className="ml-1">Refresh</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Full Body View */}
          <div className="space-y-2">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary/20">
              {loadingView === "fullBody" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/50">
                  <Loader2 className="w-8 h-8 animate-spin text-sage mb-2" />
                  <p className="text-xs text-muted-foreground">Generating...</p>
                </div>
              ) : fullBodyImage ? (
                <img 
                  src={fullBodyImage} 
                  alt="Full body try-on" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImagePlaceholder viewType="fullBody" />
              )}
            </div>
            <p className="text-xs text-center text-muted-foreground">Full Body</p>
          </div>

          {/* Upper Body View */}
          <div className="space-y-2">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary/20">
              {loadingView === "upperBody" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/50">
                  <Loader2 className="w-8 h-8 animate-spin text-sage mb-2" />
                  <p className="text-xs text-muted-foreground">Generating...</p>
                </div>
              ) : upperBodyImage ? (
                <img 
                  src={upperBodyImage} 
                  alt="Upper body try-on" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImagePlaceholder viewType="upperBody" />
              )}
            </div>
            <p className="text-xs text-center text-muted-foreground">Upper Body</p>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          AI-generated preview of {capsuleName} items
        </p>
      </CardContent>
    </Card>
  );
};

export default VirtualTryOnPreview;
