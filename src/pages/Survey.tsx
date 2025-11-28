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
    gender: "",
    styleType: "",
    likedImages: [] as string[],
    colorPreferences: [] as string[],
    budgetRange: "",
    lifestyle: "",
    occasions: [] as string[],
  });

  const styleImages = {
    Classic: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=500&fit=crop",
    Minimalist: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop",
    Trendy: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=500&fit=crop",
    Bohemian: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=400&h=500&fit=crop",
    Edgy: "https://images.unsplash.com/photo-1558769132-cb1aea588c87?w=400&h=500&fit=crop",
    Romantic: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=500&fit=crop"
  };

  const colorImages = {
    Neutral: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=300&fit=crop",
    Black: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop",
    White: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=300&fit=crop",
    "Earth Tones": "https://images.unsplash.com/photo-1544441893-675973e31985?w=400&h=300&fit=crop",
    Pastels: "https://images.unsplash.com/photo-1558769132-cb1aea588c87?w=400&h=300&fit=crop",
    "Bold Colors": "https://images.unsplash.com/photo-1525562723836-dca67a71d5f1?w=400&h=300&fit=crop"
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
      "Hi! I'm Luna, your personal AI stylist. Let's discover your perfect style together! First, what style resonates with you?",
      "Great choice! Now, which gender preference should I focus on for your wardrobe recommendations?",
      "Perfect! Let me show you some color palettes. Tap the ones that catch your eye!",
      "Beautiful selections! Now, what's your budget range? No judgment - style is for everyone!",
      "Almost there! Tell me about your lifestyle so I can curate the perfect pieces for you.",
      "Last step! What occasions do you dress for most often?"
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
            style_type: formData.styleType,
            color_preferences: formData.colorPreferences,
            budget_range: formData.budgetRange,
            body_type: formData.gender,
            lifestyle: formData.lifestyle,
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

  const progress = (step / 6) * 100;

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
            <span>Step {step} of 6</span>
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
                  formData.styleType === style 
                    ? 'border-primary shadow-lg scale-105' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setFormData({...formData, styleType: style})}
              >
                <div className="aspect-[4/5] relative">
                  <img src={imageUrl} alt={style} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-light text-lg">{style}</p>
                  </div>
                  {formData.styleType === style && (
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
                  formData.gender === gender
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setFormData({...formData, gender})}
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
            {["Under $500", "$500-$1000", "$1000-$2000", "Over $2000"].map((budget) => (
              <Card
                key={budget}
                className={`cursor-pointer transition-all ${
                  formData.budgetRange === budget
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setFormData({...formData, budgetRange: budget})}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <span className="text-lg font-light">{budget}</span>
                  {formData.budgetRange === budget && (
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
            {["Professional", "Casual", "Active", "Social", "Creative"].map((lifestyle) => (
              <Card
                key={lifestyle}
                className={`cursor-pointer transition-all ${
                  formData.lifestyle === lifestyle
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setFormData({...formData, lifestyle})}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <span className="text-lg font-light">{lifestyle}</span>
                  {formData.lifestyle === lifestyle && (
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
            {["Work", "Casual Outings", "Date Night", "Events", "Travel", "Working Out"].map((occasion) => (
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
          {step < 6 ? (
            <Button 
              onClick={() => setStep(step + 1)} 
              className="flex-1" 
              variant="luxury"
              disabled={
                (step === 1 && !formData.styleType) ||
                (step === 2 && !formData.gender) ||
                (step === 3 && formData.colorPreferences.length === 0) ||
                (step === 4 && !formData.budgetRange) ||
                (step === 5 && !formData.lifestyle)
              }
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              className="flex-1" 
              variant="luxury"
              disabled={loading || formData.occasions.length === 0}
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