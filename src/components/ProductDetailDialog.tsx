import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  colors: string[];
  image_url: string;
  product_url: string;
  description?: string;
  brand: {
    name: string;
  };
}

interface ProductDetailDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (product: Product) => void;
}

const ProductDetailDialog = ({ product, open, onOpenChange, onAddToCart }: ProductDetailDialogProps) => {
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && product) {
      setCurrentImageIndex(0);
      setTryOnImage(null);
      
      // Auto-generate try-on if user has uploaded photos
      const preferences = JSON.parse(localStorage.getItem('guest_preferences') || '{}');
      const userImage = preferences.facialPhotos?.[0] || preferences.bodyPhotos?.[0];
      
      if (userImage && !generating) {
        generateVirtualTryOn();
      }
    }
  }, [open, product]);

  const generateVirtualTryOn = async () => {
    if (!product) return;
    
    setGenerating(true);
    try {
      const preferences = JSON.parse(localStorage.getItem('guest_preferences') || '{}');
      const userImage = preferences.facialPhotos?.[0] || preferences.bodyPhotos?.[0];
      
      if (!userImage) {
        return; // Silently skip if no photo
      }

      const { data, error } = await supabase.functions.invoke("virtual-tryon", {
        body: {
          userImage,
          garmentImage: product.image_url,
        },
      });

      if (error) throw error;

      setTryOnImage(data.result);
    } catch (error: any) {
      console.error("Error generating try-on:", error);
    } finally {
      setGenerating(false);
    }
  };

  const scrollToImage = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const imageWidth = container.offsetWidth;
    container.scrollTo({
      left: imageWidth * index,
      behavior: 'smooth',
    });
    setCurrentImageIndex(index);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const imageWidth = container.offsetWidth;
      const newIndex = Math.round(container.scrollLeft / imageWidth);
      setCurrentImageIndex(newIndex);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  if (!product) return null;

  const totalImages = tryOnImage ? 2 : 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-light text-2xl">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Image Carousel */}
          <div className="relative">
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-scroll snap-x snap-mandatory hide-scrollbar aspect-[3/4] rounded-lg"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none'
              }}
            >
              {/* Product Image */}
              <div className="min-w-full snap-start bg-secondary overflow-hidden">
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Virtual Try-On Image */}
              {(tryOnImage || generating) && (
                <div className="min-w-full snap-start bg-secondary overflow-hidden flex items-center justify-center">
                  {generating && !tryOnImage ? (
                    <div className="text-center space-y-4">
                      <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                      <p className="text-muted-foreground font-light">
                        Generating your virtual try-on...
                      </p>
                    </div>
                  ) : tryOnImage ? (
                    <img 
                      src={tryOnImage} 
                      alt="Virtual try-on result" 
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
              )}
            </div>

            {/* Navigation Arrows */}
            {totalImages > 1 && (
              <>
                {currentImageIndex > 0 && (
                  <button
                    onClick={() => scrollToImage(currentImageIndex - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {currentImageIndex < totalImages - 1 && !generating && (
                  <button
                    onClick={() => scrollToImage(currentImageIndex + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </>
            )}

            {/* Image Indicators */}
            {totalImages > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {Array.from({ length: totalImages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToImage(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      currentImageIndex === index 
                        ? 'w-8 bg-primary' 
                        : 'w-1.5 bg-background/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-3 mt-4 overflow-y-auto flex-1">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{product.brand.name}</p>
              <h3 className="text-xl font-light">{product.name}</h3>
              <p className="text-muted-foreground">{product.category}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Available colors:</span>
              <div className="flex gap-2">
                {product.colors.map((color, i) => (
                  <div 
                    key={i} 
                    className="w-6 h-6 rounded-full border border-border"
                    style={{ backgroundColor: color.toLowerCase() }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {product.description && (
              <div>
                <h4 className="font-light mb-2">Description</h4>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <p className="text-3xl font-light">${product.price}</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <Button 
            variant="luxury" 
            className="w-full"
            onClick={() => {
              onAddToCart(product);
              onOpenChange(false);
            }}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Add to Cart - ${product.price}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailDialog;
