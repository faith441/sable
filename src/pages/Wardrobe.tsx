import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShoppingBag, Loader2, Heart, Package, Shirt } from "lucide-react";
import MobileNav from "@/components/MobileNav";
import VideoGuide from "@/components/VideoGuide";
import ProfileMenu from "@/components/ProfileMenu";
import ProfileSheet from "@/components/ProfileSheet";
import ProductDetailDialog from "@/components/ProductDetailDialog";
import ProductTryOnImage from "@/components/ProductTryOnImage";
import ProductImageGallery from "@/components/ProductImageGallery";

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
  isFromCloset?: boolean;
}

interface Capsule {
  name: string;
  description: string;
  total_pieces: number;
  total_price: number;
  outfit_count: number;
  products: Product[];
}

const Wardrobe = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDetailOpen, setProductDetailOpen] = useState(false);
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [favorites, setFavorites] = useState<Product[]>([]);

  useEffect(() => {
    loadWardrobe();
    const savedFavorites = JSON.parse(localStorage.getItem('favorite_products') || '[]');
    setFavorites(savedFavorites);
  }, []);

  const loadWardrobe = async () => {
    try {
      const preferences = localStorage.getItem('guest_preferences');
      if (!preferences) {
        toast.error("Please complete the style survey first");
        navigate("/survey");
        return;
      }

      // Fetch real data from database
      await fetchRealWardrobe();
    } catch (error) {
      console.error("Error loading wardrobe:", error);
      toast.error("Failed to load wardrobe");
    } finally {
      setLoading(false);
    }
  };

  const fetchRealWardrobe = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch approved brand products
    const { data: brandProducts } = await supabase
      .from("products")
      .select(`
        id, name, category, price, colors, image_url, product_url,
        brands!inner(name)
      `)
      .eq("is_available", true)
      .eq("approval_status", "approved")
      .limit(30);

    // Fetch user's closet items if logged in
    let closetItems: Product[] = [];
    if (user) {
      const { data: userWardrobe } = await supabase
        .from("user_wardrobe")
        .select("*")
        .eq("user_id", user.id);
      
      if (userWardrobe) {
        closetItems = userWardrobe.map(item => ({
          id: item.id,
          name: item.custom_description || item.custom_category || "Wardrobe Item",
          category: item.custom_category || "other",
          price: 0,
          colors: [],
          image_url: item.custom_image_url || "",
          product_url: "#",
          brand: { name: item.custom_brand || "Your Closet" },
          isFromCloset: true
        }));
      }
    }

    // Transform brand products
    const shopProducts: Product[] = (brandProducts || []).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      colors: p.colors || [],
      image_url: p.image_url || "",
      product_url: p.product_url,
      brand: { name: (p.brands as any)?.name || "Unknown Brand" }
    }));

    // Build capsules from real data
    const allProducts = [...shopProducts, ...closetItems];
    
    if (allProducts.length === 0) {
      // No products available - show empty state
      setCapsules([]);
      return;
    }

    // Group products by category for smart capsule building
    const byCategory: Record<string, Product[]> = {};
    allProducts.forEach(p => {
      const cat = p.category.toLowerCase();
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(p);
    });

    // Build capsules
    const generatedCapsules: Capsule[] = [];

    // Capsule 1: Your Wardrobe (closet items)
    if (closetItems.length > 0) {
      generatedCapsules.push({
        name: "Your Wardrobe",
        description: "Items you've added to your closet",
        total_pieces: closetItems.length,
        total_price: 0,
        outfit_count: Math.floor(closetItems.length / 2),
        products: closetItems
      });
    }

    // Capsule 2: Shop Recommendations (brand products)
    if (shopProducts.length > 0) {
      const totalPrice = shopProducts.reduce((sum, p) => sum + p.price, 0);
      generatedCapsules.push({
        name: "Shop Recommendations",
        description: "Curated pieces from our brand partners",
        total_pieces: shopProducts.length,
        total_price: totalPrice,
        outfit_count: Math.floor(shopProducts.length * 2),
        products: shopProducts
      });
    }

    // Capsule 3: Mix & Match (combined)
    if (closetItems.length > 0 && shopProducts.length > 0) {
      const mixedProducts = [...closetItems.slice(0, 3), ...shopProducts.slice(0, 5)];
      const mixedPrice = mixedProducts.filter(p => !p.isFromCloset).reduce((sum, p) => sum + p.price, 0);
      generatedCapsules.push({
        name: "Mix & Match",
        description: "Combine your wardrobe with new additions",
        total_pieces: mixedProducts.length,
        total_price: mixedPrice,
        outfit_count: mixedProducts.length * 2,
        products: mixedProducts
      });
    }

    setCapsules(generatedCapsules);
  };

  const regenerateWardrobe = async () => {
    setGenerating(true);
    try {
      await fetchRealWardrobe();
      toast.success("Wardrobe refreshed!");
    } catch (error) {
      console.error("Error regenerating wardrobe:", error);
      toast.error("Failed to refresh wardrobe");
    } finally {
      setGenerating(false);
    }
  };

  const addToCart = async (product: Product, redirectToCart: boolean = true) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = localStorage.getItem('guest_session_id') || crypto.randomUUID();
      
      if (!user) {
        localStorage.setItem('guest_session_id', sessionId);
      }

      // Check if item already exists in cart
      const query = supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("product_id", product.id);

      if (user) {
        query.eq("user_id", user.id);
      } else {
        query.eq("session_id", sessionId);
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        // Update quantity if item exists
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase.from("cart_items").insert({
          user_id: user?.id || null,
          session_id: user ? null : sessionId,
          product_id: product.id,
          quantity: 1,
          product_data: {
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            brand: product.brand,
          },
        });

        if (error) throw error;
      }

      toast.success(`"${product.name}" added to cart!`);
      
      // Redirect to cart after a brief delay
      if (redirectToCart) {
        setTimeout(() => navigate("/cart"), 800);
      }
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast.error(error?.message || "Failed to add to cart");
    }
  };

  const addCapsuleToCart = async (capsule: Capsule) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = localStorage.getItem('guest_session_id') || crypto.randomUUID();
      
      if (!user) {
        localStorage.setItem('guest_session_id', sessionId);
      }

      const cartItems = capsule.products.map(product => ({
        user_id: user?.id || null,
        session_id: user ? null : sessionId,
        product_id: product.id,
        quantity: 1,
        product_data: {
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          brand: product.brand,
        },
      }));

      const { error } = await supabase.from("cart_items").insert(cartItems);

      if (error) throw error;

      toast.success(`${capsule.products.length} items from "${capsule.name}" added to cart!`);
      
      // Redirect to cart after a brief delay
      setTimeout(() => navigate("/cart"), 1000);
    } catch (error: any) {
      console.error("Error adding capsule to cart:", error);
      toast.error(error?.message || "Failed to add to cart");
    }
  };

  const toggleFavorite = (product: Product) => {
    const isFavorited = favorites.some(f => f.id === product.id);
    
    let updatedFavorites: Product[];
    if (isFavorited) {
      updatedFavorites = favorites.filter(f => f.id !== product.id);
      toast.success("Removed from favorites");
    } else {
      updatedFavorites = [...favorites, product];
      toast.success("Added to favorites");
    }
    
    setFavorites(updatedFavorites);
    localStorage.setItem('favorite_products', JSON.stringify(updatedFavorites));
  };

  if (generating) {
    const preferences = JSON.parse(localStorage.getItem('guest_preferences') || '{}');
    return <VideoGuide gender={preferences.gender || []} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-lg font-light text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 
            onClick={() => navigate("/wardrobe")}
            className="text-xl font-light cursor-pointer hover:text-sage transition-colors flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-sage"></span>
            Sable
          </h1>
          <ProfileMenu 
            onProfileClick={() => setProfileOpen(true)}
          />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {capsules.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <Shirt className="w-16 h-16 text-muted-foreground" strokeWidth={1} />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-light">No Items Yet</h3>
                <p className="text-sm text-muted-foreground font-light">
                  Add items to your closet or wait for brand products to be available
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="luxury" onClick={() => navigate("/closet")}>
                  Add to Closet
                </Button>
                <Button variant="outline" onClick={() => navigate("/survey")}>
                  Take Survey
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="0" className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            {capsules.map((capsule, index) => (
              <TabsTrigger 
                key={index} 
                value={index.toString()} 
                className="flex-shrink-0 data-[state=active]:bg-sage/10 data-[state=active]:text-sage data-[state=active]:border-sage/30"
              >
                Capsule {index + 1}
              </TabsTrigger>
            ))}
          </TabsList>

            {capsules.map((capsule, capsuleIndex) => (
              <TabsContent key={capsuleIndex} value={capsuleIndex.toString()} className="space-y-6">
                {/* Capsule Overview Card */}
                <Card className="bg-gradient-to-br from-cream via-sage/10 to-accent/5 border-sage/20 shadow-soft">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h2 className="text-2xl font-light mb-2">{capsule.name}</h2>
                      <p className="text-sm text-muted-foreground font-light">{capsule.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 py-4">
                      <div className="text-center py-3">
                        <p className="text-2xl font-light text-sage">{capsule.total_pieces}</p>
                        <p className="text-xs text-muted-foreground font-light">Pieces</p>
                      </div>
                      <div className="text-center py-3">
                        <p className="text-2xl font-light text-primary">${capsule.total_price}</p>
                        <p className="text-xs text-muted-foreground font-light">Total</p>
                      </div>
                      <div className="text-center py-3">
                        <p className="text-2xl font-light text-accent">{capsule.outfit_count}+</p>
                        <p className="text-xs text-muted-foreground font-light">Outfits</p>
                      </div>
                    </div>

                    <Button 
                      variant="luxury" 
                      className="w-full"
                      onClick={() => addCapsuleToCart(capsule)}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Add Full Capsule to Cart
                    </Button>
                  </CardContent>
                </Card>

                {/* Products Grid */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light px-2">Items in This Capsule</h3>
                  
                  {capsule.products.map((product) => (
                    <Card 
                      key={product.id} 
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => {
                        setSelectedProduct(product);
                        setProductDetailOpen(true);
                      }}
                    >
                      <CardContent className="p-0">
                        <div className="flex gap-4">
                          <div 
                            className="w-32 h-40 bg-secondary flex-shrink-0 relative cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                              setImageGalleryOpen(true);
                            }}
                          >
                            <ProductTryOnImage 
                              product={product}
                              className="w-full h-full"
                            />
                            <button 
                              className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(product);
                              }}
                            >
                              <Heart 
                                className="w-4 h-4" 
                                fill={favorites.some(f => f.id === product.id) ? "currentColor" : "none"}
                              />
                            </button>
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
                            <div className="flex items-center justify-between">
                              <p className="text-xl font-light">${product.price}</p>
                              <Button 
                                size="sm" 
                                variant="luxury"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product);
                                }}
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
              </TabsContent>
            ))}
          </Tabs>
        )}

        {capsules.length > 0 && (
          <div className="mt-8 pb-8">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={regenerateWardrobe}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                "Regenerate Wardrobe"
              )}
            </Button>
          </div>
        )}
      </div>

      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
      <ProductDetailDialog 
        product={selectedProduct}
        open={productDetailOpen}
        onOpenChange={setProductDetailOpen}
        onAddToCart={addToCart}
      />
      <ProductImageGallery
        product={selectedProduct}
        open={imageGalleryOpen}
        onOpenChange={setImageGalleryOpen}
      />

      <MobileNav />
    </div>
  );
};

export default Wardrobe;
