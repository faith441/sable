import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Trash2, ShoppingBag, Loader2, Plus, Minus } from "lucide-react";

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
      toast.success("Item removed from cart");
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
    toast.success("Proceeding to checkout...");
  };

  const total = items.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/wardrobe")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-light">Shopping Bag</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {items.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <ShoppingBag className="w-16 h-16 text-muted-foreground" strokeWidth={1} />
              <p className="text-lg font-light text-muted-foreground">Your bag is empty</p>
              <Button 
                variant="luxury" 
                onClick={() => navigate(user ? "/wardrobe" : "/survey")}
              >
                {user ? "Browse Products" : "Discover Your Style"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-32 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.image_url && (
                          <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{item.product.brand.name}</p>
                          <h3 className="font-light mb-2 truncate">{item.product.name}</h3>
                          {item.size && <p className="text-sm text-muted-foreground mb-2">Size: {item.size}</p>}
                          <p className="text-lg font-light">${item.product.price}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2 border border-border rounded-lg">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-light min-w-[20px] text-center">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Checkout Section */}
            <Card className="shadow-elegant">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-light">Total</span>
                  <span className="text-2xl font-light">${total.toFixed(2)}</span>
                </div>
                <Button 
                  variant="luxury" 
                  size="lg" 
                  className="w-full"
                  onClick={handleCheckout}
                >
                  {user ? "Proceed to Checkout" : "Sign In to Checkout"}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;