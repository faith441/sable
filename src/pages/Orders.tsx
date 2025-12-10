import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Package, Truck, CheckCircle2, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import MobileNav from "@/components/MobileNav";
import ProfileMenu from "@/components/ProfileMenu";
import ProfileSheet from "@/components/ProfileSheet";

interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  image_url?: string;
}

interface Order {
  id: string;
  brand_order_id: string;
  order_status: string;
  payment_status: string;
  fulfillment_status: string | null;
  items: OrderItem[];
  total_amount: number;
  shipping_address: any;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-amber-500", label: "Processing" },
  confirmed: { icon: CheckCircle2, color: "text-primary", label: "Confirmed" },
  shipped: { icon: Truck, color: "text-blue-500", label: "Shipped" },
  delivered: { icon: Package, color: "text-green-500", label: "Delivered" },
};

const Orders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to view your orders");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("brand_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders((data || []).map(order => ({
        ...order,
        items: (Array.isArray(order.items) ? order.items : []) as unknown as OrderItem[],
      })));
    } catch (error: any) {
      console.error("Error loading orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-lg mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate("/wardrobe")}
              className="p-2 -ml-2 hover:bg-secondary/50 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-foreground/70" strokeWidth={1.5} />
            </button>
            <h1 className="font-serif text-lg tracking-wide">My Orders</h1>
            <ProfileMenu onProfileClick={() => setProfileOpen(true)} />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
              <Package className="w-8 h-8 text-muted-foreground/60" strokeWidth={1} />
            </div>
            <h2 className="font-serif text-xl mb-2">No Orders Yet</h2>
            <p className="text-sm text-muted-foreground mb-8 text-center max-w-[240px]">
              Your order history will appear here once you make a purchase
            </p>
            <Button 
              variant="luxury" 
              onClick={() => navigate("/wardrobe")}
              className="px-8"
            >
              Browse Collection
            </Button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {orders.map((order) => {
              const status = statusConfig[order.order_status] || statusConfig.pending;
              const StatusIcon = status.icon;
              
              return (
                <div 
                  key={order.id} 
                  className="bg-secondary/20 rounded-2xl overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="p-4 border-b border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">
                        Order #{order.brand_order_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-4 h-4 ${status.color}`} />
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-4">
                    <div className="space-y-3">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="w-14 h-18 bg-secondary/50 rounded-lg overflow-hidden flex-shrink-0">
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-4 h-4 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity}{item.size ? ` • Size: ${item.size}` : ''}
                            </p>
                            <p className="text-sm mt-0.5">${item.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{order.items.length - 3} more items
                        </p>
                      )}
                    </div>

                    <Separator className="my-4 bg-border/30" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="font-serif text-lg">${order.total_amount?.toLocaleString()}</span>
                    </div>

                    {order.tracking_number && (
                      <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Tracking Number</p>
                        {order.tracking_url ? (
                          <a 
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {order.tracking_number}
                          </a>
                        ) : (
                          <p className="text-sm">{order.tracking_number}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
      <MobileNav />
    </div>
  );
};

export default Orders;
