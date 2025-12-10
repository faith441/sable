import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  brand: {
    name: string;
  };
  image_url: string;
}

interface ProductImageGalleryProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ViewAngle = "original" | "front" | "side" | "back";

const VIEW_ANGLES: { key: ViewAngle; label: string; prompt: string }[] = [
  { key: "original", label: "Product", prompt: "" },
  { key: "front", label: "Front", prompt: "front facing full body view, standing straight" },
  { key: "side", label: "Side", prompt: "side profile view, showing the silhouette and fit" },
  { key: "back", label: "Back", prompt: "back view showing the garment from behind" },
];

const ProductImageGallery = ({ product, open, onOpenChange }: ProductImageGalleryProps) => {
  const [selectedAngle, setSelectedAngle] = useState<ViewAngle>("original");
  const [images, setImages] = useState<Record<ViewAngle, string | null>>({
    original: null,
    front: null,
    side: null,
    back: null,
  });
  const [loading, setLoading] = useState<Record<ViewAngle, boolean>>({
    original: false,
    front: false,
    side: false,
    back: false,
  });
  const [aiDisabled, setAiDisabled] = useState(false);

  const preferences = JSON.parse(localStorage.getItem('guest_preferences') || '{}');
  const userGender = Array.isArray(preferences.gender) 
    ? preferences.gender[0] 
    : preferences.gender || "Women's";

  useEffect(() => {
    if (open && product) {
      // Check if AI is disabled
      const disabled = localStorage.getItem('ai_tryon_disabled') === 'true';
      setAiDisabled(disabled);
      
      // Reset images when product changes
      setImages({ 
        original: product.image_url, 
        front: null, 
        side: null, 
        back: null 
      });
      setSelectedAngle("original");
      
      // Only generate AI views if not disabled
      if (!disabled) {
        VIEW_ANGLES.filter(a => a.key !== "original").forEach(angle => 
          generateImage(angle.key, angle.prompt)
        );
      }
    }
  }, [open, product?.id]);

  const generateImage = async (angle: ViewAngle, viewPrompt: string) => {
    if (!product || angle === "original") return;

    setLoading(prev => ({ ...prev, [angle]: true }));

    try {
      const genderTerm = userGender === "Women's" ? "woman" : "man";
      
      const { data, error } = await supabase.functions.invoke("virtual-tryon", {
        body: {
          garmentImages: [{
            name: product.name,
            category: product.category,
            brand: product.brand.name,
            image_url: product.image_url
          }],
          viewType: angle,
          userGender,
          customPrompt: `Create a high-quality fashion photography image of a stylish ${genderTerm} model wearing ${product.name} by ${product.brand.name}. Show a ${viewPrompt}. Professional studio lighting, clean gradient background, luxury fashion catalog style.`
        }
      });

      if (error) {
        const errorMsg = error.message || error.toString();
        if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment")) {
          localStorage.setItem('ai_tryon_disabled', 'true');
          setAiDisabled(true);
          console.log("AI try-on disabled due to credits issue");
        }
        throw error;
      }
      
      if (data?.error) {
        // Check if it's a credits/rate limit issue
        if (data.error.includes("credits") || data.error.includes("Rate limit") || data.error.includes("payment")) {
          localStorage.setItem('ai_tryon_disabled', 'true');
          setAiDisabled(true);
          console.log("AI try-on disabled due to:", data.error);
        }
        throw new Error(data.error);
      }
      
      if (data?.result) {
        setImages(prev => ({ ...prev, [angle]: data.result }));
      }
    } catch (err: any) {
      console.error(`Error generating ${angle} view:`, err);
      // Check for credits error in catch block
      const errorMsg = err?.message || err?.toString() || '';
      if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment")) {
        localStorage.setItem('ai_tryon_disabled', 'true');
        setAiDisabled(true);
      }
      // Fall back to original image for this angle
      setImages(prev => ({ ...prev, [angle]: product.image_url }));
    } finally {
      setLoading(prev => ({ ...prev, [angle]: false }));
    }
  };

  if (!product) return null;

  const currentImage = images[selectedAngle] || product.image_url;
  const isCurrentLoading = loading[selectedAngle];

  // Filter angles based on AI availability
  const availableAngles = aiDisabled 
    ? VIEW_ANGLES.filter(a => a.key === "original")
    : VIEW_ANGLES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Thumbnail Strip */}
          <div className="w-20 md:w-24 bg-secondary/30 border-r border-border/50 p-2 flex flex-col gap-2 overflow-y-auto">
            {availableAngles.map((angle) => (
              <button
                key={angle.key}
                onClick={() => setSelectedAngle(angle.key)}
                className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                  selectedAngle === angle.key 
                    ? 'border-sage ring-2 ring-sage/30' 
                    : 'border-transparent hover:border-sage/50'
                }`}
              >
                {loading[angle.key] ? (
                  <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-sage" />
                  </div>
                ) : images[angle.key] ? (
                  <img 
                    src={images[angle.key]!} 
                    alt={angle.label}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                    <img 
                      src={product.image_url} 
                      alt={angle.label}
                      className="w-full h-full object-cover opacity-50"
                    />
                  </div>
                )}
                <span className="absolute bottom-1 left-1 right-1 text-[9px] text-center bg-background/80 rounded px-1">
                  {angle.label}
                </span>
              </button>
            ))}
            
            {aiDisabled && (
              <p className="text-[9px] text-muted-foreground text-center mt-2 px-1">
                AI views unavailable
              </p>
            )}
          </div>

          {/* Main Image */}
          <div className="flex-1 relative bg-gradient-to-br from-cream to-secondary/20">
            {isCurrentLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-sage mb-4" />
                <p className="text-sm text-muted-foreground">Generating {VIEW_ANGLES.find(a => a.key === selectedAngle)?.label} view...</p>
              </div>
            ) : currentImage ? (
              <img 
                src={currentImage} 
                alt={`${product.name} - ${selectedAngle} view`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading image...</p>
              </div>
            )}

            {/* Product Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent">
              <p className="text-xs text-muted-foreground">{product.brand.name}</p>
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.category}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImageGallery;
