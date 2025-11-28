import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";

const Survey = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    styleType: "",
    colorPreferences: [] as string[],
    budgetRange: "",
    lifestyle: "",
    occasions: [] as string[],
  });

  useEffect(() => {
    // Load from localStorage if guest user
    const saved = localStorage.getItem('guest_preferences');
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Save to localStorage for guests
      localStorage.setItem('guest_preferences', JSON.stringify(formData));

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // If authenticated, save to database
        const { error } = await supabase
          .from("style_preferences")
          .upsert({
            user_id: user.id,
            style_type: formData.styleType,
            color_preferences: formData.colorPreferences,
            budget_range: formData.budgetRange,
            body_type: "",
            lifestyle: formData.lifestyle,
            occasions: formData.occasions,
            favorite_brands: [],
          });

        if (error) throw error;
      }

      toast.success("Generating your wardrobe...");
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

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step > 1 ? setStep(step - 1) : navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 mx-4">
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="text-sm text-muted-foreground">{step}/4</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <Card className="shadow-elegant">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-light">
                {step === 1 && "Your Style"}
                {step === 2 && "Color Palette"}
                {step === 3 && "Lifestyle"}
                {step === 4 && "Occasions"}
              </h2>
              <p className="text-sm text-muted-foreground font-light">
                {step === 1 && "What's your aesthetic?"}
                {step === 2 && "Colors you love"}
                {step === 3 && "Your daily life"}
                {step === 4 && "Where do you go?"}
              </p>
            </div>

            {step === 1 && (
              <RadioGroup value={formData.styleType} onValueChange={(value) => setFormData({...formData, styleType: value})}>
                {["Classic", "Minimalist", "Trendy", "Bohemian", "Edgy", "Romantic"].map((style) => (
                  <div 
                    key={style} 
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      formData.styleType === style 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/30'
                    }`}
                    onClick={() => setFormData({...formData, styleType: style})}
                  >
                    <RadioGroupItem value={style} id={style} />
                    <Label htmlFor={style} className="cursor-pointer font-light flex-1">{style}</Label>
                    {formData.styleType === style && <Check className="w-4 h-4 text-primary" />}
                  </div>
                ))}
              </RadioGroup>
            )}

            {step === 2 && (
              <div className="space-y-3">
                {["Neutral", "Black", "White", "Earth Tones", "Pastels", "Bold Colors"].map((color) => (
                  <div 
                    key={color} 
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      formData.colorPreferences.includes(color)
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/30'
                    }`}
                    onClick={() => setFormData({
                      ...formData,
                      colorPreferences: toggleArrayItem(formData.colorPreferences, color)
                    })}
                  >
                    <Checkbox
                      checked={formData.colorPreferences.includes(color)}
                      id={color}
                    />
                    <Label htmlFor={color} className="cursor-pointer font-light flex-1">{color}</Label>
                    {formData.colorPreferences.includes(color) && <Check className="w-4 h-4 text-primary" />}
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm font-light">Budget Range</p>
                  <RadioGroup value={formData.budgetRange} onValueChange={(value) => setFormData({...formData, budgetRange: value})}>
                    {["Under $500", "$500-$1000", "$1000-$2000", "Over $2000"].map((budget) => (
                      <div 
                        key={budget} 
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          formData.budgetRange === budget 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/30'
                        }`}
                        onClick={() => setFormData({...formData, budgetRange: budget})}
                      >
                        <RadioGroupItem value={budget} id={budget} />
                        <Label htmlFor={budget} className="cursor-pointer font-light flex-1">{budget}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-light">Lifestyle</p>
                  <RadioGroup value={formData.lifestyle} onValueChange={(value) => setFormData({...formData, lifestyle: value})}>
                    {["Professional", "Casual", "Active", "Social"].map((lifestyle) => (
                      <div 
                        key={lifestyle} 
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          formData.lifestyle === lifestyle 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/30'
                        }`}
                        onClick={() => setFormData({...formData, lifestyle: lifestyle})}
                      >
                        <RadioGroupItem value={lifestyle} id={lifestyle} />
                        <Label htmlFor={lifestyle} className="cursor-pointer font-light flex-1">{lifestyle}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                {["Work", "Casual Outings", "Date Night", "Events", "Travel"].map((occasion) => (
                  <div 
                    key={occasion} 
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      formData.occasions.includes(occasion)
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/30'
                    }`}
                    onClick={() => setFormData({
                      ...formData,
                      occasions: toggleArrayItem(formData.occasions, occasion)
                    })}
                  >
                    <Checkbox
                      checked={formData.occasions.includes(occasion)}
                      id={occasion}
                    />
                    <Label htmlFor={occasion} className="cursor-pointer font-light flex-1">{occasion}</Label>
                    {formData.occasions.includes(occasion) && <Check className="w-4 h-4 text-primary" />}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {step < 4 ? (
                <Button 
                  onClick={() => setStep(step + 1)} 
                  className="w-full" 
                  variant="luxury"
                  disabled={
                    (step === 1 && !formData.styleType) ||
                    (step === 2 && formData.colorPreferences.length === 0) ||
                    (step === 3 && (!formData.budgetRange || !formData.lifestyle))
                  }
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  className="w-full" 
                  variant="luxury"
                  disabled={loading || formData.occasions.length === 0}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  See My Wardrobe
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Survey;