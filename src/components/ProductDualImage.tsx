import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  category: string;
  brand: {
    name: string;
  };
  image_url: string;
}

interface ProductDualImageProps {
  product: Product;
  className?: string;
}

const WEARABLE_CATEGORIES = ['tops', 'bottoms', 'outerwear', 'dresses', 'shoes', 'accessories'];

const ProductDualImage = ({ product, className = "" }: ProductDualImageProps) => {
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState<'product' | 'tryon'>('tryon');
  const [error, setError] = useState<string | null>(null);

  const checkAiDisabled = () => {
    const disabledAt = localStorage.getItem('ai_tryon_disabled_at');
    if (disabledAt) {
      // Reset after 5 minutes instead of 1 hour for faster retry
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      if (parseInt(disabledAt) < fiveMinutesAgo) {
        console.log('[ProductDualImage] Resetting AI disabled flag (timeout expired)');
        localStorage.removeItem('ai_tryon_disabled');
        localStorage.removeItem('ai_tryon_disabled_at');
        return false;
      }
    }
    return localStorage.getItem('ai_tryon_disabled') === 'true';
  };
  
  // Clear the disabled flag on component mount to allow retry
  useEffect(() => {
    // Clear any stale disabled flags on page load
    const disabledAt = localStorage.getItem('ai_tryon_disabled_at');
    if (disabledAt) {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      if (parseInt(disabledAt) < fiveMinutesAgo) {
        localStorage.removeItem('ai_tryon_disabled');
        localStorage.removeItem('ai_tryon_disabled_at');
      }
    }
  }, []);
  
  const aiDisabled = checkAiDisabled();
  const isWearable = WEARABLE_CATEGORIES.includes(product.category?.toLowerCase() || '');

  useEffect(() => {
    console.log(`[ProductDualImage] Init for ${product.name}, category: ${product.category}, isWearable: ${isWearable}, aiDisabled: ${aiDisabled}`);
    if (!aiDisabled && isWearable) {
      generateTryOnImage();
    }
  }, [product.id]);

  const generateTryOnImage = async () => {
    setLoading(true);
    setError(null);
    console.log(`[ProductDualImage] Starting AI try-on generation for: ${product.name}`);

    try {
      const preferences = JSON.parse(localStorage.getItem('guest_preferences') || '{}');
      const userGender = Array.isArray(preferences.gender) 
        ? preferences.gender[0] 
        : preferences.gender || "Women's";

      // Get user's uploaded body photo from survey
      const bodyPhotos = preferences.bodyPhotos || [];
      const userImage = bodyPhotos.length > 0 ? bodyPhotos[0] : null;

      const garmentImages = [{
        name: product.name,
        category: product.category,
        brand: product.brand?.name || 'Unknown',
        image_url: product.image_url
      }];

      console.log(`[ProductDualImage] Calling virtual-tryon with:`, { 
        garmentCount: garmentImages.length, 
        viewType: 'fullBody', 
        userGender,
        hasUserImage: !!userImage 
      });

      const { data, error: fnError } = await supabase.functions.invoke("virtual-tryon", {
        body: {
          garmentImages,
          viewType: "fullBody",
          userGender,
          userImage
        }
      });

      console.log(`[ProductDualImage] Response:`, { data, fnError });

      if (fnError) {
        console.error("[ProductDualImage] Function error:", fnError);
        const errorMsg = fnError.message || fnError.toString();
        setError(errorMsg);
        if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment")) {
          localStorage.setItem('ai_tryon_disabled', 'true');
          localStorage.setItem('ai_tryon_disabled_at', Date.now().toString());
        }
        return;
      }

      if (data?.error) {
        console.error("[ProductDualImage] Data error:", data.error);
        setError(data.error);
        if (data.error.includes("credits") || data.error.includes("Rate limit") || data.error.includes("payment")) {
          localStorage.setItem('ai_tryon_disabled', 'true');
          localStorage.setItem('ai_tryon_disabled_at', Date.now().toString());
        }
        return;
      }

      if (data?.result) {
        console.log(`[ProductDualImage] Success! Got AI try-on image for ${product.name}`);
        setTryOnImage(data.result);
      } else {
        console.log(`[ProductDualImage] No result in response for ${product.name}`);
        setError("No image generated");
      }
    } catch (err: any) {
      console.error("[ProductDualImage] Exception:", err);
      const errorMsg = err?.message || err?.toString() || 'Unknown error';
      setError(errorMsg);
      if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment")) {
        localStorage.setItem('ai_tryon_disabled', 'true');
        localStorage.setItem('ai_tryon_disabled_at', Date.now().toString());
      }
    } finally {
      setLoading(false);
    }
  };

  // Main card always shows AI try-on (or product image if AI unavailable)
  const mainCardImage = tryOnImage || product.image_url;
  const dialogMainImage = activeView === 'tryon' && tryOnImage ? tryOnImage : product.image_url;

  return (
    <>
      {/* Main card - just shows the AI try-on image */}
      <div 
        className={`relative bg-secondary cursor-pointer ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          setDialogOpen(true);
        }}
      >
        {loading ? (
          <>
            <Skeleton className="w-full h-full absolute inset-0" />
            {product.image_url && (
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-cover opacity-30"
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="bg-background/80 backdrop-blur-sm rounded-full p-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <span className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
                AI Try-On...
              </span>
            </div>
          </>
        ) : (
          <img 
            src={mainCardImage} 
            alt={`${product.name} try-on`}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.log(`[ProductDualImage] Image load error, falling back`);
              (e.target as HTMLImageElement).src = product.image_url || '/placeholder.svg';
            }}
          />
        )}
        
        {/* Small AI indicator badge */}
        {tryOnImage && !loading && (
          <div className="absolute bottom-1 left-1 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sage" />
            <span className="text-[9px] text-muted-foreground">AI</span>
          </div>
        )}
        
        {/* Error indicator */}
        {error && !loading && !tryOnImage && (
          <div className="absolute bottom-1 left-1 bg-destructive/80 backdrop-blur-sm rounded px-1.5 py-0.5">
            <span className="text-[9px] text-destructive-foreground">AI unavailable</span>
          </div>
        )}
      </div>

      {/* Dialog with thumbnail switcher */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <div className="flex">
            {/* Thumbnail strip */}
            <div className="flex flex-col gap-2 p-3 bg-muted/30">
              {/* Product thumbnail */}
              <button
                onClick={() => setActiveView('product')}
                className={`relative w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  activeView === 'product' ? 'border-sage ring-2 ring-sage/30' : 'border-border hover:border-sage/50'
                }`}
              >
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt="Product"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">N/A</span>
                  </div>
                )}
                <span className="absolute bottom-0 left-0 right-0 bg-background/90 text-[10px] text-center py-0.5 font-medium">
                  Product
                </span>
              </button>

              {/* AI Try-on thumbnail */}
              <button
                onClick={() => tryOnImage && setActiveView('tryon')}
                disabled={!tryOnImage}
                className={`relative w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  activeView === 'tryon' && tryOnImage ? 'border-sage ring-2 ring-sage/30' : 'border-border'
                } ${tryOnImage ? 'hover:border-sage/50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
              >
                {loading ? (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                ) : tryOnImage ? (
                  <img 
                    src={tryOnImage} 
                    alt="AI Try-on"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted/50 flex flex-col items-center justify-center gap-1">
                    <Sparkles className="w-4 h-4 text-muted-foreground/40" />
                    <span className="text-[8px] text-muted-foreground">Unavailable</span>
                  </div>
                )}
                <span className="absolute bottom-0 left-0 right-0 bg-background/90 text-[10px] text-center py-0.5 font-medium">
                  AI Try-On
                </span>
              </button>
            </div>

            {/* Main dialog image */}
            <div className="flex-1 aspect-[3/4] bg-secondary">
              <img 
                src={dialogMainImage} 
                alt={activeView === 'tryon' ? `${product.name} try-on` : product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductDualImage;
