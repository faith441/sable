import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Loader2, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OutfitPlan {
  id: string;
  name: string;
  day_of_week: string;
  items: any[];
  image_url?: string;
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const OutfitPlanner = () => {
  const navigate = useNavigate();
  const [outfits, setOutfits] = useState<OutfitPlan[]>([]);
  const [wardrobe, setWardrobe] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast("Please sign in to access your outfit planner", {
        action: {
          label: "Sign In",
          onClick: () => navigate("/auth")
        }
      });
      navigate("/");
      return;
    }
    loadData();
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user's wardrobe
      const { data: wardrobeData } = await supabase
        .from("user_wardrobe")
        .select("*, products(*)")
        .eq("user_id", user.id);

      setWardrobe(wardrobeData || []);

      // Load outfit plans
      const { data: outfitsData } = await supabase
        .from("outfit_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("day_of_week");

      setOutfits((outfitsData || []).map(outfit => ({
        id: outfit.id,
        name: outfit.name,
        day_of_week: outfit.day_of_week || '',
        items: Array.isArray(outfit.items) ? outfit.items : [],
        image_url: outfit.image_url || undefined
      })));
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load outfit planner");
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyOutfits = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke("generate-weekly-outfits", {
        body: { userId: user.id }
      });

      if (error) throw error;

      toast.success("Weekly outfits generated!");
      loadData();
    } catch (error: any) {
      console.error("Error generating outfits:", error);
      toast.error(error.message || "Failed to generate outfits");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-light">Outfit Planner</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {wardrobe.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <Sparkles className="w-16 h-16 text-muted-foreground" strokeWidth={1} />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-light">No Items in Wardrobe</h3>
                <p className="text-sm text-muted-foreground font-light">
                  Purchase items from your recommendations to start planning outfits
                </p>
              </div>
              <Button variant="luxury" onClick={() => navigate("/wardrobe")}>
                Browse Recommendations
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-light">Weekly Outfits</h2>
                <p className="text-sm text-muted-foreground font-light">
                  {wardrobe.length} items in wardrobe
                </p>
              </div>
              <Button 
                variant="luxury" 
                size="sm"
                onClick={generateWeeklyOutfits}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>

            <Tabs defaultValue="Monday" className="w-full">
              <TabsList className="grid w-full grid-cols-7 mb-6">
                {days.map(day => (
                  <TabsTrigger key={day} value={day} className="text-xs px-1">
                    {day.slice(0, 3)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {days.map(day => {
                const outfit = outfits.find(o => o.day_of_week === day);
                
                return (
                  <TabsContent key={day} value={day} className="space-y-4">
                    {outfit ? (
                      <Card>
                        <CardContent className="p-6 space-y-4">
                          <h3 className="text-xl font-light">{outfit.name}</h3>
                          {outfit.image_url && (
                            <div className="aspect-[3/4] rounded-lg overflow-hidden">
                              <img src={outfit.image_url} alt={outfit.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="space-y-2">
                            {outfit.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                                <div className="w-12 h-16 bg-background rounded overflow-hidden" />
                                <div>
                                  <p className="text-sm font-light">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">{item.category}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                          <Plus className="w-12 h-12 text-muted-foreground" strokeWidth={1} />
                          <p className="text-sm text-muted-foreground font-light">
                            No outfit planned for {day}
                          </p>
                          <Button variant="outline" size="sm" onClick={generateWeeklyOutfits}>
                            Generate Outfit
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default OutfitPlanner;