import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Sparkles } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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

type ViewType = "product" | "tryon";

// Shared cache key with ProductTryOnImage
const CACHE_KEY = 'ai_tryon_image_cache';

const getCachedTryOnImage = (productId: string): string | null => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const cache = new Map<string, string>(JSON.parse(stored));
      return cache.get(productId) || null;
    }
  } catch (e) {
    console.error('[ProductImageGallery] Failed to load cache:', e);
  }
  return null;
};

const saveToCacheStorage = (productId: string, imageUrl: string) => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    const cache = stored ? new Map<string, string>(JSON.parse(stored)) : new Map<string, string>();
    cache.set(productId, imageUrl);
    localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(cache.entries())));
  } catch (e) {
    console.error('[ProductImageGallery] Failed to save to cache:', e);
  }
};

const ProductImageGallery = ({ product, open, onOpenChange }: ProductImageGalleryProps) => {
  const [selectedView, setSelectedView] = useState<ViewType>("product");
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiDisabled, setAiDisabled] = useState(false);

  const preferences = JSON.parse(localStorage.getItem('guest_preferences') || '{}');
  const userGender = Array.isArray(preferences.gender) 
    ? preferences.gender[0] 
    : preferences.gender || "Women's";

  useEffect(() => {
    if (open && product) {
      const disabled = localStorage.getItem('ai_tryon_disabled') === 'true';
      setAiDisabled(disabled);
      setSelectedView("product");
      
      // Only attempt AI try-on if product has an image
      if (!product.image_url) {
        setTryOnImage(null);
        return;
      }
      
      // Check cache first
      const cachedImage = getCachedTryOnImage(product.id);
      if (cachedImage) {
        setTryOnImage(cachedImage);
        return;
      }
      
      setTryOnImage(null);
      
      if (!disabled) {
        generateTryOnImage();
      }
    }
  }, [open, product?.id]);

  const generateTryOnImage = async () => {
    if (!product) return;

    setLoading(true);

    try {
      const bodyPhotos = preferences.bodyPhotos || [];
      const userImage = bodyPhotos.length > 0 ? bodyPhotos[0] : null;
      
      const { data, error } = await supabase.functions.invoke("virtual-tryon", {
        body: {
          garmentImages: [{
            name: product.name,
            category: product.category,
            brand: product.brand.name,
            image_url: product.image_url
          }],
          viewType: "fullBody",
          userGender,
          userImage
        }
      });

      if (error) {
        const errorMsg = error.message || error.toString();
        if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment")) {
          localStorage.setItem('ai_tryon_disabled', 'true');
          setAiDisabled(true);
        }
        throw error;
      }
      
      if (data?.error) {
        if (data.error.includes("credits") || data.error.includes("Rate limit") || data.error.includes("payment")) {
          localStorage.setItem('ai_tryon_disabled', 'true');
          setAiDisabled(true);
        }
        throw new Error(data.error);
      }
      
      if (data?.result) {
        // Save to shared cache
        saveToCacheStorage(product.id, data.result);
        setTryOnImage(data.result);
      }
    } catch (err: any) {
      console.error("Error generating try-on:", err);
      const errorMsg = err?.message || err?.toString() || '';
      if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment")) {
        localStorage.setItem('ai_tryon_disabled', 'true');
        setAiDisabled(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  const productImageSrc = product.image_url || '/placeholder.svg';
  const currentImage = selectedView === "tryon" && tryOnImage ? tryOnImage : productImageSrc;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>{product.name}</DialogTitle>
        </VisuallyHidden>
        <div className="flex h-full">
          {/* Thumbnail Strip - Only Product and AI Try-on */}
          <div className="w-20 md:w-24 bg-secondary/30 border-r border-border/50 p-2 flex flex-col gap-2">
            {/* Product thumbnail */}
            <button
              onClick={() => setSelectedView("product")}
              className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                selectedView === "product" 
                  ? 'border-sage ring-2 ring-sage/30' 
                  : 'border-transparent hover:border-sage/50'
              }`}
            >
              <img 
                src={productImageSrc} 
                alt="Product"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 left-1 right-1 text-[9px] text-center bg-background/80 rounded px-1">
                Product
              </span>
            </button>

            {/* AI Try-on thumbnail */}
            <button
              onClick={() => tryOnImage && setSelectedView("tryon")}
              disabled={!tryOnImage && !loading}
              className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                selectedView === "tryon" && tryOnImage 
                  ? 'border-sage ring-2 ring-sage/30' 
                  : 'border-transparent'
              } ${tryOnImage ? 'hover:border-sage/50 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
            >
              {loading ? (
                <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-sage" />
                </div>
              ) : tryOnImage ? (
                <img 
                  src={tryOnImage} 
                  alt="AI Try-on"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-secondary/50 flex flex-col items-center justify-center">
                  <Sparkles className="w-4 h-4 text-muted-foreground/50" />
                </div>
              )}
              <span className="absolute bottom-1 left-1 right-1 text-[9px] text-center bg-background/80 rounded px-1">
                AI Try-On
              </span>
            </button>
            
            {aiDisabled && (
              <p className="text-[9px] text-muted-foreground text-center mt-2 px-1">
                AI unavailable
              </p>
            )}
          </div>

          {/* Main Image */}
          <div className="flex-1 relative bg-gradient-to-br from-cream to-secondary/20">
            {loading && selectedView === "tryon" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-sage mb-4" />
                <p className="text-sm text-muted-foreground">Generating AI try-on...</p>
              </div>
            ) : (
              <img 
                src={currentImage} 
                alt={`${product.name} - ${selectedView === "tryon" ? "AI Try-on" : "Product"}`}
                className="w-full h-full object-contain"
              />
            )}

            {/* AI indicator */}
            {selectedView === "tryon" && tryOnImage && !loading && (
              <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded px-2 py-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-sage" />
                <span className="text-xs text-muted-foreground">AI Generated</span>
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
