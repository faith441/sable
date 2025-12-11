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
    } else {
      setActiveView('product');
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
        setActiveView('product');
        return;
      }

      if (data?.error) {
        if (data.error.includes("credits") || data.error.includes("Rate limit") || data.error.includes("payment")) {
          localStorage.setItem('ai_tryon_disabled', 'true');
          localStorage.setItem('ai_tryon_disabled_at', Date.now().toString());
        }
        setActiveView('product');
        return;
      }

      if (data?.result) {
        setTryOnImage(data.result);
      } else {
        setActiveView('product');
      }
    } catch (err: any) {
      const errorMsg = err?.message || err?.toString() || '';
      if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment")) {
        localStorage.setItem('ai_tryon_disabled', 'true');
        localStorage.setItem('ai_tryon_disabled_at', Date.now().toString());
      }
      setActiveView('product');
    } finally {
      setLoading(false);
    }
  };

  const mainImage = activeView === 'tryon' && tryOnImage ? tryOnImage : product.image_url;

  return (
    <div className={`flex ${className}`}>
      {/* Thumbnail strip on left */}
      <div className="flex flex-col gap-1 w-12 flex-shrink-0 p-1">
        {/* Product thumbnail */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveView('product');
          }}
          className={`relative w-10 h-12 rounded-md overflow-hidden border-2 transition-all ${
            activeView === 'product' ? 'border-sage ring-1 ring-sage/30' : 'border-border/50 hover:border-sage/50'
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
              <span className="text-[8px] text-muted-foreground">N/A</span>
            </div>
          )}
          <span className="absolute bottom-0 left-0 right-0 bg-background/90 text-[7px] text-center py-0.5 font-medium">
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
          className={`relative w-10 h-12 rounded-md overflow-hidden border-2 transition-all ${
            activeView === 'tryon' && tryOnImage ? 'border-sage ring-1 ring-sage/30' : 'border-border/50'
          } ${tryOnImage ? 'hover:border-sage/50 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
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
            <div className="w-full h-full bg-muted/50 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-muted-foreground/40" />
            </div>
          )}
          <span className="absolute bottom-0 left-0 right-0 bg-background/90 text-[7px] text-center py-0.5 font-medium">
            AI views
          </span>
        </button>
      </div>

      {/* Main image */}
      <div className="flex-1 relative bg-secondary">
        {loading && activeView === 'tryon' ? (
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
                Generating AI Try-On...
              </span>
            </div>
          </>
        ) : (
          <img 
            src={mainImage} 
            alt={activeView === 'tryon' ? `${product.name} try-on` : product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ProductDualImage;
