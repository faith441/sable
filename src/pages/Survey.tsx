import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowRight, Loader2, Sparkles, Heart, X } from "lucide-react";

const Survey = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  
  const [formData, setFormData] = useState({
    gender: [] as string[],
    styleType: [] as string[],
    likedImages: [] as string[],
    colorPreferences: [] as string[],
    budgetRange: [] as string[],
    lifestyle: [] as string[],
    occasions: [] as string[],
    // Body features
    bodyType: [] as string[],
    torsoLength: "",
    legLength: "",
    hairColor: [] as string[],
    eyeColor: [] as string[],
    weight: "",
    // Female-specific
    jeanSizes: {} as Record<string, string>,
    braSize: "",
    cleavagePreference: "",
    hairStyle: [] as string[],
  });

  const styleImages = {
    Classic: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=500&fit=crop",
    Minimalist: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop",
    Trendy: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=500&fit=crop",
    Bohemian: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=400&h=500&fit=crop",
    Edgy: "https://images.unsplash.com/photo-1558769132-cb1aea588c87?w=400&h=500&fit=crop",
    Romantic: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=500&fit=crop",
    Vintage: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=500&fit=crop",
    Military: "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400&h=500&fit=crop",
    Streetwear: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=400&h=500&fit=crop",
    Bold: "https://images.unsplash.com/photo-1525562723836-dca67a71d5f1?w=400&h=500&fit=crop",
    Formal: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=500&fit=crop",
    Chic: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=500&fit=crop",
    Western: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=400&h=500&fit=crop",
    Mountain: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=400&h=500&fit=crop",
    Beach: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=500&fit=crop",
    Sexy: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=500&fit=crop"
  };

  const colorImages = {
    Neutral: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=300&fit=crop",
    Black: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop",
    White: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=300&fit=crop",
    "Earth Tones": "https://images.unsplash.com/photo-1544441893-675973e31985?w=400&h=300&fit=crop",
    Pastels: "https://images.unsplash.com/photo-1558769132-cb1aea588c87?w=400&h=300&fit=crop",
    "Bold Colors": "https://images.unsplash.com/photo-1525562723836-dca67a71d5f1?w=400&h=300&fit=crop",
    Navy: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=300&fit=crop",
    "Jewel Tones": "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=300&fit=crop",
    Monochrome: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=300&fit=crop",
    "Warm Tones": "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400&h=300&fit=crop",
    "Cool Tones": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop",
    Metallics: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=300&fit=crop",
    "Olive & Green": "https://images.unsplash.com/photo-1602810319428-019690571b5b?w=400&h=300&fit=crop",
    "Burgundy & Wine": "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=400&h=300&fit=crop",
    "Neon & Bright": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&h=300&fit=crop",
    "Blush & Rose": "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&h=300&fit=crop"
  };

  const genderOptions = ["Women's", "Men's", "Unisex"];

  useEffect(() => {
    const saved = localStorage.getItem('guest_preferences');
    if (saved) {
      setFormData(JSON.parse(saved));
    }
    updateAiMessage(1);
  }, []);

  useEffect(() => {
    updateAiMessage(step);
  }, [step]);

  const updateAiMessage = (currentStep: number) => {
    const messages = [
      "Hi! I'm Luna, your personal AI stylist. Let's discover your perfect style together! Select all styles that resonate with you - the more you choose, the better I can understand your taste!",
      "Great choices! Now, which gender preferences should I focus on? You can select multiple!",
      "Perfect! Let me show you some color palettes. Tap all the ones that catch your eye!",
      "Beautiful selections! What's the maximum you'd be willing to spend on a capsule wardrobe (typically 10 pieces)? Select all ranges that work for you!",
      "Almost there! Tell me about your lifestyle - select all that apply!",
      "Now, let's talk about the occasions you dress for. Select all that apply!",
      "Last step! Help me understand your body features so I can recommend pieces that will fit and flatter you perfectly!"
    ];
    setAiMessage(messages[currentStep - 1] || messages[0]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      localStorage.setItem('guest_preferences', JSON.stringify(formData));

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from("style_preferences")
          .upsert({
            user_id: user.id,
            style_type: formData.styleType.join(", "),
            color_preferences: formData.colorPreferences,
            budget_range: formData.budgetRange.join(", "),
            body_type: formData.gender.join(", "),
            lifestyle: formData.lifestyle.join(", "),
            occasions: formData.occasions,
            favorite_brands: [],
          });

        if (error) throw error;
      }

      toast.success("Perfect! Generating your personalized wardrobe...");
      navigate("/wardrobe");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const progress = (step / 7) * 100;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with Progress */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="h-1 bg-secondary rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step {step} of 7</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* AI Stylist Avatar & Message */}
        <Card className="border-primary/20 shadow-elegant">
          <CardContent className="p-6">
            <div className="flex gap-4 items-start">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 animate-pulse">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-light text-lg">Luna</h3>
                  <span className="text-xs text-muted-foreground">AI Stylist</span>
                </div>
                <p className="text-sm font-light leading-relaxed">{aiMessage}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Style Type with Images */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(styleImages).map(([style, imageUrl]) => (
              <div
                key={style}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  formData.styleType.includes(style)
                    ? 'border-primary shadow-lg' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setFormData({
                  ...formData,
                  styleType: toggleArrayItem(formData.styleType, style)
                })}
              >
                <div className="aspect-[4/5] relative">
                  <img src={imageUrl} alt={style} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-light text-lg">{style}</p>
                  </div>
                  {formData.styleType.includes(style) && (
                    <div className="absolute top-2 right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white fill-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Gender Preference */}
        {step === 2 && (
          <div className="space-y-3">
            {genderOptions.map((gender) => (
              <Card
                key={gender}
                className={`cursor-pointer transition-all ${
                  formData.gender.includes(gender)
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setFormData({
                  ...formData,
                  gender: toggleArrayItem(formData.gender, gender)
                })}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <span className="text-lg font-light">{gender}</span>
                  {formData.gender.includes(gender) && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 3: Colors with Images */}
        {step === 3 && (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(colorImages).map(([color, imageUrl]) => (
              <div
                key={color}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  formData.colorPreferences.includes(color)
                    ? 'border-primary shadow-lg'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setFormData({
                  ...formData,
                  colorPreferences: toggleArrayItem(formData.colorPreferences, color)
                })}
              >
                <div className="aspect-[4/3] relative">
                  <img src={imageUrl} alt={color} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-light">{color}</p>
                  </div>
                  {formData.colorPreferences.includes(color) && (
                    <div className="absolute top-2 right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white fill-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Budget */}
        {step === 4 && (
          <div className="space-y-3">
            {["$1,000 - $2,000", "$2,000 - $3,500", "$3,500 - $5,000", "$5,000 - $7,500", "$7,500 - $10,000", "$10,000+"].map((budget) => (
              <Card
                key={budget}
                className={`cursor-pointer transition-all ${
                  formData.budgetRange.includes(budget)
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setFormData({
                  ...formData,
                  budgetRange: toggleArrayItem(formData.budgetRange, budget)
                })}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <span className="text-lg font-light">{budget}</span>
                  {formData.budgetRange.includes(budget) && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 5: Lifestyle */}
        {step === 5 && (
          <div className="space-y-3">
            {["Professional", "Casual", "Active", "Social", "Creative", "Entrepreneurial", "Remote Worker", "Student", "Parent", "Traveler", "Outdoor/Adventure", "Fitness Enthusiast", "Nightlife", "Minimalist", "Luxury", "Executive", "High Society", "Jet Set", "Philanthropist", "Country Club", "Yacht Club", "Equestrian", "Art Collector", "Fine Dining", "Opera & Theater", "Private Aviation", "Estate Living", "Concierge Lifestyle"].map((lifestyle) => (
              <Card
                key={lifestyle}
                className={`cursor-pointer transition-all ${
                  formData.lifestyle.includes(lifestyle)
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setFormData({
                  ...formData,
                  lifestyle: toggleArrayItem(formData.lifestyle, lifestyle)
                })}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <span className="text-lg font-light">{lifestyle}</span>
                  {formData.lifestyle.includes(lifestyle) && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 6: Occasions */}
        {step === 6 && (
          <div className="space-y-3">
            {["Work", "Casual Outings", "Date Night", "Events", "Travel", "Working Out", "Business Meetings", "Formal Events/Galas", "Weddings", "Networking Events", "Vacation/Resort", "Golf/Country Club", "Cocktail Parties", "Brunch/Lunch", "Weekend Getaways", "Red Carpet/VIP", "Charity Events", "Gallery Openings", "Private Dinners", "Yachting/Boating", "Outdoor Activities", "Sports Events", "Theater/Opera", "Beach/Pool", "Ski Resort", "Wine Tasting", "Fashion Shows"].map((occasion) => (
              <Card
                key={occasion}
                className={`cursor-pointer transition-all ${
                  formData.occasions.includes(occasion)
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setFormData({
                  ...formData,
                  occasions: toggleArrayItem(formData.occasions, occasion)
                })}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <span className="text-lg font-light">{occasion}</span>
                  {formData.occasions.includes(occasion) && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 7: Body Features */}
        {step === 7 && (
          <div className="space-y-6">
            {/* Body Type */}
            <div className="space-y-3">
              <h3 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Body Type</h3>
              <div className="grid grid-cols-2 gap-3">
                {["Athletic", "Slim", "Curvy", "Petite", "Plus Size", "Muscular"].map((type) => (
                  <Card
                    key={type}
                    className={`cursor-pointer transition-all ${
                      formData.bodyType.includes(type)
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({
                      ...formData,
                      bodyType: toggleArrayItem(formData.bodyType, type)
                    })}
                  >
                    <CardContent className="p-4 text-center">
                      <span className="text-sm font-light">{type}</span>
                      {formData.bodyType.includes(type) && (
                        <Heart className="w-4 h-4 mx-auto mt-1 text-primary fill-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Torso Length */}
            <div className="space-y-3">
              <h3 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Torso Length</h3>
              <div className="grid grid-cols-3 gap-3">
                {["Short", "Regular", "Tall"].map((length) => (
                  <Card
                    key={length}
                    className={`cursor-pointer transition-all ${
                      formData.torsoLength === length
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({...formData, torsoLength: length})}
                  >
                    <CardContent className="p-4 text-center">
                      <span className="text-sm font-light">{length}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Leg Length */}
            <div className="space-y-3">
              <h3 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Leg Length</h3>
              <div className="grid grid-cols-3 gap-3">
                {["Short", "Regular", "Long"].map((length) => (
                  <Card
                    key={length}
                    className={`cursor-pointer transition-all ${
                      formData.legLength === length
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({...formData, legLength: length})}
                  >
                    <CardContent className="p-4 text-center">
                      <span className="text-sm font-light">{length}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Hair Color */}
            <div className="space-y-3">
              <h3 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Hair Color</h3>
              <div className="grid grid-cols-3 gap-3">
                {["Black", "Brown", "Blonde", "Red", "Gray/Silver", "Other"].map((color) => (
                  <Card
                    key={color}
                    className={`cursor-pointer transition-all ${
                      formData.hairColor.includes(color)
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({
                      ...formData,
                      hairColor: toggleArrayItem(formData.hairColor, color)
                    })}
                  >
                    <CardContent className="p-4 text-center">
                      <span className="text-sm font-light">{color}</span>
                      {formData.hairColor.includes(color) && (
                        <Heart className="w-3 h-3 mx-auto mt-1 text-primary fill-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Eye Color */}
            <div className="space-y-3">
              <h3 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Eye Color</h3>
              <div className="grid grid-cols-3 gap-3">
                {["Brown", "Blue", "Green", "Hazel", "Gray", "Other"].map((color) => (
                  <Card
                    key={color}
                    className={`cursor-pointer transition-all ${
                      formData.eyeColor.includes(color)
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({
                      ...formData,
                      eyeColor: toggleArrayItem(formData.eyeColor, color)
                    })}
                  >
                    <CardContent className="p-4 text-center">
                      <span className="text-sm font-light">{color}</span>
                      {formData.eyeColor.includes(color) && (
                        <Heart className="w-3 h-3 mx-auto mt-1 text-primary fill-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Weight Range */}
            <div className="space-y-3">
              <h3 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Weight Range</h3>
              <div className="grid grid-cols-2 gap-3">
                {["Under 120 lbs", "120-150 lbs", "150-180 lbs", "180-210 lbs", "210-240 lbs", "240+ lbs"].map((range) => (
                  <Card
                    key={range}
                    className={`cursor-pointer transition-all ${
                      formData.weight === range
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({...formData, weight: range})}
                  >
                    <CardContent className="p-4 text-center">
                      <span className="text-sm font-light">{range}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Female-specific questions */}
            {formData.gender.includes("Women's") && (
              <>
                <div className="border-t border-border pt-6 mt-6">
                  <h3 className="text-base font-normal mb-4">Additional Fit Details</h3>
                  
                  {/* Jean Sizes */}
                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Jean Size (by brand)</h4>
                    {["Levi's", "Madewell", "AG Jeans", "J Brand", "Citizens of Humanity"].map((brand) => (
                      <div key={brand} className="flex items-center gap-3">
                        <span className="text-sm font-light min-w-[140px]">{brand}</span>
                        <input
                          type="text"
                          placeholder="e.g., 27, 28, 29"
                          className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-sm"
                          value={formData.jeanSizes[brand] || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            jeanSizes: {...formData.jeanSizes, [brand]: e.target.value}
                          })}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Bra Size */}
                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Bra Size</h4>
                    <input
                      type="text"
                      placeholder="e.g., 34C, 36D"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background"
                      value={formData.braSize}
                      onChange={(e) => setFormData({...formData, braSize: e.target.value})}
                    />
                  </div>

                  {/* Cleavage Preference */}
                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Cleavage in Clothing Style</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {["None", "A Little", "A Lot"].map((pref) => (
                        <Card
                          key={pref}
                          className={`cursor-pointer transition-all ${
                            formData.cleavagePreference === pref
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => setFormData({...formData, cleavagePreference: pref})}
                        >
                          <CardContent className="p-4 text-center">
                            <span className="text-sm font-light">{pref}</span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Hair Style */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">How You Wear Your Hair</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {["Down & Straight", "Down & Wavy", "Down & Curly", "Half Up/Half Down", "High Bun", "Low Bun", "Ponytail", "Braided", "Short & Styled"].map((style) => (
                        <Card
                          key={style}
                          className={`cursor-pointer transition-all ${
                            formData.hairStyle.includes(style)
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => setFormData({
                            ...formData,
                            hairStyle: toggleArrayItem(formData.hairStyle, style)
                          })}
                        >
                          <CardContent className="p-4 text-center">
                            <span className="text-sm font-light">{style}</span>
                            {formData.hairStyle.includes(style) && (
                              <Heart className="w-3 h-3 mx-auto mt-1 text-primary fill-primary" />
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              Back
            </Button>
          )}
          {step < 7 ? (
            <Button 
              onClick={() => setStep(step + 1)} 
              className="flex-1" 
              variant="luxury"
              disabled={
                (step === 1 && formData.styleType.length === 0) ||
                (step === 2 && formData.gender.length === 0) ||
                (step === 3 && formData.colorPreferences.length === 0) ||
                (step === 4 && formData.budgetRange.length === 0) ||
                (step === 5 && formData.lifestyle.length === 0) ||
                (step === 6 && formData.occasions.length === 0)
              }
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              className="flex-1" 
              variant="luxury"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate My Wardrobe
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Survey;