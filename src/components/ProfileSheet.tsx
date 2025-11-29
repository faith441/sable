import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STYLE_TYPES = ["Classic", "Minimalist", "Trendy", "Bohemian", "Edgy", "Romantic", "Vintage", "Military", "Streetwear", "Bold", "Formal", "Chic", "Western", "Mountain", "Beach", "Sexy"];
const COLORS = ["Neutral", "Black", "White", "Earth Tones", "Pastels", "Bold Colors", "Navy", "Jewel Tones", "Monochrome", "Warm Tones", "Cool Tones", "Metallics", "Olive & Green", "Burgundy & Wine", "Neon & Bright", "Blush & Rose"];
const BUDGETS = ["$1,000 - $2,000", "$2,000 - $3,500", "$3,500 - $5,000", "$5,000 - $7,500", "$7,500 - $10,000", "$10,000+"];
const LIFESTYLES = ["Professional", "Casual", "Active", "Social", "Creative", "Entrepreneurial", "Remote Worker", "Student", "Parent", "Traveler", "Outdoor/Adventure", "Fitness Enthusiast", "Nightlife", "Minimalist", "Luxury", "Executive", "High Society", "Jet Set", "Philanthropist", "Country Club", "Yacht Club", "Equestrian", "Art Collector", "Fine Dining", "Opera & Theater", "Private Aviation", "Estate Living", "Concierge Lifestyle"];
const OCCASIONS = ["Work", "Casual Outings", "Date Night", "Events", "Travel", "Working Out", "Business Meetings", "Formal Events/Galas", "Weddings", "Networking Events", "Vacation/Resort", "Golf/Country Club", "Cocktail Parties", "Brunch/Lunch", "Weekend Getaways", "Red Carpet/VIP", "Charity Events", "Gallery Openings", "Private Dinners", "Yachting/Boating", "Outdoor Activities", "Sports Events", "Theater/Opera", "Beach/Pool", "Ski Resort", "Wine Tasting", "Fashion Shows"];
const GENDERS = ["Women's", "Men's", "Unisex"];
const BODY_TYPES = ["Athletic", "Slim", "Curvy", "Petite", "Plus Size", "Muscular"];

const ProfileSheet = ({ open, onOpenChange }: ProfileSheetProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({
    gender: [],
    styleType: [],
    colorPreferences: [],
    budgetRange: [],
    lifestyle: [],
    occasions: [],
    bodyType: [],
  });

  useEffect(() => {
    if (open) {
      const preferences = localStorage.getItem('guest_preferences');
      if (preferences) {
        const parsed = JSON.parse(preferences);
        setFormData({
          gender: parsed.gender || [],
          styleType: parsed.styleType || [],
          colorPreferences: parsed.colorPreferences || [],
          budgetRange: parsed.budgetRange || [],
          lifestyle: parsed.lifestyle || [],
          occasions: parsed.occasions || [],
          bodyType: parsed.bodyType || [],
        });
      }
    }
  }, [open]);

  const toggleArrayItem = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field]?.includes(value)
        ? prev[field].filter((item: string) => item !== value)
        : [...(prev[field] || []), value]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save to localStorage
      const existingPrefs = localStorage.getItem('guest_preferences');
      const allPrefs = existingPrefs ? JSON.parse(existingPrefs) : {};
      localStorage.setItem('guest_preferences', JSON.stringify({
        ...allPrefs,
        ...formData
      }));

      // Save to Supabase if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from("style_preferences")
          .upsert({
            user_id: user.id,
            style_type: formData.styleType.length > 0 ? formData.styleType.join(", ") : "Not specified",
            color_preferences: formData.colorPreferences,
            budget_range: formData.budgetRange.length > 0 ? formData.budgetRange.join(", ") : "Not specified",
            body_type: formData.gender.length > 0 ? formData.gender.join(", ") : null,
            lifestyle: formData.lifestyle.length > 0 ? formData.lifestyle.join(", ") : "Not specified",
            occasions: formData.occasions,
            favorite_brands: [],
            sizes: {
              bodyType: formData.bodyType || [],
            }
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;
      }

      // Clear cached capsules to regenerate with new preferences
      localStorage.removeItem('cached_capsules');
      
      toast.success("Profile updated successfully! Your wardrobe will refresh.");
      onOpenChange(false);
      
      // Refresh the page to reload wardrobe with new preferences
      window.location.reload();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="font-light text-2xl">Your Profile</SheetTitle>
          <SheetDescription className="font-light">
            Edit your style preferences
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1 px-6">
          <div className="py-4">
            <Accordion type="multiple" defaultValue={["style", "lifestyle"]} className="w-full">
              {/* Style Preferences Section */}
              <AccordionItem value="style">
                <AccordionTrigger className="text-lg font-light">Style Preferences</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-2">
                    {/* Gender */}
                    <div className="space-y-3">
                      <Label className="font-medium">Gender Preference</Label>
                      <div className="space-y-2">
                        {GENDERS.map((gender) => (
                          <div key={gender} className="flex items-center space-x-2">
                            <Checkbox
                              id={`gender-${gender}`}
                              checked={formData.gender?.includes(gender)}
                              onCheckedChange={() => toggleArrayItem('gender', gender)}
                            />
                            <label
                              htmlFor={`gender-${gender}`}
                              className="text-sm font-light cursor-pointer"
                            >
                              {gender}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Style Types */}
                    <div className="space-y-3">
                      <Label className="font-medium">Style Types</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {STYLE_TYPES.map((style) => (
                          <div key={style} className="flex items-center space-x-2">
                            <Checkbox
                              id={`style-${style}`}
                              checked={formData.styleType?.includes(style)}
                              onCheckedChange={() => toggleArrayItem('styleType', style)}
                            />
                            <label
                              htmlFor={`style-${style}`}
                              className="text-sm font-light cursor-pointer"
                            >
                              {style}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Colors */}
                    <div className="space-y-3">
                      <Label className="font-medium">Preferred Colors</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {COLORS.map((color) => (
                          <div key={color} className="flex items-center space-x-2">
                            <Checkbox
                              id={`color-${color}`}
                              checked={formData.colorPreferences?.includes(color)}
                              onCheckedChange={() => toggleArrayItem('colorPreferences', color)}
                            />
                            <label
                              htmlFor={`color-${color}`}
                              className="text-sm font-light cursor-pointer"
                            >
                              {color}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="space-y-3">
                      <Label className="font-medium">Budget Range</Label>
                      <div className="space-y-2">
                        {BUDGETS.map((budget) => (
                          <div key={budget} className="flex items-center space-x-2">
                            <Checkbox
                              id={`budget-${budget}`}
                              checked={formData.budgetRange?.includes(budget)}
                              onCheckedChange={() => toggleArrayItem('budgetRange', budget)}
                            />
                            <label
                              htmlFor={`budget-${budget}`}
                              className="text-sm font-light cursor-pointer"
                            >
                              {budget}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Lifestyle & Occasions Section */}
              <AccordionItem value="lifestyle">
                <AccordionTrigger className="text-lg font-light">Lifestyle & Occasions</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-2">
                    {/* Lifestyle */}
                    <div className="space-y-3">
                      <Label className="font-medium">Lifestyle</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                        {LIFESTYLES.map((lifestyle) => (
                          <div key={lifestyle} className="flex items-center space-x-2">
                            <Checkbox
                              id={`lifestyle-${lifestyle}`}
                              checked={formData.lifestyle?.includes(lifestyle)}
                              onCheckedChange={() => toggleArrayItem('lifestyle', lifestyle)}
                            />
                            <label
                              htmlFor={`lifestyle-${lifestyle}`}
                              className="text-sm font-light cursor-pointer"
                            >
                              {lifestyle}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Occasions */}
                    <div className="space-y-3">
                      <Label className="font-medium">Occasions</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                        {OCCASIONS.map((occasion) => (
                          <div key={occasion} className="flex items-center space-x-2">
                            <Checkbox
                              id={`occasion-${occasion}`}
                              checked={formData.occasions?.includes(occasion)}
                              onCheckedChange={() => toggleArrayItem('occasions', occasion)}
                            />
                            <label
                              htmlFor={`occasion-${occasion}`}
                              className="text-sm font-light cursor-pointer"
                            >
                              {occasion}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Body Type Section */}
              <AccordionItem value="body">
                <AccordionTrigger className="text-lg font-light">Body Type</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <Label className="font-medium">Body Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {BODY_TYPES.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`bodytype-${type}`}
                            checked={formData.bodyType?.includes(type)}
                            onCheckedChange={() => toggleArrayItem('bodyType', type)}
                          />
                          <label
                            htmlFor={`bodytype-${type}`}
                            className="text-sm font-light cursor-pointer"
                          >
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-border bg-background">
          <Button 
            variant="luxury" 
            className="w-full"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProfileSheet;
