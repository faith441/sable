import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShoppingBag, Loader2, Heart, Package, AlertCircle } from "lucide-react";
import MobileNav from "@/components/MobileNav";
import VideoGuide from "@/components/VideoGuide";
import ProfileMenu from "@/components/ProfileMenu";
import ProfileSheet from "@/components/ProfileSheet";
import ProductDetailDialog from "@/components/ProductDetailDialog";
import ProductTryOnImage from "@/components/ProductTryOnImage";
import ProductImageGallery from "@/components/ProductImageGallery";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

interface Capsule {
  name: string;
  description: string;
  total_pieces: number;
  total_price: number;
  outfit_count: number;
  products: Product[];
}

// AI features - set to false to enable AI wardrobe generation and virtual try-on
const AI_DISABLED = false;

// Sample wardrobe data for when AI is disabled
const SAMPLE_CAPSULES: Capsule[] = [
  {
    name: "Essential Minimalist",
    description: "A timeless collection of versatile pieces that form the foundation of any sophisticated wardrobe.",
    total_pieces: 12,
    total_price: 2450,
    outfit_count: 24,
    products: [
      { id: "sample-1", name: "Cashmere Crewneck Sweater", category: "tops", price: 295, colors: ["Ivory"], image_url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400", product_url: "#", brand: { name: "Loro Piana" } },
      { id: "sample-2", name: "Tailored Wool Trousers", category: "bottoms", price: 385, colors: ["Navy"], image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400", product_url: "#", brand: { name: "Theory" } },
      { id: "sample-3", name: "Silk Button-Down Shirt", category: "tops", price: 275, colors: ["White"], image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400", product_url: "#", brand: { name: "Equipment" } },
      { id: "sample-4", name: "Double-Breasted Blazer", category: "outerwear", price: 595, colors: ["Charcoal"], image_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400", product_url: "#", brand: { name: "Max Mara" } },
      { id: "sample-5", name: "Leather Chelsea Boots", category: "shoes", price: 425, colors: ["Black"], image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", product_url: "#", brand: { name: "Common Projects" } },
      { id: "sample-6", name: "Minimalist Leather Tote", category: "accessories", price: 475, colors: ["Tan"], image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400", product_url: "#", brand: { name: "Mansur Gavriel" } },
    ]
  },
  {
    name: "Weekend Casual",
    description: "Relaxed yet refined pieces perfect for off-duty moments and casual gatherings.",
    total_pieces: 10,
    total_price: 1850,
    outfit_count: 18,
    products: [
      { id: "sample-7", name: "Oversized Cotton Hoodie", category: "tops", price: 195, colors: ["Sage"], image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400", product_url: "#", brand: { name: "Acne Studios" } },
      { id: "sample-8", name: "Relaxed Fit Chinos", category: "bottoms", price: 165, colors: ["Khaki"], image_url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400", product_url: "#", brand: { name: "A.P.C." } },
      { id: "sample-9", name: "Premium Sneakers", category: "shoes", price: 285, colors: ["White"], image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400", product_url: "#", brand: { name: "Veja" } },
      { id: "sample-10", name: "Linen Blend T-Shirt", category: "tops", price: 85, colors: ["Cream"], image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400", product_url: "#", brand: { name: "COS" } },
      { id: "sample-11", name: "Lightweight Denim Jacket", category: "outerwear", price: 245, colors: ["Light Blue"], image_url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400", product_url: "#", brand: { name: "Levi's" } },
      { id: "sample-12", name: "Canvas Crossbody Bag", category: "accessories", price: 125, colors: ["Navy"], image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400", product_url: "#", brand: { name: "Rains" } },
    ]
  },
  {
    name: "Evening Elevated",
    description: "Sophisticated pieces for special occasions and memorable evenings.",
    total_pieces: 8,
    total_price: 3200,
    outfit_count: 12,
    products: [
      { id: "sample-13", name: "Silk Midi Dress", category: "dresses", price: 685, colors: ["Burgundy"], image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400", product_url: "#", brand: { name: "Reformation" } },
      { id: "sample-14", name: "Velvet Blazer", category: "outerwear", price: 495, colors: ["Midnight"], image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400", product_url: "#", brand: { name: "Saint Laurent" } },
      { id: "sample-15", name: "Strappy Heeled Sandals", category: "shoes", price: 545, colors: ["Gold"], image_url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400", product_url: "#", brand: { name: "Jimmy Choo" } },
      { id: "sample-16", name: "Crystal Embellished Clutch", category: "accessories", price: 375, colors: ["Silver"], image_url: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400", product_url: "#", brand: { name: "Judith Leiber" } },
      { id: "sample-17", name: "Statement Earrings", category: "accessories", price: 195, colors: ["Pearl"], image_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400", product_url: "#", brand: { name: "Jennifer Behr" } },
      { id: "sample-18", name: "Jo Malone Velvet Rose", category: "fragrance", price: 155, colors: ["Rose"], image_url: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400", product_url: "#", brand: { name: "Jo Malone London" } },
    ]
  }
];

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
  const [creditsExhausted, setCreditsExhausted] = useState(AI_DISABLED);
  const [usingSampleData, setUsingSampleData] = useState(false);

  useEffect(() => {
    // Set AI disabled flag in localStorage for other components
    if (AI_DISABLED) {
      localStorage.setItem('ai_tryon_disabled', 'true');
    }
    loadWardrobe();
    // Load favorites from localStorage
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

      // Check if we have cached capsules
      const cachedCapsules = localStorage.getItem('cached_capsules');
      if (cachedCapsules) {
        setCapsules(JSON.parse(cachedCapsules));
        setLoading(false);
        return;
      }

      // If AI is disabled and no cached capsules, use sample data
      if (AI_DISABLED) {
        setCapsules(SAMPLE_CAPSULES);
        setUsingSampleData(true);
        setLoading(false);
        return;
      }

      // If no cached capsules, generate new ones
      await generateWardrobe();
    } catch (error) {
      console.error("Error loading wardrobe:", error);
      toast.error("Failed to load wardrobe");
    } finally {
      setLoading(false);
    }
  };

  const generateWardrobe = async () => {
    // Check if AI is disabled
    if (AI_DISABLED || creditsExhausted) {
      toast.error("AI features are temporarily disabled. Please add AI credits to enable wardrobe generation.");
      return;
    }
    
    // Clear cached capsules to force fresh generation
    localStorage.removeItem('cached_capsules');
    setGenerating(true);
    try {
      const preferences = JSON.parse(localStorage.getItem('guest_preferences') || '{}');

      const { data, error } = await supabase.functions.invoke("generate-wardrobe", {
        body: { preferences },
      });

      // Check for credit exhaustion error
      if (error) {
        const errorMsg = error.message || error.toString();
        if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment")) {
          setCreditsExhausted(true);
          toast.error("AI credits exhausted. Please add funds to continue.");
          return;
        }
        throw error;
      }
      
      if (data?.error) {
        if (data.error.includes("credits") || data.error.includes("payment")) {
          setCreditsExhausted(true);
          toast.error("AI credits exhausted. Please add funds to continue.");
          return;
        }
        throw new Error(data.error);
      }

      const newCapsules = data.capsules || [];
      setCapsules(newCapsules);
      
      // Cache the generated capsules
      localStorage.setItem('cached_capsules', JSON.stringify(newCapsules));
      toast.success("Wardrobe regenerated successfully!");
    } catch (error: any) {
      console.error("Error generating wardrobe:", error);
      const errorMsg = error?.message || error?.toString() || '';
      if (errorMsg.includes("credits") || errorMsg.includes("payment") || errorMsg.includes("402")) {
        setCreditsExhausted(true);
        toast.error("AI credits exhausted. Please add funds to continue.");
      } else {
        toast.error(error.message || "Failed to generate wardrobe");
      }
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

      toast.success("Added to cart!", {
        action: {
          label: "View Cart",
          onClick: () => navigate("/cart")
        }
      });
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

      toast.success("Full capsule added to cart!", {
        action: {
          label: "View Cart",
          onClick: () => navigate("/cart")
        }
      });
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
        {/* AI Credits Alert */}
        {creditsExhausted && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">AI Features Temporarily Unavailable</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              {usingSampleData 
                ? "You're viewing sample wardrobe data. Add AI credits to generate personalized recommendations based on your style preferences."
                : "AI credits have been exhausted. Your previously generated wardrobes are shown below. Add credits to regenerate or access virtual try-on features."
              }
            </AlertDescription>
          </Alert>
        )}

        {capsules.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <Package className="w-16 h-16 text-muted-foreground" strokeWidth={1} />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-light">No Capsules Yet</h3>
                <p className="text-sm text-muted-foreground font-light">
                  Complete the survey to get personalized capsule wardrobes
                </p>
              </div>
              <Button variant="luxury" onClick={() => navigate("/survey")}>
                Take Survey
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="0" className="space-y-6">
          {usingSampleData && (
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full font-medium">
                Sample Collection
              </span>
              <span className="text-xs text-muted-foreground">
                Showing example wardrobes
              </span>
            </div>
          )}
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
              onClick={generateWardrobe}
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
