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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const preferences = JSON.parse(localStorage.getItem('guest_preferences') || '{}');
  const userGender = Array.isArray(preferences.gender) 
    ? preferences.gender[0] 
    : preferences.gender || "Women's";

  useEffect(() => {
    generateTryOnImage();
  }, [product.id]);

  const generateTryOnImage = async () => {
    setLoading(true);
    setError(false);

    try {
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
        console.error("Try-on data error:", data.error);
        throw new Error(data.error);
      }

      if (data?.result) {
        setTryOnImage(data.result);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Error generating try-on for product:", product.name, err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Show original image if error or while loading shows skeleton
  if (error || !tryOnImage) {
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
