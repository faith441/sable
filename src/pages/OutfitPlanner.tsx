import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Loader2, Plus, MapPin, Cloud, CloudRain, CloudSnow, Sun, CloudDrizzle, Trash2, RotateCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const [generatingDay, setGeneratingDay] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

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

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lon: longitude });
        setLocationEnabled(true);
        await fetchWeather(latitude, longitude);
        toast.success("Location enabled");
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Failed to get location. Please enable location services.");
        setLocationEnabled(false);
      }
    );
  };

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      // Using Open-Meteo free weather API (no key required)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=auto`
      );
      const data = await response.json();
      
      const weatherCode = data.current.weather_code;
      const temp = Math.round(data.current.temperature_2m);
      
      // Map weather codes to conditions
      let condition = "clear";
      if (weatherCode >= 61 && weatherCode <= 67) condition = "rain";
      else if (weatherCode >= 71 && weatherCode <= 77) condition = "snow";
      else if (weatherCode >= 51 && weatherCode <= 57) condition = "drizzle";
      else if (weatherCode >= 2 && weatherCode <= 3) condition = "cloudy";
      
      setWeather({ condition, temp, code: weatherCode });
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
  };

  const handleLocationToggle = async (enabled: boolean) => {
    if (enabled) {
      await requestLocation();
    } else {
      setLocationEnabled(false);
      setWeather(null);
      setLocation(null);
    }
  };

  const generateWeeklyOutfits = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weatherData = locationEnabled && weather ? {
        condition: weather.condition,
        temp: weather.temp
      } : null;

      const { data, error } = await supabase.functions.invoke("generate-weekly-outfits", {
        body: { 
          userId: user.id,
          weather: weatherData
        }
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

  const generateDayOutfit = async (day: string) => {
    setGeneratingDay(day);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weatherData = locationEnabled && weather ? {
        condition: weather.condition,
        temp: weather.temp
      } : null;

      const { data, error } = await supabase.functions.invoke("generate-weekly-outfits", {
        body: { 
          userId: user.id,
          weather: weatherData,
          dayOnly: day
        }
      });

      if (error) throw error;

      toast.success(`Outfit generated for ${day}!`);
      loadData();
    } catch (error: any) {
      console.error("Error generating outfit:", error);
      toast.error(error.message || "Failed to generate outfit");
    } finally {
      setGeneratingDay(null);
    }
  };

  const deleteOutfit = async (outfitId: string, day: string) => {
    try {
      const { error } = await supabase
        .from("outfit_plans")
        .delete()
        .eq("id", outfitId);

      if (error) throw error;

      toast.success(`Outfit deleted for ${day}`);
      loadData();
    } catch (error: any) {
      console.error("Error deleting outfit:", error);
      toast.error("Failed to delete outfit");
    }
  };

  const getWeatherIcon = () => {
    if (!weather) return <Cloud className="w-4 h-4" />;
    
    switch (weather.condition) {
      case "rain":
        return <CloudRain className="w-4 h-4" />;
      case "snow":
        return <CloudSnow className="w-4 h-4" />;
      case "drizzle":
        return <CloudDrizzle className="w-4 h-4" />;
      case "cloudy":
        return <Cloud className="w-4 h-4" />;
      default:
        return <Sun className="w-4 h-4" />;
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
          <Button variant="ghost" size="sm" onClick={() => navigate("/wardrobe")}>
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
            <div className="space-y-4">
              <div className="flex justify-between items-start">
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

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="location" className="text-sm font-light">
                        Weather-based recommendations
                      </Label>
                    </div>
                    <Switch
                      id="location"
                      checked={locationEnabled}
                      onCheckedChange={handleLocationToggle}
                    />
                  </div>
                  
                  {locationEnabled && weather && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pl-6">
                      {getWeatherIcon()}
                      <span className="capitalize">{weather.condition}</span>
                      <span>·</span>
                      <span>{weather.temp}°F</span>
                    </div>
                  )}
                </CardContent>
              </Card>
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
                          <div className="flex items-start justify-between">
                            <h3 className="text-xl font-light">{outfit.name}</h3>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => generateDayOutfit(day)}
                                disabled={generatingDay === day}
                              >
                                {generatingDay === day ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RotateCw className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteOutfit(outfit.id, day)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {outfit.image_url && (
                            <div className="aspect-[3/4] rounded-lg overflow-hidden">
                              <img src={outfit.image_url} alt={outfit.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="space-y-2">
                            {outfit.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                                <div className="w-12 h-16 bg-background rounded overflow-hidden flex-shrink-0">
                                  {item.image_url && (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-light">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">{item.category}</p>
                                  {item.layer && (
                                    <p className="text-xs text-muted-foreground/70 capitalize">{item.layer} layer</p>
                                  )}
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => generateDayOutfit(day)}
                            disabled={generatingDay === day}
                          >
                            {generatingDay === day ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              "Generate Outfit"
                            )}
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