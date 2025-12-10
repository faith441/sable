import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
        throw fnError;
      }

      if (data?.error) {
        // Check if it's a credits/rate limit issue
        if (data.error.includes("credits") || data.error.includes("Rate limit")) {
          localStorage.setItem('ai_tryon_disabled', 'true');
          console.log("AI try-on disabled due to:", data.error);
        }
        throw new Error(data.error);
      }

      if (data?.result) {
        setTryOnImage(data.result);
      } else {
        setUseOriginal(true);
      }
    } catch (err) {
      console.error("Error generating try-on for product:", product.name, err);
      setUseOriginal(true);
    } finally {
      setLoading(false);
    }
  };

  // Show original image
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
        {loading && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-sage" />
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
