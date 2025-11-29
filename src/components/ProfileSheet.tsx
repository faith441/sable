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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
const GENDERS = ["Women's", "Men's"];
const BODY_TYPES = ["Athletic", "Slim", "Curvy", "Petite", "Plus Size", "Muscular"];
const EXPOSURE_PREFERENCES = ["None", "A Little", "A Lot"];
const JEAN_BRANDS = ["Levi's", "AG", "J Brand", "Paige", "Good American", "Mother", "Citizens of Humanity", "Frame"];
const FRAGRANCE_TYPES = ["Floral", "Woody", "Fresh/Citrus", "Oriental/Spicy", "Fruity", "Aquatic", "Gourmand", "Musky"];
const HAIR_TYPES = ["Straight", "Wavy", "Curly", "Coily", "Fine/Thin", "Thick/Coarse", "Color-Treated", "Natural/Virgin"];

const ProfileSheet = ({ open, onOpenChange }: ProfileSheetProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({
    gender: "",
    styleType: [],
    colorPreferences: [],
    budgetRange: [],
    lifestyle: [],
    occasions: [],
    bodyType: [],
    fragranceTypes: [],
    hairType: [],
    // Women-specific
    jeanSizes: {} as Record<string, string>,
    braSize: "",
    cleavagePreference: "",
    buttPreference: "",
    legPreference: "",
  });

  useEffect(() => {
    if (open) {
      const preferences = localStorage.getItem('guest_preferences');
      if (preferences) {
        const parsed = JSON.parse(preferences);
        setFormData({
          gender: parsed.gender || "",
          styleType: parsed.styleType || [],
          colorPreferences: parsed.colorPreferences || [],
          budgetRange: parsed.budgetRange || [],
          lifestyle: parsed.lifestyle || [],
          occasions: parsed.occasions || [],
          bodyType: parsed.bodyType || [],
          fragranceTypes: parsed.fragranceTypes || [],
          hairType: parsed.hairType || [],
          jeanSizes: parsed.jeanSizes || {},
          braSize: parsed.braSize || "",
          cleavagePreference: parsed.cleavagePreference || "",
          buttPreference: parsed.buttPreference || "",
          legPreference: parsed.legPreference || "",
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
      const existingPrefs = localStorage.getItem('guest_preferences');
      const allPrefs = existingPrefs ? JSON.parse(existingPrefs) : {};
      localStorage.setItem('guest_preferences', JSON.stringify({
        ...allPrefs,
        ...formData
      }));

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from("style_preferences")
          .upsert({
            user_id: user.id,
            style_type: formData.styleType.length > 0 ? formData.styleType.join(", ") : "Not specified",
            color_preferences: formData.colorPreferences,
            budget_range: formData.budgetRange.length > 0 ? formData.budgetRange.join(", ") : "Not specified",
            body_type: formData.gender || null,
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

      localStorage.removeItem('cached_capsules');
      
      toast.success("Profile updated successfully! Your wardrobe will refresh.");
      onOpenChange(false);
      window.location.reload();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const BadgeOption = ({ item, isSelected, onClick }: { item: string; isSelected: boolean; onClick: () => void }) => {
    // Rotate between colors for visual variety
    const getColorClass = () => {
      const hash = item.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const colors = [
        "bg-primary text-primary-foreground",
        "bg-sage text-sage-foreground", 
        "bg-accent text-accent-foreground"
      ];
      return isSelected ? colors[hash % colors.length] : "";
    };
    
    return (
      <Badge
        variant={isSelected ? "default" : "outline"}
        className={`cursor-pointer transition-all text-xs py-1 px-2 ${
          isSelected ? getColorClass() : "hover:bg-accent"
        }`}
        onClick={onClick}
      >
        {item}
      </Badge>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-3 border-b border-border">
          <SheetTitle className="font-light text-2xl">Your Profile</SheetTitle>
          <SheetDescription className="font-light text-sm">
            Edit your style preferences
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="style" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-3 grid w-[calc(100%-3rem)] grid-cols-4">
            <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
            <TabsTrigger value="lifestyle" className="text-xs">Lifestyle</TabsTrigger>
            <TabsTrigger value="body" className="text-xs">Body</TabsTrigger>
            <TabsTrigger value="care" className="text-xs">Care</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6">
            <TabsContent value="style" className="mt-4 space-y-4">
              {/* Gender */}
              <div className="space-y-2">
                <Label className="font-medium text-sm">Gender</Label>
                <div className="flex flex-wrap gap-1.5">
                  {GENDERS.map((gender) => (
                    <BadgeOption
                      key={gender}
                      item={gender}
                      isSelected={formData.gender === gender}
                      onClick={() => setFormData((prev: any) => ({ ...prev, gender }))}
                    />
                  ))}
                </div>
              </div>

              {/* Style Types */}
              <div className="space-y-2">
                <Label className="font-medium text-sm">Style Types</Label>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_TYPES.map((style) => (
                    <BadgeOption
                      key={style}
                      item={style}
                      isSelected={formData.styleType?.includes(style)}
                      onClick={() => toggleArrayItem('styleType', style)}
                    />
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <Label className="font-medium text-sm">Colors</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COLORS.map((color) => (
                    <BadgeOption
                      key={color}
                      item={color}
                      isSelected={formData.colorPreferences?.includes(color)}
                      onClick={() => toggleArrayItem('colorPreferences', color)}
                    />
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label className="font-medium text-sm">Budget Range</Label>
                <div className="flex flex-wrap gap-1.5">
                  {BUDGETS.map((budget) => (
                    <BadgeOption
                      key={budget}
                      item={budget}
                      isSelected={formData.budgetRange?.includes(budget)}
                      onClick={() => toggleArrayItem('budgetRange', budget)}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lifestyle" className="mt-4 space-y-4">
              {/* Lifestyle */}
              <div className="space-y-2">
                <Label className="font-medium text-sm">Lifestyle</Label>
                <div className="flex flex-wrap gap-1.5">
                  {LIFESTYLES.map((lifestyle) => (
                    <BadgeOption
                      key={lifestyle}
                      item={lifestyle}
                      isSelected={formData.lifestyle?.includes(lifestyle)}
                      onClick={() => toggleArrayItem('lifestyle', lifestyle)}
                    />
                  ))}
                </div>
              </div>

              {/* Occasions */}
              <div className="space-y-2">
                <Label className="font-medium text-sm">Occasions</Label>
                <div className="flex flex-wrap gap-1.5">
                  {OCCASIONS.map((occasion) => (
                    <BadgeOption
                      key={occasion}
                      item={occasion}
                      isSelected={formData.occasions?.includes(occasion)}
                      onClick={() => toggleArrayItem('occasions', occasion)}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="body" className="mt-4 space-y-4 pb-4">
              {/* Body Type */}
              <div className="space-y-2">
                <Label className="font-medium text-sm">Body Type</Label>
                <div className="flex flex-wrap gap-1.5">
                  {BODY_TYPES.map((type) => (
                    <BadgeOption
                      key={type}
                      item={type}
                      isSelected={formData.bodyType?.includes(type)}
                      onClick={() => toggleArrayItem('bodyType', type)}
                    />
                  ))}
                </div>
              </div>

              {/* Women-specific sections */}
              {formData.gender === "Women's" && (
                <>
                  {/* Jean Sizes */}
                  <div className="space-y-2">
                    <Label className="font-medium text-sm">Jean Sizes by Brand (Optional)</Label>
                    <div className="space-y-2">
                      {JEAN_BRANDS.map((brand) => (
                        <div key={brand} className="flex items-center gap-2">
                          <span className="text-sm w-32 text-muted-foreground">{brand}</span>
                          <input
                            type="text"
                            placeholder="e.g., 27, 28"
                            className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm"
                            value={formData.jeanSizes?.[brand] || ""}
                            onChange={(e) => setFormData((prev: any) => ({
                              ...prev,
                              jeanSizes: { ...prev.jeanSizes, [brand]: e.target.value }
                            }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bra Size */}
                  <div className="space-y-2">
                    <Label className="font-medium text-sm">Bra Size (Optional)</Label>
                    <input
                      type="text"
                      placeholder="e.g., 34C, 36D"
                      className="w-full px-3 py-2 rounded-md border border-border bg-background"
                      value={formData.braSize === "No bra" ? "" : formData.braSize}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, braSize: e.target.value }))}
                      disabled={formData.braSize === "No bra"}
                    />
                    <div
                      className={`cursor-pointer p-3 rounded-md border transition-all ${
                        formData.braSize === "No bra"
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setFormData((prev: any) => ({ 
                        ...prev, 
                        braSize: prev.braSize === "No bra" ? "" : "No bra" 
                      }))}
                    >
                      <span className="text-sm">I don't wear a bra</span>
                    </div>
                  </div>

                  {/* Exposure Preferences */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="font-medium text-sm">Cleavage Showing</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {EXPOSURE_PREFERENCES.map((pref) => (
                          <div
                            key={pref}
                            className={`cursor-pointer p-3 rounded-md border text-center transition-all ${
                              formData.cleavagePreference === pref
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setFormData((prev: any) => ({ ...prev, cleavagePreference: pref }))}
                          >
                            <span className="text-sm">{pref}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-sm">Butt Showing</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {EXPOSURE_PREFERENCES.map((pref) => (
                          <div
                            key={pref}
                            className={`cursor-pointer p-3 rounded-md border text-center transition-all ${
                              formData.buttPreference === pref
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setFormData((prev: any) => ({ ...prev, buttPreference: pref }))}
                          >
                            <span className="text-sm">{pref}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-sm">Legs Showing</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {EXPOSURE_PREFERENCES.map((pref) => (
                          <div
                            key={pref}
                            className={`cursor-pointer p-3 rounded-md border text-center transition-all ${
                              formData.legPreference === pref
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setFormData((prev: any) => ({ ...prev, legPreference: pref }))}
                          >
                            <span className="text-sm">{pref}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="care" className="mt-4 space-y-4 pb-4">
              {/* Fragrance Types */}
              <div className="space-y-2">
                <Label className="font-medium text-sm">Fragrance Types</Label>
                <div className="flex flex-wrap gap-1.5">
                  {FRAGRANCE_TYPES.map((type) => (
                    <BadgeOption
                      key={type}
                      item={type}
                      isSelected={formData.fragranceTypes?.includes(type)}
                      onClick={() => toggleArrayItem('fragranceTypes', type)}
                    />
                  ))}
                </div>
              </div>

              {/* Hair Type */}
              <div className="space-y-2">
                <Label className="font-medium text-sm">Hair Type</Label>
                <div className="flex flex-wrap gap-1.5">
                  {HAIR_TYPES.map((type) => (
                    <BadgeOption
                      key={type}
                      item={type}
                      isSelected={formData.hairType?.includes(type)}
                      onClick={() => toggleArrayItem('hairType', type)}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="px-6 py-3 border-t border-border bg-background">
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
