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
import ProductDualImage from "@/components/ProductDualImage";
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

// Shared cache key with ProductTryOnImage
const TRYON_CACHE_KEY = 'ai_tryon_image_cache';
const WEARABLE_CATEGORIES = ['tops', 'bottoms', 'outerwear', 'dresses', 'shoes', 'accessories'];

const getTryOnCache = (): Map<string, string> => {
  try {
    const stored = localStorage.getItem(TRYON_CACHE_KEY);
    if (stored) {
      return new Map<string, string>(JSON.parse(stored));
    }
  } catch (e) {
    console.error('[Wardrobe] Failed to load try-on cache:', e);
  }
  return new Map();
};

const saveTryOnCache = (cache: Map<string, string>) => {
  try {
    localStorage.setItem(TRYON_CACHE_KEY, JSON.stringify(Array.from(cache.entries())));
  } catch (e) {
    console.error('[Wardrobe] Failed to save try-on cache:', e);
  }
};

// No sample data - wait for real brand partner inventory

interface CompletedTryOn {
  productId: string;
  productName: string;
  productImage: string;
  tryOnImage: string;
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
  const [creditsExhausted, setCreditsExhausted] = useState(AI_DISABLED);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [noInventory, setNoInventory] = useState(false);
  const [preGeneratingTryOn, setPreGeneratingTryOn] = useState(false);
  const [tryOnProgress, setTryOnProgress] = useState({ current: 0, total: 0 });
  const [completedTryOns, setCompletedTryOns] = useState<CompletedTryOn[]>([]);

  // Pre-generate try-on images for all products in capsules
  // showVideoGuide = false for background generation (when returning to cached wardrobe)
  const preGenerateTryOnImages = async (capsulesData: Capsule[], showVideoGuide: boolean = true) => {
    const aiDisabled = localStorage.getItem('ai_tryon_disabled') === 'true';
    if (aiDisabled || AI_DISABLED) return;

    const cache = getTryOnCache();
    const preferences = JSON.parse(localStorage.getItem('guest_preferences') || '{}');
    const userGender = Array.isArray(preferences.gender) 
      ? preferences.gender[0] 
      : preferences.gender || "Women's";

    // Collect all wearable products that aren't cached
    const productsToGenerate: Product[] = [];
    for (const capsule of capsulesData) {
      for (const product of capsule.products) {
        const isWearable = WEARABLE_CATEGORIES.includes(product.category?.toLowerCase() || '');
        if (isWearable && !cache.has(product.id)) {
          productsToGenerate.push(product);
        }
      }
    }

    if (productsToGenerate.length === 0) return;

    // Only show video guide for initial generation, not background generation
    if (showVideoGuide) {
      setPreGeneratingTryOn(true);
      setTryOnProgress({ current: 0, total: productsToGenerate.length });
      setCompletedTryOns([]);
    }

    const BATCH_SIZE = 3;
    let completed = 0;
    let shouldStop = false;

    // Helper to generate a single try-on image
    const generateSingleTryOn = async (product: Product): Promise<boolean> => {
      if (shouldStop) return false;
      
      try {
        const { data, error } = await supabase.functions.invoke("virtual-tryon", {
          body: {
            garmentImages: [{
              name: product.name,
              category: product.category,
              brand: product.brand.name,
              image_url: product.image_url
            }],
            viewType: "fullBody",
            userGender
          }
        });

        if (error) {
          const errorMsg = error.message || error.toString();
          if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment")) {
            localStorage.setItem('ai_tryon_disabled', 'true');
            localStorage.setItem('ai_tryon_disabled_at', Date.now().toString());
            shouldStop = true;
            return false;
          }
          return true; // Continue with next
        }

        if (data?.error) {
          if (data.error.includes("credits") || data.error.includes("Rate limit") || data.error.includes("payment")) {
            localStorage.setItem('ai_tryon_disabled', 'true');
            localStorage.setItem('ai_tryon_disabled_at', Date.now().toString());
            shouldStop = true;
            return false;
          }
          return true; // Continue with next
        }

        if (data?.result) {
          cache.set(product.id, data.result);
          saveTryOnCache(cache);
          // Add to completed try-ons for visual progress
          setCompletedTryOns(prev => [...prev, {
            productId: product.id,
            productName: product.name,
            productImage: product.image_url,
            tryOnImage: data.result
          }]);
        }
        return true;
      } catch (err) {
        console.error(`[Wardrobe] Error generating try-on for ${product.name}:`, err);
        return true; // Continue with next
      }
    };

    // Process in batches of 3
    for (let i = 0; i < productsToGenerate.length && !shouldStop; i += BATCH_SIZE) {
      const batch = productsToGenerate.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (product) => {
        await generateSingleTryOn(product);
        completed++;
        setTryOnProgress({ current: completed, total: productsToGenerate.length });
      }));
    }

    if (showVideoGuide) {
      setPreGeneratingTryOn(false);
      setCompletedTryOns([]);
    }
  };

  useEffect(() => {
    // Manage AI disabled flag in localStorage
    if (AI_DISABLED) {
      localStorage.setItem('ai_tryon_disabled', 'true');
    } else {
      // Clear any stale AI disabled flags when AI is enabled
      localStorage.removeItem('ai_tryon_disabled');
      localStorage.removeItem('ai_tryon_disabled_at');
    }
    loadWardrobe();
    // Load favorites from localStorage
    const savedFavorites = JSON.parse(localStorage.getItem('favorite_products') || '[]');
    setFavorites(savedFavorites);
  }, []);

  // Helper function to check if a string is a valid UUID
  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const loadWardrobe = async () => {
    try {
      const preferences = localStorage.getItem('guest_preferences');
      if (!preferences) {
        toast.error("Please complete the style survey first");
        navigate("/survey");
        return;
      }

      // Check if we have cached capsules with valid UUIDs
      const cachedCapsules = localStorage.getItem('cached_capsules');
      if (cachedCapsules) {
        const parsed = JSON.parse(cachedCapsules);
        // Validate that all product IDs are proper UUIDs
        const hasValidIds = parsed.every((capsule: Capsule) => 
          capsule.products.every((product: Product) => isValidUUID(product.id))
        );
        
        if (hasValidIds) {
          setCapsules(parsed);
          // Show wardrobe immediately, generate try-on images in background (no video guide)
          setLoading(false);
          // Fire and forget - don't await, don't show video guide
          preGenerateTryOnImages(parsed, false).catch(console.error);
          return;
        } else {
          // Clear invalid cached data
          localStorage.removeItem('cached_capsules');
        }
      }

      // If AI is disabled, show empty state
      if (AI_DISABLED) {
        setCapsules([]);
        setUsingSampleData(true);
        setCreditsExhausted(true);
        setLoading(false);
        return;
      }

      // Try to generate new wardrobes (will fall back to sample if AI fails)
      await generateWardrobe();
    } catch (error) {
      console.error("Error loading wardrobe:", error);
      // Show empty state on error
      setCapsules([]);
      setUsingSampleData(true);
      toast.error("Failed to load wardrobe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fallbackToEmptyState = async (reason: 'credits' | 'inventory' | 'error' = 'error') => {
    setCapsules([]);
    setUsingSampleData(true);
    if (reason === 'credits') {
      setCreditsExhausted(true);
    } else if (reason === 'inventory') {
      setNoInventory(true);
    }
  };

  const generateWardrobe = async () => {
    // Check if AI is disabled - show empty state
    if (AI_DISABLED || creditsExhausted) {
      await fallbackToEmptyState();
      toast.info("No wardrobe available. Please check back later.");
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
        if (errorMsg.includes("402") || errorMsg.includes("credits") || errorMsg.includes("payment") || errorMsg.includes("non-2xx")) {
          await fallbackToEmptyState('credits');
          toast.info("AI unavailable. Please check back later.");
          return;
        }
        throw error;
      }
      
      if (data?.error) {
        if (data.error === "no_inventory") {
          await fallbackToEmptyState('inventory');
          toast.info("No brand partner products available yet.");
          return;
        }
        if (data.error.includes("credits") || data.error.includes("payment")) {
          await fallbackToEmptyState('credits');
          toast.info("AI unavailable. Please check back later.");
          return;
        }
        throw new Error(data.error);
      }

      const newCapsules = data.capsules || [];
      setCapsules(newCapsules);
      
      // Cache the generated capsules
      localStorage.setItem('cached_capsules', JSON.stringify(newCapsules));
      
      // Wait for try-on images to complete before showing wardrobe
      await preGenerateTryOnImages(newCapsules);
      
      toast.success("Wardrobe regenerated successfully!");
    } catch (error: any) {
      console.error("Error generating wardrobe:", error);
      const errorMsg = error?.message || error?.toString() || '';
      if (errorMsg.includes("credits") || errorMsg.includes("payment") || errorMsg.includes("402") || errorMsg.includes("non-2xx")) {
        await fallbackToEmptyState('credits');
        toast.info("AI unavailable. Please check back later.");
      } else {
        // For other errors, show empty state
        await fallbackToEmptyState('error');
        toast.error("Failed to generate wardrobe. Please try again.");
      }
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

  if (generating || preGeneratingTryOn) {
    const preferences = JSON.parse(localStorage.getItem('guest_preferences') || '{}');
    return (
      <VideoGuide 
        gender={preferences.gender || []} 
        tryOnProgress={preGeneratingTryOn ? tryOnProgress : undefined}
        completedTryOns={preGeneratingTryOn ? completedTryOns : undefined}
      />
    );
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
        {/* No Inventory Alert */}
        {noInventory && (
          <Alert className="mb-6 border-sage/50 bg-sage/10">
            <Package className="h-4 w-4 text-sage" />
            <AlertTitle className="text-foreground">Coming Soon</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Brand partner products are coming soon! Check back later for personalized wardrobe recommendations.
            </AlertDescription>
          </Alert>
        )}

        {/* AI Credits Alert - only show if credits exhausted but not inventory issue */}
        {creditsExhausted && !noInventory && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">AI Features Temporarily Unavailable</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              AI credits have been exhausted. Please check back later for personalized wardrobe recommendations.
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
                            <ProductDualImage 
                              product={product}
                              className="w-full h-full"
                            />
                            <button 
                              className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors z-10"
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
