import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import MobileNav from "@/components/MobileNav";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  colors: string[];
  image_url: string;
  product_url: string;
  brand: {
    name: string;
  };
}

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    const savedFavorites = localStorage.getItem('favorite_products');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    setLoading(false);
  };

  const removeFavorite = (productId: string) => {
    const updatedFavorites = favorites.filter(p => p.id !== productId);
    setFavorites(updatedFavorites);
    localStorage.setItem('favorite_products', JSON.stringify(updatedFavorites));
    toast.success("Removed from favorites");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg font-light text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/wardrobe")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-light">Favorites</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {favorites.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <Heart className="w-16 h-16 text-muted-foreground" strokeWidth={1} />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-light">No Favorites Yet</h3>
                <p className="text-sm text-muted-foreground font-light">
                  Start favoriting items from your wardrobe
                </p>
              </div>
              <Button variant="luxury" onClick={() => navigate("/wardrobe")}>
                Browse Wardrobe
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {favorites.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-4">
                    <div className="w-32 h-40 bg-secondary flex-shrink-0 relative">
                      {product.image_url && (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 py-4 pr-4 flex flex-col justify-between min-w-0">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{product.brand.name}</p>
                        <h4 className="font-light mb-1 truncate">{product.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                        <div className="flex gap-1 mb-2">
                          {product.colors.map((color, i) => (
                            <div 
                              key={i} 
                              className="w-4 h-4 rounded-full border border-border"
                              style={{ backgroundColor: color.toLowerCase() }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xl font-light">${product.price}</p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeFavorite(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

export default Favorites;
