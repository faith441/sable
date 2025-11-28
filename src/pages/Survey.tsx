import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => step > 1 ? setStep(step - 1) : navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Discover Your Style</CardTitle>
            <CardDescription>Step {step} of 4</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <Label className="text-lg">What's your style personality?</Label>
                <RadioGroup value={formData.styleType} onValueChange={(value) => setFormData({...formData, styleType: value})}>
                  {["Classic", "Minimalist", "Trendy", "Bohemian", "Edgy", "Romantic"].map((style) => (
                    <div key={style} className="flex items-center space-x-2">
                      <RadioGroupItem value={style} id={style} />
                      <Label htmlFor={style} className="cursor-pointer">{style}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Label className="text-lg">Select your favorite colors</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["Neutral", "Black", "White", "Earth Tones", "Pastels", "Bold Colors", "Jewel Tones"].map((color) => (
                    <div key={color} className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.colorPreferences.includes(color)}
                        onCheckedChange={() => setFormData({
                          ...formData,
                          colorPreferences: toggleArrayItem(formData.colorPreferences, color)
                        })}
                        id={color}
                      />
                      <Label htmlFor={color} className="cursor-pointer">{color}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-lg">What's your budget range?</Label>
                  <RadioGroup value={formData.budgetRange} onValueChange={(value) => setFormData({...formData, budgetRange: value})}>
                    {["Under $500", "$500-$1000", "$1000-$2000", "Over $2000"].map((budget) => (
                      <div key={budget} className="flex items-center space-x-2">
                        <RadioGroupItem value={budget} id={budget} />
                        <Label htmlFor={budget} className="cursor-pointer">{budget}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-lg">What's your lifestyle?</Label>
                  <RadioGroup value={formData.lifestyle} onValueChange={(value) => setFormData({...formData, lifestyle: value})}>
                    {["Professional", "Casual", "Active", "Social", "Creative"].map((lifestyle) => (
                      <div key={lifestyle} className="flex items-center space-x-2">
                        <RadioGroupItem value={lifestyle} id={lifestyle} />
                        <Label htmlFor={lifestyle} className="cursor-pointer">{lifestyle}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <Label className="text-lg">What occasions do you dress for?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["Work", "Casual Outings", "Date Night", "Events", "Travel", "Working Out"].map((occasion) => (
                    <div key={occasion} className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.occasions.includes(occasion)}
                        onCheckedChange={() => setFormData({
                          ...formData,
                          occasions: toggleArrayItem(formData.occasions, occasion)
                        })}
                        id={occasion}
                      />
                      <Label htmlFor={occasion} className="cursor-pointer">{occasion}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6">
              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)} className="ml-auto" disabled={
                  (step === 1 && !formData.styleType) ||
                  (step === 2 && formData.colorPreferences.length === 0) ||
                  (step === 3 && (!formData.budgetRange || !formData.lifestyle))
                }>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="ml-auto" disabled={loading || formData.occasions.length === 0}>
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