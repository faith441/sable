import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    bodyType: "",
    lifestyle: "",
    occasions: [] as string[],
    favoriteBrands: [] as string[],
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to save your preferences");
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("style_preferences")
        .upsert({
          user_id: user.id,
          style_type: formData.styleType,
          color_preferences: formData.colorPreferences,
          budget_range: formData.budgetRange,
          body_type: formData.bodyType,
          lifestyle: formData.lifestyle,
          occasions: formData.occasions,
          favorite_brands: formData.favoriteBrands,
        });

      if (error) throw error;

      toast.success("Preferences saved! Generating your wardrobe...");
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
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => step > 1 ? setStep(step - 1) : navigate("/")}
          className="mb-8 font-light"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-3">
            <p className="text-sm font-light text-muted-foreground">Step {step} of 4</p>
            <p className="text-sm font-light text-muted-foreground">{progress.toFixed(0)}% Complete</p>
          </div>
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card className="shadow-elegant border-border/50 backdrop-blur-sm">
          <CardHeader className="space-y-3 pb-8">
            <CardTitle className="text-4xl font-light tracking-tight">
              {step === 1 && "Your Style Personality"}
              {step === 2 && "Color Preferences"}
              {step === 3 && "Budget & Lifestyle"}
              {step === 4 && "Occasions"}
            </CardTitle>
            <CardDescription className="text-base font-light">
              {step === 1 && "Help us understand your aesthetic preferences"}
              {step === 2 && "Select the colors that resonate with you"}
              {step === 3 && "Tell us about your lifestyle and budget"}
              {step === 4 && "When do you need to look your best?"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8 pb-10">
            {step === 1 && (
              <div className="space-y-6">
                <RadioGroup value={formData.styleType} onValueChange={(value) => setFormData({...formData, styleType: value})}>
                  {["Classic", "Minimalist", "Trendy", "Bohemian", "Edgy", "Romantic"].map((style) => (
                    <div 
                      key={style} 
                      className={`flex items-center space-x-4 p-5 rounded-lg border-2 transition-all cursor-pointer ${
                        formData.styleType === style 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/30 hover:bg-accent/50'
                      }`}
                      onClick={() => setFormData({...formData, styleType: style})}
                    >
                      <RadioGroupItem value={style} id={style} />
                      <Label htmlFor={style} className="cursor-pointer text-lg font-light flex-1">{style}</Label>
                      {formData.styleType === style && <Check className="w-5 h-5 text-primary" />}
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {["Neutral", "Black", "White", "Earth Tones", "Pastels", "Bold Colors", "Jewel Tones"].map((color) => (
                    <div 
                      key={color} 
                      className={`flex items-center space-x-4 p-5 rounded-lg border-2 transition-all cursor-pointer ${
                        formData.colorPreferences.includes(color)
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/30 hover:bg-accent/50'
                      }`}
                      onClick={() => setFormData({
                        ...formData,
                        colorPreferences: toggleArrayItem(formData.colorPreferences, color)
                      })}
                    >
                      <Checkbox
                        checked={formData.colorPreferences.includes(color)}
                        onCheckedChange={() => setFormData({
                          ...formData,
                          colorPreferences: toggleArrayItem(formData.colorPreferences, color)
                        })}
                        id={color}
                      />
                      <Label htmlFor={color} className="cursor-pointer text-base font-light flex-1">{color}</Label>
                      {formData.colorPreferences.includes(color) && <Check className="w-5 h-5 text-primary" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-xl font-light">Budget Range</Label>
                  <RadioGroup value={formData.budgetRange} onValueChange={(value) => setFormData({...formData, budgetRange: value})}>
                    {["Under $500", "$500-$1000", "$1000-$2000", "Over $2000"].map((budget) => (
                      <div 
                        key={budget} 
                        className={`flex items-center space-x-4 p-5 rounded-lg border-2 transition-all cursor-pointer ${
                          formData.budgetRange === budget 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/30 hover:bg-accent/50'
                        }`}
                        onClick={() => setFormData({...formData, budgetRange: budget})}
                      >
                        <RadioGroupItem value={budget} id={budget} />
                        <Label htmlFor={budget} className="cursor-pointer text-base font-light flex-1">{budget}</Label>
                        {formData.budgetRange === budget && <Check className="w-5 h-5 text-primary" />}
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-xl font-light">Lifestyle</Label>
                  <RadioGroup value={formData.lifestyle} onValueChange={(value) => setFormData({...formData, lifestyle: value})}>
                    {["Professional", "Casual", "Active", "Social", "Creative"].map((lifestyle) => (
                      <div 
                        key={lifestyle} 
                        className={`flex items-center space-x-4 p-5 rounded-lg border-2 transition-all cursor-pointer ${
                          formData.lifestyle === lifestyle 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/30 hover:bg-accent/50'
                        }`}
                        onClick={() => setFormData({...formData, lifestyle: lifestyle})}
                      >
                        <RadioGroupItem value={lifestyle} id={lifestyle} />
                        <Label htmlFor={lifestyle} className="cursor-pointer text-base font-light flex-1">{lifestyle}</Label>
                        {formData.lifestyle === lifestyle && <Check className="w-5 h-5 text-primary" />}
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {["Work", "Casual Outings", "Date Night", "Events", "Travel", "Working Out"].map((occasion) => (
                    <div 
                      key={occasion} 
                      className={`flex items-center space-x-4 p-5 rounded-lg border-2 transition-all cursor-pointer ${
                        formData.occasions.includes(occasion)
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/30 hover:bg-accent/50'
                      }`}
                      onClick={() => setFormData({
                        ...formData,
                        occasions: toggleArrayItem(formData.occasions, occasion)
                      })}
                    >
                      <Checkbox
                        checked={formData.occasions.includes(occasion)}
                        onCheckedChange={() => setFormData({
                          ...formData,
                          occasions: toggleArrayItem(formData.occasions, occasion)
                        })}
                        id={occasion}
                      />
                      <Label htmlFor={occasion} className="cursor-pointer text-base font-light flex-1">{occasion}</Label>
                      {formData.occasions.includes(occasion) && <Check className="w-5 h-5 text-primary" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-8 border-t border-border/50">
              {step < 4 ? (
                <Button 
                  onClick={() => setStep(step + 1)} 
                  className="ml-auto" 
                  size="lg"
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
                  className="ml-auto" 
                  size="lg"
                  variant="luxury"
                  disabled={loading || formData.occasions.length === 0}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Generate My Wardrobe
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