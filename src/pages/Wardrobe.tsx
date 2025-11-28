import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Loader2, Sparkles } from "lucide-react";

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
  const [wardrobe, setWardrobe] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadWardrobe();
  }, []);

  const loadWardrobe = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: prefs } = await supabase
        .from("style_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!prefs) {
        toast.error("Please complete the survey first");
        navigate("/survey");
        return;
      }

      const { data: wardrobes } = await supabase
        .from("capsule_wardrobes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!wardrobes || wardrobes.length === 0) {
        await generateWardrobe();
      } else {
        setWardrobe(wardrobes[0]);
        await loadProducts(wardrobes[0].id);
      }
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke("generate-wardrobe", {
        body: { userId: user.id },
      });

      if (error) throw error;

      toast.success("Your wardrobe has been generated!");
      setWardrobe(data.wardrobe);
      setProducts(data.products);
    } catch (error: any) {
      console.error("Error generating wardrobe:", error);
      toast.error(error.message || "Failed to generate wardrobe");
    } finally {
      setGenerating(false);
    }
  };

  const loadProducts = async (wardrobeId: string) => {
    try {
      const { data } = await supabase
        .from("wardrobe_items")
        .select(`
          product_id,
          products (
            id,
            name,
            category,
            price,
            image_url,
            product_url,
            brands (name)
          )
        `)
        .eq("wardrobe_id", wardrobeId);

      if (data) {
        setProducts(data.map((item: any) => ({
          ...item.products,
          brand: item.products.brands,
        })));
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  if (loading || generating) {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-xl font-light text-muted-foreground">
              {generating ? "Curating your perfect wardrobe..." : "Loading..."}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[500px] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 lg:px-12 py-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/")} className="font-light">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Home
            </Button>
            <Button 
              variant="outline" 
              onClick={generateWardrobe} 
              disabled={generating}
              className="font-light"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Regenerate Wardrobe
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-12 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20 space-y-6 max-w-3xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-muted-foreground font-light">
            Your Personalized Collection
          </p>
          <h1 className="text-6xl lg:text-7xl font-light tracking-tight leading-tight">
            {wardrobe?.name || "Your Capsule"}<br />
            <span className="italic font-normal">Wardrobe</span>
          </h1>
          {wardrobe?.description && (
            <p className="text-xl text-muted-foreground font-light leading-relaxed">
              {wardrobe.description}
            </p>
          )}
          <div className="flex gap-8 justify-center pt-4">
            <div>
              <p className="text-3xl font-light">{products.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Curated Pieces</p>
            </div>
            {wardrobe?.season && (
              <div>
                <p className="text-3xl font-light">{wardrobe.season}</p>
                <p className="text-sm text-muted-foreground mt-1">Season</p>
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card className="text-center p-16 shadow-elegant max-w-2xl mx-auto">
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-2xl font-light mb-3">No Products Found</h3>
                <p className="text-muted-foreground font-light">
                  Generate a wardrobe to see your personalized recommendations
                </p>
              </div>
              <Button variant="luxury" onClick={generateWardrobe} disabled={generating} size="lg">
                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Wardrobe
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {products.map((product, index) => (
              <Card 
                key={product.id} 
                className="group overflow-hidden hover:shadow-elegant transition-all duration-500 border-border/50"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  opacity: 0,
                  animation: 'fadeInUp 0.8s ease-out forwards'
                }}
              >
                <div className="aspect-[3/4] bg-secondary/20 overflow-hidden relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-primary" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm text-muted-foreground font-light">Image Coming Soon</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <div className="bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-light">
                      {product.category}
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-light">
                      {product.brand.name}
                    </p>
                    <h3 className="text-xl font-light mb-1">{product.name}</h3>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <p className="text-2xl font-light">${product.price}</p>
                    <Button size="sm" variant="outline" asChild className="font-light">
                      <a href={product.product_url} target="_blank" rel="noopener noreferrer">
                        View <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wardrobe;