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

type ViewAngle = "front" | "upperBody" | "side" | "back";

const VIEW_ANGLES: { key: ViewAngle; label: string; prompt: string }[] = [
  { key: "front", label: "Front", prompt: "front facing full body view, standing straight" },
  { key: "upperBody", label: "Upper", prompt: "upper body portrait view from waist up, facing camera" },
  { key: "side", label: "Side", prompt: "side profile view, showing the silhouette and fit" },
  { key: "back", label: "Back", prompt: "back view showing the garment from behind" },
];

const ProductImageGallery = ({ product, open, onOpenChange }: ProductImageGalleryProps) => {
  const [selectedAngle, setSelectedAngle] = useState<ViewAngle>("front");
  const [images, setImages] = useState<Record<ViewAngle, string | null>>({
    front: null,
    upperBody: null,
    side: null,
    back: null,
  });
  const [loading, setLoading] = useState<Record<ViewAngle, boolean>>({
    front: false,
    upperBody: false,
    side: false,
    back: false,
  });

  const preferences = JSON.parse(localStorage.getItem('guest_preferences') || '{}');
  const userGender = Array.isArray(preferences.gender) 
    ? preferences.gender[0] 
    : preferences.gender || "Women's";

  useEffect(() => {
    if (open && product) {
      // Reset images when product changes
      setImages({ front: null, upperBody: null, side: null, back: null });
      setSelectedAngle("front");
      // Generate all views
      VIEW_ANGLES.forEach(angle => generateImage(angle.key, angle.prompt));
    }
  }, [open, product?.id]);

  const generateImage = async (angle: ViewAngle, viewPrompt: string) => {
    if (!product) return;

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

      if (error) throw error;
      if (data?.result) {
        setImages(prev => ({ ...prev, [angle]: data.result }));
      }
    } catch (err) {
      console.error(`Error generating ${angle} view:`, err);
    } finally {
      setLoading(prev => ({ ...prev, [angle]: false }));
    }
  };

  if (!product) return null;

  const currentImage = images[selectedAngle];
  const isCurrentLoading = loading[selectedAngle];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Thumbnail Strip */}
          <div className="w-20 md:w-24 bg-secondary/30 border-r border-border/50 p-2 flex flex-col gap-2 overflow-y-auto">
            {VIEW_ANGLES.map((angle) => (
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
                    <span className="text-[10px] text-muted-foreground">{angle.label}</span>
                  </div>
                )}
              </button>
            ))}
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
