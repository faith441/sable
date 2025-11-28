import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, ShoppingBag, Loader2, Sparkles, Heart } from "lucide-react";
import MobileNav from "@/components/MobileNav";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url: string;
  product_url: string;
  brand: {
    name: string;
  };
}

const Wardrobe = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadWardrobe();
  }, []);

  const loadWardrobe = async () => {
    try {
      const preferences = localStorage.getItem('guest_preferences');
      if (!preferences) {
        toast.error("Please complete the style survey first");
        navigate("/survey");
        return;
      }

      await generateWardrobe();
    } catch (error) {
      console.error("Error loading wardrobe:", error);
      toast.error("Failed to load wardrobe");
    } finally {
      setLoading(false);
    }
  };

  const generateWardrobe = async () => {
    setGenerating(true);
    try {
      const preferences = JSON.parse(localStorage.getItem('guest_preferences') || '{}');

      const { data, error } = await supabase.functions.invoke("generate-wardrobe", {
        body: { preferences },
      });

      if (error) throw error;

      setProducts(data.products || []);
    } catch (error: any) {
      console.error("Error generating wardrobe:", error);
      toast.error(error.message || "Failed to generate wardrobe");
    } finally {
      setGenerating(false);
    }
  };

  const addToCart = async (product: Product) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = localStorage.getItem('guest_session_id') || crypto.randomUUID();
      
      if (!user) {
        localStorage.setItem('guest_session_id', sessionId);
      }

      const { error } = await supabase.from("cart_items").insert({
        user_id: user?.id,
        session_id: !user ? sessionId : null,
        product_id: product.id,
        quantity: 1,
      });

      if (error) throw error;

      toast.success("Added to cart!", {
        action: {
          label: "View Cart",
          onClick: () => navigate("/cart")
        }
      });
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  if (loading || generating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-lg font-light text-muted-foreground">
            {generating ? "Curating your wardrobe..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-light">Your Wardrobe</h1>
          <Button variant="ghost" size="sm" onClick={generateWardrobe} disabled={generating}>
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {products.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <Sparkles className="w-16 h-16 text-muted-foreground" strokeWidth={1} />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-light">No Recommendations Yet</h3>
                <p className="text-sm text-muted-foreground font-light">
                  Complete the survey to get personalized recommendations
                </p>
              </div>
              <Button variant="luxury" onClick={() => navigate("/survey")}>
                Take Survey
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-4">
                    <div className="w-32 h-40 bg-secondary flex-shrink-0 relative">
                      {product.image_url && (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      )}
                      <button className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 py-4 pr-4 flex flex-col justify-between min-w-0">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{product.brand.name}</p>
                        <h3 className="font-light mb-1 truncate">{product.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-light">${product.price}</p>
                        <Button 
                          size="sm" 
                          variant="luxury"
                          onClick={() => addToCart(product)}
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <MobileNav />
    </div>
  );
};

export default Wardrobe;