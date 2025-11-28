import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";

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

      // Check if user has preferences
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

      // Get latest wardrobe
      const { data: wardrobes } = await supabase
        .from("capsule_wardrobes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!wardrobes || wardrobes.length === 0) {
        // Generate new wardrobe
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
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Home
        </Button>

        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4">Your Capsule Wardrobe</h1>
          <p className="text-xl text-muted-foreground">
            {wardrobe?.name || "Curated just for you"}
          </p>
        </div>

        {products.length === 0 ? (
          <Card className="text-center p-12">
            <CardHeader>
              <CardTitle>No products found</CardTitle>
              <CardDescription>Try generating a new wardrobe</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={generateWardrobe} disabled={generating}>
                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Generate Wardrobe
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="aspect-[3/4] bg-muted">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">{product.brand.name}</p>
                  <h3 className="font-semibold mb-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold">${product.price}</p>
                    <Button size="sm" asChild>
                      <a href={product.product_url} target="_blank" rel="noopener noreferrer">
                        Shop <ExternalLink className="ml-2 h-4 w-4" />
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