import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";
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

// Single unified cache key - must match Wardrobe.tsx and ProductDualImage.tsx
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

  useEffect(() => {
    if (open && product) {
      // Default to product view
      setSelectedView("product");
      
      // Only read from cache - NEVER generate independently
      // This ensures consistency with ProductDualImage
      if (product.image_url) {
        const cachedImage = getCachedTryOnImage(product.id);
        setTryOnImage(cachedImage);
        // If we have a cached try-on, show it by default
        if (cachedImage) {
          setSelectedView("tryon");
        }
      } else {
        setTryOnImage(null);
      }
    }
  }, [open, product?.id]);

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
              disabled={!tryOnImage}
              className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                selectedView === "tryon" && tryOnImage 
                  ? 'border-sage ring-2 ring-sage/30' 
                  : 'border-transparent'
              } ${tryOnImage ? 'hover:border-sage/50 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
            >
              {tryOnImage ? (
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
            
            {!tryOnImage && (
              <p className="text-[9px] text-muted-foreground text-center mt-2 px-1">
                Not available
              </p>
            )}
          </div>

          {/* Main Image */}
          <div className="flex-1 relative bg-gradient-to-br from-cream to-secondary/20">
            <img 
              src={currentImage} 
              alt={`${product.name} - ${selectedView === "tryon" ? "AI Try-on" : "Product"}`}
              className="w-full h-full object-contain"
            />

            {/* AI indicator */}
            {selectedView === "tryon" && tryOnImage && (
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
