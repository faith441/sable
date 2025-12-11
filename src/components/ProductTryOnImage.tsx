import { useState, useEffect, useRef } from "react";
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

interface ProductTryOnImageProps {
  product: Product;
  className?: string;
}

// Categories that can have AI try-on images generated
const WEARABLE_CATEGORIES = ['tops', 'bottoms', 'outerwear', 'dresses', 'shoes', 'accessories'];

// Cache for generated try-on images keyed by product ID
const tryOnImageCache = new Map<string, string>();

const ProductTryOnImage = ({ product, className = "" }: ProductTryOnImageProps) => {
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);
  const generationAttemptedRef = useRef(false);

  // Check if AI try-on is disabled - but reset it after 1 hour to retry
  const checkAiDisabled = () => {
    const disabledAt = localStorage.getItem('ai_tryon_disabled_at');
    if (disabledAt) {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (parseInt(disabledAt) < oneHourAgo) {
        localStorage.removeItem('ai_tryon_disabled');
        localStorage.removeItem('ai_tryon_disabled_at');
        return false;
      }
    }
    return localStorage.getItem('ai_tryon_disabled') === 'true';
  };
  
  const aiDisabled = checkAiDisabled();
  const isWearable = WEARABLE_CATEGORIES.includes(product.category?.toLowerCase() || '');

  useEffect(() => {
    // Check cache first
    const cachedImage = tryOnImageCache.get(product.id);
    if (cachedImage) {
      setTryOnImage(cachedImage);
      return;
    }

    if (aiDisabled || !isWearable) {
      setUseOriginal(true);
      return;
    }

    // Only attempt generation once per component instance
    if (!generationAttemptedRef.current) {
      generationAttemptedRef.current = true;
      generateTryOnImage();
    }
  }, [product.id]);

  const generateTryOnImage = async () => {
    // Double-check cache before generating
    if (tryOnImageCache.has(product.id)) {
      setTryOnImage(tryOnImageCache.get(product.id)!);
      return;
    }

    setLoading(true);

    try {
      const preferences = JSON.parse(localStorage.getItem('guest_preferences') || '{}');
      const userGender = Array.isArray(preferences.gender) 
        ? preferences.gender[0] 
        : preferences.gender || "Women's";

      const garmentImages = [{
        name: product.name,
        category: product.category,
        brand: product.brand.name,
        image_url: product.image_url
      }];

      const { data, error: fnError } = await supabase.functions.invoke("virtual-tryon", {
        body: {
          garmentImages,
          viewType: "fullBody",
          userGender
        }
      });

      if (fnError) {
        const errorMsg = fnError.message || fnError.toString();
        if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment")) {
          localStorage.setItem('ai_tryon_disabled', 'true');
          localStorage.setItem('ai_tryon_disabled_at', Date.now().toString());
        }
        throw fnError;
      }

      if (data?.error) {
        if (data.error.includes("credits") || data.error.includes("Rate limit") || data.error.includes("payment")) {
          localStorage.setItem('ai_tryon_disabled', 'true');
          localStorage.setItem('ai_tryon_disabled_at', Date.now().toString());
        }
        throw new Error(data.error);
      }

      if (data?.result) {
        // Cache the result
        tryOnImageCache.set(product.id, data.result);
        setTryOnImage(data.result);
      } else {
        setUseOriginal(true);
      }
    } catch (err: any) {
      console.error("[ProductTryOnImage] Error generating try-on:", err);
      setUseOriginal(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <Skeleton className="w-full h-full absolute inset-0" />
        {product.image_url && (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="bg-background/80 backdrop-blur-sm rounded-full p-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <span className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
            Generating...
          </span>
        </div>
      </div>
    );
  }

  if (useOriginal || !tryOnImage) {
    return (
      <div className={`relative ${className}`}>
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <span className="text-xs text-muted-foreground">No image</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <img 
        src={tryOnImage} 
        alt={`${product.name} try-on`} 
        className="w-full h-full object-cover"
        onError={() => setUseOriginal(true)}
      />
    </div>
  );
};

export default ProductTryOnImage;
