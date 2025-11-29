import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Loader2, Plus, MapPin, Cloud, CloudRain, CloudSnow, Sun, CloudDrizzle, Trash2, RotateCw, Edit2, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface OutfitPlan {
  id: string;
  name: string;
  day_of_week: string;
  items: any[];
  image_url?: string;
  recommended_additions?: Array<{
    type: string;
    description: string;
    reason?: string;
  }>;
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
  const [weeklyForecast, setWeeklyForecast] = useState<any[]>([]);
  const [locationName, setLocationName] = useState<string>("");
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

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

      setOutfits((outfitsData || []).map(outfit => {
        // Handle both old format (items array) and new format (items object with recommended_additions)
        const outfitItems = Array.isArray(outfit.items) 
          ? outfit.items 
          : (outfit.items as any)?.items || [];
        
        const recommendedAdditions = !Array.isArray(outfit.items) 
          ? (outfit.items as any)?.recommended_additions 
          : undefined;

        return {
          id: outfit.id,
          name: outfit.name,
          day_of_week: outfit.day_of_week || '',
          items: outfitItems,
          image_url: outfit.image_url || undefined,
          recommended_additions: recommendedAdditions
        };
      }));
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
        await getLocationName(latitude, longitude);
        toast.success("Location enabled");
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Failed to get location. Please enable location services.");
        setLocationEnabled(false);
      }
    );
  };

  const getLocationName = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const name = result.name || result.admin1 || "Unknown";
        setLocationName(name);
      }
    } catch (error) {
      console.error("Error getting location name:", error);
    }
  };

  // Debounced search for location suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!locationInput.trim() || locationInput.length < 2) {
        setLocationSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationInput.trim())}&count=5&language=en&format=json`
        );
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          setLocationSuggestions(data.results);
          setShowSuggestions(true);
        } else {
          setLocationSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setLocationSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [locationInput]);

  const selectLocation = async (result: any) => {
    const { latitude, longitude, name, admin1, country } = result;
    const displayName = admin1 ? `${name}, ${admin1}, ${country}` : `${name}, ${country}`;
    
    setLocation({ lat: latitude, lon: longitude });
    setLocationName(name);
    setLocationInput(displayName);
    setLocationEnabled(true);
    setShowSuggestions(false);
    
    await fetchWeather(latitude, longitude);
    
    setLocationDialogOpen(false);
    setLocationInput("");
    toast.success(`Weather set to ${name}`);
  };

  const searchLocation = async () => {
    if (!locationInput.trim() || locationInput.length < 2) {
      toast.error("Please enter at least 2 characters");
      return;
    }

    if (locationInput.trim().length > 100) {
      toast.error("Location name is too long");
      return;
    }

    setSearchingLocation(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationInput.trim())}&count=1&language=en&format=json`
      );
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        toast.error("Location not found. Try a different city name.");
        setSearchingLocation(false);
        return;
      }

      await selectLocation(data.results[0]);
    } catch (error) {
      console.error("Error searching location:", error);
      toast.error("Failed to search location");
    } finally {
      setSearchingLocation(false);
    }
  };

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      // Using Open-Meteo free weather API with 7-day forecast
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=fahrenheit&timezone=auto&forecast_days=7`
      );
      const data = await response.json();
      
      const weatherCode = data.current.weather_code;
      const temp = Math.round(data.current.temperature_2m);
      
      // Map weather codes to conditions
      const getCondition = (code: number) => {
        if (code >= 61 && code <= 67) return "rain";
        if (code >= 71 && code <= 77) return "snow";
        if (code >= 51 && code <= 57) return "drizzle";
        if (code >= 2 && code <= 3) return "cloudy";
        return "clear";
      };
      
      const condition = getCondition(weatherCode);
      
      // Get today's high and low
      const high = Math.round(data.daily.temperature_2m_max[0]);
      const low = Math.round(data.daily.temperature_2m_min[0]);
      
      setWeather({ condition, temp, high, low, code: weatherCode });
      
      // Process 7-day forecast
      const forecast = data.daily.temperature_2m_max.map((maxTemp: number, index: number) => ({
        high: Math.round(maxTemp),
        low: Math.round(data.daily.temperature_2m_min[index]),
        condition: getCondition(data.daily.weather_code[index]),
        date: data.daily.time[index]
      }));
      
      setWeeklyForecast(forecast);
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
      setWeeklyForecast([]);
      setLocation(null);
      setLocationName("");
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

  const getWeatherIconForDay = (condition: string) => {
    switch (condition) {
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

  const toggleItemCheck = (itemId: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const openItemDetails = (item: any) => {
    setSelectedItem(item);
    setItemDialogOpen(true);
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
                    <>
                      <div className="flex items-center justify-between pl-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getWeatherIcon()}
                          <span className="capitalize">{weather.condition}</span>
                          <span>·</span>
                          <span>H: {weather.high}°</span>
                          <span>L: {weather.low}°</span>
                        </div>
                        <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <Edit2 className="w-3 h-3 mr-1" />
                              {locationName || "Change"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Change Location</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2 relative">
                                <Label htmlFor="city">City Name</Label>
                                <Input
                                  id="city"
                                  placeholder="e.g., Tampa, New York, London"
                                  value={locationInput}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.length <= 100) {
                                      setLocationInput(value);
                                    }
                                  }}
                                  onKeyDown={(e) => e.key === "Enter" && searchLocation()}
                                  onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
                                  autoComplete="off"
                                />
                                {showSuggestions && locationSuggestions.length > 0 && (
                                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                                    {locationSuggestions.map((suggestion, index) => (
                                      <button
                                        key={index}
                                        onClick={() => selectLocation(suggestion)}
                                        className="w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors flex flex-col gap-1 border-b border-border/50 last:border-0"
                                      >
                                        <span className="text-sm font-light">{suggestion.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {suggestion.admin1 && `${suggestion.admin1}, `}{suggestion.country}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    requestLocation();
                                    setShowSuggestions(false);
                                  }}
                                  className="flex-1"
                                >
                                  <MapPin className="w-4 h-4 mr-2" />
                                  Use Current
                                </Button>
                                <Button
                                  onClick={searchLocation}
                                  disabled={searchingLocation}
                                  className="flex-1"
                                >
                                  {searchingLocation ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    "Search"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="Monday" className="w-full">
              <TabsList className="grid w-full grid-cols-7 mb-6">
                {days.map((day, index) => {
                  const dayForecast = weeklyForecast[index];
                  return (
                    <TabsTrigger key={day} value={day} className="text-xs px-1 flex flex-col gap-1 py-3">
                      <span>{day.slice(0, 3)}</span>
                      {locationEnabled && dayForecast && (
                        <>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {dayForecast.high}°/{dayForecast.low}°
                          </span>
                          <div className="flex items-center justify-center mt-0.5">
                            {getWeatherIconForDay(dayForecast.condition)}
                          </div>
                        </>
                      )}
                    </TabsTrigger>
                  );
                })}
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
                              <div 
                                key={idx} 
                                className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-colors group"
                              >
                                <Checkbox
                                  checked={checkedItems.has(`${outfit.id}-${item.id || idx}`)}
                                  onCheckedChange={() => toggleItemCheck(`${outfit.id}-${item.id || idx}`)}
                                  className="flex-shrink-0"
                                />
                                <div 
                                  className="w-12 h-16 bg-background rounded overflow-hidden flex-shrink-0 cursor-pointer"
                                  onClick={() => openItemDetails(item)}
                                >
                                  {item.image_url && (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                  )}
                                </div>
                                <div 
                                  className="flex-1 cursor-pointer"
                                  onClick={() => openItemDetails(item)}
                                >
                                  <p className="text-sm font-light">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">{item.category}</p>
                                  {item.layer && (
                                    <p className="text-xs text-muted-foreground/70 capitalize">{item.layer} layer</p>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            {outfit.recommended_additions && outfit.recommended_additions.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border/50">
                                <p className="text-xs text-muted-foreground font-light mb-2">Suggested additions:</p>
                                {outfit.recommended_additions.map((addition: any, idx: number) => (
                                  <div key={idx} className="flex items-start gap-2 p-2 bg-secondary/10 rounded-lg mb-2">
                                    <Plus className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-xs font-light">{addition.description}</p>
                                      {addition.reason && (
                                        <p className="text-xs text-muted-foreground/70 mt-0.5">{addition.reason}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
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

      {/* Item Details Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {selectedItem.image_url && (
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-secondary/20">
                  <img 
                    src={selectedItem.image_url} 
                    alt={selectedItem.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-light">{selectedItem.category}</p>
                  </div>
                  {selectedItem.layer && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Layer</p>
                      <p className="font-light capitalize">{selectedItem.layer}</p>
                    </div>
                  )}
                </div>
                {selectedItem.brand && (
                  <div>
                    <p className="text-sm text-muted-foreground">Brand</p>
                    <p className="font-light">{selectedItem.brand}</p>
                  </div>
                )}
                {selectedItem.size && (
                  <div>
                    <p className="text-sm text-muted-foreground">Size</p>
                    <p className="font-light">{selectedItem.size}</p>
                  </div>
                )}
                {selectedItem.colors && selectedItem.colors.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Colors</p>
                    <div className="flex gap-2 mt-1">
                      {selectedItem.colors.map((color: string, idx: number) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-secondary/50 rounded">
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OutfitPlanner;