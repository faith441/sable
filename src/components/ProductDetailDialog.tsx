import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Loader2, Sparkles } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("product");

  useEffect(() => {
    if (open && product) {
      setActiveTab("product");
      setTryOnImage(null);
    }
  }, [open, product]);

  const generateVirtualTryOn = async () => {
    if (!product) return;
    
    setGenerating(true);
    try {
      const preferences = JSON.parse(localStorage.getItem('guest_preferences') || '{}');
      const userImage = preferences.facialPhotos?.[0] || preferences.bodyPhotos?.[0];
      
      if (!userImage) {
        toast.error("Please upload a photo in your profile to use virtual try-on");
        return;
      }

      const { data, error } = await supabase.functions.invoke("virtual-tryon", {
        body: {
          userImage,
          garmentImage: product.image_url,
        },
      });

      if (error) throw error;

      setTryOnImage(data.result);
      setActiveTab("tryon");
      toast.success("Virtual try-on ready!");
    } catch (error: any) {
      console.error("Error generating try-on:", error);
      toast.error("Failed to generate virtual try-on");
    } finally {
      setGenerating(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-light text-2xl">{product.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="product" className="flex-1 font-light">Product</TabsTrigger>
            <TabsTrigger value="tryon" className="flex-1 font-light">Virtual Try-On</TabsTrigger>
          </TabsList>

          <TabsContent value="product" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-4">
              <div className="aspect-[3/4] bg-secondary rounded-lg overflow-hidden">
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3">
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
          </TabsContent>

          <TabsContent value="tryon" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-4">
              {!tryOnImage && !generating && (
                <div className="aspect-[3/4] bg-secondary rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-4 p-8">
                    <Sparkles className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground font-light">
                      See how this looks on you with AI virtual try-on
                    </p>
                    <Button 
                      variant="luxury" 
                      onClick={generateVirtualTryOn}
                    >
                      Generate Try-On
                    </Button>
                  </div>
                </div>
              )}

              {generating && (
                <div className="aspect-[3/4] bg-secondary rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground font-light">
                      Generating your virtual try-on...
                    </p>
                  </div>
                </div>
              )}

              {tryOnImage && (
                <div className="aspect-[3/4] bg-secondary rounded-lg overflow-hidden">
                  <img 
                    src={tryOnImage} 
                    alt="Virtual try-on result" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

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
