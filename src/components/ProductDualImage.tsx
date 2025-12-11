import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, RefreshCw } from "lucide-react";
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

// Cache for generated try-on images
const CACHE_KEY = 'ai_tryon_dual_cache';

const loadCacheFromStorage = (): Map<string, string> => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      return new Map(JSON.parse(stored));
    }
  } catch (e) {
    console.error('[ProductDualImage] Failed to load cache:', e);
  }
  return new Map();
};

const saveCacheToStorage = (cache: Map<string, string>) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(cache.entries())));
  } catch (e) {
    console.error('[ProductDualImage] Failed to save cache:', e);
  }
};

// Track which products have been attempted globally to prevent duplicate generation
const generationAttempted = new Set<string>();

const ProductDualImage = ({ product, className = "" }: ProductDualImageProps) => {
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'product' | 'tryon'>('tryon');
  const [error, setError] = useState<string | null>(null);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const mountedRef = useRef(true);

  const checkAiDisabled = () => {
    const disabledAt = localStorage.getItem('ai_tryon_disabled_at');
    if (disabledAt) {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      if (parseInt(disabledAt) < fiveMinutesAgo) {
        localStorage.removeItem('ai_tryon_disabled');
        localStorage.removeItem('ai_tryon_disabled_at');
        return false;
      }
    }
    return localStorage.getItem('ai_tryon_disabled') === 'true';
  };
  
  const aiDisabled = checkAiDisabled();
  const isWearable = WEARABLE_CATEGORIES.includes(product.category?.toLowerCase() || '');
  const hasProductImage = !!product.image_url;

  useEffect(() => {
    mountedRef.current = true;
    
    // Check cache first
    const currentCache = loadCacheFromStorage();
    const cachedImage = currentCache.get(product.id);
    
    if (cachedImage) {
      setTryOnImage(cachedImage);
      setActiveView('tryon');
      return;
    }

    // Only attempt once per product ID globally
    if (!aiDisabled && isWearable && hasProductImage && !generationAttempted.has(product.id)) {
      generationAttempted.add(product.id);
      generateTryOnImage();
    } else if (!hasProductImage) {
      setActiveView('product');
    }

    return () => {
      mountedRef.current = false;
    };
  }, [product.id]);

  const generateTryOnImage = async (forceRegenerate = false) => {
    // Check cache unless forcing regeneration
    if (!forceRegenerate) {
      const currentCache = loadCacheFromStorage();
      if (currentCache.has(product.id)) {
        setTryOnImage(currentCache.get(product.id)!);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const preferences = JSON.parse(localStorage.getItem('guest_preferences') || '{}');
      const userGender = Array.isArray(preferences.gender) 
        ? preferences.gender[0] 
        : preferences.gender || "Women's";

      const bodyPhotos = preferences.bodyPhotos || [];
      const userImage = bodyPhotos.length > 0 ? bodyPhotos[0] : null;

      const garmentImages = [{
        name: product.name,
        category: product.category,
        brand: product.brand?.name || 'Unknown',
        image_url: product.image_url
      }];

      const { data, error: fnError } = await supabase.functions.invoke("virtual-tryon", {
        body: {
          garmentImages,
          viewType: "fullBody",
          userGender,
          userImage
        }
      });

      if (!mountedRef.current) return;

      if (fnError) {
        const errorMsg = fnError.message || fnError.toString();
        setError(errorMsg);
        if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment")) {
          localStorage.setItem('ai_tryon_disabled', 'true');
          localStorage.setItem('ai_tryon_disabled_at', Date.now().toString());
        }
        return;
      }

      if (data?.error) {
        setError(data.error);
        if (data.error.includes("credits") || data.error.includes("Rate limit") || data.error.includes("payment")) {
          localStorage.setItem('ai_tryon_disabled', 'true');
          localStorage.setItem('ai_tryon_disabled_at', Date.now().toString());
        }
        return;
      }

      if (data?.result) {
        // Cache the result
        const cacheToUpdate = loadCacheFromStorage();
        cacheToUpdate.set(product.id, data.result);
        saveCacheToStorage(cacheToUpdate);
        setTryOnImage(data.result);
        setActiveView('tryon');
      } else {
        setError("No image generated");
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      const errorMsg = err?.message || 'Unknown error';
      setError(errorMsg);
      if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment")) {
        localStorage.setItem('ai_tryon_disabled', 'true');
        localStorage.setItem('ai_tryon_disabled_at', Date.now().toString());
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleManualRegenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    generateTryOnImage(true);
  };

  const mainCardImage = activeView === 'tryon' && tryOnImage 
    ? tryOnImage 
    : (product.image_url || '/placeholder.svg');

  const productImageSrc = product.image_url || '/placeholder.svg';

  return (
    <div className={`flex gap-2 ${className}`}>
      {showThumbnails && (
        <div className="flex flex-col gap-1.5">
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

          {/* Manual regenerate button */}
          {isWearable && hasProductImage && !aiDisabled && (
            <button
              onClick={handleManualRegenerate}
              disabled={loading}
              className="w-14 h-8 rounded-md border border-border/50 hover:border-sage/50 flex items-center justify-center transition-all disabled:opacity-50"
              title="Regenerate AI Try-On"
            >
              <RefreshCw className={`w-3 h-3 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      )}

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
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        )}
        
        {activeView === 'tryon' && tryOnImage && !loading && (
          <div className="absolute bottom-1 left-1 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sage" />
            <span className="text-[9px] text-muted-foreground">AI</span>
          </div>
        )}
        
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
