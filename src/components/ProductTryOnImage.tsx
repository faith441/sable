import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";
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

const ProductTryOnImage = ({ product, className = "" }: ProductTryOnImageProps) => {
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);

  // Check if AI try-on is disabled (e.g., credits exhausted)
  const aiDisabled = localStorage.getItem('ai_tryon_disabled') === 'true';

  useEffect(() => {
    if (!aiDisabled) {
      generateTryOnImage();
    } else {
      setUseOriginal(true);
    }
  }, [product.id, aiDisabled]);

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
          viewType: "upperBody",
          userGender
        }
      });

      if (fnError) {
        console.error("Try-on function error:", fnError);
        const errorMsg = fnError.message || fnError.toString();
        if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment")) {
          localStorage.setItem('ai_tryon_disabled', 'true');
        }
        throw fnError;
      }

      if (data?.error) {
        if (data.error.includes("credits") || data.error.includes("Rate limit") || data.error.includes("payment")) {
          localStorage.setItem('ai_tryon_disabled', 'true');
        }
        throw new Error(data.error);
      }

      if (data?.result) {
        setTryOnImage(data.result);
      } else {
        setUseOriginal(true);
      }
    } catch (err: any) {
      console.error("Error generating try-on for product:", product.name, err);
      const errorMsg = err?.message || err?.toString() || '';
      if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment")) {
        localStorage.setItem('ai_tryon_disabled', 'true');
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

  // Show original image when AI disabled or failed
  if (useOriginal || !tryOnImage) {
    return (
      <div className={`relative ${className}`}>
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover"
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
      />
    </div>
  );
};

export default ProductTryOnImage;
