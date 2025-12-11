import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [activeView, setActiveView] = useState<'product' | 'tryon'>('tryon');
  const [error, setError] = useState<string | null>(null);
  const [showThumbnails, setShowThumbnails] = useState(false);

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
  const hasProductImage = !!product.image_url;

  useEffect(() => {
    console.log(`[ProductDualImage] Init for ${product.name}, category: ${product.category}, isWearable: ${isWearable}, aiDisabled: ${aiDisabled}, hasImage: ${hasProductImage}`);
    if (!aiDisabled && isWearable && hasProductImage) {
      generateTryOnImage();
    } else if (!hasProductImage) {
      setActiveView('product');
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

  // Main card shows the selected view - fallback to placeholder if no images
  const mainCardImage = activeView === 'tryon' && tryOnImage 
    ? tryOnImage 
    : (product.image_url || '/placeholder.svg');

  const productImageSrc = product.image_url || '/placeholder.svg';

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Thumbnail strip - only visible when clicked */}
      {showThumbnails && (
        <div className="flex flex-col gap-1.5">
          {/* Product thumbnail */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveView('product');
            }}
            className={`relative w-14 h-16 rounded-md overflow-hidden border-2 transition-all ${
              activeView === 'product' ? 'border-sage ring-1 ring-sage/30' : 'border-border/50 hover:border-sage/50'
            }`}
          >
            <img 
              src={productImageSrc} 
              alt="Product"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 left-0 right-0 bg-background/90 text-[8px] text-center py-0.5 font-medium">
              Product
            </span>
          </button>

          {/* AI Try-on thumbnail */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (tryOnImage) setActiveView('tryon');
            }}
            disabled={!tryOnImage && !loading}
            className={`relative w-14 h-16 rounded-md overflow-hidden border-2 transition-all ${
              activeView === 'tryon' && tryOnImage ? 'border-sage ring-1 ring-sage/30' : 'border-border/50'
            } ${tryOnImage ? 'hover:border-sage/50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
          >
            {loading ? (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              </div>
            ) : tryOnImage ? (
              <img 
                src={tryOnImage} 
                alt="AI Try-on"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted/50 flex flex-col items-center justify-center gap-0.5">
                <Sparkles className="w-3 h-3 text-muted-foreground/40" />
                <span className="text-[7px] text-muted-foreground">N/A</span>
              </div>
            )}
            <span className="absolute bottom-0 left-0 right-0 bg-background/90 text-[8px] text-center py-0.5 font-medium">
              AI Try-On
            </span>
          </button>
        </div>
      )}

      {/* Main image - clickable to toggle thumbnails */}
      <div 
        className="relative flex-1 bg-secondary rounded-lg overflow-hidden cursor-pointer"
        onClick={() => setShowThumbnails(!showThumbnails)}
      >
        {loading && activeView === 'tryon' ? (
          <>
            <Skeleton className="w-full h-full absolute inset-0" />
            <img 
              src={productImageSrc} 
              alt={product.name} 
              className="w-full h-full object-cover opacity-30"
            />
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
            alt={activeView === 'tryon' ? `${product.name} try-on` : product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.log(`[ProductDualImage] Image load error, falling back`);
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        )}
        
        {/* Small AI indicator badge */}
        {activeView === 'tryon' && tryOnImage && !loading && (
          <div className="absolute bottom-1 left-1 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sage" />
            <span className="text-[9px] text-muted-foreground">AI</span>
          </div>
        )}
        
        {/* Error indicator */}
        {error && !loading && !tryOnImage && activeView === 'tryon' && (
          <div className="absolute bottom-1 left-1 bg-destructive/80 backdrop-blur-sm rounded px-1.5 py-0.5">
            <span className="text-[9px] text-destructive-foreground">AI unavailable</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDualImage;
