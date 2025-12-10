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

interface ProductTryOnImageProps {
  product: Product;
  className?: string;
}

// Categories that can have AI try-on images generated
const WEARABLE_CATEGORIES = ['tops', 'bottoms', 'outerwear', 'dresses', 'shoes', 'accessories'];

const ProductTryOnImage = ({ product, className = "" }: ProductTryOnImageProps) => {
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if AI try-on is disabled - but reset it after 1 hour to retry
  const checkAiDisabled = () => {
    const disabledAt = localStorage.getItem('ai_tryon_disabled_at');
    if (disabledAt) {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (parseInt(disabledAt) < oneHourAgo) {
        // Reset after 1 hour
        localStorage.removeItem('ai_tryon_disabled');
        localStorage.removeItem('ai_tryon_disabled_at');
        return false;
      }
    }
    return localStorage.getItem('ai_tryon_disabled') === 'true';
  };
  
  const aiDisabled = checkAiDisabled();
  
  // Check if product category is wearable (skip fragrance, shampoo, conditioner, etc.)
  const isWearable = WEARABLE_CATEGORIES.includes(product.category?.toLowerCase() || '');

  useEffect(() => {
    console.log(`[ProductTryOnImage] Product: ${product.name}, Category: ${product.category}, isWearable: ${isWearable}, aiDisabled: ${aiDisabled}`);
    
    if (aiDisabled || !isWearable) {
      console.log(`[ProductTryOnImage] Skipping AI generation - aiDisabled: ${aiDisabled}, isWearable: ${isWearable}`);
      setUseOriginal(true);
    } else {
      generateTryOnImage();
    }
  }, [product.id, aiDisabled, isWearable]);

  const generateTryOnImage = async () => {
    setLoading(true);
    setError(null);
    console.log(`[ProductTryOnImage] Starting generation for: ${product.name}`);

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

      console.log(`[ProductTryOnImage] Calling virtual-tryon for ${product.name} with gender: ${userGender}`);

      const { data, error: fnError } = await supabase.functions.invoke("virtual-tryon", {
        body: {
          garmentImages,
          viewType: "upperBody",
          userGender
        }
      });

      console.log(`[ProductTryOnImage] Response for ${product.name}:`, { data, fnError });

      if (fnError) {
        console.error("[ProductTryOnImage] Function error:", fnError);
        const errorMsg = fnError.message || fnError.toString();
        if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment")) {
          localStorage.setItem('ai_tryon_disabled', 'true');
          localStorage.setItem('ai_tryon_disabled_at', Date.now().toString());
        }
        throw fnError;
      }

      if (data?.error) {
        console.error("[ProductTryOnImage] Data error:", data.error);
        if (data.error.includes("credits") || data.error.includes("Rate limit") || data.error.includes("payment")) {
          localStorage.setItem('ai_tryon_disabled', 'true');
          localStorage.setItem('ai_tryon_disabled_at', Date.now().toString());
        }
        throw new Error(data.error);
      }

      if (data?.result) {
        console.log(`[ProductTryOnImage] Success! Got image for ${product.name}`);
        setTryOnImage(data.result);
      } else {
        console.log(`[ProductTryOnImage] No result in response for ${product.name}, using original`);
        setUseOriginal(true);
      }
    } catch (err: any) {
      console.error("[ProductTryOnImage] Error generating try-on:", err);
      const errorMsg = err?.message || err?.toString() || '';
      setError(errorMsg);
      if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment")) {
        localStorage.setItem('ai_tryon_disabled', 'true');
        localStorage.setItem('ai_tryon_disabled_at', Date.now().toString());
      }
      setUseOriginal(true);
    } finally {
      setLoading(false);
    }
  };

  // Loading state with skeleton
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

  // Show original image when AI disabled, not wearable, or failed
  if (useOriginal || !tryOnImage) {
    return (
      <div className={`relative ${className}`}>
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error(`[ProductTryOnImage] Image failed to load: ${product.image_url}`);
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
        onError={(e) => {
          console.error(`[ProductTryOnImage] AI image failed to load, falling back`);
          setUseOriginal(true);
        }}
      />
    </div>
  );
};

export default ProductTryOnImage;
