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

// Categories that can have AI try-on images generated
const WEARABLE_CATEGORIES = ['tops', 'bottoms', 'outerwear', 'dresses', 'shoes', 'accessories'];

const ProductDualImage = ({ product, className = "" }: ProductDualImageProps) => {
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if AI try-on is disabled
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
    if (!aiDisabled && isWearable) {
      generateTryOnImage();
    }
  }, [product.id, aiDisabled, isWearable]);

  const generateTryOnImage = async () => {
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
        return;
      }

      if (data?.error) {
        if (data.error.includes("credits") || data.error.includes("Rate limit") || data.error.includes("payment")) {
          localStorage.setItem('ai_tryon_disabled', 'true');
          localStorage.setItem('ai_tryon_disabled_at', Date.now().toString());
        }
        return;
      }

      if (data?.result) {
        setTryOnImage(data.result);
      }
    } catch (err: any) {
      const errorMsg = err?.message || err?.toString() || '';
      if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment")) {
        localStorage.setItem('ai_tryon_disabled', 'true');
        localStorage.setItem('ai_tryon_disabled_at', Date.now().toString());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex gap-1 ${className}`}>
      {/* Product Image */}
      <div className="w-1/2 h-full relative bg-secondary">
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
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground">No image</span>
          </div>
        )}
      </div>

      {/* AI Try-On Image */}
      <div className="w-1/2 h-full relative bg-secondary">
        {loading ? (
          <>
            <Skeleton className="w-full h-full absolute inset-0" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <div className="bg-background/80 backdrop-blur-sm rounded-full p-1.5">
                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              </div>
              <span className="text-[10px] text-muted-foreground bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded">
                AI Try-On
              </span>
            </div>
          </>
        ) : tryOnImage ? (
          <img 
            src={tryOnImage} 
            alt={`${product.name} try-on`} 
            className="w-full h-full object-cover"
            onError={(e) => {
              setTryOnImage(null);
            }}
          />
        ) : isWearable ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-muted/30">
            <Sparkles className="w-4 h-4 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground text-center px-2">Try-On Unavailable</span>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/30">
            <span className="text-[10px] text-muted-foreground text-center px-2">N/A</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDualImage;
