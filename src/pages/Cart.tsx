import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Trash2, ShoppingBag, Loader2, Plus, Minus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface CartItem {
  id: string;
  quantity: number;
  size?: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    brand: { name: string };
  };
}

const Cart = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadCart();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const getSessionId = () => {
    let sessionId = localStorage.getItem('guest_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('guest_session_id', sessionId);
    }
    return sessionId;
  };

  const loadCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = getSessionId();

      const query = supabase
        .from("cart_items")
        .select("id, quantity, size, product_data");

      if (user) {
        query.eq("user_id", user.id);
      } else {
        query.eq("session_id", sessionId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const itemsWithProduct = (data || []).filter((item: any) => item.product_data);

      setItems(itemsWithProduct.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        size: item.size,
        product: item.product_data as any,
      })) || []);
    } catch (error) {
      console.error("Error loading cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeItem(itemId);
      return;
    }

    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", itemId);

      if (error) throw error;

      setItems(items.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setItems(items.filter(item => item.id !== itemId));
      toast.success("Item removed");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  const handleCheckout = () => {
    if (!user) {
      toast("Please sign in to continue", {
        description: "Create an account to complete your purchase",
        action: {
          label: "Sign In",
          onClick: () => navigate("/auth?redirect=cart")
        }
      });
      return;
    }
    navigate("/checkout");
  };

  const total = items.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Elegant Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-lg mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate("/wardrobe")}
              className="p-2 -ml-2 hover:bg-secondary/50 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-foreground/70" strokeWidth={1.5} />
            </button>
            <div className="text-center">
              <h1 className="font-serif text-lg tracking-wide">Shopping Bag</h1>
              {items.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>
            <div className="w-9" />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-8">
        {items.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
              <ShoppingBag className="w-8 h-8 text-muted-foreground/60" strokeWidth={1} />
            </div>
            <h2 className="font-serif text-xl mb-2">Your bag is empty</h2>
            <p className="text-sm text-muted-foreground mb-8 text-center max-w-[240px]">
              Discover curated pieces tailored to your unique style
            </p>
            <Button 
              variant="luxury" 
              onClick={() => navigate(user ? "/wardrobe" : "/survey")}
              className="px-8"
            >
              {user ? "Explore Collection" : "Discover Your Style"}
            </Button>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Items List */}
            <div className="space-y-6">
              {items.map((item, index) => (
                <div key={item.id}>
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-28 h-36 bg-secondary/30 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                      {item.product.image_url ? (
                        <img 
                          src={item.product.image_url} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 flex flex-col py-1">
                      <div className="flex-1">
                        <p className="text-[11px] uppercase tracking-widest text-muted-foreground/70 mb-1">
                          {item.product.brand?.name || 'Sable'}
                        </p>
                        <h3 className="font-serif text-base leading-snug mb-1.5 line-clamp-2">
                          {item.product.name}
                        </h3>
                        {item.size && (
                          <p className="text-xs text-muted-foreground">
                            Size {item.size}
                          </p>
                        )}
                      </div>

                      <div className="flex items-end justify-between mt-auto">
                        <p className="font-serif text-lg">
                          ${item.product.price?.toLocaleString()}
                        </p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-border/50 flex items-center justify-center hover:bg-secondary/50 transition-colors"
                          >
                            <Minus className="h-3 w-3" strokeWidth={1.5} />
                          </button>
                          <span className="w-8 text-center text-sm font-light">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-border/50 flex items-center justify-center hover:bg-secondary/50 transition-colors"
                          >
                            <Plus className="h-3 w-3" strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-destructive/10 transition-colors ml-2"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < items.length - 1 && (
                    <Separator className="mt-6 bg-border/30" />
                  )}
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="pt-4">
              <Separator className="bg-border/30 mb-6" />
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-muted-foreground">Calculated at checkout</span>
                </div>
              </div>

              <Separator className="my-5 bg-border/30" />

              <div className="flex justify-between items-baseline mb-8">
                <span className="text-sm uppercase tracking-wide">Total</span>
                <span className="font-serif text-2xl">${total.toLocaleString()}</span>
              </div>

              <Button 
                variant="luxury" 
                size="lg" 
                className="w-full h-14 text-base tracking-wide"
                onClick={handleCheckout}
              >
                {user ? "Continue to Checkout" : "Sign In to Checkout"}
              </Button>

              <p className="text-[11px] text-muted-foreground/60 text-center mt-4">
                Complimentary shipping on orders over $500
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
