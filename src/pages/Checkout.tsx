import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ShoppingBag, CreditCard, MapPin, Check } from "lucide-react";
import { z } from "zod";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "PH", name: "Philippines" },
  { code: "SG", name: "Singapore" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "CH", name: "Switzerland" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "HK", name: "Hong Kong" },
  { code: "NZ", name: "New Zealand" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "IN", name: "India" },
];

const shippingSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  address: z.string().min(5, "Address is required").max(200),
  apartment: z.string().max(50).optional(),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State/Province is required").max(100),
  zipCode: z.string().min(4, "ZIP/Postal code is required").max(20),
  country: z.string().min(2, "Country is required"),
  phone: z.string().min(10, "Phone number is required").max(20),
});

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

const Checkout = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    phone: "",
  });

  useEffect(() => {
    checkUserAndLoadCart();
  }, []);

  const checkUserAndLoadCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to checkout");
        navigate("/auth?redirect=cart");
        return;
      }
      
      setUser(user);

      // Load cart items
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, size, product_data")
        .eq("user_id", user.id);

      if (error) throw error;

      const itemsWithProduct = (data || []).filter((item: any) => item.product_data);
      
      if (itemsWithProduct.length === 0) {
        toast.error("Your cart is empty");
        navigate("/cart");
        return;
      }

      setItems(itemsWithProduct.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        size: item.size,
        product: item.product_data as any,
      })));

      // Pre-fill name from profile if available
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profile?.full_name) {
        const names = profile.full_name.split(" ");
        setShippingInfo(prev => ({
          ...prev,
          firstName: names[0] || "",
          lastName: names.slice(1).join(" ") || "",
        }));
      }
    } catch (error) {
      console.error("Error loading checkout:", error);
      toast.error("Failed to load checkout");
    } finally {
      setLoading(false);
    }
  };

  const validateShipping = () => {
    try {
      shippingSchema.parse(shippingInfo);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleShippingSubmit = () => {
    if (validateShipping()) {
      setStep('payment');
    }
  };

  const handlePlaceOrder = async () => {
    setProcessing(true);
    
    try {
      // Create order in brand_orders table
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        size: item.size,
        image_url: item.product.image_url,
      }));

      const { error: orderError } = await supabase
        .from("brand_orders")
        .insert({
          user_id: user.id,
          brand_order_id: `SABLE-${Date.now()}`,
          order_status: "pending",
          payment_status: "paid",
          items: orderItems,
          total_amount: total,
          shipping_address: shippingInfo,
        });

      if (orderError) throw orderError;

      // Clear cart
      const { error: clearError } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (clearError) console.error("Error clearing cart:", clearError);

      setStep('confirmation');
      toast.success("Order placed successfully!");
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);
  const shipping = subtotal >= 500 ? 0 : 25;
  const total = subtotal + shipping;
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
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => step === 'shipping' ? navigate("/cart") : setStep('shipping')}
              className="p-2 -ml-2 hover:bg-secondary/50 rounded-full transition-colors"
              disabled={step === 'confirmation'}
            >
              <ArrowLeft className="h-5 w-5 text-foreground/70" strokeWidth={1.5} />
            </button>
            <div className="text-center">
              <h1 className="font-serif text-lg tracking-wide">
                {step === 'confirmation' ? 'Order Confirmed' : 'Checkout'}
              </h1>
            </div>
            <div className="w-9" />
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      {step !== 'confirmation' && (
        <div className="max-w-2xl mx-auto px-5 py-6">
          <div className="flex items-center justify-center gap-3">
            <div className={`flex items-center gap-2 ${step === 'shipping' ? 'text-foreground' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                step === 'shipping' ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground'
              }`}>
                {step === 'payment' ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className="text-sm font-light hidden sm:inline">Shipping</span>
            </div>
            <div className="w-12 h-px bg-border" />
            <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-foreground' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                step === 'payment' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                2
              </div>
              <span className="text-sm font-light hidden sm:inline">Payment</span>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-5">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Main Content */}
          <div className="md:col-span-3">
            {step === 'shipping' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                  <h2 className="font-serif text-xl">Shipping Address</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-xs uppercase tracking-wide text-muted-foreground">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={shippingInfo.firstName}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, firstName: e.target.value })}
                      className="h-12 bg-secondary/30 border-border/50 focus:border-primary"
                    />
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={shippingInfo.lastName}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, lastName: e.target.value })}
                      className="h-12 bg-secondary/30 border-border/50 focus:border-primary"
                    />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Street Address
                  </Label>
                  <Input
                    id="address"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                    className="h-12 bg-secondary/30 border-border/50 focus:border-primary"
                    placeholder="123 Main Street"
                  />
                  {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apartment" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Apartment, Suite, etc. (optional)
                  </Label>
                  <Input
                    id="apartment"
                    value={shippingInfo.apartment}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, apartment: e.target.value })}
                    className="h-12 bg-secondary/30 border-border/50 focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-xs uppercase tracking-wide text-muted-foreground">
                      City
                    </Label>
                    <Input
                      id="city"
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                      className="h-12 bg-secondary/30 border-border/50 focus:border-primary"
                    />
                    {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-xs uppercase tracking-wide text-muted-foreground">
                      State
                    </Label>
                    <Input
                      id="state"
                      value={shippingInfo.state}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                      className="h-12 bg-secondary/30 border-border/50 focus:border-primary"
                    />
                    {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
                  </div>
                </div>

                {/* Country Selector */}
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Country
                  </Label>
                  <Select
                    value={shippingInfo.country}
                    onValueChange={(value) => setShippingInfo({ ...shippingInfo, country: value })}
                  >
                    <SelectTrigger className="h-12 bg-secondary/30 border-border/50 focus:border-primary">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border z-50">
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-xs uppercase tracking-wide text-muted-foreground">
                      ZIP / Postal Code
                    </Label>
                    <Input
                      id="zipCode"
                      value={shippingInfo.zipCode}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                      className="h-12 bg-secondary/30 border-border/50 focus:border-primary"
                    />
                    {errors.zipCode && <p className="text-xs text-destructive">{errors.zipCode}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                      className="h-12 bg-secondary/30 border-border/50 focus:border-primary"
                    />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>
                </div>

                <Button 
                  variant="luxury" 
                  size="lg" 
                  className="w-full h-14 text-base tracking-wide mt-8"
                  onClick={handleShippingSubmit}
                >
                  Continue to Payment
                </Button>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                  <h2 className="font-serif text-xl">Payment</h2>
                </div>

                {/* Shipping Summary */}
                <div className="bg-secondary/30 rounded-xl p-4 mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Shipping to</p>
                      <p className="text-sm">{shippingInfo.firstName} {shippingInfo.lastName}</p>
                      <p className="text-sm text-muted-foreground">
                        {shippingInfo.address}{shippingInfo.apartment ? `, ${shippingInfo.apartment}` : ''}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {COUNTRIES.find(c => c.code === shippingInfo.country)?.name || shippingInfo.country}
                      </p>
                    </div>
                    <button 
                      onClick={() => setStep('shipping')}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Payment Form Placeholder */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Card Number
                    </Label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        placeholder="4242 4242 4242 4242"
                        className="h-12 bg-secondary/30 border-border/50 focus:border-primary pl-12"
                        maxLength={19}
                      />
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry" className="text-xs uppercase tracking-wide text-muted-foreground">
                        Expiration
                      </Label>
                      <Input
                        id="expiry"
                        placeholder="MM / YY"
                        className="h-12 bg-secondary/30 border-border/50 focus:border-primary"
                        maxLength={7}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc" className="text-xs uppercase tracking-wide text-muted-foreground">
                        Security Code
                      </Label>
                      <Input
                        id="cvc"
                        placeholder="CVC"
                        className="h-12 bg-secondary/30 border-border/50 focus:border-primary"
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nameOnCard" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Name on Card
                    </Label>
                    <Input
                      id="nameOnCard"
                      placeholder="John Doe"
                      defaultValue={`${shippingInfo.firstName} ${shippingInfo.lastName}`}
                      className="h-12 bg-secondary/30 border-border/50 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Demo Notice */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Demo mode — no real payment will be processed
                  </p>
                </div>

                <Button 
                  variant="luxury" 
                  size="lg" 
                  className="w-full h-14 text-base tracking-wide mt-4"
                  onClick={handlePlaceOrder}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    `Place Order • $${total.toLocaleString()}`
                  )}
                </Button>

                <p className="text-[11px] text-muted-foreground/60 text-center">
                  By placing your order, you agree to our Terms of Service
                </p>
              </div>
            )}

            {step === 'confirmation' && (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-primary" strokeWidth={1.5} />
                </div>
                <h2 className="font-serif text-2xl mb-2">Thank You!</h2>
                <p className="text-muted-foreground mb-8">
                  Your order has been placed successfully
                </p>

                <div className="bg-secondary/30 rounded-xl p-6 text-left mb-8">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Shipping to</p>
                  <p className="font-medium">{shippingInfo.firstName} {shippingInfo.lastName}</p>
                  <p className="text-sm text-muted-foreground">
                    {shippingInfo.address}{shippingInfo.apartment ? `, ${shippingInfo.apartment}` : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button 
                    variant="luxury" 
                    size="lg" 
                    className="w-full h-14"
                    onClick={() => navigate("/orders")}
                  >
                    View Orders
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full h-14"
                    onClick={() => navigate("/wardrobe")}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          {step !== 'confirmation' && (
            <div className="md:col-span-2">
              <div className="sticky top-32 bg-secondary/20 rounded-2xl p-5">
                <h3 className="font-serif text-lg mb-4">Order Summary</h3>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-20 bg-secondary/50 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.image_url ? (
                          <img 
                            src={item.product.image_url} 
                            alt={item.product.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm mt-1">${(item.product.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4 bg-border/30" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `$${shipping}`}</span>
                  </div>
                </div>

                <Separator className="my-4 bg-border/30" />

                <div className="flex justify-between font-serif text-lg">
                  <span>Total</span>
                  <span>${total.toLocaleString()}</span>
                </div>

                {shipping === 0 && (
                  <p className="text-[11px] text-primary/80 mt-3 text-center">
                    ✓ You qualify for free shipping
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Checkout;
