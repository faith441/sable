import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowRight, Loader2, Sparkles, Heart, X } from "lucide-react";

// Helper function to get image source from File or string
const getImageSrc = (photo: File | string | null | unknown): string => {
  if (!photo) return '';
  if (typeof photo === 'string' && photo.length > 0) return photo;
  // Check if it's actually a File/Blob object (not an empty object from localStorage)
  if (photo instanceof File || photo instanceof Blob) {
    return URL.createObjectURL(photo);
  }
  // Invalid value (e.g., {} from serialized File), return empty
  return '';
};

// Helper to check if a photo value is valid (not null/undefined/empty object)
const isValidPhoto = (photo: unknown): boolean => {
  if (!photo) return false;
  if (typeof photo === 'string' && photo.length > 0) return true;
  if (photo instanceof File || photo instanceof Blob) return true;
  return false;
};

const Survey = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  
  const [formData, setFormData] = useState({
    gender: "" as string,
    styleType: [] as string[],
    likedImages: [] as string[],
    colorPreferences: [] as string[],
    budgetRange: [] as string[],
    lifestyle: [] as string[],
    occasions: [] as string[],
    mood: [] as string[],
    // Body features
    bodyType: [] as string[],
    torsoLength: "",
    legLength: "",
    hairColor: [] as string[],
    eyeColor: [] as string[],
    skinTone: "",
    weight: "",
    // Female-specific
    jeanSizes: {} as Record<string, string>,
    braSize: "",
    cleavagePreference: "",
    buttPreference: "",
    legPreference: "",
    hairStyle: [] as string[],
    // Fragrance & Hair Care
    fragranceTypes: [] as string[],
    fragranceIntensity: "",
    scentPreferences: [] as string[],
    hairType: [] as string[],
    hairConcerns: [] as string[],
    shampooPreferences: [] as string[],
    // Photos - can be File (new upload) or string (loaded from localStorage)
    photos: [null, null, null, null] as (File | string | null)[],
    fullBodyPhotos: Array(10).fill(null) as (File | string | null)[],
    swimsuitPhotos: Array(10).fill(null) as (File | string | null)[],
  });

  const womensStyleImages = {
    Classic: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=500&fit=crop", // Timeless white button-down
    Minimalist: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop", // Clean lines, neutral tones
    Trendy: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=500&fit=crop", // Fashion-forward modern look
    Bohemian: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=400&h=500&fit=crop", // Flowy boho dress
    Edgy: "https://images.unsplash.com/photo-1558769132-cb1aea588c87?w=400&h=500&fit=crop", // Leather jacket style
    Romantic: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop", // Soft feminine dress
    Vintage: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=500&fit=crop", // Retro style clothing
    Military: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=500&fit=crop", // Utility jacket, structured
    Streetwear: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop", // Urban casual sneakers
    Bold: "https://images.unsplash.com/photo-1596516109370-29001ec8ec36?w=400&h=500&fit=crop", // Bright colors, statement pieces
    Formal: "https://images.unsplash.com/photo-1562184552-1026b76b1087?w=400&h=500&fit=crop", // Evening gown elegance
    Chic: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop", // Sophisticated tailored look
    Western: "https://images.unsplash.com/photo-1598522325074-042db73aa4e6?w=400&h=500&fit=crop", // Cowboy boots, denim
    Mountain: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=400&h=500&fit=crop", // Outdoor hiking gear
    Beach: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=500&fit=crop", // Beachwear, resort style
    Sexy: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop" // Form-fitting, alluring
  };

  const mensStyleImages = {
    Classic: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=400&h=500&fit=crop", // Timeless suit style
    Minimalist: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop", // Clean simple outfit
    Trendy: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&h=500&fit=crop", // Modern fashion-forward
    Bohemian: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=500&fit=crop", // Relaxed boho layers
    Edgy: "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=400&h=500&fit=crop", // Dark leather jacket
    Romantic: "https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=400&h=500&fit=crop", // Soft refined look
    Vintage: "https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?w=400&h=500&fit=crop", // Retro classic pieces
    Military: "https://images.unsplash.com/photo-1627225924765-552d49cf47ad?w=400&h=500&fit=crop", // Army jacket, cargo
    Streetwear: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&h=500&fit=crop", // Urban hoodie, sneakers
    Bold: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop", // Vibrant statement outfit
    Formal: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=500&fit=crop", // Tuxedo, black tie
    Chic: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop", // Sophisticated tailored
    Western: "https://images.unsplash.com/photo-1608613304899-ea8098577e38?w=400&h=500&fit=crop", // Cowboy hat, boots
    Mountain: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=400&h=500&fit=crop", // Outdoor hiking gear
    Beach: "https://images.unsplash.com/photo-1549388604-817d15aa0110?w=400&h=500&fit=crop", // Beachwear, shorts
    Sexy: "https://images.unsplash.com/photo-1564859228273-274232fdb516?w=400&h=500&fit=crop" // Fitted, attractive style
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

  const genderOptions = ["Women's", "Men's"];

  useEffect(() => {
    const saved = localStorage.getItem('guest_preferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      setFormData({
        ...parsed,
        // Ensure all array fields exist with fallbacks
        gender: parsed.gender || [],
        styleType: parsed.styleType || [],
        colorPreferences: parsed.colorPreferences || [],
        budgetRange: parsed.budgetRange || [],
        lifestyle: parsed.lifestyle || [],
        occasions: parsed.occasions || [],
        mood: parsed.mood || [],
        bodyType: parsed.bodyType || [],
        hairColor: parsed.hairColor || [],
        eyeColor: parsed.eyeColor || [],
        hairStyle: parsed.hairStyle || [],
        fragranceTypes: parsed.fragranceTypes || [],
        scentPreferences: parsed.scentPreferences || [],
        hairType: parsed.hairType || [],
        hairConcerns: parsed.hairConcerns || [],
        shampooPreferences: parsed.shampooPreferences || [],
        jeanSizes: parsed.jeanSizes || {},
        photos: parsed.photos && Array.isArray(parsed.photos)
          ? [
              parsed.photos[0] ?? null,
              parsed.photos[1] ?? null,
              parsed.photos[2] ?? null,
              parsed.photos[3] ?? null,
            ]
          : [null, null, null, null],
        fullBodyPhotos: parsed.fullBodyPhotos && Array.isArray(parsed.fullBodyPhotos)
          ? Array(10).fill(null).map((_, i) => parsed.fullBodyPhotos[i] ?? null)
          : Array(10).fill(null),
        swimsuitPhotos: parsed.swimsuitPhotos && Array.isArray(parsed.swimsuitPhotos)
          ? Array(10).fill(null).map((_, i) => parsed.swimsuitPhotos[i] ?? null)
          : Array(10).fill(null),
      });
    }
    updateAiMessage(1);
  }, []);

  useEffect(() => {
    updateAiMessage(step);
    
    // Auto-skip step 10 (swimsuit photos) for men
    if (step === 10 && formData.gender !== "Women's") {
      setStep(11);
    }
  }, [step, formData.gender]);

  const updateAiMessage = (currentStep: number) => {
    const messages = [
      "Hi! I'm Luna, your personal AI stylist. Let's start by understanding which gender preferences I should focus on!",
      "Great choice! Now let's discover your perfect style together! Select all styles that resonate with you - the more you choose, the better I can understand your taste!",
      "Perfect! Let me show you some color palettes. Tap all the ones that catch your eye!",
      "Beautiful selections! Now let's talk investment level. What's your wardrobe strategy? Select all ranges you're comfortable with!",
      "Almost there! Tell me about your lifestyle - select all that apply!",
      "Now, let's talk about the occasions you dress for. Select all that apply!",
      "How do you want to feel when you get dressed? What energy are you bringing to the world? Select all moods that resonate!",
      "Great! Now help me understand your body features so I can recommend pieces that will fit and flatter you perfectly!",
      "Optionally upload up to 4 clear selfie photos of your face without sunglasses. This helps me understand your unique features and provide even more personalized recommendations!",
      "Share up to 10 photos of yourself that you really like showing your entire body. This helps me understand your style and fit preferences even better!",
      "Upload up to 10 photos of yourself in swimsuits. This helps me provide perfect swimwear recommendations!",
      "Let's talk about fragrance! What scent profiles appeal to you? This helps me recommend the perfect signature scents!",
      "Finally, tell me about your hair! This helps me recommend the perfect shampoo and conditioner for your hair type and goals!"
    ];
    setAiMessage(messages[currentStep - 1] || messages[0]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      localStorage.setItem('guest_preferences', JSON.stringify(formData));

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Ensure all arrays are properly formatted with fallbacks
        const styleTypeArray = Array.isArray(formData.styleType) ? formData.styleType : [];
        const colorPrefsArray = Array.isArray(formData.colorPreferences) ? formData.colorPreferences : [];
        const budgetArray = Array.isArray(formData.budgetRange) ? formData.budgetRange : [];
        const genderArray = Array.isArray(formData.gender) ? formData.gender : [];
        const lifestyleArray = Array.isArray(formData.lifestyle) ? formData.lifestyle : [];
        const occasionsArray = Array.isArray(formData.occasions) ? formData.occasions : [];

        const { error } = await supabase
          .from("style_preferences")
          .upsert({
            user_id: user.id,
            style_type: styleTypeArray.length > 0 ? styleTypeArray.join(", ") : "Not specified",
            color_preferences: colorPrefsArray,
            budget_range: budgetArray.length > 0 ? budgetArray.join(", ") : "Not specified",
            body_type: genderArray.length > 0 ? genderArray.join(", ") : null,
            lifestyle: lifestyleArray.length > 0 ? lifestyleArray.join(", ") : "Not specified",
            occasions: occasionsArray,
            favorite_brands: [],
            sizes: {
              jeanSizes: formData.jeanSizes || {},
              braSize: formData.braSize || null,
              bodyType: Array.isArray(formData.bodyType) ? formData.bodyType : [],
              torsoLength: formData.torsoLength || null,
              legLength: formData.legLength || null,
              weight: formData.weight || null
            }
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;
      }

      toast.success("Perfect! Generating your personalized wardrobe...");
      // Clear cached capsules so wardrobe page generates fresh ones
      localStorage.removeItem('cached_capsules');
      navigate("/wardrobe");
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast.error(error?.message || "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const isWomensSelected = formData.gender === "Women's";
  const maxStep = isWomensSelected ? 12 : 12;
  const progress = (step / maxStep) * 100;

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
            <span>Step {step} of {maxStep}</span>
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

        {/* Step 1: Gender Preference */}
        {step === 1 && (
          <div className="space-y-3">
            {genderOptions.map((gender) => (
              <Card
                key={gender}
                className={`cursor-pointer transition-all ${
                  formData.gender === gender
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setFormData({
                  ...formData,
                  gender: gender
                })}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <span className="text-lg font-light">{gender}</span>
                  {formData.gender === gender && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 2: Style Type with Images */}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(formData.gender === "Men's" ? mensStyleImages : womensStyleImages).map(([style, imageUrl]) => (
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

        {/* Step 4: Investment Level */}
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

        {/* Step 7: Mood & Energy */}
        {step === 7 && (
          <div className="space-y-3">
            {["Confident", "Creative", "Understated Elegance", "Bold", "Relaxed Luxury", "Professional Power", "Effortless Cool", "Romantic", "Edgy", "Playful"].map((mood) => (
              <Card
                key={mood}
                className={`cursor-pointer transition-all ${
                  formData.mood.includes(mood)
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setFormData({
                  ...formData,
                  mood: toggleArrayItem(formData.mood, mood)
                })}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <span className="text-lg font-light">{mood}</span>
                  {formData.mood.includes(mood) && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 8: Body Features */}
        {step === 8 && (
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

            {/* Skin Tone - Visual Color Strips */}
            <div className="space-y-3">
              <h3 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Skin Tone</h3>
              <p className="text-xs text-muted-foreground font-light mb-3">
                Hold your phone next to your skin to find your closest match
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: "Fair", color: "hsl(30, 45%, 92%)" },
                  { name: "Light", color: "hsl(30, 40%, 85%)" },
                  { name: "Medium", color: "hsl(30, 35%, 70%)" },
                  { name: "Olive", color: "hsl(35, 30%, 60%)" },
                  { name: "Tan", color: "hsl(30, 35%, 55%)" },
                  { name: "Brown", color: "hsl(25, 30%, 40%)" },
                  { name: "Deep", color: "hsl(25, 30%, 30%)" },
                  { name: "Dark", color: "hsl(20, 25%, 20%)" }
                ].map((tone) => (
                  <div
                    key={tone.name}
                    className={`cursor-pointer transition-all rounded-lg overflow-hidden border-2 ${
                      formData.skinTone === tone.name
                        ? 'border-primary shadow-lg scale-105'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({...formData, skinTone: tone.name})}
                  >
                    <div 
                      className="h-24 w-full"
                      style={{ backgroundColor: tone.color }}
                    />
                    <div className="p-2 bg-background text-center">
                      <span className="text-xs font-light">{tone.name}</span>
                      {formData.skinTone === tone.name && (
                        <Heart className="w-3 h-3 mx-auto mt-1 text-primary fill-primary" />
                      )}
                    </div>
                  </div>
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
            {isWomensSelected && (
              <>
                <div className="border-t border-border pt-6 mt-6">
                  <h3 className="text-base font-normal mb-4">
                    Additional Fit Details
                    <span className="text-xs text-muted-foreground font-light ml-2">(Women's options)</span>
                  </h3>
                  
                  {/* Jean Sizes */}
                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">
                      Jean Size (by brand) <span className="text-xs lowercase">optional*</span>
                    </h4>
                    <p className="text-xs text-muted-foreground font-light mb-3">
                      This helps us find out what jean size works for you for other brands.
                    </p>
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
                      value={formData.braSize === "No bra" ? "" : formData.braSize}
                      onChange={(e) => setFormData({...formData, braSize: e.target.value})}
                      disabled={formData.braSize === "No bra"}
                    />
                    <Card
                      className={`cursor-pointer transition-all ${
                        formData.braSize === "No bra"
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setFormData({...formData, braSize: formData.braSize === "No bra" ? "" : "No bra"})}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <span className="text-sm font-light">I don't wear a bra</span>
                        {formData.braSize === "No bra" && (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Heart className="w-4 h-4 text-white fill-white" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Body Showing Preferences */}
                  <div className="space-y-4 mb-6">
                    <h4 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Skin Showing in Clothing Style</h4>
                    
                    {/* Breast Showing */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-light">Breast showing</p>
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

                    {/* Butt Showing */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-light">Butt showing</p>
                      <div className="grid grid-cols-3 gap-3">
                        {["None", "A Little", "A Lot"].map((pref) => (
                          <Card
                            key={pref}
                            className={`cursor-pointer transition-all ${
                              formData.buttPreference === pref
                                ? 'border-primary bg-primary/5'
                                : 'hover:border-primary/50'
                            }`}
                            onClick={() => setFormData({...formData, buttPreference: pref})}
                          >
                            <CardContent className="p-4 text-center">
                              <span className="text-sm font-light">{pref}</span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Leg Showing */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-light">Leg showing</p>
                      <div className="grid grid-cols-3 gap-3">
                        {["None", "A Little", "A Lot"].map((pref) => (
                          <Card
                            key={pref}
                            className={`cursor-pointer transition-all ${
                              formData.legPreference === pref
                                ? 'border-primary bg-primary/5'
                                : 'hover:border-primary/50'
                            }`}
                            onClick={() => setFormData({...formData, legPreference: pref})}
                          >
                            <CardContent className="p-4 text-center">
                              <span className="text-sm font-light">{pref}</span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
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

        {/* Step 9: Photo Upload */}
        {step === 9 && (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-6">
              <h3 className="text-lg font-normal">Upload Your Selfie Photos (Optional)</h3>
              <p className="text-sm text-muted-foreground font-light">
                Upload up to 4 clear photos of your face without sunglasses for more personalized recommendations
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="space-y-2">
                  <label
                    htmlFor={`photo-${index}`}
                    className={`relative block aspect-square rounded-lg border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
                      isValidPhoto(formData.photos[index])
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 bg-secondary/20'
                    }`}
                  >
                    {isValidPhoto(formData.photos[index]) ? (
                      <div className="relative w-full h-full">
                        <img
                          src={getImageSrc(formData.photos[index])}
                          alt={`Selfie ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const newPhotos = [...formData.photos];
                            newPhotos[index] = null;
                            setFormData({ ...formData, photos: newPhotos });
                          }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 flex items-center justify-center hover:bg-background"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                        <Sparkles className="w-8 h-8 text-muted-foreground" />
                        <span className="text-xs text-center font-light text-muted-foreground">
                          Photo {index + 1}
                        </span>
                      </div>
                    )}
                    <input
                      id={`photo-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const newPhotos = [...formData.photos];
                          newPhotos[index] = file;
                          setFormData({ ...formData, photos: newPhotos });
                        }
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-normal flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Photo Guidelines
              </h4>
              <ul className="text-xs text-muted-foreground font-light space-y-1 list-disc list-inside">
                <li>Clear, well-lit photos of your face</li>
                <li>No sunglasses or face coverings</li>
                <li>Natural expressions work best</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 10: Full Body Photos */}
        {step === 10 && (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-6">
              <h3 className="text-lg font-normal">Upload Full Body Photos (Optional)</h3>
              <p className="text-sm text-muted-foreground font-light">
                Share up to 10 photos that you really like showing your entire body
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
                <div key={index} className="space-y-2">
                  <label
                    htmlFor={`full-body-photo-${index}`}
                    className={`relative block aspect-[3/4] rounded-lg border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
                      isValidPhoto(formData.fullBodyPhotos[index])
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 bg-secondary/20'
                    }`}
                  >
                    {isValidPhoto(formData.fullBodyPhotos[index]) ? (
                      <div className="relative w-full h-full">
                        <img
                          src={getImageSrc(formData.fullBodyPhotos[index])}
                          alt={`Full body photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const newPhotos = [...formData.fullBodyPhotos];
                            newPhotos[index] = null;
                            setFormData({ ...formData, fullBodyPhotos: newPhotos });
                          }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 flex items-center justify-center hover:bg-background"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                        <Sparkles className="w-8 h-8 text-muted-foreground" />
                        <span className="text-xs text-center font-light text-muted-foreground">
                          Photo {index + 1}
                        </span>
                      </div>
                    )}
                    <input
                      id={`full-body-photo-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const newPhotos = [...formData.fullBodyPhotos];
                          newPhotos[index] = file;
                          setFormData({ ...formData, fullBodyPhotos: newPhotos });
                        }
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-normal flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Photo Guidelines
              </h4>
              <ul className="text-xs text-muted-foreground font-light space-y-1 list-disc list-inside">
                <li>Full body visible in the photo</li>
                <li>Photos you really like of yourself</li>
                <li>Clear, well-lit images work best</li>
                <li>Wearing outfits that represent your style</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 10: Swimsuit Photos (Women's Only) */}
        {step === 10 && isWomensSelected && (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-6">
              <h3 className="text-lg font-normal">Upload Swimsuit Photos (Optional)</h3>
              <p className="text-sm text-muted-foreground font-light">
                Share up to 10 photos of yourself in swimsuits for better swimwear recommendations
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
                <div key={index} className="space-y-2">
                  <label
                    htmlFor={`swimsuit-photo-${index}`}
                    className={`relative block aspect-[3/4] rounded-lg border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
                      isValidPhoto(formData.swimsuitPhotos[index])
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 bg-secondary/20'
                    }`}
                  >
                    {isValidPhoto(formData.swimsuitPhotos[index]) ? (
                      <div className="relative w-full h-full">
                        <img
                          src={getImageSrc(formData.swimsuitPhotos[index])}
                          alt={`Swimsuit photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const newPhotos = [...formData.swimsuitPhotos];
                            newPhotos[index] = null;
                            setFormData({ ...formData, swimsuitPhotos: newPhotos });
                          }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 flex items-center justify-center hover:bg-background"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                        <Sparkles className="w-8 h-8 text-muted-foreground" />
                        <span className="text-xs text-center font-light text-muted-foreground">
                          Photo {index + 1}
                        </span>
                      </div>
                    )}
                    <input
                      id={`swimsuit-photo-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const newPhotos = [...formData.swimsuitPhotos];
                          newPhotos[index] = file;
                          setFormData({ ...formData, swimsuitPhotos: newPhotos });
                        }
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-normal flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Photo Guidelines
              </h4>
              <ul className="text-xs text-muted-foreground font-light space-y-1 list-disc list-inside">
                <li>Photos in swimsuits</li>
                <li>Clear, well-lit images</li>
                <li>Full body visible works best</li>
                <li>Helps with swimwear recommendations</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 11: Fragrance Preferences */}
        {step === 11 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Fragrance Types You Love</h3>
              <div className="grid grid-cols-2 gap-3">
                {["Floral", "Woody", "Fresh/Citrus", "Oriental/Spicy", "Fruity", "Aquatic", "Gourmand", "Musky"].map((type) => (
                  <Card
                    key={type}
                    className={`cursor-pointer transition-all ${
                      formData.fragranceTypes.includes(type)
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({
                      ...formData,
                      fragranceTypes: toggleArrayItem(formData.fragranceTypes, type)
                    })}
                  >
                    <CardContent className="p-4 text-center">
                      <span className="text-sm font-light">{type}</span>
                      {formData.fragranceTypes.includes(type) && (
                        <Heart className="w-4 h-4 mx-auto mt-1 text-primary fill-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Fragrance Intensity</h3>
              <div className="grid grid-cols-3 gap-3">
                {["Light/Subtle", "Moderate", "Strong/Bold"].map((intensity) => (
                  <Card
                    key={intensity}
                    className={`cursor-pointer transition-all ${
                      formData.fragranceIntensity === intensity
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({...formData, fragranceIntensity: intensity})}
                  >
                    <CardContent className="p-4 text-center">
                      <span className="text-sm font-light">{intensity}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Scent Preferences</h3>
              <div className="space-y-2">
                {["Clean & Fresh", "Sweet & Warm", "Bold & Sensual", "Light & Airy", "Earthy & Natural", "Luxury/Designer"].map((pref) => (
                  <Card
                    key={pref}
                    className={`cursor-pointer transition-all ${
                      formData.scentPreferences.includes(pref)
                        ? 'border-primary bg-primary/5 shadow-lg'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({
                      ...formData,
                      scentPreferences: toggleArrayItem(formData.scentPreferences, pref)
                    })}
                  >
                    <CardContent className="p-6 flex items-center justify-between">
                      <span className="text-lg font-light">{pref}</span>
                      {formData.scentPreferences.includes(pref) && (
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Heart className="w-4 h-4 text-white fill-white" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 12: Hair Care Preferences */}
        {step === 12 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Fragrance Types You Love</h3>
              <div className="grid grid-cols-2 gap-3">
                {["Floral", "Woody", "Fresh/Citrus", "Oriental/Spicy", "Fruity", "Aquatic", "Gourmand", "Musky"].map((type) => (
                  <Card
                    key={type}
                    className={`cursor-pointer transition-all ${
                      formData.fragranceTypes.includes(type)
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({
                      ...formData,
                      fragranceTypes: toggleArrayItem(formData.fragranceTypes, type)
                    })}
                  >
                    <CardContent className="p-4 text-center">
                      <span className="text-sm font-light">{type}</span>
                      {formData.fragranceTypes.includes(type) && (
                        <Heart className="w-4 h-4 mx-auto mt-1 text-primary fill-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Fragrance Intensity</h3>
              <div className="grid grid-cols-3 gap-3">
                {["Light/Subtle", "Moderate", "Strong/Bold"].map((intensity) => (
                  <Card
                    key={intensity}
                    className={`cursor-pointer transition-all ${
                      formData.fragranceIntensity === intensity
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({...formData, fragranceIntensity: intensity})}
                  >
                    <CardContent className="p-4 text-center">
                      <span className="text-sm font-light">{intensity}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Scent Preferences</h3>
              <div className="space-y-2">
                {["Clean & Fresh", "Sweet & Warm", "Bold & Sensual", "Light & Airy", "Earthy & Natural", "Luxury/Designer"].map((pref) => (
                  <Card
                    key={pref}
                    className={`cursor-pointer transition-all ${
                      formData.scentPreferences.includes(pref)
                        ? 'border-primary bg-primary/5 shadow-lg'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({
                      ...formData,
                      scentPreferences: toggleArrayItem(formData.scentPreferences, pref)
                    })}
                  >
                    <CardContent className="p-6 flex items-center justify-between">
                      <span className="text-lg font-light">{pref}</span>
                      {formData.scentPreferences.includes(pref) && (
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Heart className="w-4 h-4 text-white fill-white" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 12: Hair Care Preferences */}
        {step === 12 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Hair Type & Texture</h3>
              <div className="grid grid-cols-2 gap-3">
                {["Straight", "Wavy", "Curly", "Coily", "Frizzy", "Fine/Thin", "Thick/Coarse", "Color-Treated", "Natural/Virgin"].map((type) => (
                  <Card
                    key={type}
                    className={`cursor-pointer transition-all ${
                      formData.hairType.includes(type)
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({
                      ...formData,
                      hairType: toggleArrayItem(formData.hairType, type)
                    })}
                  >
                    <CardContent className="p-4 text-center">
                      <span className="text-sm font-light">{type}</span>
                      {formData.hairType.includes(type) && (
                        <Heart className="w-4 h-4 mx-auto mt-1 text-primary fill-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Hair Concerns</h3>
              <div className="grid grid-cols-2 gap-3">
                {["Dryness", "Frizz", "Damage/Breakage", "Oily Scalp", "Dandruff", "Lack of Volume", "Color Fading", "None"].map((concern) => (
                  <Card
                    key={concern}
                    className={`cursor-pointer transition-all ${
                      formData.hairConcerns.includes(concern)
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({
                      ...formData,
                      hairConcerns: toggleArrayItem(formData.hairConcerns, concern)
                    })}
                  >
                    <CardContent className="p-4 text-center">
                      <span className="text-sm font-light">{concern}</span>
                      {formData.hairConcerns.includes(concern) && (
                        <Heart className="w-4 h-4 mx-auto mt-1 text-primary fill-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-normal text-muted-foreground uppercase tracking-wide">Product Preferences</h3>
              <div className="space-y-2">
                {["Sulfate-Free", "Silicone-Free", "Paraben-Free", "Natural/Organic", "Professional/Salon", "Drugstore/Affordable", "Luxury/Premium"].map((pref) => (
                  <Card
                    key={pref}
                    className={`cursor-pointer transition-all ${
                      formData.shampooPreferences.includes(pref)
                        ? 'border-primary bg-primary/5 shadow-lg'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({
                      ...formData,
                      shampooPreferences: toggleArrayItem(formData.shampooPreferences, pref)
                    })}
                  >
                    <CardContent className="p-6 flex items-center justify-between">
                      <span className="text-lg font-light">{pref}</span>
                      {formData.shampooPreferences.includes(pref) && (
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Heart className="w-4 h-4 text-white fill-white" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
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
          {step < maxStep ? (
            <Button 
              onClick={() => setStep(step + 1)} 
              className="flex-1" 
              variant="luxury"
              disabled={
                (step === 1 && !formData.gender) ||
                (step === 2 && formData.styleType.length === 0) ||
                (step === 3 && formData.colorPreferences.length === 0) ||
                (step === 4 && formData.budgetRange.length === 0) ||
                (step === 5 && formData.lifestyle.length === 0) ||
                (step === 6 && formData.occasions.length === 0) ||
                (step === 7 && formData.mood.length === 0) ||
                (step === 8 && formData.bodyType.length === 0) ||
                (step === 11 && formData.fragranceTypes.length === 0) ||
                (step === 12 && formData.hairType.length === 0)
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